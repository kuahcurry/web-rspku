<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use App\Models\ActivityLog;

class ProfileController extends Controller
{
    /**
     * Update user profile (merged profile + account updates)
     * Handles: profile data, email, password changes in one endpoint
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = auth()->user();
            
            $validator = Validator::make($request->all(), [
                // Profile fields
                'nip' => 'sometimes|string|max:18|unique:users_registration,nip,' . $user->id,
                'nik' => 'sometimes|string|max:16|unique:users_registration,nik,' . $user->id,
                'name' => 'sometimes|string|max:255',
                'phone' => 'sometimes|string|max:15',
                'jenis_kelamin' => 'sometimes|string|max:20',
                'agama' => 'sometimes|string|max:50',
                'tempat' => 'sometimes|string|max:100',
                'tanggal_lahir' => 'sometimes|date',
                'province' => 'sometimes|string|max:255',
                'regency' => 'sometimes|string|max:255',
                'district' => 'sometimes|string|max:255',
                'village' => 'sometimes|string|max:255',
                'address' => 'sometimes|string',
                'status_kepegawaian' => 'sometimes|string|max:100',
                'jabatan' => 'sometimes|string|max:100',
                'unit_kerja' => 'sometimes|string|max:100',
                'tanggal_mulai_kerja' => 'sometimes|date',
                // Account fields
                'email' => 'sometimes|email|max:255|unique:users_registration,email,' . $user->id,
                'password' => 'sometimes|string|min:8',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = $request->only([
                'nip',
                'nik',
                'name',
                'phone',
                'jenis_kelamin',
                'agama',
                'tempat',
                'tanggal_lahir',
                'province',
                'regency',
                'district',
                'village',
                'address',
                'status_kepegawaian',
                'jabatan',
                'unit_kerja',
                'tanggal_mulai_kerja',
                'email',
            ]);
            
            // Hash password if provided
            if ($request->has('password') && !empty($request->password)) {
                $updateData['password'] = Hash::make($request->password);
            }

            $user->update($updateData);

            // Log profile update activity (non-blocking)
            try {
                $changedFields = array_keys($updateData);
                ActivityLog::create([
                    'user_id' => $user->id,
                    'type' => 'update',
                    'action' => 'Profile updated',
                    'metadata' => [
                        'fields_updated' => $changedFields,
                    ]
                ]);
            } catch (\Exception $logException) {
                \Log::error('Failed to create activity log', [
                    'error' => $logException->getMessage(),
                    'user_id' => $user->id
                ]);
            }

            // Clear user cache after update
            Cache::forget("user_profile_{$user->id}");

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $user
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload profile picture
     */
    public function uploadProfilePicture(Request $request)
    {
        try {
            $user = auth()->user();
            
            $validator = Validator::make($request->all(), [
                'foto_profil' => 'required|image|mimes:jpeg,jpg,png|max:2048', // Max 2MB
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Delete old profile picture if exists
            if ($user->foto_profil && Storage::disk('public')->exists($user->foto_profil)) {
                Storage::disk('public')->delete($user->foto_profil);
            }

            // Create folder name: {name}_{nik} (same as dokumen legalitas)
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;

            // Store the file in the same base folder
            $file = $request->file('foto_profil');
            $fileName = 'profile_' . time() . '.' . $file->getClientOriginalExtension();
            $filePath = $file->storeAs($folderName, $fileName, 'public');

            // Update user's foto_profil path
            $user->update([
                'foto_profil' => $filePath
            ]);

            $profileUrl = Storage::disk('public')->url($filePath);
            // Normalize URL to remove double slashes
            $profileUrl = preg_replace('#(?<!:)//+#', '/', $profileUrl);
            
            \Log::info('Profile picture uploaded', [
                'user_id' => $user->id,
                'file_path' => $filePath,
                'full_url' => $profileUrl,
                'folder_name' => $folderName,
                'file_exists' => Storage::disk('public')->exists($filePath)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture uploaded successfully',
                'data' => [
                    'foto_profil' => $filePath,
                    'foto_profil_url' => $profileUrl
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload profile picture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get profile picture URL
     */
    public function getProfilePicture()
    {
        try {
            $user = auth()->user();
            
            \Log::info('Fetching profile picture', [
                'user_id' => $user->id,
                'user_name' => $user->name,
                'foto_profil_db' => $user->foto_profil
            ]);
            
            if (!$user->foto_profil) {
                \Log::info('No profile picture in database for user: ' . $user->id);
                return response()->json([
                    'success' => true,
                    'message' => 'No profile picture found',
                    'data' => [
                        'foto_profil' => null,
                        'foto_profil_url' => null
                    ]
                ], 200);
            }

            $fileExists = Storage::disk('public')->exists($user->foto_profil);
            $profileUrl = Storage::disk('public')->url($user->foto_profil);
            // Normalize URL to remove double slashes
            $profileUrl = preg_replace('#(?<!:)//+#', '/', $profileUrl);
            
            \Log::info('Profile picture details', [
                'file_path' => $user->foto_profil,
                'file_exists' => $fileExists,
                'full_url' => $profileUrl,
                'storage_path' => Storage::disk('public')->path($user->foto_profil)
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture retrieved successfully',
                'data' => [
                    'foto_profil' => $user->foto_profil,
                    'foto_profil_url' => $profileUrl
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to get profile picture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete profile picture
     */
    public function deleteProfilePicture()
    {
        try {
            $user = auth()->user();
            
            if ($user->foto_profil && Storage::disk('public')->exists($user->foto_profil)) {
                Storage::disk('public')->delete($user->foto_profil);
            }

            $user->update([
                'foto_profil' => null
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile picture deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete profile picture',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete user account permanently
     */
    public function deleteAccount(Request $request)
    {
        try {
            $user = auth()->user();
            
            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
                'confirmation_text' => 'required|string|in:HAPUS AKUN SAYA',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Password salah',
                    'errors' => ['password' => ['Password yang Anda masukkan salah']]
                ], 401);
            }

            // Delete user's profile picture if exists
            if ($user->foto_profil) {
                Storage::disk('public')->delete($user->foto_profil);
            }

            // Delete user's folder if exists
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->id;
            $folderPath = 'users/' . $folderName;
            if (Storage::disk('public')->exists($folderPath)) {
                Storage::disk('public')->deleteDirectory($folderPath);
            }

            // Invalidate the JWT token
            auth()->logout();

            // Delete the user
            $user->delete();

            return response()->json([
                'success' => true,
                'message' => 'Akun berhasil dihapus secara permanen',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghapus akun',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sanitize folder name to remove special characters
     */
    private function sanitizeFolderName($name)
    {
        return preg_replace('/[^A-Za-z0-9_-]/', '_', $name);
    }
}
