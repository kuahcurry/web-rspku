<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerificationCodeMail;

class TestEmailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'email:test {email}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Test email verification sending';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');
        $testCode = '123456';
        
        $this->info('Sending test verification email to: ' . $email);
        
        try {
            Mail::to($email)->send(new VerificationCodeMail($testCode, 'Test User'));
            $this->info('✓ Email sent successfully!');
            $this->info('Check your Mailtrap inbox at: https://mailtrap.io/inboxes');
        } catch (\Exception $e) {
            $this->error('✗ Failed to send email: ' . $e->getMessage());
        }
    }
}
