<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            $table->string('alamat_lengkap', 512)->nullable()->after('address');
        });
    }

    public function down(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            $table->dropColumn('alamat_lengkap');
        });
    }
};
