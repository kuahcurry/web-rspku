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
        Schema::create('status_kewenangan', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->enum('jenis', ['SPK', 'RKK']);
            $table->string('nomor_dokumen');
            $table->date('tanggal_terbit');
            $table->date('masa_berlaku');
            $table->enum('status', ['Aktif', 'Segera Habis', 'Tidak Aktif'])->default('Aktif');
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('status_kewenangan');
    }
};
