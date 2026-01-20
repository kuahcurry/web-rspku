<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/login', function () {
    return view('app');
})->name('login');

// Test storage route
Route::get('/test-storage', function () {
    $testFile = 'Aqief_Idlan_Hakimi_1122334455667788/profile_1768283047.png';
    $fullPath = storage_path('app/public/' . $testFile);
    
    return response()->json([
        'file_path' => $testFile,
        'full_path' => $fullPath,
        'exists' => file_exists($fullPath),
        'storage_files' => Storage::disk('public')->allFiles('Aqief_Idlan_Hakimi_1122334455667788'),
        'permissions' => file_exists($fullPath) ? substr(sprintf('%o', fileperms($fullPath)), -4) : 'N/A',
    ]);
});

// Serve storage files (for PHP built-in server compatibility)
Route::get('/storage/{path}', function ($path) {
    $filePath = storage_path('app/public/' . $path);
    
    if (!file_exists($filePath)) {
        return response()->json([
            'error' => 'File not found',
            'path' => $path,
            'full_path' => $filePath,
            'storage_path' => storage_path('app/public/'),
            'files_in_storage' => Storage::disk('public')->allFiles(),
        ], 404);
    }
    
    $mimeType = mime_content_type($filePath);
    
    return response()->file($filePath, [
        'Content-Type' => $mimeType,
        'Cache-Control' => 'public, max-age=3600',
    ]);
})->where('path', '.*');

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
