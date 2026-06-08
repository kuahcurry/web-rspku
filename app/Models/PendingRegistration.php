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
        'last_activity_at',
        'resend_count',
    ];

    protected $casts = [
        'verification_code_expires_at' => 'datetime',
        'last_activity_at'             => 'datetime',
        'resend_count'                 => 'integer',
    ];

    protected $hidden = [
        'password',
        'verification_code',
    ];
}
