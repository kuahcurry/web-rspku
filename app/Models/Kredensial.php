<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Kredensial extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'kredensial';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'tanggal_berlaku',
        'tanggal_selesai',
        'nama_kegiatan',
        'jenis_kegiatan',
        'kredensial_type',
        'hasil_penilaian',
        'catatan',
        'file_path',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tanggal_berlaku' => 'date',
        'tanggal_selesai' => 'date',
    ];

    /**
     * Get the user that owns the kredensial record.
     */
    public function user()
    {
        return $this->belongsTo(UserRegistration::class, 'user_id');
    }
}
