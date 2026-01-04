<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StatusKewenangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class StatusKewenanganController extends Controller
{
    /**
     * Get all status kewenangan records for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $records = StatusKewenangan::where('user_id', $user->id)
                ->orderBy('tanggal_terbit', 'desc')
                ->get();

            // Group by jenis
            $grouped = [
                'SPK' => $records->where('jenis', 'SPK')->values(),
                'RKK' => $records->where('jenis', 'RKK')->values(),
            ];

            return response()->json([
                'success' => true,
                'data' => $grouped,
                'meta' => [
                    'total' => $records->count()
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a new status kewenangan record
     */
    public function store(Request $request)
    {
        $rules = [
            'nomor_dokumen' => 'required|string|max:255',
            'tanggal_terbit' => 'required|date',
            'masa_berlaku' => 'required|date|after_or_equal:tanggal_terbit',
            'status' => 'required|in:Aktif,Segera Habis,Tidak Aktif',
            'jenis' => 'required|in:SPK,RKK',
            'file' => 'required|file|mimes:pdf|max:10240',
        ];

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = auth()->user();
            $file = $request->file('file');

            // Create folder structure: {name}_{nik}/kredensial&kewenanganKlinis/statusKewenangan
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $folderPath = $folderName . '/kredensial&kewenanganKlinis/statusKewenangan';

            // Use original filename
            $fileName = $file->getClientOriginalName();
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Create new record
            $record = StatusKewenangan::create([
                'user_id' => $user->id,
                'jenis' => $request->jenis,
                'nomor_dokumen' => $request->nomor_dokumen,
                'tanggal_terbit' => $request->tanggal_terbit,
                'masa_berlaku' => $request->masa_berlaku,
                'status' => $request->status,
                'file_path' => $filePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Record added successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * View/serve a document (inline PDF viewer)
     */
    public function view($id)
    {
        try {
            $user = auth()->user();
            $record = StatusKewenangan::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

            if (!$record->file_path) {
                return response()->json([
                    'success' => false,
                    'message' => 'No file attached to this record'
                ], 404);
            }

            $filePath = storage_path('app/public/' . $record->file_path);

            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            return response()->file($filePath, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'inline; filename="' . basename($filePath) . '"'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to view document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single status kewenangan record
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $record = StatusKewenangan::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found'
                ], 404);
            }

            // Delete file from storage
            if ($record->file_path && Storage::disk('public')->exists($record->file_path)) {
                Storage::disk('public')->delete($record->file_path);
            }

            $record->delete();

            return response()->json([
                'success' => true,
                'message' => 'Record deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete multiple status kewenangan records (legacy support)
     * @deprecated Use DELETE /{id} for single deletions
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:status_kewenangan,id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = auth()->user();
            $records = StatusKewenangan::where('user_id', $user->id)
                ->whereIn('id', $request->ids)
                ->get();

            if ($records->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No records found to delete'
                ], 404);
            }

            // Delete files from storage
            foreach ($records as $record) {
                if ($record->file_path && Storage::disk('public')->exists($record->file_path)) {
                    Storage::disk('public')->delete($record->file_path);
                }
            }

            // Delete database records
            StatusKewenangan::where('user_id', $user->id)
                ->whereIn('id', $request->ids)
                ->delete();

            return response()->json([
                'success' => true,
                'message' => 'Records deleted successfully',
                'deleted_count' => $records->count()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Sanitize folder name (remove special characters)
     */
    private function sanitizeFolderName($name)
    {
        return preg_replace('/[^A-Za-z0-9_-]/', '_', $name);
    }
}
