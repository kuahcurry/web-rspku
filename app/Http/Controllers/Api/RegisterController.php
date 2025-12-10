<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserRegistration;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class RegisterController extends Controller
{
    public function register(Request $request)
    {
        // Validate the request
        $validator = Validator::make($request->all(), [
            'nip' => 'required|string|max:18|unique:users_registration,nip',
            'nik' => 'required|string|max:16|unique:users_registration,nik',
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users_registration,email',
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
            
            // Create the user
            $user = UserRegistration::create([
                'nip' => $request->nip,
                'nik' => $request->nik,
                'name' => $request->name,
                'email' => $request->email,
                'phone' => $request->phone,
                'province' => $request->province,
                'regency' => $request->regency,
                'district' => $request->district,
                'village' => $request->village,
                'address' => $request->address,
                'password' => Hash::make($request->password),
                'email_verification_code' => $verificationCode,
                'email_verification_code_expires_at' => now()->addMinutes(15),
            ]);

            // Send verification email
            try {
                Mail::to($user->email)->send(new VerificationCodeMail($verificationCode, $user->name));
                
                \Log::info('Verification email sent', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'code' => $verificationCode
                ]);
            } catch (\Exception $mailException) {
                \Log::error('Failed to send verification email', [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'error' => $mailException->getMessage()
                ]);
                // Don't fail registration if email fails, user can resend
            }

            return response()->json([
                'success' => true,
                'message' => 'Registration successful. Please check your email for verification code.',
                'data' => [
                    'user_id' => $user->id,
                    'email' => $user->email,
                    'name' => $user->name,
                    'requires_verification' => true
                ]
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Registration failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
