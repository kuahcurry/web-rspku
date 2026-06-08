<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Symfony\Component\Process\Process;
use ZipArchive;

class RestoreSystemBackup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'backup:restore
                            {backupDir? : Backup folder name under storage/app/backups}
                            {--latest : Restore the latest available backup folder}
                            {--db-only : Restore MySQL only}
                            {--files-only : Restore storage files only}
                            {--force : Required for destructive restore actions}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Restore system backup (database and/or storage files)';

    public function handle(): int
    {
        // Security safeguard: keep restore strictly CLI-only.
        // This blocks accidental execution if someone calls Artisan from a web request.
        if (!app()->runningInConsole()) {
            $this->error('backup:restore is CLI-only and cannot run from web context.');
            return Command::FAILURE;
        }

        $dbOnly = (bool) $this->option('db-only');
        $filesOnly = (bool) $this->option('files-only');
        $latest = (bool) $this->option('latest');
        $force = (bool) $this->option('force');

        if ($dbOnly && $filesOnly) {
            $this->error('Choose either --db-only or --files-only, not both.');
            return Command::FAILURE;
        }

        $baseDir = storage_path('app/backups');
        if (!File::isDirectory($baseDir)) {
            $this->error('Backup directory not found: ' . $baseDir);
            return Command::FAILURE;
        }

        $backupDir = $latest
            ? $this->resolveLatestBackupDirectory($baseDir)
            : $this->resolveBackupDirectoryByName($baseDir, (string) $this->argument('backupDir'));

        if (!$backupDir || !File::isDirectory($backupDir)) {
            $this->error('Backup folder not found. Use --latest or provide a valid backupDir.');
            return Command::FAILURE;
        }

        $this->warn('You are about to restore backup: ' . $backupDir);
        if (!$force && !$this->confirm('This operation may overwrite current data. Continue?', false)) {
            $this->line('Restore cancelled.');
            return Command::SUCCESS;
        }

        if (!$filesOnly) {
            $result = $this->restoreDatabase($backupDir);
            if (!$result['success']) {
                $this->error('Database restore failed: ' . $result['message']);
                return Command::FAILURE;
            }
            $this->info('Database restore completed.');
        }

        if (!$dbOnly) {
            $result = $this->restoreStorage($backupDir, $force);
            if (!$result['success']) {
                $this->error('Storage restore failed: ' . $result['message']);
                return Command::FAILURE;
            }
            $this->info('Storage restore completed.');
        }

        $this->info('Restore finished successfully.');
        return Command::SUCCESS;
    }

    private function resolveLatestBackupDirectory(string $baseDir): ?string
    {
        $directories = collect(File::directories($baseDir))
            ->sortByDesc(fn ($dir) => File::lastModified($dir))
            ->values();

        return $directories->first();
    }

    private function resolveBackupDirectoryByName(string $baseDir, string $folder): ?string
    {
        if ($folder === '') {
            return null;
        }

        $resolved = realpath($baseDir . DIRECTORY_SEPARATOR . $folder);
        if ($resolved === false) {
            return null;
        }

        $baseReal = realpath($baseDir);
        if ($baseReal === false || !str_starts_with($resolved, $baseReal)) {
            return null;
        }

        return $resolved;
    }

    private function restoreDatabase(string $backupDir): array
    {
        $sqlPath = $backupDir . DIRECTORY_SEPARATOR . 'database.sql';
        if (!File::exists($sqlPath)) {
            return [
                'success' => false,
                'message' => 'database.sql not found in backup folder',
            ];
        }

        $connection = config('database.default');
        $dbConfig = config("database.connections.{$connection}");

        if (!$dbConfig || ($dbConfig['driver'] ?? null) !== 'mysql') {
            return [
                'success' => false,
                'message' => 'Only MySQL driver is supported by backup:restore right now.',
            ];
        }

        $host = env('BACKUP_DB_HOST', $dbConfig['host'] ?? '127.0.0.1');
        $port = (string) env('BACKUP_DB_PORT', $dbConfig['port'] ?? 3306);
        $username = env('BACKUP_DB_USERNAME', $dbConfig['username'] ?? '');
        $database = env('BACKUP_DB_DATABASE', $dbConfig['database'] ?? '');
        $password = env('BACKUP_DB_PASSWORD', $dbConfig['password'] ?? null);
        $protocol = env('BACKUP_DB_PROTOCOL', 'TCP');

        $mysqlBinary = env('BACKUP_MYSQL_BINARY', 'mysql');
        $command = [
            $mysqlBinary,
            '--protocol=' . $protocol,
            '--host=' . $host,
            '--port=' . $port,
            '--user=' . $username,
            $database,
        ];

        $process = new Process($command);
        $process->setTimeout((int) env('BACKUP_RESTORE_DB_TIMEOUT_SECONDS', 600));

        $env = [];
        if (!empty($password)) {
            $env['MYSQL_PWD'] = $password;
        }
        if (!empty($env)) {
            $process->setEnv($env);
        }

        $process->setInput(File::get($sqlPath));
        $process->run();

        if (!$process->isSuccessful()) {
            return [
                'success' => false,
                'message' => trim($process->getErrorOutput()) ?: 'Unknown mysql restore error',
            ];
        }

        return ['success' => true];
    }

    private function restoreStorage(string $backupDir, bool $force): array
    {
        if (!$force) {
            return [
                'success' => false,
                'message' => 'Use --force to restore storage files',
            ];
        }

        $zipPath = $backupDir . DIRECTORY_SEPARATOR . 'storage_app.zip';
        if (!File::exists($zipPath)) {
            return [
                'success' => false,
                'message' => 'storage_app.zip not found in backup folder',
            ];
        }

        $targetDir = storage_path('app');
        File::ensureDirectoryExists($targetDir);

        $tmpExtract = storage_path('app/tmp_restore_' . now()->format('Ymd_His'));
        File::ensureDirectoryExists($tmpExtract);

        $zip = new ZipArchive();
        if ($zip->open($zipPath) !== true) {
            File::deleteDirectory($tmpExtract);
            return [
                'success' => false,
                'message' => 'Unable to open backup zip archive',
            ];
        }

        $zip->extractTo($tmpExtract);
        $zip->close();

        $restoredRoot = $tmpExtract . DIRECTORY_SEPARATOR . 'app';
        if (!File::isDirectory($restoredRoot)) {
            File::deleteDirectory($tmpExtract);
            return [
                'success' => false,
                'message' => 'Invalid storage backup archive structure',
            ];
        }

        // Preserve current backup folder and restore everything else.
        foreach (File::directories($targetDir) as $directory) {
            if (basename($directory) === 'backups') {
                continue;
            }
            File::deleteDirectory($directory);
        }

        foreach (File::files($targetDir) as $file) {
            File::delete($file->getPathname());
        }

        foreach (File::directories($restoredRoot) as $directory) {
            $name = basename($directory);
            File::copyDirectory($directory, $targetDir . DIRECTORY_SEPARATOR . $name);
        }

        foreach (File::files($restoredRoot) as $file) {
            File::copy($file->getPathname(), $targetDir . DIRECTORY_SEPARATOR . $file->getFilename());
        }

        File::deleteDirectory($tmpExtract);

        return ['success' => true];
    }
}
