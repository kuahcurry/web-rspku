<?php

namespace App\Helpers;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;

class RegionHelper
{
    /**
     * Get province name by code
     * Code format: "11", "12", etc. (two digits)
     */
    public static function getProvinceName($code)
    {
        if (!$code) return '';
        return Cache::remember("province_name:{$code}", 86400, function () use ($code) {
            try {
                return DB::table('provinces')->where('code', $code)->value('name') ?? '';
            } catch (\Exception $e) {
                return '';
            }
        });
    }

    /**
     * Get regency name by code
     * Code format: "11.01", "11.02", etc.
     */
    public static function getRegencyName($code)
    {
        if (!$code) return '';
        return Cache::remember("regency_name:{$code}", 86400, function () use ($code) {
            try {
                return DB::table('regencies')->where('code', $code)->value('name') ?? '';
            } catch (\Exception $e) {
                return '';
            }
        });
    }

    /**
     * Get district name by code
     * Code format: "11.01.01", "11.01.02", etc.
     */
    public static function getDistrictName($code)
    {
        if (!$code) return '';
        return Cache::remember("district_name:{$code}", 86400, function () use ($code) {
            try {
                return DB::table('districts')->where('code', $code)->value('name') ?? '';
            } catch (\Exception $e) {
                return '';
            }
        });
    }

    /**
     * Get village name by code
     * Code format: "11.01.01.2001", etc.
     */
    public static function getVillageName($code)
    {
        if (!$code) return '';
        return Cache::remember("village_name:{$code}", 86400, function () use ($code) {
            try {
                return DB::table('villages')->where('code', $code)->value('name') ?? '';
            } catch (\Exception $e) {
                return '';
            }
        });
    }
}
