<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class PrestasiPenghargaan extends Model
{
    use HasFactory;

    /**
     * The table associated with the model.
     *
     * @var string
     */
    protected $table = 'prestasi_penghargaan';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'achievement_type',
        'judul',
        'penyelenggara',
        'tahun',
        'file_path',
    ];

    /**
     * Get the user that owns the prestasi/penghargaan record.
     */
    public function user()
    {
        return $this->belongsTo(UserRegistration::class, 'user_id');
    }
}
