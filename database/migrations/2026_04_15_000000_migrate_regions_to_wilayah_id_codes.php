<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Backup existing data only if source tables exist.
        // This keeps migration safe on environments that never had these tables.
        if (Schema::hasTable('provinces') && !Schema::hasTable('provinces_backup')) {
            DB::statement('CREATE TABLE provinces_backup AS SELECT * FROM provinces');
        }
        if (Schema::hasTable('regencies') && !Schema::hasTable('regencies_backup')) {
            DB::statement('CREATE TABLE regencies_backup AS SELECT * FROM regencies');
        }
        if (Schema::hasTable('districts') && !Schema::hasTable('districts_backup')) {
            DB::statement('CREATE TABLE districts_backup AS SELECT * FROM districts');
        }
        if (Schema::hasTable('villages') && !Schema::hasTable('villages_backup')) {
            DB::statement('CREATE TABLE villages_backup AS SELECT * FROM villages');
        }

        // Drop dependent tables first to avoid foreign key conflicts
        Schema::dropIfExists('villages');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('regencies');
        Schema::dropIfExists('provinces');

        // Recreate provinces with code as primary key
        Schema::create('provinces', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->timestamps();
        });

        // Recreate regencies with code as primary key
        Schema::create('regencies', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('province_code');
            $table->timestamps();
        });

        // Recreate districts with code as primary key
        Schema::create('districts', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('regency_code');
            $table->timestamps();
        });

        // Recreate villages with code as primary key
        Schema::create('villages', function (Blueprint $table) {
            $table->string('code')->primary();
            $table->string('name');
            $table->string('district_code');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        // Restore from backup if available
        Schema::dropIfExists('provinces');
        Schema::dropIfExists('regencies');
        Schema::dropIfExists('districts');
        Schema::dropIfExists('villages');

        Schema::create('provinces', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('regencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('province_id');
            $table->timestamps();
        });

        Schema::create('districts', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('regency_id');
            $table->timestamps();
        });

        Schema::create('villages', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->unsignedBigInteger('district_id');
            $table->timestamps();
        });
    }
};
