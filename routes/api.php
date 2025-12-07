<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\DokumenLegalitasController;

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
});
