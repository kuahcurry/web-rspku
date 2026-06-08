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
        Schema::create('pengajuan_kredensial', function (Blueprint $table) {
            $table->id();
            // optional link to user registration table if available
            $table->foreignId('user_id')->nullable()->constrained('users_registration')->onDelete('cascade');
            $table->string('jenis_kredensial');
            $table->string('surat_permohonan_path')->nullable();
            $table->string('form_k1_path')->nullable();
            $table->string('form_k3_path')->nullable();
            $table->text('catatan')->nullable();
            $table->string('status')->default('pending');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pengajuan_kredensial');
    }
};
