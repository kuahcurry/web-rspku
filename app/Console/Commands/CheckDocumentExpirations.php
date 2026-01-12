<?php

namespace App\Console\Commands;

use App\Mail\DocumentExpirationWarning;
use App\Models\DokumenLegalitas;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class CheckDocumentExpirations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documents:check-expirations
                          {--force : Force send emails even if already sent}
                          {--test : Test mode - show what would be sent without sending}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check for expiring documents and send warning emails (30 days, 14 days, 7 days)';

    /**
     * Warning stages in days
     */
    private const WARNING_STAGES = [
        30 => 'warning_30_days_sent_at',
        14 => 'warning_14_days_sent_at',
        7 => 'warning_7_days_sent_at',
    ];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔍 Checking for expiring documents...');
        $this->newLine();

        $force = $this->option('force');
        $testMode = $this->option('test');

        if ($testMode) {
            $this->warn('🧪 TEST MODE - No emails will be sent');
            $this->newLine();
        }

        $totalSent = 0;
        $totalChecked = 0;

        foreach (self::WARNING_STAGES as $days => $sentColumn) {
            $this->info("📅 Checking for documents expiring in {$days} days...");
            
            $sent = $this->checkAndSendWarnings($days, $sentColumn, $force, $testMode);
            
            $totalSent += $sent;
            $totalChecked++;
            
            $this->line("   ✅ Processed {$days}-day warnings: {$sent} email(s)");
            $this->newLine();
        }

        // Summary
        $this->info('═══════════════════════════════════════');
        $this->info("✅ Document expiration check complete!");
        $this->info("📊 Total emails sent: {$totalSent}");
        $this->info('═══════════════════════════════════════');

        return Command::SUCCESS;
    }

    /**
     * Check and send warnings for a specific stage
     */
    private function checkAndSendWarnings(int $daysBeforeExpiry, string $sentColumn, bool $force, bool $testMode): int
    {
        $targetDate = Carbon::today()->addDays($daysBeforeExpiry);
        $emailsSent = 0;

        // Get documents expiring on target date
        $query = DokumenLegalitas::whereNotNull('tanggal_berlaku')
            ->whereDate('tanggal_berlaku', $targetDate)
            ->with('user');

        // If not forcing, only get documents where warning hasn't been sent
        if (!$force) {
            $query->whereNull($sentColumn);
        }

        $documents = $query->get();

        if ($documents->isEmpty()) {
            $this->line("   ℹ️  No documents found expiring on " . $targetDate->format('Y-m-d'));
            return 0;
        }

        $this->line("   📝 Found {$documents->count()} document(s) expiring on " . $targetDate->format('Y-m-d'));

        foreach ($documents as $document) {
            try {
                $user = $document->user;

                if (!$user || !$user->email) {
                    $this->warn("   ⚠️  Skipping document ID {$document->id}: User or email not found");
                    continue;
                }

                // Determine stage identifier
                $stage = match($daysBeforeExpiry) {
                    30 => '30_days',
                    14 => '14_days',
                    7 => '7_days',
                    default => 'unknown'
                };

                if ($testMode) {
                    $this->line("   🧪 Would send to: {$user->email} ({$user->name})");
                    $this->line("      Document: {$document->jenis_dokumen}");
                    $this->line("      Expires: {$document->tanggal_berlaku->format('Y-m-d')}");
                } else {
                    // Send email
                    Mail::to($user->email)->send(
                        new DocumentExpirationWarning(
                            $document,
                            $user->name,
                            $daysBeforeExpiry,
                            $stage
                        )
                    );

                    // Update sent timestamp
                    $document->update([
                        $sentColumn => Carbon::now()
                    ]);

                    $this->line("   ✉️  Sent to: {$user->email} ({$user->name}) - {$document->jenis_dokumen}");
                    
                    Log::info('Document expiration warning sent', [
                        'user_id' => $user->id,
                        'user_email' => $user->email,
                        'document_id' => $document->id,
                        'document_type' => $document->jenis_dokumen,
                        'expiry_date' => $document->tanggal_berlaku->format('Y-m-d'),
                        'days_remaining' => $daysBeforeExpiry,
                        'stage' => $stage
                    ]);
                }

                $emailsSent++;

            } catch (\Exception $e) {
                $this->error("   ❌ Error sending email for document ID {$document->id}: {$e->getMessage()}");
                
                Log::error('Failed to send document expiration warning', [
                    'document_id' => $document->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }
        }

        return $emailsSent;
    }

    /**
     * Display upcoming expirations (bonus feature)
     */
    private function displayUpcomingExpirations(): void
    {
        $this->newLine();
        $this->info('📊 Upcoming Expirations Summary:');
        $this->line('─────────────────────────────────');

        foreach ([30, 14, 7, 3, 1] as $days) {
            $targetDate = Carbon::today()->addDays($days);
            $count = DokumenLegalitas::whereNotNull('tanggal_berlaku')
                ->whereDate('tanggal_berlaku', $targetDate)
                ->count();

            if ($count > 0) {
                $emoji = $days <= 7 ? '🔴' : ($days <= 14 ? '🟡' : '🟢');
                $this->line("   {$emoji} {$days} days: {$count} document(s) on " . $targetDate->format('Y-m-d'));
            }
        }
    }
}
