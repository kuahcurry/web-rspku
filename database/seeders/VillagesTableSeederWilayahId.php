<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

class VillagesTableSeederWilayahId extends Seeder
{
    public function run()
    {
        try {
            $this->command->info('Fetching districts to seed villages...');
            
            $districts = DB::table('districts')->pluck('code');
            
            if ($districts->isEmpty()) {
                $this->command->error('No districts found. Run DistrictsTableSeederWilayahId first.');
                return;
            }

            $batchSize = 500;
            $allVillages = [];
            $totalCount = $districts->count();
            
            foreach ($districts as $index => $districtCode) {
                $currentNum = $index + 1;
                $this->command->line("[{$currentNum}/{$totalCount}] Fetching villages for district: {$districtCode}");
                
                try {
                    $response = Http::timeout(60)->get("https://wilayah.id/api/villages/{$districtCode}.json");
                    
                    if (!$response->successful()) {
                        $this->command->warn("Failed to fetch villages for district {$districtCode}");
                        continue;
                    }

                    $data = $response->json();
                    
                    if (isset($data['data']) && is_array($data['data'])) {
                        foreach ($data['data'] as $item) {
                            $allVillages[] = [
                                'code' => $item['code'],
                                'name' => $item['name'],
                                'district_code' => $districtCode,
                                'created_at' => now(),
                                'updated_at' => now(),
                            ];

                            // Insert in batches to avoid memory issues
                            if (count($allVillages) === $batchSize) {
                                DB::table('villages')->insert($allVillages);
                                $this->command->info("Inserted {$batchSize} villages...");
                                $allVillages = [];
                            }
                        }
                    }
                } catch (\Exception $e) {
                    $this->command->warn("Error fetching villages for {$districtCode}: " . $e->getMessage());
                    continue;
                }
                
                // Avoid rate limiting
                sleep(1);
            }

            // Insert remaining villages
            if (!empty($allVillages)) {
                DB::table('villages')->insert($allVillages);
                $this->command->info("Inserted remaining " . count($allVillages) . " villages.");
            }

            $this->command->info('Villages import completed successfully.');
        } catch (\Exception $e) {
            $this->command->error('Error importing villages: ' . $e->getMessage());
        }
    }
}
