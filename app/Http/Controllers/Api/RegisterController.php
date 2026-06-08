<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PendingRegistration;
use App\Models\UserRegistration;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class RegisterController extends Controller
{
    /**
     * Delete pending registration(s) by email, NIK, or NIP.
     * Accepts one or more of these identifiers in the request body.
     * Example payload: { "email": "...", "nik": "...", "nip": "..." }
     */
    public function deletePending(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'nullable|email',
            'nik' => 'nullable|string',
            'nip' => 'nullable|string',
        ]);

        if ($validator->fails() || (!$request->email && !$request->nik && !$request->nip)) {
            return response()->json([
                'success' => false,
                'message' => 'Provide at least one identifier (email, NIK, or NIP) to delete pending registration.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $query = PendingRegistration::query();
        if ($request->email) {
            $query->orWhere('email', $request->email);
        }
        if ($request->nik) {
            $query->orWhere('nik', $request->nik);
        }
        if ($request->nip) {
            $query->orWhere('nip', $request->nip);
        }

        $count = $query->count();
        if ($count === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No pending registration found for the provided identifier(s).',
            ], 404);
        }

        $deleted = $query->delete();

        return response()->json([
            'success' => true,
            'message' => "Deleted $deleted pending registration(s).",
        ]);
    }
    public function register(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'nip' => 'required|string|min:7|max:18|unique:users_registration,nip|unique:pending_registrations,nip',
            'nik' => 'required|string|max:16|unique:users_registration,nik|unique:pending_registrations,nik',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users_registration,email|unique:pending_registrations,email',
            'phone' => 'required|string|max:15',
            'province' => 'required|string',
            'regency' => 'required|string',
            'district' => 'required|string',
            'village' => 'required|string',
            'address' => 'required|string',
            'password' => 'required|string|min:8',
            'confirmPassword' => 'required|same:password',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Generate 6-digit verification code
            $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            
            // Store temporarily in pending_registrations table
            $pendingUser = PendingRegistration::create([
                'nip'                          => $request->nip,
                'nik'                          => $request->nik,
                'name'                         => $request->name,
                'email'                        => $request->email,
                'phone'                        => $request->phone,
                'province'                     => $request->province,
                'regency'                      => $request->regency,
                'district'                     => $request->district,
                'village'                      => $request->village,
                'address'                      => $request->address,
                'password'                     => Hash::make($request->password),
                'verification_code'            => $verificationCode,
                'verification_code_expires_at' => now()->addMinutes(15),
                'last_activity_at'             => now(),
                'resend_count'                 => 0,
            ]);

            // Send verification email
            try {
                Mail::to($pendingUser->email)->send(new VerificationCodeMail($verificationCode, $pendingUser->name));
                
                \Log::info('Verification email sent', [
                    'pending_id' => $pendingUser->id,
                    'email' => $pendingUser->email,
                    'code' => $verificationCode
                ]);
            } catch (\Exception $mailException) {
                \Log::error('Failed to send verification email', [
                    'pending_id' => $pendingUser->id,
                    'email' => $pendingUser->email,
                    'error' => $mailException->getMessage()
                ]);
                
                // Delete pending registration if email fails
                $pendingUser->delete();
                
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to send verification email. Please try again.',
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => 'Verification code sent to your email. Please verify to complete registration.',
                'data' => [
                    'email' => $pendingUser->email,
                    'name' => $pendingUser->name,
                    'requires_verification' => true
                ]
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Registration error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'verification_code' => 'required|string|size:6',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find pending registration
            $pendingUser = PendingRegistration::where('email', $request->email)
                ->where('verification_code', $request->verification_code)
                ->first();

            if (!$pendingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid verification code',
                ], 400);
            }

            // Check if code is expired
            if (now()->isAfter($pendingUser->verification_code_expires_at)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Verification code has expired',
                ], 400);
            }

            // Create actual user in users_registration table
            $user = UserRegistration::create([
                'nip' => $pendingUser->nip,
                'nik' => $pendingUser->nik,
                'name' => $pendingUser->name,
                'email' => $pendingUser->email,
                'phone' => $pendingUser->phone,
                'province' => $pendingUser->province,
                'regency' => $pendingUser->regency,
                'district' => $pendingUser->district,
                'village' => $pendingUser->village,
                'address' => $pendingUser->address,
                'password' => $pendingUser->password, // Already hashed
                'email_verified_at' => now(),
            ]);

            // Log registration activity (non-blocking)
            try {
                ActivityLog::create([
                    'user_id' => $user->id,
                    'type' => 'register',
                    'action' => 'User registered and verified email',
                    'metadata' => [
                        'email' => $user->email,
                        'name' => $user->name,
                        'nik' => $user->nik,
                    ]
                ]);
            } catch (\Exception $logException) {
                \Log::error('Failed to create activity log', [
                    'error' => $logException->getMessage(),
                    'user_id' => $user->id
                ]);
            }

            // Delete pending registration
            $pendingUser->delete();

            \Log::info('User registration completed', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Email verified successfully. You can now login.',
                'data' => [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                ]
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Email verification error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Verification failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function resendVerificationCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Find pending registration
            $pendingUser = PendingRegistration::where('email', $request->email)->first();

            if (!$pendingUser) {
                return response()->json([
                    'success' => false,
                    'message' => 'Email not found in pending registrations',
                ], 404);
            }

            // Enforce maximum 3 resends
            if ($pendingUser->resend_count >= 3) {
                // Delete the pending registration so user can start fresh
                $pendingUser->delete();

                return response()->json([
                    'success'        => false,
                    'message'        => 'Anda telah melebihi batas pengiriman ulang kode (3x). Silakan daftar ulang.',
                    'max_resend_reached' => true,
                ], 429);
            }

            // Generate new verification code
            $verificationCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

            // Update pending registration: new OTP (15 min), increment resend counter, refresh activity timestamp
            $pendingUser->update([
                'verification_code'            => $verificationCode,
                'verification_code_expires_at' => now()->addMinutes(15),
                'last_activity_at'             => now(),
                'resend_count'                 => $pendingUser->resend_count + 1,
            ]);

            // Send verification email
            Mail::to($pendingUser->email)->send(new VerificationCodeMail($verificationCode, $pendingUser->name));

            \Log::info('Verification code resent', [
                'pending_id'   => $pendingUser->id,
                'email'        => $pendingUser->email,
                'resend_count' => $pendingUser->resend_count,
            ]);

            return response()->json([
                'success'      => true,
                'message'      => 'Verification code resent successfully',
                'resend_count' => $pendingUser->resend_count,
                'resends_left' => 3 - $pendingUser->resend_count,
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Resend verification error', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to resend verification code',
                'error'   => $e->getMessage()
            ], 500);
        }
    }
}
