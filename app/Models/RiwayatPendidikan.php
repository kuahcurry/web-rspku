<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class RiwayatPendidikan extends Model
{
    protected $table = 'riwayat_pendidikan';

    protected $fillable = [
        'user_id',
        'jenis',
        'judul',
        'institusi',
        'tahun_lulus',
        'file_path',
    ];

    protected $casts = [
        'tahun_lulus' => 'integer',
    ];

    protected $appends = [
        'file_name',
        'url',
    ];

    /**
     * Get the user that owns the education record
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

    /**
     * Get subfolder based on jenis
     */
    public static function getSubfolderByJenis(string $jenis): string
    {
        $mapping = [
            'Ijazah' => 'ijazah',
            'Sertifikat Pelatihan' => 'sertifikatPelatihan',
            'Sertifikat Workshop' => 'sertifikatWorkshop',
        ];

        return $mapping[$jenis] ?? 'other';
    }
}
