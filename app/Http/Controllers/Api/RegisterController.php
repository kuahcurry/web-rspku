<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\UserRegistration;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

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
            'province' => 'required|string|max:255',
            'regency' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'village' => 'required|string|max:255',
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
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => $user
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
