<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Mail;
use Symfony\Component\Process\Process;
use ZipArchive;

class CreateSystemBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:create
                            {--db-only : Backup MySQL only}
                            {--files-only : Backup storage files only}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a full system backup (MySQL dump + storage files archive)';

    public function handle(): int
    {
        try {
            $dbOnly = (bool) $this->option('db-only');
            $filesOnly = (bool) $this->option('files-only');

            if ($dbOnly && $filesOnly) {
                $message = 'Choose either --db-only or --files-only, not both.';
                $this->error($message);
                $this->notifyFailure($message);
                return Command::FAILURE;
            }

            $timestamp = now()->format('Ymd_His');
            $baseDir = storage_path('app/backups');
            $backupDir = $baseDir . DIRECTORY_SEPARATOR . 'backup_' . $timestamp;

            File::ensureDirectoryExists($backupDir);

            $this->info('Starting backup process...');
            $this->line('Backup directory: ' . $backupDir);

            $results = [
                'database' => null,
                'files' => null,
            ];

            if (!$filesOnly) {
                $results['database'] = $this->backupDatabase($backupDir);
                if (!$results['database']['success']) {
                    $message = 'Database backup failed: ' . $results['database']['message'];
                    $this->error($message);
                    $this->notifyFailure($message);
                    return Command::FAILURE;
                }
                $this->info('Database backup completed.');
            }

            if (!$dbOnly) {
                $results['files'] = $this->backupStorage($backupDir);
                if (!$results['files']['success']) {
                    $message = 'Storage backup failed: ' . $results['files']['message'];
                    $this->error($message);
                    $this->notifyFailure($message);
                    return Command::FAILURE;
                }
                $this->info('Storage backup completed.');
            }

            File::put(
                $backupDir . DIRECTORY_SEPARATOR . 'manifest.json',
                json_encode([
                    'created_at' => now()->toIso8601String(),
                    'mode' => $dbOnly ? 'db-only' : ($filesOnly ? 'files-only' : 'full'),
                    'database' => $results['database'],
                    'files' => $results['files'],
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
            );

            $this->cleanupOldBackups($baseDir);

            $this->newLine();
            $this->info('Backup finished successfully.');
            $this->line('Location: ' . $backupDir);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $message = 'Unexpected backup failure: ' . $e->getMessage();
            $this->error($message);
            $this->notifyFailure($message);
            return Command::FAILURE;
        }
    }

    private function notifyFailure(string $errorMessage): void
    {
        $targetEmail = env('BACKUP_ALERT_EMAIL') ?: env('MAIL_FROM_ADDRESS');
        if (!$targetEmail) {
            return;
        }

        $subject = '[' . (config('app.name') ?: 'Laravel App') . '] Backup Failed';
        $body = "Backup command failed at " . now()->toDateTimeString() . "\n"
            . "Environment: " . app()->environment() . "\n"
            . "Host: " . (request()?->getHost() ?: php_uname('n')) . "\n\n"
            . "Error:\n" . $errorMessage . "\n";

        try {
            Mail::raw($body, function ($message) use ($targetEmail, $subject) {
                $message->to($targetEmail)->subject($subject);
            });
        } catch (\Throwable $e) {
            // Avoid recursive failures in command output when mail transport is unavailable.
            $this->warn('Failed to send backup alert email: ' . $e->getMessage());
        }
    }

    private function backupDatabase(string $backupDir): array
    {
        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (!$dbConfig || ($dbConfig['driver'] ?? null) !== 'mysql') {
            return [
                'success' => false,
                'message' => 'Only MySQL driver is supported by backup:create right now.',
            ];
        }

        $host = env('BACKUP_DB_HOST', $dbConfig['host'] ?? '127.0.0.1');
        $port = (string) env('BACKUP_DB_PORT', $dbConfig['port'] ?? 3306);
        $username = env('BACKUP_DB_USERNAME', $dbConfig['username'] ?? '');
        $database = env('BACKUP_DB_DATABASE', $dbConfig['database'] ?? '');
        $password = env('BACKUP_DB_PASSWORD', $dbConfig['password'] ?? null);
        $protocol = env('BACKUP_DB_PROTOCOL', 'TCP');

        $dumpBinary = env('BACKUP_MYSQLDUMP_BINARY', 'mysqldump');
        $dumpPath = $backupDir . DIRECTORY_SEPARATOR . 'database.sql';

        $command = [
            $dumpBinary,
            '--single-transaction',
            '--quick',
            '--skip-lock-tables',
            '--protocol=' . $protocol,
            '--host=' . $host,
            '--port=' . $port,
            '--user=' . $username,
            '--result-file=' . $dumpPath,
            $database,
        ];

        $process = new Process($command);
        $process->setTimeout((int) env('BACKUP_DB_TIMEOUT_SECONDS', 300));

        $env = [];
        if (!empty($password)) {
            $env['MYSQL_PWD'] = $password;
        }
        if (!empty($env)) {
            $process->setEnv($env);
        }

        $process->run();

        if (!$process->isSuccessful()) {
            return [
                'success' => false,
                'message' => trim($process->getErrorOutput()) ?: 'Unknown mysqldump error',
            ];
        }

        return [
            'success' => true,
            'path' => $dumpPath,
            'size_bytes' => File::exists($dumpPath) ? File::size($dumpPath) : 0,
        ];
    }

    private function backupStorage(string $backupDir): array
    {
        $sourceDir = storage_path('app');
        $zipPath = $backupDir . DIRECTORY_SEPARATOR . 'storage_app.zip';

        if (!File::exists($sourceDir)) {
            return [
                'success' => false,
                'message' => 'Directory storage/app not found',
            ];
        }

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return [
                'success' => false,
                'message' => 'Unable to create zip archive',
            ];
        }

        $sourceRealPath = realpath($sourceDir);
        if ($sourceRealPath === false) {
            $zip->close();
            return [
                'success' => false,
                'message' => 'Unable to resolve storage/app path',
            ];
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($sourceRealPath, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        $addedCount = 0;

        foreach ($files as $file) {
            $filePath = $file->getRealPath();
            if ($filePath === false) {
                continue;
            }

            // Avoid recursively backing up backup artifacts.
            if (str_contains(str_replace('\\', '/', $filePath), '/storage/app/backups/')) {
                continue;
            }

            $relativePath = substr($filePath, strlen($sourceRealPath) + 1);
            $zipPathName = 'app/' . str_replace('\\', '/', $relativePath);

            if ($file->isDir()) {
                $zip->addEmptyDir($zipPathName);
            } else {
                $zip->addFile($filePath, $zipPathName);
                $addedCount++;
            }
        }

        $zip->close();

        return [
            'success' => true,
            'path' => $zipPath,
            'files_count' => $addedCount,
            'size_bytes' => File::exists($zipPath) ? File::size($zipPath) : 0,
        ];
    }

    private function cleanupOldBackups(string $baseDir): void
    {
        $retentionDays = (int) env('BACKUP_RETENTION_DAYS', 7);
        if ($retentionDays <= 0 || !File::isDirectory($baseDir)) {
            return;
        }

        $cutoff = now()->subDays($retentionDays)->getTimestamp();

        foreach (File::directories($baseDir) as $directory) {
            $lastModified = File::lastModified($directory);
            if ($lastModified < $cutoff) {
                File::deleteDirectory($directory);
                $this->line('Removed old backup: ' . $directory);
            }
        }
    }
}
