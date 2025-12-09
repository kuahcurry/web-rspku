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
        Schema::create('etik_disiplin', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users_registration')->onDelete('cascade');
            $table->enum('jenis', ['etik', 'disiplin']);
            $table->date('tanggal_kejadian');
            $table->date('tanggal_penyelesaian')->nullable();
            $table->string('jenis_pelanggaran');
            $table->text('uraian_singkat');
            $table->enum('tingkat', ['Ringan', 'Sedang', 'Berat'])->nullable(); // For etik
            $table->string('tindakan')->nullable(); // For disiplin (Teguran Lisan, SP1, etc)
            $table->enum('status_penyelesaian', ['Proses', 'Selesai', 'Pending']);
            $table->text('catatan')->nullable();
            $table->string('file_path');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('etik_disiplin');
    }
};
