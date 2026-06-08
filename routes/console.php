<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule document expiration checks to run daily at 8:00 AM
Schedule::command('documents:check-expirations')
    ->dailyAt('08:00')
    ->timezone('Asia/Jakarta')
    ->emailOutputOnFailure(env('MAIL_FROM_ADDRESS'))
    ->appendOutputTo(storage_path('logs/document-expiration-checks.log'));

// Schedule pending registrations cleanup to run every 15 minutes
Schedule::command('pending-registrations:cleanup')
    ->everyFifteenMinutes()
    ->timezone('Asia/Jakarta')
    ->appendOutputTo(storage_path('logs/pending-registrations-cleanup.log'));
