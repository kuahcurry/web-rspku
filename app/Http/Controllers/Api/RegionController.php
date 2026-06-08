<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Throwable;

class RegionController extends Controller
{
    private const REMOTE_API_BASE = 'https://wilayah.id/api';

    public function provinces(): JsonResponse
    {
        $data = $this->getLocalRegions(
            'provinces',
            ['code', 'name']
        );

        if ($data->isEmpty()) {
            $data = $this->getRemoteRegions('provinces.json');
        }

        return response()->json(['data' => $data]);
    }

    public function regencies(string $provinceCode): JsonResponse
    {
        $data = $this->getLocalRegions(
            'regencies',
            ['code', 'name', 'province_code'],
            'province_code',
            $provinceCode
        );

        if ($data->isEmpty()) {
            $data = $this->getRemoteRegions('regencies/' . rawurlencode($provinceCode) . '.json');
        }

        return response()->json(['data' => $data]);
    }

    public function districts(string $regencyCode): JsonResponse
    {
        $data = $this->getLocalRegions(
            'districts',
            ['code', 'name', 'regency_code'],
            'regency_code',
            $regencyCode
        );

        if ($data->isEmpty()) {
            $data = $this->getRemoteRegions('districts/' . rawurlencode($regencyCode) . '.json');
        }

        return response()->json(['data' => $data]);
    }

    public function villages(string $districtCode): JsonResponse
    {
        $data = $this->getLocalRegions(
            'villages',
            ['code', 'name', 'district_code'],
            'district_code',
            $districtCode
        );

        if ($data->isEmpty()) {
            $data = $this->getRemoteRegions('villages/' . rawurlencode($districtCode) . '.json');
        }

        return response()->json(['data' => $data]);
    }

    private function getLocalRegions(
        string $table,
        array $requiredColumns,
        ?string $filterColumn = null,
        ?string $filterValue = null
    ): Collection {
        try {
            if (!Schema::hasTable($table)) {
                return collect();
            }

            foreach ($requiredColumns as $column) {
                if (!Schema::hasColumn($table, $column)) {
                    return collect();
                }
            }

            $query = DB::table($table)->select('code', 'name');

            if ($filterColumn !== null && $filterValue !== null) {
                $query->where($filterColumn, $filterValue);
            }

            return $query->orderBy('name')->get();
        } catch (Throwable $e) {
            Log::warning('Failed reading local region data', [
                'table' => $table,
                'error' => $e->getMessage(),
            ]);

            return collect();
        }
    }

    private function getRemoteRegions(string $path): Collection
    {
        try {
            $response = Http::timeout(20)->get(self::REMOTE_API_BASE . '/' . ltrim($path, '/'));

            if (!$response->successful()) {
                return collect();
            }

            $rows = $response->json('data');
            if (!is_array($rows)) {
                return collect();
            }

            return collect($rows)
                ->map(function ($row) {
                    return [
                        'code' => isset($row['code']) ? (string) $row['code'] : null,
                        'name' => isset($row['name']) ? (string) $row['name'] : null,
                    ];
                })
                ->filter(function ($row) {
                    return !empty($row['code']) && !empty($row['name']);
                })
                ->values();
        } catch (Throwable $e) {
            Log::warning('Failed reading remote region data', [
                'path' => $path,
                'error' => $e->getMessage(),
            ]);

            return collect();
        }
    }
}