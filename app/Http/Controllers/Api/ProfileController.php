<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

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
}
