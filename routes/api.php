<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DokumenLegalitasController;
use App\Http\Controllers\Api\RiwayatPendidikanController;

// Public routes
Route::post('/register', [RegisterController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require JWT token)
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    Route::put('/account', [ProfileController::class, 'updateAccount']);
    
    // Dokumen Legalitas routes
    Route::prefix('dokumen-legalitas')->group(function () {
        Route::get('/', [DokumenLegalitasController::class, 'index']);
        Route::post('/upload', [DokumenLegalitasController::class, 'upload']);
        Route::get('/view/{id}', [DokumenLegalitasController::class, 'view']);
        Route::delete('/{id}', [DokumenLegalitasController::class, 'delete']);
    });
    
    // Riwayat Pendidikan routes
    Route::prefix('riwayat-pendidikan')->group(function () {
        Route::get('/', [RiwayatPendidikanController::class, 'index']);
        Route::post('/store', [RiwayatPendidikanController::class, 'store']);
        Route::get('/view/{id}', [RiwayatPendidikanController::class, 'view']);
        Route::post('/delete-multiple', [RiwayatPendidikanController::class, 'deleteMultiple']);
    });
    
    // Penugasan routes
    Route::prefix('penugasan')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\PenugasanController::class, 'index']);
        Route::post('/store', [\App\Http\Controllers\Api\PenugasanController::class, 'store']);
        Route::get('/view/{id}', [\App\Http\Controllers\Api\PenugasanController::class, 'view']);
        Route::post('/delete-multiple', [\App\Http\Controllers\Api\PenugasanController::class, 'deleteMultiple']);
    });
    
    // Etik & Disiplin routes
    Route::prefix('etik-disiplin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'index']);
        Route::post('/store', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'store']);
        Route::put('/update/{id}', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'update']);
        Route::get('/view/{id}', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'view']);
        Route::post('/delete-multiple', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'deleteMultiple']);
    });
    
    // Kredensial routes
    Route::prefix('kredensial')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\KredensialController::class, 'index']);
        Route::post('/store', [\App\Http\Controllers\Api\KredensialController::class, 'store']);
        Route::put('/update/{id}', [\App\Http\Controllers\Api\KredensialController::class, 'update']);
        Route::get('/view/{id}', [\App\Http\Controllers\Api\KredensialController::class, 'view']);
        Route::post('/delete-multiple', [\App\Http\Controllers\Api\KredensialController::class, 'deleteMultiple']);
    });
});
