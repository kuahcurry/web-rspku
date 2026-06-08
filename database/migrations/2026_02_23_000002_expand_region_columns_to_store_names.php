<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Expand region columns from VARCHAR(10) back to VARCHAR(100)
     * so they can store full names like "Kabupaten Rembang" instead
     * of only short numeric IDs.
     */
    public function up(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            $table->string('province', 100)->change();
            $table->string('regency', 100)->change();
            $table->string('district', 100)->change();
            $table->string('village', 100)->change();
        });
    }

    public function down(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            $table->string('province', 10)->change();
            $table->string('regency', 10)->change();
            $table->string('district', 10)->change();
            $table->string('village', 10)->change();
        });
    }
};
