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
        'province',
        'regency',
        'district',
        'village',
        'address',
        'password',
    ];

    protected $hidden = [
        'password',
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
