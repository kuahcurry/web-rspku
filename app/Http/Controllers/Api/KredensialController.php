<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kredensial;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class KredensialController extends Controller
{
    /**
     * Get all kredensial records for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $records = Kredensial::where('user_id', $user->id)
                ->orderBy('tanggal_berlaku', 'desc')
                ->get();

            // Group by kredensial_type
            $grouped = [
                'riwayat' => $records->values(),
                'rekredensial' => $records->where('kredensial_type', 'Rekredensial')->values(),
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
     * Store a new kredensial record
     */
    public function store(Request $request)
    {
        $rules = [
            'tanggal_berlaku' => 'required|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_berlaku',
            'nama_kegiatan' => 'required|string|max:255',
            'jenis_kegiatan' => 'required|string|max:255',
            'kredensial_type' => 'required|in:Kredensial Awal,Rekredensial',
            'hasil_penilaian' => 'required|in:Kompeten,Tidak Kompeten,Belum Diisi',
            'catatan' => 'nullable|string',
            'file' => 'nullable|file|mimes:pdf|max:10240',
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
            $filePath = null;

            // Handle file upload if provided
            if ($request->hasFile('file')) {
                $file = $request->file('file');

                // Create folder structure: {name}_{nik}/kredensial&kewenanganKlinis/kredensial&rekredensial
                $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
                $folderPath = $folderName . '/kredensial&kewenanganKlinis/kredensial&rekredensial';

                // Use original filename
                $fileName = $file->getClientOriginalName();
                
                // Store file in public storage
                $filePath = $file->storeAs($folderPath, $fileName, 'public');
            }

            // Create new record
            $record = Kredensial::create([
                'user_id' => $user->id,
                'tanggal_berlaku' => $request->tanggal_berlaku,
                'tanggal_selesai' => $request->tanggal_selesai,
                'nama_kegiatan' => $request->nama_kegiatan,
                'jenis_kegiatan' => $request->jenis_kegiatan,
                'kredensial_type' => $request->kredensial_type,
                'hasil_penilaian' => $request->hasil_penilaian,
                'catatan' => $request->catatan,
                'file_path' => $filePath,
            ]);

            // Log the activity
            ActivityLog::create([
                'user_id' => $user->id,
                'type' => 'upload',
                'action' => 'Uploaded kredensial',
                'metadata' => json_encode([
                    'kategori' => $request->kredensial_type
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Kredensial record added successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add kredensial record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update an existing kredensial record
     */
    public function update(Request $request, $id)
    {
        try {
            $user = auth()->user();
            $record = Kredensial::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

            $rules = [
                'tanggal_berlaku' => 'required|date',
                'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_berlaku',
                'nama_kegiatan' => 'required|string|max:255',
                'jenis_kegiatan' => 'required|string|max:255',
                'kredensial_type' => 'required|in:Kredensial Awal,Rekredensial',
                'hasil_penilaian' => 'required|in:Kompeten,Tidak Kompeten,Belum Diisi',
                'catatan' => 'nullable|string',
                'file' => 'nullable|file|mimes:pdf|max:10240',
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'tanggal_berlaku' => $request->tanggal_berlaku,
                'tanggal_selesai' => $request->tanggal_selesai,
                'nama_kegiatan' => $request->nama_kegiatan,
                'jenis_kegiatan' => $request->jenis_kegiatan,
                'kredensial_type' => $request->kredensial_type,
                'hasil_penilaian' => $request->hasil_penilaian,
                'catatan' => $request->catatan,
            ];

            // Handle file upload if new file is provided
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                
                // Delete old file
                if ($record->file_path && Storage::disk('public')->exists($record->file_path)) {
                    Storage::disk('public')->delete($record->file_path);
                }

                // Store new file
                $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
                $folderPath = $folderName . '/kredensial&kewenanganKlinis/kredensial&rekredensial';
                $fileName = $file->getClientOriginalName();
                $filePath = $file->storeAs($folderPath, $fileName, 'public');
                
                $updateData['file_path'] = $filePath;
            }

            $record->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Kredensial record updated successfully',
                'data' => $record->fresh()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update kredensial record',
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
            $record = Kredensial::where('user_id', $user->id)
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
     * Delete a single kredensial record
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $record = Kredensial::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found'
                ], 404);
            }

            // Capture metadata before deletion
            $metadata = [
                'kategori' => $record->kredensial_type
            ];

            // Delete file from storage
            if (Storage::disk('public')->exists($record->file_path)) {
                Storage::disk('public')->delete($record->file_path);
            }

            $record->delete();

            // Log the activity
            ActivityLog::create([
                'user_id' => $user->id,
                'type' => 'delete',
                'action' => 'Deleted kredensial',
                'metadata' => json_encode($metadata)
            ]);

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
     * Delete multiple kredensial records (legacy support)
     * @deprecated Use DELETE /{id} for single deletions
     */
    public function deleteMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:kredensial,id',
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
            $records = Kredensial::where('user_id', $user->id)
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
            Kredensial::where('user_id', $user->id)
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
