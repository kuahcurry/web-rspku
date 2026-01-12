<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Adjust email/password/name as needed. This is idempotent.
        User::updateOrCreate(
            ['email' => 'admin@keperawatan-pkugombong.com'],
            [
                'name' => 'Administrator',
                'email' => 'admin@keperawatan-pkugombong.com',
                'password' => Hash::make('admin123'), // change default password after first login
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }
}
