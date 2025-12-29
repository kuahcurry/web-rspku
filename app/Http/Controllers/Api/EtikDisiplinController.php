<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EtikDisiplin;
use App\Models\UserRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EtikDisiplinController extends Controller
{
    /**
     * Get all records for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $records = EtikDisiplin::where('user_id', $user->id)
                ->orderBy('tanggal_kejadian', 'desc')
                ->get();

            // Group by jenis
            $grouped = [
                'etik' => $records->where('jenis', 'etik')->values(),
                'disiplin' => $records->where('jenis', 'disiplin')->values(),
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
     * Store a new record
     */
    public function store(Request $request)
    {
        $rules = [
            'jenis' => 'required|in:etik,disiplin',
            'tanggal_kejadian' => 'required|date',
            'tanggal_penyelesaian' => 'nullable|date|after_or_equal:tanggal_kejadian',
            'jenis_pelanggaran' => 'required|string|max:255',
            'uraian_singkat' => 'required|string',
            'status_penyelesaian' => 'required|in:Proses,Selesai,Pending',
            'catatan' => 'nullable|string',
            'file' => 'required|file|mimes:pdf|max:10240',
        ];

        // Conditional validation based on jenis
        if ($request->jenis === 'etik') {
            $rules['tingkat'] = 'required|in:Ringan,Sedang,Berat';
        } else {
            $rules['tindakan'] = 'required|string|max:255';
        }

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

            // Create folder structure: {name}_{nik}/etikndisiplin/{jenis}
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $folderPath = $folderName . '/etikndisiplin/' . $request->jenis;

            // Generate unique filename
            $fileName = Str::slug($request->jenis_pelanggaran) . '_' . date('Ymd') . '_' . time() . '.pdf';
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Create new record
            $record = EtikDisiplin::create([
                'user_id' => $user->id,
                'jenis' => $request->jenis,
                'tanggal_kejadian' => $request->tanggal_kejadian,
                'tanggal_penyelesaian' => $request->tanggal_penyelesaian,
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'uraian_singkat' => $request->uraian_singkat,
                'tingkat' => $request->tingkat,
                'tindakan' => $request->tindakan,
                'status_penyelesaian' => $request->status_penyelesaian,
                'catatan' => $request->catatan,
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
     * Update an existing record
     */
    public function update(Request $request, $id)
    {
        try {
            $user = auth()->user();
            $record = EtikDisiplin::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

            $rules = [
                'tanggal_kejadian' => 'required|date',
                'tanggal_penyelesaian' => 'nullable|date|after_or_equal:tanggal_kejadian',
                'jenis_pelanggaran' => 'required|string|max:255',
                'uraian_singkat' => 'required|string',
                'status_penyelesaian' => 'required|in:Proses,Selesai,Pending',
                'catatan' => 'nullable|string',
                'file' => 'nullable|file|mimes:pdf|max:10240',
            ];

            // Conditional validation based on existing jenis
            if ($record->jenis === 'etik') {
                $rules['tingkat'] = 'required|in:Ringan,Sedang,Berat';
            } else {
                $rules['tindakan'] = 'required|string|max:255';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation error',
                    'errors' => $validator->errors()
                ], 422);
            }

            $updateData = [
                'tanggal_kejadian' => $request->tanggal_kejadian,
                'tanggal_penyelesaian' => $request->tanggal_penyelesaian,
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'uraian_singkat' => $request->uraian_singkat,
                'tingkat' => $request->tingkat,
                'tindakan' => $request->tindakan,
                'status_penyelesaian' => $request->status_penyelesaian,
                'catatan' => $request->catatan,
            ];

            // Handle file upload if new file is provided
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                
                // Delete old file
                if (Storage::disk('public')->exists($record->file_path)) {
                    Storage::disk('public')->delete($record->file_path);
                }

                // Store new file
                $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
                $folderPath = $folderName . '/etikndisiplin/' . $record->jenis;
                $fileName = Str::slug($request->jenis_pelanggaran) . '_' . date('Ymd') . '_' . time() . '.pdf';
                $filePath = $file->storeAs($folderPath, $fileName, 'public');
                
                $updateData['file_path'] = $filePath;
            }

            $record->update($updateData);

            return response()->json([
                'success' => true,
                'message' => 'Record updated successfully',
                'data' => $record->fresh()
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update record',
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
            $record = EtikDisiplin::where('user_id', $user->id)
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
     * Delete a single record
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $record = EtikDisiplin::where('user_id', $user->id)
                ->where('id', $id)
                ->first();

            if (!$record) {
                return response()->json([
                    'success' => false,
                    'message' => 'Record not found'
                ], 404);
            }

            // Delete file from storage
            if (Storage::disk('public')->exists($record->file_path)) {
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
     * Delete multiple records (legacy support)
     * @deprecated Use DELETE /{id} for single deletions
     */
    public function deleteMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:etik_disiplin,id',
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
            $records = EtikDisiplin::where('user_id', $user->id)
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
            EtikDisiplin::where('user_id', $user->id)
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
