<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule)
    {
        $schedule->command('pending-registrations:cleanup')->everyMinute();
        $schedule->command('documents:check-expirations')->dailyAt('03:00');
        $schedule->command('backup:create')
            ->dailyAt(env('BACKUP_SCHEDULE_AT', '02:30'))
            ->timezone(config('app.timezone', 'Asia/Jakarta'))
            ->emailOutputOnFailure(env('BACKUP_ALERT_EMAIL', env('MAIL_FROM_ADDRESS')))
            ->appendOutputTo(storage_path('logs/backup-create.log'));
    }

    /**
     * Register the commands for the application.
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');
    }
}
