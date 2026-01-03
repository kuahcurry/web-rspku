<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DokumenLegalitas extends Model
{
    protected $table = 'dokumen_legalitas';

    protected $fillable = [
        'user_id',
        'jenis_dokumen',
        'nomor_sk',
        'tanggal_mulai',
        'tanggal_berlaku',
        'file_path',
        'warning_30_days_sent_at',
        'warning_14_days_sent_at',
        'warning_7_days_sent_at',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_berlaku' => 'date',
        'warning_30_days_sent_at' => 'datetime',
        'warning_14_days_sent_at' => 'datetime',
        'warning_7_days_sent_at' => 'datetime',
    ];

    /**
     * Get the user that owns the document
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserRegistration::class, 'user_id');
    }

    /**
     * Get full storage path
     */
    public function getFullPathAttribute(): string
    {
        return storage_path('app/public/' . $this->file_path);
    }

    /**
     * Get public URL for the document
     */
    public function getUrlAttribute(): string
    {
        return asset('storage/' . $this->file_path);
    }

    /**
     * Check if document is expiring soon
     */
    public function isExpiringSoon(): bool
    {
        if (!$this->tanggal_berlaku) {
            return false;
        }

        $daysUntilExpiry = now()->diffInDays($this->tanggal_berlaku, false);
        return $daysUntilExpiry <= 30 && $daysUntilExpiry >= 0;
    }

    /**
     * Check if document is expired
     */
    public function isExpired(): bool
    {
        if (!$this->tanggal_berlaku) {
            return false;
        }

        return $this->tanggal_berlaku->isPast();
    }

    /**
     * Get days until expiry
     */
    public function daysUntilExpiry(): ?int
    {
        if (!$this->tanggal_berlaku) {
            return null;
        }

        return now()->diffInDays($this->tanggal_berlaku, false);
    }

    /**
     * Get expiry status with color coding
     */
    public function getExpiryStatus(): array
    {
        $days = $this->daysUntilExpiry();

        if ($days === null) {
            return ['status' => 'unknown', 'color' => 'gray', 'text' => 'Tanggal tidak tersedia'];
        }

        if ($days < 0) {
            return ['status' => 'expired', 'color' => 'red', 'text' => 'Sudah berakhir'];
        }

        if ($days <= 7) {
            return ['status' => 'critical', 'color' => 'red', 'text' => "{$days} hari lagi"];
        }

        if ($days <= 14) {
            return ['status' => 'warning', 'color' => 'orange', 'text' => "{$days} hari lagi"];
        }

        if ($days <= 30) {
            return ['status' => 'caution', 'color' => 'yellow', 'text' => "{$days} hari lagi"];
        }

        return ['status' => 'valid', 'color' => 'green', 'text' => "{$days} hari lagi"];
    }
}
