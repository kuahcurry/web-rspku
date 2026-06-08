<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class ProgressiveThrottle
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string  $action
     * @return mixed
     */
    public function handle(Request $request, Closure $next, string $action = 'default')
    {
        $ip = $request->ip();
        
        // Find identifier (NIK, Email, or NIP) to isolate users on shared networks/IPs
        $identifier = '';
        if ($request->has('nik')) {
            $identifier = preg_replace('/\D/', '', $request->input('nik'));
        } elseif ($request->has('email')) {
            $identifier = strtolower(trim($request->input('email')));
        } elseif ($request->has('nip')) {
            $identifier = preg_replace('/\D/', '', $request->input('nip'));
        }
        
        $keySuffix = $identifier ? md5($identifier) : $ip;
        
        $expiryKey = "throttle:expiry:{$keySuffix}:{$action}";
        $attemptsKey = "throttle:attempts:{$keySuffix}:{$action}";
        $lockoutCountKey = "throttle:lockouts:{$keySuffix}:{$action}";

        // 1. Check if currently locked out
        if (Cache::has($expiryKey)) {
            $expiryTime = Cache::get($expiryKey);
            $secondsRemaining = $expiryTime - time();
            
            if ($secondsRemaining > 0) {
                $minutes = floor($secondsRemaining / 60);
                $seconds = $secondsRemaining % 60;
                
                if ($minutes > 0) {
                    $timeString = "{$minutes} menit {$seconds} detik";
                } else {
                    $timeString = "{$seconds} detik";
                }
                
                return response()->json([
                    'success' => false,
                    'message' => "Terlalu banyak percobaan. Silakan coba lagi dalam {$timeString}.",
                    'retry_after' => $secondsRemaining
                ], 429);
            } else {
                // Lockout expired, clear lockout cache and reset attempts to 0 (expires in 15 minutes)
                Cache::forget($expiryKey);
                Cache::put($attemptsKey, 0, now()->addMinutes(15));
            }
        }

        // 2. Read state
        $lockouts = (int) Cache::get($lockoutCountKey, 0);
        $maxAttempts = ($lockouts === 0) ? 5 : 3;
        $attempts = (int) Cache::get($attemptsKey, 0);

        if ($attempts >= $maxAttempts) {
            // Initiate new lockout
            $lockouts++;
            Cache::put($lockoutCountKey, $lockouts, now()->addHours(2)); // lockout count resets after 2 hours of inactivity
            
            $lockoutMinutes = $lockouts * 5; // 1st = 5m, 2nd = 10m, 3rd = 15m, etc.
            $expiryTime = time() + ($lockoutMinutes * 60);
            
            Cache::put($expiryKey, $expiryTime, now()->addMinutes($lockoutMinutes + 1));
            Cache::put($attemptsKey, 0, now()->addMinutes(15)); // Reset attempts to 0 for next round
            
            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan. Silakan coba lagi dalam {$lockoutMinutes} menit.",
                'retry_after' => $lockoutMinutes * 60
            ], 429);
        }

        // Increment attempts before running the request (expires in 15 minutes of inactivity)
        Cache::put($attemptsKey, $attempts + 1, now()->addMinutes(15));

        $response = $next($request);

        // If the request was successful, reset the attempts, lockout count, and expiry
        $isSuccess = false;
        if ($response instanceof \Illuminate\Http\JsonResponse) {
            $data = $response->getData(true);
            if (isset($data['success']) && $data['success'] === true) {
                $isSuccess = true;
            }
        } elseif ($response->isSuccessful()) {
            $isSuccess = true;
        }

        if ($isSuccess) {
            Cache::forget($attemptsKey);
            Cache::forget($lockoutCountKey);
            Cache::forget($expiryKey);
        }

        return $response;
    }
}
