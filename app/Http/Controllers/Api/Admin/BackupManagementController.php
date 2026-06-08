<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use ZipArchive;

class BackupManagementController extends Controller
{
    public function index()
    {
        $baseDir = storage_path('app/backups');
        File::ensureDirectoryExists($baseDir);

        $backups = collect(File::directories($baseDir))
            ->map(function ($dir) {
                $manifestPath = $dir . DIRECTORY_SEPARATOR . 'manifest.json';
                $manifest = null;
                if (File::exists($manifestPath)) {
                    $decoded = json_decode(File::get($manifestPath), true);
                    if (is_array($decoded)) {
                        $manifest = $decoded;
                    }
                }

                return [
                    'name' => basename($dir),
                    'created_at' => date('c', File::lastModified($dir)),
                    'has_database' => File::exists($dir . DIRECTORY_SEPARATOR . 'database.sql'),
                    'has_files' => File::exists($dir . DIRECTORY_SEPARATOR . 'storage_app.zip'),
                    'manifest' => $manifest,
                ];
            })
            ->sortByDesc('created_at')
            ->values();

        return response()->json([
            'success' => true,
            'data' => $backups,
            'latest' => $backups->first(),
        ]);
    }

    public function create(Request $request)
    {
        $mode = (string) $request->input('mode', 'full');

        if (!in_array($mode, ['full', 'db-only', 'files-only'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid mode. Use: full, db-only, files-only.',
            ], 422);
        }

        $command = ['--no-interaction' => true];
        if ($mode === 'db-only') {
            $command['--db-only'] = true;
        }
        if ($mode === 'files-only') {
            $command['--files-only'] = true;
        }

        $exitCode = Artisan::call('backup:create', $command);
        $output = Artisan::output();

        return response()->json([
            'success' => $exitCode === 0,
            'message' => $exitCode === 0 ? 'Backup created successfully' : 'Backup creation failed',
            'output' => $output,
        ], $exitCode === 0 ? 200 : 500);
    }

    public function downloadLatest(Request $request)
    {
        $type = (string) $request->query('type', 'full');
        if (!in_array($type, ['full', 'db', 'files'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid type. Use: full, db, files.',
            ], 422);
        }

        $baseDir = storage_path('app/backups');
        if (!File::isDirectory($baseDir)) {
            return response()->json([
                'success' => false,
                'message' => 'No backups directory found.',
            ], 404);
        }

        $latest = collect(File::directories($baseDir))
            ->sortByDesc(fn ($dir) => File::lastModified($dir))
            ->values()
            ->first();

        if (!$latest) {
            return response()->json([
                'success' => false,
                'message' => 'No backups available.',
            ], 404);
        }

        if ($type === 'db') {
            $dbPath = $latest . DIRECTORY_SEPARATOR . 'database.sql';
            if (!File::exists($dbPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Latest backup has no database.sql.',
                ], 404);
            }
            return response()->download($dbPath, basename($latest) . '_database.sql');
        }

        if ($type === 'files') {
            $filesPath = $latest . DIRECTORY_SEPARATOR . 'storage_app.zip';
            if (!File::exists($filesPath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Latest backup has no storage_app.zip.',
                ], 404);
            }
            return response()->download($filesPath, basename($latest) . '_storage_app.zip');
        }

        // full backup: package the latest backup folder as one zip for direct download
        $tmpZip = tempnam(sys_get_temp_dir(), 'backup_full_');
        if ($tmpZip === false) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create temp file.',
            ], 500);
        }

        $zipPath = $tmpZip . '.zip';
        @rename($tmpZip, $zipPath);

        $zip = new ZipArchive();
        if ($zip->open($zipPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            @unlink($zipPath);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create zip archive.',
            ], 500);
        }

        $root = realpath($latest);
        if ($root === false) {
            $zip->close();
            @unlink($zipPath);
            return response()->json([
                'success' => false,
                'message' => 'Failed to read latest backup directory.',
            ], 500);
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($root, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($iterator as $item) {
            $filePath = $item->getRealPath();
            if ($filePath === false) {
                continue;
            }
            $relative = substr($filePath, strlen($root) + 1);
            $zipName = basename($latest) . '/' . str_replace('\\', '/', $relative);
            if ($item->isDir()) {
                $zip->addEmptyDir($zipName);
            } else {
                $zip->addFile($filePath, $zipName);
            }
        }

        $zip->close();

        return response()->download($zipPath, basename($latest) . '_full.zip')->deleteFileAfterSend(true);
    }
}
