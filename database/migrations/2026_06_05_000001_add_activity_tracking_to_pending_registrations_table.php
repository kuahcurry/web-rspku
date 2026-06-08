<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('pending_registrations', function (Blueprint $table) {
            // Tracks the last time the user did anything (created or resent OTP).
            // Cleanup command deletes records with no activity for 30+ minutes.
            $table->timestamp('last_activity_at')->nullable()->after('verification_code_expires_at');

            // Tracks how many times the user has requested a resend (max 3).
            $table->unsignedTinyInteger('resend_count')->default(0)->after('last_activity_at');
        });

        // Backfill existing rows: set last_activity_at = created_at
        DB::statement('UPDATE pending_registrations SET last_activity_at = created_at WHERE last_activity_at IS NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pending_registrations', function (Blueprint $table) {
            $table->dropColumn(['last_activity_at', 'resend_count']);
        });
    }
};
