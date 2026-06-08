<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class DistrictsTableSeeder extends Seeder
{
    public function run()
    {
        $file = storage_path('app/region-data/districts.csv');
        if (!file_exists($file)) {
            $this->command->error('districts.csv not found in storage/app/region-data');
            return;
        }
        $handle = fopen($file, 'r');
        if ($handle === false) {
            $this->command->error('Cannot open districts.csv');
            return;
        }
        $header = fgetcsv($handle); // skip header
        $data = [];
        while (($row = fgetcsv($handle)) !== false) {
            // Assuming columns: id, regency_id, name
            $data[] = [
                'id' => $row[0],
                'regency_id' => $row[1],
                'name' => $row[2],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($handle);
        DB::table('districts')->insert($data);
        $this->command->info('Districts imported successfully.');
    }
}
