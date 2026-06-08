<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DokumenLegalitas;
use Carbon\Carbon;

class CheckDocuments extends Command
{
    protected $signature = 'check:documents';
    protected $description = 'Check documents and their expiry dates';

    public function handle()
    {
        $this->info('=== Checking Documents ===');
        $this->newLine();
        
        $documents = DokumenLegalitas::with('user:id,name')->get();
        
        if ($documents->isEmpty()) {
            $this->warn('No documents found in database.');
            return;
        }
        
        $this->info("Total documents: {$documents->count()}");
        $this->newLine();
        
        foreach ($documents as $doc) {
            $expiryDate = Carbon::parse($doc->tanggal_berlaku);
            $daysLeft = Carbon::now()->startOfDay()->diffInDays($expiryDate->startOfDay(), false);
            
            $status = $daysLeft < 0 ? 'EXPIRED' : ($daysLeft <= 7 ? 'CRITICAL' : ($daysLeft <= 30 ? 'WARNING' : 'OK'));
            
            $this->line("User: " . ($doc->user->name ?? 'Unknown'));
            $this->line("Type: {$doc->jenis_dokumen}");
            $this->line("Expiry: {$doc->tanggal_berlaku->format('Y-m-d')}");
            $this->line("Days left: {$daysLeft}");
            $this->line("Status: {$status}");
            $this->newLine();
        }
        
        // Check expiring query
        $expiring = DokumenLegalitas::where('tanggal_berlaku', '<=', Carbon::now()->addDays(60))->count();
        $this->info("Documents expiring within 60 days: {$expiring}");
    }
}
