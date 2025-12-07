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
            $table->string('jenis_kelamin', 20)->nullable()->after('nik');
            $table->string('agama', 50)->nullable()->after('jenis_kelamin');
            $table->string('tempat', 100)->nullable()->after('agama');
            $table->date('tanggal_lahir')->nullable()->after('tempat');
            $table->string('status_kepegawaian', 100)->nullable()->after('address');
            $table->string('jabatan', 100)->nullable()->after('status_kepegawaian');
            $table->string('unit_kerja', 100)->nullable()->after('jabatan');
            $table->date('tanggal_mulai_kerja')->nullable()->after('unit_kerja');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users_registration', function (Blueprint $table) {
            $table->dropColumn([
                'jenis_kelamin',
                'agama',
                'tempat',
                'tanggal_lahir',
                'status_kepegawaian',
                'jabatan',
                'unit_kerja',
                'tanggal_mulai_kerja'
            ]);
        });
    }
};
