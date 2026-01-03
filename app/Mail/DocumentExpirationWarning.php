<?php

namespace App\Mail;

use App\Models\DokumenLegalitas;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DocumentExpirationWarning extends Mailable
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
            default => 'Peringatan',
        };
    }

    /**
     * Get urgency color
     */
    private function getUrgencyColor(): string
    {
        return match(true) {
            $this->daysRemaining <= 7 => '#dc3545', // Red
            $this->daysRemaining <= 14 => '#fd7e14', // Orange
            default => '#ffc107', // Yellow
        };
    }
}
