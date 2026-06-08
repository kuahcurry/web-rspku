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
        // Step 1: Add ruang column after unit
        Schema::table('penugasan', function (Blueprint $table) {
            $table->string('ruang')->nullable()->after('unit');
        });

        // Step 2: Update enum to replace 'Penugasan' with 'Pekerjaan'
        DB::statement("ALTER TABLE `penugasan` MODIFY `jenis` ENUM('Pekerjaan', 'Pengabdian') NOT NULL DEFAULT 'Pekerjaan'");

        // Step 3: Migrate existing 'Penugasan' records to 'Pekerjaan'
        DB::statement("UPDATE `penugasan` SET `jenis` = 'Pekerjaan' WHERE `jenis` = 'Penugasan'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert jenis values back to 'Penugasan'
        DB::statement("UPDATE `penugasan` SET `jenis` = 'Penugasan' WHERE `jenis` = 'Pekerjaan'");

        // Revert enum
        DB::statement("ALTER TABLE `penugasan` MODIFY `jenis` ENUM('Penugasan', 'Pengabdian') NOT NULL DEFAULT 'Penugasan'");

        // Remove ruang column
        Schema::table('penugasan', function (Blueprint $table) {
            $table->dropColumn('ruang');
        });
    }
};
