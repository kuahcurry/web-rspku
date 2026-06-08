<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Disable foreign key checks to allow truncation
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        DB::table('villages')->truncate();
        DB::table('districts')->truncate();
        DB::table('regencies')->truncate();
        DB::table('provinces')->truncate();
        // Re-enable foreign key checks
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        $this->call([
            ProvincesTableSeeder::class,
            RegenciesTableSeeder::class,
            DistrictsTableSeeder::class,
            VillagesTableSeeder::class,
        ]);
    }
}
