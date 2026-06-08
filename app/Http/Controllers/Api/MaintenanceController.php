<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use Illuminate\Http\Request;

class MaintenanceController extends Controller
{
    public function publicStatus()
    {
        return response()->json([
            'success' => true,
            'maintenance' => SystemSetting::getBool('maintenance_mode', false),
            'message' => 'Maintenance status fetched successfully',
        ]);
    }

    public function adminStatus()
    {
        return response()->json([
            'success' => true,
            'maintenance' => SystemSetting::getBool('maintenance_mode', false),
            'message' => 'Maintenance status fetched successfully',
        ]);
    }

    public function toggle(Request $request)
    {
        $validated = $request->validate([
            'enabled' => 'required|boolean',
            'message' => 'nullable|string|max:255',
        ]);

        SystemSetting::setBool('maintenance_mode', (bool) $validated['enabled']);

        if (array_key_exists('message', $validated)) {
            SystemSetting::setValue('maintenance_message', $validated['message']);
        }

        return response()->json([
            'success' => true,
            'maintenance' => (bool) $validated['enabled'],
            'message' => (bool) $validated['enabled']
                ? 'Maintenance mode activated'
                : 'Maintenance mode deactivated',
        ]);
    }
}
