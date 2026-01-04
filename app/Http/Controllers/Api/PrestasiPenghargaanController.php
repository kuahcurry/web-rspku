<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PrestasiPenghargaan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PrestasiPenghargaanController extends Controller
{
    /**
     * Get all prestasi and penghargaan records for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $records = PrestasiPenghargaan::where('user_id', $user->id)
                ->orderBy('tahun', 'desc')
                ->orderBy('created_at', 'desc')
                ->get();

            // Group by achievement_type
            $grouped = [
                'Prestasi' => $records->where('achievement_type', 'Prestasi')->values(),
                'Penghargaan' => $records->where('achievement_type', 'Penghargaan')->values(),
                'Kompetensi Utama' => $records->where('achievement_type', 'Kompetensi Utama')->values(),
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
     * Store a new prestasi/penghargaan record
     */
    public function store(Request $request)
    {
        $rules = [
            'judul' => 'required|string|max:255',
            'penyelenggara' => 'required|string|max:255',
            'tahun' => 'required|digits:4|integer|min:1900|max:' . (date('Y') + 1),
            'jenis' => 'required|in:Prestasi,Penghargaan,Kompetensi Utama',
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

            // Create folder structure based on type
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            
            // Determine subfolder based on type
            if ($request->jenis === 'Prestasi') {
                $subFolder = 'prestasi';
            } elseif ($request->jenis === 'Penghargaan') {
                $subFolder = 'penghargaan';
            } else { // Kompetensi Utama
                $subFolder = 'kompetensiUtama';
            }
            
            $folderPath = $folderName . '/pendidikan&prestasi/' . $subFolder;

            // Use original filename
            $fileName = $file->getClientOriginalName();
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Create new record
            $record = PrestasiPenghargaan::create([
                'user_id' => $user->id,
                'achievement_type' => $request->jenis,
                'judul' => $request->judul,
                'penyelenggara' => $request->penyelenggara,
                'tahun' => $request->tahun,
                'file_path' => $filePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Record added successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            \Log::error('Failed to add prestasi/penghargaan record', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'request_data' => $request->except(['file'])
            ]);
            
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
            $record = PrestasiPenghargaan::where('user_id', $user->id)
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
     * Delete a single prestasi/penghargaan record
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $record = PrestasiPenghargaan::where('user_id', $user->id)
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
     * Delete multiple prestasi/penghargaan records (legacy support)
     * @deprecated Use DELETE /{id} for single deletions
     */
    public function bulkDelete(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:prestasi_penghargaan,id',
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
            $records = PrestasiPenghargaan::where('user_id', $user->id)
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
            PrestasiPenghargaan::where('user_id', $user->id)
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
