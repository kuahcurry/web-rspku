<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class ProvincesTableSeederWilayahId extends Seeder
{
    public function run()
    {
        try {
            $this->command->info('Fetching provinces from wilayah.id API...');
            
            $response = Http::timeout(60)->get('https://wilayah.id/api/provinces.json');
            
            if (!$response->successful()) {
                $this->command->error('Failed to fetch provinces from API');
                return;
            }

            $data = $response->json();
            
            if (!isset($data['data']) || !is_array($data['data'])) {
                $this->command->error('Invalid API response format');
                return;
            }

            $provinces = collect($data['data'])->map(function ($item) {
                return [
                    'code' => $item['code'],
                    'name' => $item['name'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            })->all();

            DB::table('provinces')->insert($provinces);
            $this->command->info('Provinces imported successfully. Total: ' . count($provinces));
        } catch (\Exception $e) {
            $this->command->error('Error importing provinces: ' . $e->getMessage());
        }
    }
}
