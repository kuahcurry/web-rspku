<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use App\Models\Admin;

class AdminManagementController extends Controller
{
    /**
     * Get list of all admins (super admin only)
     */
    public function index(Request $request)
    {
        try {
            // Check if current admin is super admin
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || $currentAdmin->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only super admin can access this resource.'
                ], 403);
            }

            $admins = Admin::select('id', 'name', 'email', 'role', 'created_at')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $admins
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve admins',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Create new admin (super admin only)
     */
    public function store(Request $request)
    {
        try {
            // Check if current admin is super admin
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || $currentAdmin->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only super admin can create admins.'
                ], 403);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:admins,email',
                'password' => 'required|string|min:8',
                'role' => 'required|in:admin,super_admin'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $admin = Admin::create([
                'name' => $request->name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'role' => $request->role
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Admin created successfully',
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'created_at' => $admin->created_at
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update admin (super admin only)
     */
    public function update(Request $request, $id)
    {
        try {
            // Check if current admin is super admin
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || $currentAdmin->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only super admin can update admins.'
                ], 403);
            }

            $admin = Admin::find($id);
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            $rules = [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:admins,email,' . $id,
                'role' => 'required|in:admin,super_admin'
            ];

            // Only validate password if provided
            if ($request->filled('password')) {
                $rules['password'] = 'string|min:8';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $admin->name = $request->name;
            $admin->email = $request->email;
            $admin->role = $request->role;

            if ($request->filled('password')) {
                $admin->password = Hash::make($request->password);
            }

            $admin->save();

            return response()->json([
                'success' => true,
                'message' => 'Admin updated successfully',
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'created_at' => $admin->created_at
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete admin (super admin only)
     */
    public function destroy($id)
    {
        try {
            // Check if current admin is super admin
            $currentAdmin = auth('admin')->user();
            if (!$currentAdmin || $currentAdmin->role !== 'super_admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized. Only super admin can delete admins.'
                ], 403);
            }

            // Prevent deleting self
            if ($currentAdmin->id == $id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You cannot delete your own account.'
                ], 400);
            }

            $admin = Admin::find($id);
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Admin not found'
                ], 404);
            }

            $admin->delete();

            return response()->json([
                'success' => true,
                'message' => 'Admin deleted successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete admin',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get current admin profile
     */
    public function profile()
    {
        try {
            $admin = auth('admin')->user();
            
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'role' => $admin->role,
                    'created_at' => $admin->created_at
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update own profile
     */
    public function updateProfile(Request $request)
    {
        try {
            $admin = auth('admin')->user();
            
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'email' => 'required|email|unique:admins,email,' . $admin->id
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $admin->name = $request->name;
            $admin->email = $request->email;
            $admin->save();

            // Update localStorage data
            $updatedData = [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role
            ];

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'data' => $updatedData
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
     * Change own password
     */
    public function changePassword(Request $request)
    {
        try {
            $admin = auth('admin')->user();
            
            if (!$admin) {
                return response()->json([
                    'success' => false,
                    'message' => 'Not authenticated'
                ], 401);
            }

            $validator = Validator::make($request->all(), [
                'current_password' => 'required|string',
                'new_password' => 'required|string|min:8',
                'confirm_password' => 'required|string|same:new_password'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Verify current password
            if (!Hash::check($request->current_password, $admin->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 400);
            }

            // Update password
            $admin->password = Hash::make($request->new_password);
            $admin->save();

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to change password',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
