<?php

namespace App\Http\Middleware;

use App\Models\SystemSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApiMaintenanceMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $isMaintenance = SystemSetting::getBool('maintenance_mode', false);

        if (!$isMaintenance) {
            return $next($request);
        }

        $path = ltrim($request->path(), '/');

        // Allow routes required to inspect/toggle maintenance and admin login.
        $allowedPaths = [
            'api/maintenance/status',
            'api/admin/maintenance/status',
            'api/admin/maintenance/toggle',
            'api/admin/login',
        ];

        if (in_array($path, $allowedPaths, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'maintenance' => true,
            'message' => 'Website sedang maintenance. Silakan coba lagi nanti.',
        ], 503);
    }
}
