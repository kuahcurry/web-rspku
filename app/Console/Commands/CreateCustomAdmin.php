<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class CreateCustomAdmin extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'admin:create 
                            {--name= : The name of the admin}
                            {--email= : The email of the admin}
                            {--password= : The password of the admin}
                            {--role=admin : The role of the admin (admin or super_admin)}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create a new admin account with encrypted password';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('=== Create New Admin Account ===');
        $this->newLine();

        // Get or ask for name
        $name = $this->option('name') ?: $this->ask('Enter admin name');
        
        // Get or ask for email
        $email = $this->option('email') ?: $this->ask('Enter admin email');
        
        // Get or ask for password
        $password = $this->option('password') ?: $this->secret('Enter admin password');
        
        // Get or ask for role
        $role = $this->option('role') ?: $this->choice(
            'Select admin role',
            ['admin', 'super_admin'],
            0
        );

        // Validate input
        $validator = Validator::make([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => $role,
        ], [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:admins,email',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,super_admin',
        ]);

        if ($validator->fails()) {
            $this->error('Validation failed:');
            foreach ($validator->errors()->all() as $error) {
                $this->error('- ' . $error);
            }
            return 1;
        }

        try {
            // Create admin with encrypted password
            $admin = Admin::create([
                'name' => $name,
                'email' => $email,
                'password' => Hash::make($password),
                'role' => $role,
            ]);

            $this->newLine();
            $this->info('✓ Admin account created successfully!');
            $this->newLine();
            $this->table(
                ['Field', 'Value'],
                [
                    ['ID', $admin->id],
                    ['Name', $admin->name],
                    ['Email', $admin->email],
                    ['Role', $admin->role],
                    ['Created At', $admin->created_at],
                ]
            );
            $this->newLine();
            $this->comment('Password has been securely encrypted.');

            return 0;
        } catch (\Exception $e) {
            $this->error('Failed to create admin account:');
            $this->error($e->getMessage());
            return 1;
        }
    }
}
