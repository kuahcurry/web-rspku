<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class DistrictsTableSeederWilayahId extends Seeder
{
    public function run()
    {
        try {
            $this->command->info('Fetching regencies to seed districts...');
            
            $regencies = DB::table('regencies')->pluck('code');
            
            if ($regencies->isEmpty()) {
                $this->command->error('No regencies found. Run RegenciesTableSeederWilayahId first.');
                return;
            }

            $allDistricts = [];
            $count = $regencies->count();
            
            foreach ($regencies as $index => $regencyCode) {
                $this->command->line("[" . ($index + 1) . "/" . $count . "] Fetching districts for regency: {$regencyCode}");
                
                try {
                    $response = Http::timeout(60)->get("https://wilayah.id/api/districts/{$regencyCode}.json");
                    
                    if (!$response->successful()) {
                        $this->command->warn("Failed to fetch districts for regency {$regencyCode}");
                        continue;
                    }

                    $data = $response->json();
                    
                    if (isset($data['data']) && is_array($data['data'])) {
                        foreach ($data['data'] as $item) {
                            $allDistricts[] = [
                                'code' => $item['code'],
                                'name' => $item['name'],
                                'regency_code' => $regencyCode,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    $this->command->warn("Error fetching districts for {$regencyCode}: " . $e->getMessage());
                    continue;
                }
                
                // Avoid rate limiting
                sleep(1);
            }

            if (!empty($allDistricts)) {
                // Insert in batches
                $chunks = array_chunk($allDistricts, 500);
                foreach ($chunks as $chunk) {
                    DB::table('districts')->insert($chunk);
                }
                $this->command->info('Districts imported successfully. Total: ' . count($allDistricts));
            } else {
                $this->command->warn('No districts imported.');
            }
        } catch (\Exception $e) {
            $this->command->error('Error importing districts: ' . $e->getMessage());
        }
    }
}
