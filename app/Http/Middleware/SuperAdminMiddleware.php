<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class SuperAdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            // Get the token from the request
            $token = JWTAuth::parseToken();
            
            // Get the payload
            $payload = $token->getPayload();
            
            // Check if the token has admin role in custom claims
            $role = $payload->get('role');
            $type = $payload->get('type');
            
            if ($role !== 'admin' || $type !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Admin access required.'
                ], 403);
            }
            
            // Authenticate the admin user
            $admin = $token->authenticate();
            
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated'
                ], 401);
            }
            
            // Check if admin has super_admin role
            if ($admin->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Super admin access required.'
                ], 403);
            }
            
        } catch (JWTException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token invalid or expired'
            ], 401);
        }

        return $next($request);
    }
}
