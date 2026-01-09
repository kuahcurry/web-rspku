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
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users_registration')->onDelete('cascade');
            $table->string('type'); // e.g., 'auth', 'profile', 'document'
            $table->text('action'); // e.g., 'User logged in', 'Updated profile'
            $table->json('metadata')->nullable(); // Additional data as JSON
            $table->timestamps();
            
            // Index for faster queries
            $table->index(['user_id', 'created_at']);
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
