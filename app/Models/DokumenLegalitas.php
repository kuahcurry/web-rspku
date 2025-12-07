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
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_berlaku' => 'date',
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
}
