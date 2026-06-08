<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class DebugController extends Controller
{
    /**
     * Store client-side debug logs.
     * Accepts JSON payloads from the browser and writes them to the Laravel log.
     */
    public function store(Request $request)
    {
        $payload = $request->all();
        try {
            $prefix = '[client-debug] ';
            Log::info($prefix . json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
        } catch (\Throwable $e) {
            // If logging fails, write minimal info
            Log::error('[client-debug] failed to log payload: ' . $e->getMessage());
        }

        return response()->json(['success' => true]);
    }
}
