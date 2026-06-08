<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class RegenciesTableSeeder extends Seeder
{
    public function run()
    {
        $file = storage_path('app/region-data/regencies.csv');
        if (!file_exists($file)) {
            $this->command->error('regencies.csv not found in storage/app/region-data');
            return;
        }
        $handle = fopen($file, 'r');
        if ($handle === false) {
            $this->command->error('Cannot open regencies.csv');
            return;
        }
        $header = fgetcsv($handle); // skip header
        $data = [];
        while (($row = fgetcsv($handle)) !== false) {
            // Assuming columns: id, province_id, name
            $data[] = [
                'id' => $row[0],
                'province_id' => $row[1],
                'name' => $row[2],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($handle);
        DB::table('regencies')->insert($data);
        $this->command->info('Regencies imported successfully.');
    }
}
