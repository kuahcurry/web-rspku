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
        Schema::create('admin_notification_reads', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('admin_id');
            $table->string('notification_key', 255);
            $table->timestamps();

            $table->unique(['admin_id', 'notification_key'], 'admin_notification_reads_unique');
            $table->index('admin_id');

            $table->foreign('admin_id')
                ->references('id')
                ->on('admins')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('admin_notification_reads');
    }
};
