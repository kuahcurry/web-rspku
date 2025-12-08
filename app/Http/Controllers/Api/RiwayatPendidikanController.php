<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\RiwayatPendidikan;
use App\Models\UserRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RiwayatPendidikanController extends Controller
{
    /**
     * Get all education records for authenticated user
     */
    public function index()
    {
        try {
            $user = auth()->user();
            $records = RiwayatPendidikan::where('user_id', $user->id)
                ->orderBy('tahun_lulus', 'desc')
                ->get();

            // Group by jenis
            $grouped = [
                'Ijazah' => $records->where('jenis', 'Ijazah')->values(),
                'Sertifikat Pelatihan' => $records->where('jenis', 'Sertifikat Pelatihan')->values(),
                'Sertifikat Workshop' => $records->where('jenis', 'Sertifikat Workshop')->values(),
            ];

            return response()->json([
                'success' => true,
                'data' => $grouped
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch education records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload a new education record
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis' => 'required|string|in:Ijazah,Sertifikat Pelatihan,Sertifikat Workshop',
            'judul' => 'required|string|max:255',
            'institusi' => 'required|string|max:255',
            'tahun_lulus' => 'required|integer|min:1900|max:' . (date('Y') + 10),
            'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB
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
            $file = $request->file('file');

            // Create folder structure: {name}_{nik}/riwayatPendidikan/{subfolder}
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $subfolder = RiwayatPendidikan::getSubfolderByJenis($request->jenis);
            $folderPath = $folderName . '/riwayatPendidikan/' . $subfolder;

            // Generate unique filename
            $fileName = Str::slug($request->judul) . '_' . $request->tahun_lulus . '_' . time() . '.pdf';
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Create new record
            $record = RiwayatPendidikan::create([
                'user_id' => $user->id,
                'jenis' => $request->jenis,
                'judul' => $request->judul,
                'institusi' => $request->institusi,
                'tahun_lulus' => $request->tahun_lulus,
                'file_path' => $filePath,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Education record added successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add education record',
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
            $record = RiwayatPendidikan::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

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
     * Delete multiple education records
     */
    public function deleteMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:riwayat_pendidikan,id',
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
            $records = RiwayatPendidikan::where('user_id', $user->id)
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
                if (Storage::disk('public')->exists($record->file_path)) {
                    Storage::disk('public')->delete($record->file_path);
                }
            }

            // Delete database records
            RiwayatPendidikan::where('user_id', $user->id)
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
