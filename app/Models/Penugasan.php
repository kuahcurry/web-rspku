<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Penugasan extends Model
{
    protected $table = 'penugasan';

    protected $fillable = [
        'user_id',
        'jenis',
        'unit',
        'penanggung_jawab',
        'tanggal_mulai',
        'tanggal_selesai',
        'file_path',
    ];

    protected $casts = [
        'tanggal_mulai' => 'date',
        'tanggal_selesai' => 'date',
    ];

    protected $appends = [
        'file_name',
        'status',
        'url',
    ];

    /**
     * Get the user that owns the assignment
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
     * Get assignment status (Aktif or Selesai)
     */
    public function getStatusAttribute(): string
    {
        if (!$this->tanggal_selesai) {
            return 'Aktif';
        }
        
        $today = now()->startOfDay();
        $endDate = $this->tanggal_selesai->startOfDay();
        
        return $endDate >= $today ? 'Aktif' : 'Selesai';
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
