<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserRegistration;
use App\Models\DokumenLegalitas;
use App\Models\EtikDisiplin;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Carbon\Carbon;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function getStatistics()
    {
        try {
            $totalUsers = UserRegistration::count();
            
            // Count users who logged in today (within the last 24 hours)
            $activeUsers = UserRegistration::where('last_login_at', '>=', Carbon::now()->subDay())
                ->count();
            
            $etikDisiplinCases = EtikDisiplin::count();
            
            // Count SIP documents expiring within 60 days (only SIP has expiry dates)
            $expiringDocuments = DokumenLegalitas::where('jenis_dokumen', 'SIP')
                ->whereNotNull('berlaku_sampai')
                ->where('berlaku_sampai', '<=', Carbon::now()->addDays(60))
                ->count();

            // Count new users this month
            $newUsersThisMonth = UserRegistration::whereYear('created_at', Carbon::now()->year)
                ->whereMonth('created_at', Carbon::now()->month)
                ->count();

            return response()->json([
                'success' => true,
                'data' => [
                    'totalUsers' => $totalUsers,
                    'activeUsers' => $activeUsers,
                    'etikDisiplinCases' => $etikDisiplinCases,
                    'expiringDocuments' => $expiringDocuments,
                    'newUsersThisMonth' => $newUsersThisMonth
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch statistics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get expiring documents
     */
    public function getExpiringDocuments(Request $request)
    {
        try {
            // Get SIP documents expiring within the next 60 days (only SIP has expiry dates)
            $documents = DokumenLegalitas::with('user:id,name,nik,unit_kerja')
                ->where('jenis_dokumen', 'SIP')
                ->whereNotNull('berlaku_sampai')
                ->where('berlaku_sampai', '<=', Carbon::now()->addDays(60))
                ->orderBy('berlaku_sampai', 'asc')
                ->get()
                ->map(function($doc) {
                    $expiryDate = Carbon::parse($doc->berlaku_sampai);
                    $daysLeft = Carbon::now()->startOfDay()->diffInDays($expiryDate->startOfDay(), false);
                    
                    return [
                        'id' => $doc->id,
                        'userName' => $doc->user->name ?? 'Unknown',
                        'nip' => $doc->user->nik ?? '-',
                        'unit' => $doc->user->unit_kerja ?? '-',
                        'documentType' => $doc->jenis_dokumen,
                        'documentNumber' => $doc->nomor_sk ?? '-',
                        'expiryDate' => $expiryDate->format('Y-m-d'),
                        'daysLeft' => $daysLeft,
                        'status' => $daysLeft < 0 ? 'expired' : ($daysLeft <= 7 ? 'critical' : ($daysLeft <= 30 ? 'warning' : 'upcoming'))
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $documents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch expiring documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get recent activities
     */
    public function getRecentActivities()
    {
        try {
            $activities = ActivityLog::with('user:id,name')
                ->orderBy('created_at', 'desc')
                ->limit(10)
                ->get()
                ->map(function($activity) {
                    return [
                        'id' => $activity->id,
                        'type' => $activity->type,
                        'userName' => $activity->user->name ?? 'Unknown',
                        'action' => $activity->action,
                        'timestamp' => $activity->created_at->format('Y-m-d H:i')
                    ];
                });

            return response()->json([
                'success' => true,
                'data' => $activities
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch activities',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
