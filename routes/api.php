<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\RegisterController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProfileController;
use App\Http\Controllers\Api\RegionController;
use App\Http\Controllers\Api\DokumenLegalitasController;
use App\Http\Controllers\Api\RiwayatPendidikanController;
use App\Http\Controllers\Api\MaintenanceController;
use App\Http\Controllers\Api\PasswordResetController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Admin\EtikDisiplinController;
use App\Http\Controllers\Api\Admin\AdminManagementController;
use App\Http\Controllers\Api\Admin\BackupManagementController;
use App\Http\Controllers\PdfCompressionController;

// Public routes
Route::post('/register', [RegisterController::class, 'register'])->middleware('throttle:5,1');
Route::post('/delete-pending-registration', [RegisterController::class, 'deletePending'])->middleware('throttle:5,1');
Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:5,1');
Route::post('/admin/login', [AuthController::class, 'adminLogin'])->middleware('throttle:5,1');
Route::post('/verify-email', [RegisterController::class, 'verifyEmail'])->middleware('throttle:10,1');
Route::post('/resend-verification-code', [RegisterController::class, 'resendVerificationCode'])->middleware('throttle:3,10');
Route::prefix('regions')->middleware('throttle:120,1')->group(function () {
    Route::get('/provinces', [RegionController::class, 'provinces']);
    Route::get('/regencies/{provinceCode}', [RegionController::class, 'regencies']);
    Route::get('/districts/{regencyCode}', [RegionController::class, 'districts']);
    Route::get('/villages/{districtCode}', [RegionController::class, 'villages']);
});

// Password Reset routes
Route::post('/forgot-password', [PasswordResetController::class, 'forgotPassword'])->middleware('throttle:3,10');
Route::post('/verify-reset-code', [PasswordResetController::class, 'verifyResetCode'])->middleware('throttle:10,1');
Route::post('/reset-password', [PasswordResetController::class, 'resetPassword'])->middleware('throttle:5,10');
Route::get('/maintenance/status', [MaintenanceController::class, 'publicStatus']);

// Protected routes (require JWT token)
Route::middleware('auth:api')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::get('/me', [AuthController::class, 'me']);
    
    // PDF Compression
    Route::post('/compress-pdf', [PdfCompressionController::class, 'compress']);
    
    // Profile routes (merged profile + account)
    Route::put('/profile', [ProfileController::class, 'updateProfile']);
    Route::delete('/profile', [ProfileController::class, 'deleteAccount']);
    Route::post('/profile/foto-profil', [ProfileController::class, 'uploadProfilePicture']);
    Route::get('/profile/foto-profil', [ProfileController::class, 'getProfilePicture']);
    Route::delete('/profile/foto-profil', [ProfileController::class, 'deleteProfilePicture']);
    
    // Dokumen Legalitas (RESTful)
    Route::prefix('dokumen-legalitas')->group(function () {
        Route::get('/', [DokumenLegalitasController::class, 'index']);
        Route::post('/', [DokumenLegalitasController::class, 'upload']);
        Route::get('/{id}', [DokumenLegalitasController::class, 'view']);
        Route::get('/{id}/download', [DokumenLegalitasController::class, 'download']);
        Route::delete('/{id}', [DokumenLegalitasController::class, 'delete']);
    });
    
    // Riwayat Pendidikan (RESTful)
    Route::prefix('riwayat-pendidikan')->group(function () {
        Route::get('/', [RiwayatPendidikanController::class, 'index']);
        Route::post('/', [RiwayatPendidikanController::class, 'store']);
        Route::get('/{id}', [RiwayatPendidikanController::class, 'view']);
        Route::delete('/{id}', [RiwayatPendidikanController::class, 'delete']);
    });
    
    // Penugasan (RESTful)
    Route::prefix('penugasan')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\PenugasanController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\PenugasanController::class, 'store']);
        Route::post('/delete-multiple', [\App\Http\Controllers\Api\PenugasanController::class, 'deleteMultiple']);
        Route::get('/{id}', [\App\Http\Controllers\Api\PenugasanController::class, 'view']);
        Route::get('/{id}/download', [\App\Http\Controllers\Api\PenugasanController::class, 'download']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\PenugasanController::class, 'delete']);
    });
    
    // Etik & Disiplin (RESTful)
    Route::prefix('etik-disiplin')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'view']);
        Route::get('/{id}/download', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'download']);
        Route::put('/{id}', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\EtikDisiplinController::class, 'delete']);
    });
    
    // Kredensial (RESTful)
    Route::prefix('kredensial')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\KredensialController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\KredensialController::class, 'store']);
        Route::post('/delete-multiple', [\App\Http\Controllers\Api\KredensialController::class, 'deleteMultiple']);
        Route::get('/{id}', [\App\Http\Controllers\Api\KredensialController::class, 'view']);
        Route::get('/{id}/download', [\App\Http\Controllers\Api\KredensialController::class, 'download']);
        Route::put('/{id}', [\App\Http\Controllers\Api\KredensialController::class, 'update']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\KredensialController::class, 'delete']);
    });

    // Pengajuan Kredensial (user)
    Route::prefix('pengajuan-kredensial')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\Admin\PengajuanKredensialController::class, 'indexUser']);
        Route::post('/', [\App\Http\Controllers\Api\Admin\PengajuanKredensialController::class, 'store']);
        Route::get('/{id}', [\App\Http\Controllers\Api\Admin\PengajuanKredensialController::class, 'show']);
    });
    
    // Prestasi & Penghargaan (RESTful)
    Route::prefix('prestasi-penghargaan')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\PrestasiPenghargaanController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\PrestasiPenghargaanController::class, 'store']);
        Route::post('/bulk-delete', [\App\Http\Controllers\Api\PrestasiPenghargaanController::class, 'bulkDelete']);
        Route::get('/{id}', [\App\Http\Controllers\Api\PrestasiPenghargaanController::class, 'view']);
        Route::get('/{id}/file', [\App\Http\Controllers\Api\PrestasiPenghargaanController::class, 'downloadFile']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\PrestasiPenghargaanController::class, 'delete']);
    });
    
    // Status Kewenangan (RESTful)
    Route::prefix('status-kewenangan')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\StatusKewenanganController::class, 'index']);
        Route::post('/', [\App\Http\Controllers\Api\StatusKewenanganController::class, 'store']);
        Route::post('/bulk-delete', [\App\Http\Controllers\Api\StatusKewenanganController::class, 'bulkDelete']);
        Route::get('/{id}', [\App\Http\Controllers\Api\StatusKewenanganController::class, 'view']);
        Route::delete('/{id}', [\App\Http\Controllers\Api\StatusKewenanganController::class, 'delete']);
    });
});

