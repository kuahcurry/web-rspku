<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RegionDataSeeder extends Seeder
{
    /**
     * Seed the region data from wilayah.id API
     * Run this seeder after running the migration: 2026_04_15_000000_migrate_regions_to_wilayah_id_codes.php
     * 
     * Command: php artisan db:seed --class=RegionDataSeeder
     * 
     * This will:
     * 1. Fetch and seed all provinces
     * 2. Fetch and seed all regencies
     * 3. Fetch and seed all districts
     * 4. Fetch and seed all villages
     * 
     * Note: This may take a while due to API calls and rate limiting (1 second between requests)
     */
    public function run(): void
    {
        $this->command->info('Starting region data seeding from wilayah.id API...');
        $this->command->newLine();

        // Run seeders in order
        $this->call(ProvincesTableSeederWilayahId::class);
        $this->command->newLine();
        
        $this->call(RegenciesTableSeederWilayahId::class);
        $this->command->newLine();
        
        $this->call(DistrictsTableSeederWilayahId::class);
        $this->command->newLine();
        
        $this->call(VillagesTableSeederWilayahId::class);
        $this->command->newLine();

        $this->command->info('✅ Region data seeding completed successfully!');
        $this->command->line('Frontend will now use wilayah.id API with codes as identifiers.');
    }
}
