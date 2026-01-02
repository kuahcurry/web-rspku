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
        Schema::table('prestasi_penghargaan', function (Blueprint $table) {
            // Drop the incorrect foreign key constraint
            $table->dropForeign(['user_id']);
            
            // Add the correct foreign key constraint pointing to users_registration
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users_registration')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('prestasi_penghargaan', function (Blueprint $table) {
            // Drop the correct foreign key constraint
            $table->dropForeign(['user_id']);
            
            // Add back the incorrect foreign key constraint
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');
        });
    }
};
