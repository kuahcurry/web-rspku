<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\DokumenLegalitas;
use Carbon\Carbon;

class TestExpiringDocuments extends Command
{
    protected $signature = 'test:expiring';
    protected $description = 'Test expiring documents endpoint logic';

    public function handle()
    {
        $this->info('=== Testing Expiring Documents Query ===');
        $this->newLine();
        
        // Simulate the controller query
        $documents = DokumenLegalitas::with('user:id,name,nik,unit_kerja')
            ->where('tanggal_berlaku', '<=', Carbon::now()->addDays(60))
            ->orderBy('tanggal_berlaku', 'asc')
            ->get()
            ->map(function($doc) {
                $expiryDate = Carbon::parse($doc->tanggal_berlaku);
                $daysLeft = Carbon::now()->startOfDay()->diffInDays($expiryDate->startOfDay(), false);
                
                return [
                    'id' => $doc->id,
                    'userName' => $doc->user->name ?? 'Unknown',
                    'nip' => $doc->user->nik ?? '-',
                    'unit' => $doc->user->unit_kerja ?? '-',
                    'documentType' => $doc->jenis_dokumen,
                    'documentNumber' => $doc->nomor_sk ?? '-',
                    'expiryDate' => $expiryDate->format('Y-m-d'),
                    'daysLeft' => $daysLeft,
                    'status' => $daysLeft < 0 ? 'expired' : ($daysLeft <= 7 ? 'critical' : ($daysLeft <= 30 ? 'warning' : 'upcoming'))
                ];
            });
        
        $this->info("Total documents found: {$documents->count()}");
        $this->newLine();
        
        if ($documents->isEmpty()) {
            $this->warn('No documents found!');
            return;
        }
        
        foreach ($documents as $doc) {
            $this->line("ID: {$doc['id']}");
            $this->line("User: {$doc['userName']}");
            $this->line("NIP: {$doc['nip']}");
            $this->line("Type: {$doc['documentType']}");
            $this->line("Expiry: {$doc['expiryDate']}");
            $this->line("Days Left: {$doc['daysLeft']}");
            $this->line("Status: {$doc['status']}");
            $this->newLine();
        }
        
        $this->info('JSON Response:');
        $response = [
            'success' => true,
            'data' => $documents->toArray()
        ];
        $this->line(json_encode($response, JSON_PRETTY_PRINT));
    }
}
