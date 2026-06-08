<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class RegenciesTableSeederWilayahId extends Seeder
{
    public function run()
    {
        try {
            $this->command->info('Fetching provinces to seed regencies...');
            
            $provinces = DB::table('provinces')->pluck('code');
            
            if ($provinces->isEmpty()) {
                $this->command->error('No provinces found. Run ProvincesTableSeederWilayahId first.');
                return;
            }

            $allRegencies = [];
            
            foreach ($provinces as $provinceCode) {
                $this->command->line("Fetching regencies for province: {$provinceCode}");
                
                try {
                    $response = Http::timeout(60)->get("https://wilayah.id/api/regencies/{$provinceCode}.json");
                    
                    if (!$response->successful()) {
                        $this->command->warn("Failed to fetch regencies for province {$provinceCode}");
                        continue;
                    }

                    $data = $response->json();
                    
                    if (isset($data['data']) && is_array($data['data'])) {
                        foreach ($data['data'] as $item) {
                            $allRegencies[] = [
                                'code' => $item['code'],
                                'name' => $item['name'],
                                'province_code' => $provinceCode,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];
                        }
                    }
                } catch (\Exception $e) {
                    $this->command->warn("Error fetching regencies for {$provinceCode}: " . $e->getMessage());
                    continue;
                }
                
                // Avoid rate limiting
                sleep(1);
            }

            if (!empty($allRegencies)) {
                // Insert in batches
                $chunks = array_chunk($allRegencies, 500);
                foreach ($chunks as $chunk) {
                    DB::table('regencies')->insert($chunk);
                }
                $this->command->info('Regencies imported successfully. Total: ' . count($allRegencies));
            } else {
                $this->command->warn('No regencies imported.');
            }
        } catch (\Exception $e) {
            $this->command->error('Error importing regencies: ' . $e->getMessage());
        }
    }
}
