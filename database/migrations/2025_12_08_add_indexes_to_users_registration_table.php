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
        Schema::table('users_registration', function (Blueprint $table) {
            // Add indexes for commonly queried fields
            $table->index('email');
            $table->index('nip');
            $table->index('nik');
            $table->index('jabatan');
            $table->index('unit_kerja');
            $table->index('status_kepegawaian');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            $table->dropIndex(['email']);
            $table->dropIndex(['nip']);
            $table->dropIndex(['nik']);
            $table->dropIndex(['jabatan']);
            $table->dropIndex(['unit_kerja']);
            $table->dropIndex(['status_kepegawaian']);
            $table->dropIndex(['created_at']);
        });
    }
};
