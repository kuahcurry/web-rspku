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
        Schema::create('kredensial', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users_registration')->onDelete('cascade');
            $table->date('tanggal_berlaku');
            $table->date('tanggal_selesai')->nullable();
            $table->string('nama_kegiatan');
            $table->string('jenis_kegiatan');
            $table->enum('kredensial_type', ['Kredensial Awal', 'Rekredensial']);
            $table->enum('hasil_penilaian', ['Kompeten', 'Tidak Kompeten', 'Belum Diisi']);
            $table->text('catatan')->nullable();
            $table->string('file_path')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kredensial');
    }
};
