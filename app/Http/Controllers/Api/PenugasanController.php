<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Penugasan;
use App\Models\UserRegistration;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class PenugasanController extends Controller
{
    /**
     * Get all assignments for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $assignments = Penugasan::where('user_id', $user->id)
                ->orderBy('tanggal_mulai', 'desc')
                ->get();

            // Group by jenis
            $grouped = [
                'Penugasan' => $assignments->where('jenis', 'Penugasan')->values(),
                'Pengabdian' => $assignments->where('jenis', 'Pengabdian')->values(),
            ];

            return response()->json([
                'success' => true,
                'data' => $grouped,
                'meta' => [
                    'total' => $assignments->count()
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch assignments',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload a new assignment
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis' => 'required|in:Penugasan,Pengabdian',
            'unit' => 'required|string|max:255',
            'penanggung_jawab' => 'required|string|max:255',
            'tanggal_mulai' => 'required|date',
            'tanggal_selesai' => 'nullable|date|after_or_equal:tanggal_mulai',
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

            // Create folder structure based on jenis: {name}_{nik}/penugasan or pengabdian
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $subFolder = strtolower($request->jenis); // 'penugasan' or 'pengabdian'
            $folderPath = $folderName . '/' . $subFolder;

            // Use original filename
            $fileName = $file->getClientOriginalName();
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Create new record
            $record = Penugasan::create([
                'user_id' => $user->id,
                'jenis' => $request->jenis,
                'unit' => $request->unit,
                'penanggung_jawab' => $request->penanggung_jawab,
                'tanggal_mulai' => $request->tanggal_mulai,
                'tanggal_selesai' => $request->tanggal_selesai,
                'file_path' => $filePath,
            ]);

            // Log the activity
            ActivityLog::create([
                'user_id' => $user->id,
                'type' => 'upload',
                'action' => 'Uploaded penugasan',
                'metadata' => json_encode([
                    'instansi' => $request->unit
                ])
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Assignment added successfully',
                'data' => $record
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add assignment',
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
            $record = Penugasan::where('user_id', $user->id)
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
     * Download a document (force download instead of inline view)
     */
    public function download($id)
    {
        try {
            $user = auth()->user();
            $record = Penugasan::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

            $filePath = storage_path('app/public/' . $record->file_path);

            if (!file_exists($filePath)) {
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }

            $fileName = basename($filePath);
            
            return response()->download($filePath, $fileName, [
                'Content-Type' => 'application/pdf',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to download document',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete a single assignment
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $record = Penugasan::where('user_id', $user->id)
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
                'instansi' => $record->unit
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
                'action' => 'Deleted penugasan',
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
     * Delete multiple assignments (legacy support)
     * @deprecated Use DELETE /{id} for single deletions
     */
    public function deleteMultiple(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'ids' => 'required|array|min:1',
            'ids.*' => 'required|integer|exists:penugasan,id',
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
            $records = Penugasan::where('user_id', $user->id)
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
            Penugasan::where('user_id', $user->id)
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
