<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EtikDisiplin extends Model
{
    protected $table = 'etik_disiplin';

    protected $fillable = [
        'user_id',
        'jenis',
        'tanggal_kejadian',
        'tanggal_penyelesaian',
        'jenis_pelanggaran',
        'uraian_singkat',
        'tingkat',
        'tindakan',
        'status_penyelesaian',
        'catatan',
        'file_path',
    ];

    protected $casts = [
        'tanggal_kejadian' => 'date',
        'tanggal_penyelesaian' => 'date',
    ];

    protected $appends = [
        'file_name',
    ];

    /**
     * Get the user that owns the record
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(UserRegistration::class, 'user_id');
    }

    /**
     * Get the filename from the file path
     */
    public function getFileNameAttribute(): string
    {
        return basename($this->file_path);
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
