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
    protected $description = 'Check for expiring documents and send warning emails (SIP: 180/90/30 days, others: 30/14/7/3/1 days)';

    /**
     * Warning stages in days
     */
    private const WARNING_STAGES = [
        180 => 'warning_180_days_sent_at',
        90 => 'warning_90_days_sent_at',
        30 => 'warning_30_days_sent_at',
        14 => 'warning_14_days_sent_at',
        7 => 'warning_7_days_sent_at',
        3 => 'warning_3_days_sent_at',
        1 => 'warning_1_day_sent_at',
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

        // Get all documents that might need warnings (expiring within 180 days)
        $documents = DokumenLegalitas::whereNotNull('tanggal_berlaku')
            ->where('tanggal_berlaku', '>=', Carbon::today())
            ->where('tanggal_berlaku', '<=', Carbon::today()->addDays(180))
            ->with('user')
            ->get();

        $this->info("📋 Found {$documents->count()} document(s) to check");
        $this->newLine();

        foreach ($documents as $document) {
            $warningsSent = $this->checkDocumentWarnings($document, $force, $testMode);
            $totalSent += $warningsSent;
        }

        // Summary
        $this->info('═══════════════════════════════════════');
        $this->info("✅ Document expiration check complete!");
        $this->info("📊 Total emails sent: {$totalSent}");
        $this->info('═══════════════════════════════════════');

        return Command::SUCCESS;
    }

    /**
     * Check and send warnings for a specific document
     */
    private function checkDocumentWarnings(DokumenLegalitas $document, bool $force, bool $testMode): int
    {
        $user = $document->user;
        if (!$user || !$user->email) {
            $this->warn("⚠️ Skipping document ID {$document->id}: User or email not found");
            return 0;
        }

        $daysRemaining = Carbon::today()->diffInDays($document->tanggal_berlaku, false);
        if ($daysRemaining < 0) {
            // Already expired
            return 0;
        }

        // Determine warning stages based on document type
        $warningStages = $this->getWarningStagesForDocument($document->jenis_dokumen);

        $emailsSent = 0;

        foreach ($warningStages as $days => $sentColumn) {
            if ($daysRemaining == $days) {
                // Check if warning already sent
                if (!$force && $document->$sentColumn) {
                    continue;
                }

                $stage = $this->getStageIdentifier($days);

                try {
                    if ($testMode) {
                        $this->line("🧪 Would send {$days}-day warning to: {$user->email} ({$user->name}) - {$document->jenis_dokumen}");
                    } else {
                        // Send email
                        Mail::to($user->email)->send(
                            new DocumentExpirationWarning(
                                $document,
                                $user->name,
                                $days,
                                $stage
                            )
                        );

                        // Update sent timestamp
                        $document->update([
                            $sentColumn => Carbon::now()
                        ]);

                        $this->line("✉️ Sent {$days}-day warning to: {$user->email} ({$user->name}) - {$document->jenis_dokumen}");

                        Log::info('Document expiration warning sent', [
                            'user_id' => $user->id,
                            'user_email' => $user->email,
                            'document_id' => $document->id,
                            'document_type' => $document->jenis_dokumen,
                            'expiry_date' => $document->tanggal_berlaku->format('Y-m-d'),
                            'days_remaining' => $days,
                            'stage' => $stage
                        ]);
                    }

                    $emailsSent++;
                } catch (\Exception $e) {
                    $this->error("❌ Error sending {$days}-day warning for document ID {$document->id}: {$e->getMessage()}");

                    Log::error('Failed to send document expiration warning', [
                        'document_id' => $document->id,
                        'days' => $days,
                        'error' => $e->getMessage(),
                        'trace' => $e->getTraceAsString()
                    ]);
                }
            }
        }

        return $emailsSent;
    }

    /**
     * Get warning stages for a document type
     */
    private function getWarningStagesForDocument(string $jenisDokumen): array
    {
        if (strtoupper($jenisDokumen) === 'SIP') {
            return [
                180 => 'warning_180_days_sent_at',
                90 => 'warning_90_days_sent_at',
                30 => 'warning_30_days_sent_at',
            ];
        }

        // Default stages for other documents
        return [
            30 => 'warning_30_days_sent_at',
            14 => 'warning_14_days_sent_at',
            7 => 'warning_7_days_sent_at',
            3 => 'warning_3_days_sent_at',
            1 => 'warning_1_day_sent_at',
        ];
    }

    /**
     * Get stage identifier for email
     */
    private function getStageIdentifier(int $days): string
    {
        return match($days) {
            180 => '180_days',
            90 => '90_days',
            30 => '30_days',
            14 => '14_days',
            7 => '7_days',
            3 => '3_days',
            1 => '1_day',
            default => 'unknown'
        };
    }
}
