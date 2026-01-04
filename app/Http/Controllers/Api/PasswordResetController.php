<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use App\Models\UserRegistration;
use App\Mail\PasswordResetMail;

class PasswordResetController extends Controller
{
    /**
     * Send password reset link/code to user's email
     */
    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $user = UserRegistration::where('email', $request->email)->first();

        if (!$user) {
            // Don't reveal if email exists or not for security
            // Return success message but don't send any email
            return response()->json([
                'success' => true,
                'message' => 'Jika email terdaftar, Anda akan menerima kode reset password.'
            ], 200);
        }

        // Generate a 6-digit reset code
        $resetCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        
        // Store the token in password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($resetCode),
                'created_at' => now()
            ]
        );

        try {
            Mail::to($user->email)->send(new PasswordResetMail($resetCode, $user->name));
            
            return response()->json([
                'success' => true,
                'message' => 'Kode reset password telah dikirim ke email Anda.'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengirim email reset password.',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify the reset code
     */
    public function verifyResetCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Kode reset tidak valid atau sudah kedaluwarsa.'
            ], 400);
        }

        // Check if code is expired (15 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 15) {
            // Delete expired token
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            
            return response()->json([
                'success' => false,
                'message' => 'Kode reset sudah kedaluwarsa. Silakan minta kode baru.'
            ], 400);
        }

        // Verify the code
        if (!Hash::check($request->code, $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode reset tidak valid.'
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => 'Kode valid. Silakan masukkan password baru.'
        ], 200);
    }

    /**
     * Reset the password
     */
    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:6',
            'password' => 'required|string|min:8|confirmed'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        $resetRecord = DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json([
                'success' => false,
                'message' => 'Kode reset tidak valid atau sudah kedaluwarsa.'
            ], 400);
        }

        // Check if code is expired (15 minutes)
        if (now()->diffInMinutes($resetRecord->created_at) > 15) {
            DB::table('password_reset_tokens')->where('email', $request->email)->delete();
            
            return response()->json([
                'success' => false,
                'message' => 'Kode reset sudah kedaluwarsa. Silakan minta kode baru.'
            ], 400);
        }

        // Verify the code
        if (!Hash::check($request->code, $resetRecord->token)) {
            return response()->json([
                'success' => false,
                'message' => 'Kode reset tidak valid.'
            ], 400);
        }

        // Update the password
        $user = UserRegistration::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.'
            ], 404);
        }

        $user->update([
            'password' => Hash::make($request->password)
        ]);

        // Delete the reset token
        DB::table('password_reset_tokens')->where('email', $request->email)->delete();

        return response()->json([
            'success' => true,
            'message' => 'Password berhasil direset. Silakan login dengan password baru.'
        ], 200);
    }
}
