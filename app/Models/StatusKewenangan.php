<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class StatusKewenangan extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'status_kewenangan';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'jenis',
        'nomor_dokumen',
        'tanggal_terbit',
        'masa_berlaku',
        'status',
        'file_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_terbit' => 'date',
        'masa_berlaku' => 'date',
    ];

    /**
     * Get the user that owns the status kewenangan record.
     */
    public function user()
    {
        return $this->belongsTo(UserRegistration::class, 'user_id');
    }
}
