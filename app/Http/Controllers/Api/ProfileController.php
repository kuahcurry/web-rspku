<?php

namespace App\Http\Controllers\Api;

use App\Helpers\RegionHelper;
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
                'nip' => 'sometimes|string|min:7|max:18|unique:users_registration,nip,' . $user->id,
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
                'province',
                'regency',
                'district',
                'village',
                'address',
                'status_kepegawaian',
                'jabatan',
                'unit_kerja',
                'email',
            ]);

            // Only update tanggal_lahir if present and not empty
            if ($request->has('tanggal_lahir') && !empty($request->tanggal_lahir)) {
                $updateData['tanggal_lahir'] = $request->tanggal_lahir;
            }
            // Only update tanggal_mulai_kerja if present and not empty
            if ($request->has('tanggal_mulai_kerja') && !empty($request->tanggal_mulai_kerja)) {
                $updateData['tanggal_mulai_kerja'] = $request->tanggal_mulai_kerja;
            }
            
            // Hash password if provided
            if ($request->has('password') && !empty($request->password)) {
                $updateData['password'] = Hash::make($request->password);
            }

            // Compose alamat_lengkap for DB
            $province = RegionHelper::getProvinceName($updateData['province'] ?? $user->province);
            $regency = RegionHelper::getRegencyName($updateData['regency'] ?? $user->regency);
            $district = RegionHelper::getDistrictName($updateData['district'] ?? $user->district);
            $village = RegionHelper::getVillageName($updateData['village'] ?? $user->village);
            $alamat_lengkap_raw = trim(implode(', ', array_filter([
                $updateData['address'] ?? $user->address,
                $village,
                $district,
                $regency,
                $province
            ])));
            // Convert to sentence case: all lowercase, then ucfirst
            $alamat_lengkap = $alamat_lengkap_raw ? ucfirst(mb_strtolower($alamat_lengkap_raw)) : '';
            $updateData['alamat_lengkap'] = $alamat_lengkap;
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

            // Add region names and alamat_lengkap to response
            $province = RegionHelper::getProvinceName($user->province);
            $regency = RegionHelper::getRegencyName($user->regency);
            $district = RegionHelper::getDistrictName($user->district);
            $village = RegionHelper::getVillageName($user->village);
            $alamat_lengkap = trim(implode(', ', array_filter([
                $user->address,
                $village,
                $district,
                $regency,
                $province
            ])));

            $userData = $user->toArray();
            $userData['province'] = $province;
            $userData['regency'] = $regency;
            $userData['district'] = $district;
            $userData['village'] = $village;
            $userData['alamat_lengkap'] = $alamat_lengkap;

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $userData
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

            // Generate full URL for profile picture
            $profileUrl = env('APP_URL') . '/storage/' . $filePath;
            
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
            $profileUrl = env('APP_URL') . '/storage/' . $user->foto_profil;
            
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
            
            // Accept either the old confirmation phrase or the new one for non-activation
            $validator = Validator::make($request->all(), [
                'password' => 'required|string',
                'confirmation_text' => 'required|string|in:HAPUS AKUN SAYA,NONAKTIFKAN AKUN SAYA',
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

            // Instead of permanently deleting, mark the account as non-active
            $user->status_kepegawaian = 'Tidak Aktif';
            $user->save();

            // Invalidate the JWT token
            auth()->logout();

            return response()->json([
                'success' => true,
                'message' => 'Akun berhasil dinonaktifkan. Hubungi administrator jika ingin mengaktifkan kembali.',
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
