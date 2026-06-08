<?php

namespace App\Mail;

use Illuminate\Contracts\Queue\ShouldQueue;
use App\Models\DokumenLegalitas;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentExpirationWarning extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public DokumenLegalitas $document,
        public string $userName,
        public int $daysRemaining,
        public string $stage // '30_days', '14_days', '7_days'
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $urgency = $this->daysRemaining <= 7 ? 'MENDESAK' : 'PENTING';
        
        return new Envelope(
            subject: "[$urgency] Dokumen {$this->document->jenis_dokumen} Akan Berakhir dalam {$this->daysRemaining} Hari",
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.document-expiration-warning',
            with: [
                'document' => $this->document,
                'userName' => $this->userName,
                'daysRemaining' => $this->daysRemaining,
                'stage' => $this->stage,
                'urgencyLevel' => $this->getUrgencyLevel(),
                'urgencyColor' => $this->getUrgencyColor(),
            ],
        );
    }

    /**
     * Get urgency level text
     */
    private function getUrgencyLevel(): string
    {
        return match($this->daysRemaining) {
            30 => 'Peringatan Awal',
            14 => 'Peringatan Menengah',
            7 => 'Peringatan Mendesak',
            3 => 'Sangat Mendesak',
            1 => 'KRITIS',
            default => 'Peringatan',
        };
    }

    /**
     * Get urgency color
     */
    private function getUrgencyColor(): string
    {
        return match(true) {
            $this->daysRemaining <= 1 => '#8B0000', // Dark Red (Critical)
            $this->daysRemaining <= 3 => '#dc3545', // Red (Very Urgent)
            $this->daysRemaining <= 7 => '#fd7e14', // Orange (Urgent)
            $this->daysRemaining <= 14 => '#ffc107', // Yellow (Medium)
            default => '#17a2b8', // Blue (Early Warning)
        };
    }
}
