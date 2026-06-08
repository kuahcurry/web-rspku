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
        
        $expiryKey = "throttle:expiry:{$ip}:{$action}";
        $attemptsKey = "throttle:attempts:{$ip}:{$action}";
        $lockoutCountKey = "throttle:lockouts:{$ip}:{$action}";

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
                // Lockout expired, clear lockout cache and reset attempts to 0
                Cache::forget($expiryKey);
                Cache::put($attemptsKey, 0, now()->addDay());
            }
        }

        // 2. Read state
        $lockouts = (int) Cache::get($lockoutCountKey, 0);
        $maxAttempts = ($lockouts === 0) ? 5 : 3;
        $attempts = (int) Cache::get($attemptsKey, 0);

        if ($attempts >= $maxAttempts) {
            // Initiate new lockout
            $lockouts++;
            Cache::put($lockoutCountKey, $lockouts, now()->addDay());
            
            $lockoutMinutes = $lockouts * 5; // 1st = 5m, 2nd = 10m, 3rd = 15m, etc.
            $expiryTime = time() + ($lockoutMinutes * 60);
            
            Cache::put($expiryKey, $expiryTime, now()->addDay());
            Cache::put($attemptsKey, 0, now()->addDay()); // Reset attempts to 0 for next round after block expires
            
            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan. Silakan coba lagi dalam {$lockoutMinutes} menit.",
                'retry_after' => $lockoutMinutes * 60
            ], 429);
        }

        // Increment attempts before running the request
        Cache::put($attemptsKey, $attempts + 1, now()->addDay());

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
