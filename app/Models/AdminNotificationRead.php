<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminNotificationRead extends Model
{
    protected $table = 'admin_notification_reads';

    protected $fillable = [
        'admin_id',
        'notification_key',
    ];
}
