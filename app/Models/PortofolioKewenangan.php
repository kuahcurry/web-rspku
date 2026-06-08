<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PortofolioKewenangan extends Model
{
    use HasFactory;

    protected $table = 'portofolio_kewenangan';

    protected $fillable = [
        'user_id',
        'file_path',
        'file_name',
    ];

    public function getFileUrlAttribute()
    {
        return $this->file_path ? asset('storage/' . $this->file_path) : null;
    }

    public function user()
    {
        return $this->belongsTo(\App\Models\User::class, 'user_id');
    }
}
