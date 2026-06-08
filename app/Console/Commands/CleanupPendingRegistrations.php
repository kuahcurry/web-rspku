<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\PendingRegistration;
use Carbon\Carbon;

class CleanupPendingRegistrations extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'pending-registrations:cleanup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Delete pending registrations with no activity for 30 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $threshold = Carbon::now()->subMinutes(30);

        // Delete records where the user has had no activity (no resend, no visit)
        // for the past 30 minutes. Falls back to created_at for older rows that
        // predate the last_activity_at column.
        $count = PendingRegistration::where(function ($query) use ($threshold) {
            $query->where('last_activity_at', '<', $threshold)
                  ->orWhere(function ($q) use ($threshold) {
                      $q->whereNull('last_activity_at')
                        ->where('created_at', '<', $threshold);
                  });
        })->delete();

        $this->info("Deleted {$count} pending registration(s) with no activity for 30+ minutes.");
    }
}

