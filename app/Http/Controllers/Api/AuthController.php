<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\UserRegistration;
use Tymon\JWTAuth\Facades\JWTAuth;

class AuthController extends Controller
{
    /**
     * Get a JWT via given credentials.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nik' => 'required|digits:16|numeric',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        // Find user by NIK
        $user = UserRegistration::where('nik', $request->nik)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'NIK atau password salah'
            ], 401);
        }

        try {
            // Generate JWT token
            $token = JWTAuth::fromUser($user);

            return response()->json([
                'success' => true,
                'message' => 'Login berhasil',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'nip' => $user->nip,
                        'nik' => $user->nik,
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                    ],
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60 // in seconds
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Login gagal',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get the authenticated User.
     */
    public function me()
    {
        try {
            $user = auth()->user();
            
            return response()->json([
                'success' => true,
                'data' => $user
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized'
            ], 401);
        }
    }

    /**
     * Log the user out (Invalidate the token).
     */
    public function logout()
    {
        try {
            auth()->logout();

            return response()->json([
                'success' => true,
                'message' => 'Logout berhasil'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout gagal'
            ], 500);
        }
    }

    /**
     * Refresh a token.
     */
    public function refresh()
    {
        try {
            $token = auth()->refresh();

            return response()->json([
                'success' => true,
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'bearer',
                    'expires_in' => config('jwt.ttl') * 60
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Token refresh failed'
            ], 401);
        }
    }
}
