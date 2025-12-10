<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $user = auth()->user();
            
            $validator = Validator::make($request->all(), [
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
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $user->update($request->only([
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
            ]));

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
     * Update user account (email and password)
     */
    public function updateAccount(Request $request)
    {
        try {
            $user = auth()->user();
            
            $validator = Validator::make($request->all(), [
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

            $updateData = [];
            
            if ($request->has('email')) {
                $updateData['email'] = $request->email;
            }
            
            if ($request->has('password') && !empty($request->password)) {
                $updateData['password'] = Hash::make($request->password);
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            return response()->json([
                'success' => true,
                'message' => 'Account updated successfully',
                'data' => $user
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update account',
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
     * Sanitize folder name to remove special characters
     */
    private function sanitizeFolderName($name)
    {
        return preg_replace('/[^A-Za-z0-9_-]/', '_', $name);
    }
}
