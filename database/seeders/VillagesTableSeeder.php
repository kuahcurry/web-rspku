<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class VillagesTableSeeder extends Seeder
{
    public function run()
    {
        $file = storage_path('app/region-data/villages.csv');
        if (!file_exists($file)) {
            $this->command->error('villages.csv not found in storage/app/region-data');
            return;
        }
        $handle = fopen($file, 'r');
        if ($handle === false) {
            $this->command->error('Cannot open villages.csv');
            return;
        }
        $header = fgetcsv($handle); // skip header
        $data = [];
        $batchSize = 500;
        while (($row = fgetcsv($handle)) !== false) {
            $data[] = [
                'id' => $row[0],
                'district_id' => $row[1],
                'name' => $row[2],
                'created_at' => now(),
                'updated_at' => now(),
            ];
            if (count($data) === $batchSize) {
                DB::table('villages')->insert($data);
                $data = [];
            }
        }
        fclose($handle);
        if (!empty($data)) {
            DB::table('villages')->insert($data);
        }
        $this->command->info('Villages imported successfully.');
    }
}
