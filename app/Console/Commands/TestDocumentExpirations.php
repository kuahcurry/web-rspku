<?php

namespace App\Console\Commands;

use App\Mail\DocumentExpirationWarning;
use App\Models\DokumenLegalitas;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class TestDocumentExpirations extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'documents:test-expirations
                          {email : Email address to send test emails to}
                          {--create : Create test documents with expiration dates}';

    /**
     * The console command description.
     */
    protected $description = 'Test document expiration emails for all time periods (30, 14, 7, 3, 1 days)';

    /**
     * Test stages
     */
    private const TEST_STAGES = [
        30 => ['days' => 30, 'stage' => '30_days', 'label' => '30 Days Warning'],
        14 => ['days' => 14, 'stage' => '14_days', 'label' => '14 Days Warning'],
        7 => ['days' => 7, 'stage' => '7_days', 'label' => '7 Days Warning'],
        3 => ['days' => 3, 'stage' => '3_days', 'label' => '3 Days Warning'],
        1 => ['days' => 1, 'stage' => '1_day', 'label' => '1 Day Warning (Critical)'],
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');
        $createDocuments = $this->option('create');

        $this->info('🧪 Testing Document Expiration Email System');
        $this->info('══════════════════════════════════════════════');
        $this->newLine();

        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('❌ Invalid email address provided');
            return Command::FAILURE;
        }

        // Get test user
        $testUser = $this->getOrCreateTestUser($email);

        if ($createDocuments) {
            $this->info('📝 Creating test documents with expiration dates...');
            $this->createTestDocuments($testUser);
            $this->newLine();
        }

        $this->info("📧 Sending test emails to: {$email}");
        $this->newLine();

        $successCount = 0;
        $failCount = 0;

        foreach (self::TEST_STAGES as $config) {
            try {
                $this->sendTestEmail($testUser, $config);
                $successCount++;
                $this->line("   ✅ {$config['label']} - Sent successfully");
            } catch (\Exception $e) {
                $failCount++;
                $this->error("   ❌ {$config['label']} - Failed: {$e->getMessage()}");
            }
        }

        $this->newLine();
        $this->info('══════════════════════════════════════════════');
        $this->info("✅ Test complete!");
        $this->info("📊 Success: {$successCount} | Failed: {$failCount}");
        $this->info('══════════════════════════════════════════════');
        $this->newLine();

        if ($successCount > 0) {
            $this->info("📬 Check your inbox at: {$email}");
            $this->line("   You should receive {$successCount} test email(s)");
        }

        return Command::SUCCESS;
    }

    /**
     * Get or create test user
     */
    private function getOrCreateTestUser(string $email): User
    {
        // Create a mock user for testing (not saved to database)
        $testUser = new User([
            'name' => 'Test User',
            'email' => $email,
            'nip' => '123456789',
        ]);
        
        $this->line("ℹ️  Using test user: {$testUser->name} ({$email})");
        
        return $testUser;
    }

    /**
     * Create test documents with various expiration dates
     */
    private function createTestDocuments(User $user): void
    {
        foreach (self::TEST_STAGES as $config) {
            $expiryDate = Carbon::today()->addDays($config['days']);
            
            $document = DokumenLegalitas::create([
                'user_id' => $user->id,
                'jenis_dokumen' => "Test Document ({$config['label']})",
                'nomor_sk' => 'TEST-' . $config['days'] . 'D-' . now()->format('YmdHis'),
                'tanggal_mulai' => Carbon::today()->subYear(),
                'tanggal_berlaku' => $expiryDate,
                'file_path' => 'test/document.pdf',
            ]);

            $this->line("   📄 Created: {$document->jenis_dokumen} (expires: {$expiryDate->format('Y-m-d')})");
        }
    }

    /**
     * Send test email for a specific stage
     */
    private function sendTestEmail(User $user, array $config): void
    {
        // Create a mock document
        $mockDocument = new DokumenLegalitas([
            'user_id' => $user->id,
            'jenis_dokumen' => "Surat Izin Praktik (SIP) - Test {$config['label']}",
            'nomor_sk' => 'TEST/' . $config['days'] . 'D/XII/2025',
            'tanggal_mulai' => Carbon::today()->subYear(),
            'tanggal_berlaku' => Carbon::today()->addDays($config['days']),
        ]);

        // Send email
        $email = $this->argument('email');
        
        Mail::to($email)->send(
            new DocumentExpirationWarning(
                $mockDocument,
                $user->name ?? 'Test User',
                $config['days'],
                $config['stage']
            )
        );
    }
}
