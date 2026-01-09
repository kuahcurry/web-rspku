<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Notifications\Notifiable;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class UserRegistration extends Authenticatable implements JWTSubject
{
    use Notifiable;

    protected $table = 'users_registration';

    protected $fillable = [
        'nip',
        'nik',
        'name',
        'email',
        'phone',
        'jenis_kelamin',
        'agama',
        'tempat',
        'tanggal_lahir',
        'province',
        'regency',
        'district',
        'village',
        'address',
        'status_kepegawaian',
        'jabatan',
        'unit_kerja',
        'tanggal_mulai_kerja',
        'password',
        'foto_profil',
        'email_verification_code',
        'email_verification_code_expires_at',
        'email_verified_at',
        'last_login_at',
        'role',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'email_verification_code_expires_at' => 'datetime',
        'tanggal_lahir' => 'date',
        'tanggal_mulai_kerja' => 'date',
    ];

    /**
     * Get the identifier that will be stored in the subject claim of the JWT.
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return a key value array, containing any custom claims to be added to the JWT.
     */
    public function getJWTCustomClaims()
    {
        return [
            'email' => $this->email,
            'name' => $this->name,
            'nip' => $this->nip,
        ];
    }
}
