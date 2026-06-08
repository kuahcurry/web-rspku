<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProvincesTableSeeder extends Seeder
{
    public function run()
    {
        $file = storage_path('app/region-data/provinces.csv');
        if (!file_exists($file)) {
            $this->command->error('provinces.csv not found in storage/app/region-data');
            return;
        }
        $handle = fopen($file, 'r');
        if ($handle === false) {
            $this->command->error('Cannot open provinces.csv');
            return;
        }
        $header = fgetcsv($handle); // skip header
        $data = [];
        while (($row = fgetcsv($handle)) !== false) {
            // Assuming columns: id, name
            $data[] = [
                'id' => $row[0],
                'name' => $row[1],
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        fclose($handle);
        DB::table('provinces')->insert($data);
        $this->command->info('Provinces imported successfully.');
    }
}
