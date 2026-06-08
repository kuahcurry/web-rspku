<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Admin;

class CreateAdminUser extends Command
{
    protected $signature = 'user:create-admin';
    protected $description = 'Create admin user in admins table';

    public function handle()
    {
        try {
            // Check if admin user already exists
            $existingAdmin = Admin::where('email', 'admin@pku.com')->first();
            if ($existingAdmin) {
                $this->warn('Admin user already exists!');
                return;
            }

            // Create admin user
            $admin = Admin::create([
                'name' => 'Administrator',
                'email' => 'admin@pku.com',
                'password' => bcrypt('admin123'),
            ]);

            $this->info('Admin user created successfully!');
            $this->info('Email: admin@pku.com');
            $this->info('Password: admin123');

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
        }
    }
}
