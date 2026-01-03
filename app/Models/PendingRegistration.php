<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PendingRegistration extends Model
{
    protected $fillable = [
        'nip',
        'nik',
        'name',
        'email',
        'phone',
        'province',
        'regency',
        'district',
        'village',
        'address',
        'password',
        'verification_code',
        'verification_code_expires_at',
    ];

    protected $casts = [
        'verification_code_expires_at' => 'datetime',
    ];

    protected $hidden = [
        'password',
        'verification_code',
    ];
}
