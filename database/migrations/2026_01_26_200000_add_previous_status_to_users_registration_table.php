<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('users_registration', function (Blueprint $table) {
            if (!Schema::hasColumn('users_registration', 'previous_status_kepegawaian')) {
                $table->string('previous_status_kepegawaian')->nullable()->after('status_kepegawaian');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('users_registration', function (Blueprint $table) {
            if (Schema::hasColumn('users_registration', 'previous_status_kepegawaian')) {
                $table->dropColumn('previous_status_kepegawaian');
            }
        });
    }
};
