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
        // Step 1: Drop the unique constraint (if exists)
        try {
            Schema::table('dokumen_legalitas', function (Blueprint $table) {
                $table->dropUnique(['user_id', 'jenis_dokumen']);
            });
        } catch (\Exception $e) {
            // If that doesn't work, try dropping by index name directly
            try {
                DB::statement('ALTER TABLE `dokumen_legalitas` DROP INDEX `dokumen_legalitas_user_id_jenis_dokumen_unique`');
            } catch (\Exception $e) {
                // Log but continue - index might not exist or already dropped
                \Log::warning('Could not drop unique index: ' . $e->getMessage());
            }
        }

        // Step 2: Rename tanggal_berlaku to berlaku_sampai
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->renameColumn('tanggal_berlaku', 'berlaku_sampai');
        });

        // Step 3: Rename tanggal_mulai to tanggal_lulus
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->renameColumn('tanggal_mulai', 'tanggal_lulus');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse the column renames
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->renameColumn('tanggal_lulus', 'tanggal_mulai');
        });

        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->renameColumn('berlaku_sampai', 'tanggal_berlaku');
        });

        // Restore the unique constraint
        Schema::table('dokumen_legalitas', function (Blueprint $table) {
            $table->unique(['user_id', 'jenis_dokumen']);
        });
    }
};
