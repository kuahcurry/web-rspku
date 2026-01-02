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
        Schema::table('prestasi_penghargaan', function (Blueprint $table) {
            // Modify enum to include Kompetensi Utama
            DB::statement("ALTER TABLE prestasi_penghargaan MODIFY COLUMN achievement_type ENUM('Prestasi', 'Penghargaan', 'Kompetensi Utama')");
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prestasi_penghargaan', function (Blueprint $table) {
            // Revert to original enum values
            DB::statement("ALTER TABLE prestasi_penghargaan MODIFY COLUMN achievement_type ENUM('Prestasi', 'Penghargaan')");
        });
    }
};
