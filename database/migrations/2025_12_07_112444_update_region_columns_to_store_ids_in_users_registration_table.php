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
            // Change region columns to store IDs instead of names
            $table->string('province', 10)->change();
            $table->string('regency', 10)->change();
            $table->string('district', 10)->change();
            $table->string('village', 10)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            // Revert back to storing full names
            $table->string('province', 255)->change();
            $table->string('regency', 255)->change();
            $table->string('district', 255)->change();
            $table->string('village', 255)->change();
        });
    }
};