// Admin Dashboard routes (admin role required)
Route::middleware(['auth:admin', 'admin', 'throttle:60,1'])->prefix('admin')->group(function () {
    // Dashboard
    Route::get('/dashboard/statistics', [DashboardController::class, 'getStatistics']);
    Route::get('/dashboard/expiring-documents', [DashboardController::class, 'getExpiringDocuments']);
    Route::get('/dashboard/activities', [DashboardController::class, 'getRecentActivities']);
    
    // User Management
    Route::get('/pengguna', [UserManagementController::class, 'index']);
    Route::get('/pengguna/{id}', [UserManagementController::class, 'show']);
    Route::get('/pengguna/{id}/download-dokumen', [UserManagementController::class, 'downloadAllDocuments']);

    // Delete (deactivate) users — accessible to admins (marks as 'Tidak Aktif')
    Route::delete('/pengguna/{id}', [UserManagementController::class, 'destroy']);
    // Permanent delete (super admin only)
    Route::middleware('super_admin')->delete('/pengguna/{id}/permanent', [UserManagementController::class, 'destroyPermanent']);
    // Super admin can reactivate previously deactivated users
    Route::middleware('super_admin')->post('/pengguna/{id}/reactivate', [UserManagementController::class, 'reactivate']);
    
    // Etik dan Disiplin Management
    Route::get('/etik-disiplin', [EtikDisiplinController::class, 'index']);
    Route::post('/etik-disiplin', [EtikDisiplinController::class, 'store']);
    Route::delete('/etik-disiplin/{id}', [EtikDisiplinController::class, 'destroy']);
    Route::post('/etik-disiplin/bulk-delete', [EtikDisiplinController::class, 'bulkDelete']);
    Route::get('/users/approved', [EtikDisiplinController::class, 'getApprovedUsers']);
    
    // Admin Management (super admin only)
    Route::middleware('super_admin')->group(function () {
        Route::get('/admins', [AdminManagementController::class, 'index']);
        Route::post('/admins', [AdminManagementController::class, 'store']);
        Route::put('/admins/{id}', [AdminManagementController::class, 'update']);
        Route::delete('/admins/{id}', [AdminManagementController::class, 'destroy']);

        // Backup Management (super admin only)
        Route::get('/backups', [BackupManagementController::class, 'index']);
        Route::post('/backups/create', [BackupManagementController::class, 'create']);
        Route::get('/backups/latest/download', [BackupManagementController::class, 'downloadLatest']);

        // Maintenance Management (super admin only)
        Route::get('/maintenance/status', [MaintenanceController::class, 'adminStatus']);
        Route::post('/maintenance/toggle', [MaintenanceController::class, 'toggle']);
    });
    
    // Admin Profile Management (own account)
    Route::get('/profile', [AdminManagementController::class, 'profile']);
    Route::put('/profile', [AdminManagementController::class, 'updateProfile']);
    Route::post('/profile/change-password', [AdminManagementController::class, 'changePassword']);

    // Pengajuan Kredensial (admin)
    Route::get('/pengajuan-kredensial', [\App\Http\Controllers\Api\Admin\PengajuanKredensialController::class, 'index']);
    Route::get('/pengajuan-kredensial/{id}', [\App\Http\Controllers\Api\Admin\PengajuanKredensialController::class, 'show']);
    Route::put('/pengajuan-kredensial/{id}', [\App\Http\Controllers\Api\Admin\PengajuanKredensialController::class, 'update']);
});
