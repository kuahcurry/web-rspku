<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            // Track when warnings were sent to avoid duplicates
            $table->timestamp('warning_30_days_sent_at')->nullable()->after('file_path');
            $table->timestamp('warning_14_days_sent_at')->nullable()->after('warning_30_days_sent_at');
            $table->timestamp('warning_7_days_sent_at')->nullable()->after('warning_14_days_sent_at');
            
            // Index for efficient expiration queries
            $table->index('tanggal_berlaku');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->dropIndex(['tanggal_berlaku']);
            $table->dropColumn([
                'warning_30_days_sent_at',
                'warning_14_days_sent_at',
                'warning_7_days_sent_at'
            ]);
        });
    }
};
