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
            $table->timestamp('warning_3_days_sent_at')->nullable()->after('warning_7_days_sent_at');
            $table->timestamp('warning_1_day_sent_at')->nullable()->after('warning_3_days_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->dropColumn(['warning_3_days_sent_at', 'warning_1_day_sent_at']);
        });
    }
};
