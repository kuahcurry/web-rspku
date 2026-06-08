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
        Schema::create('dokumen_legalitas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users_registration')->onDelete('cascade');
            $table->string('jenis_dokumen'); // e.g., 'Surat Keterangan', 'STR', 'SIP'
            $table->string('nomor_sk')->nullable();
            $table->date('tanggal_mulai')->nullable();
            $table->date('tanggal_berlaku')->nullable();
            $table->string('file_path'); // Path to PDF in storage
            $table->timestamps();
            
            // Unique constraint: one document per type per user
            $table->unique(['user_id', 'jenis_dokumen']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dokumen_legalitas');
    }
};
