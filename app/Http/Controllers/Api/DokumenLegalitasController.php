<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DokumenLegalitas;
use App\Models\UserRegistration;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class DokumenLegalitasController extends Controller
{
    /**
     * Get all documents for authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $perPage = $request->get('per_page', 15); // Default 15 items per page
            
            // If per_page is 'all', return all records
            if ($perPage === 'all') {
                $documents = DokumenLegalitas::where('user_id', $user->id)
                    ->orderBy('created_at', 'desc')
                    ->get();
                
                return response()->json([
                    'success' => true,
                    'data' => $documents
                ], 200);
            }
            
            // Otherwise return paginated results
            $documents = DokumenLegalitas::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => $documents->items(),
                'meta' => [
                    'current_page' => $documents->currentPage(),
                    'last_page' => $documents->lastPage(),
                    'per_page' => $documents->perPage(),
                    'total' => $documents->total(),
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload or update a document
     */
    public function upload(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'jenis_dokumen' => 'required|string|in:Surat Keterangan,STR,SIP',
            'nomor_sk' => 'nullable|string|max:255',
            'tanggal_mulai' => 'nullable|date',
            'tanggal_berlaku' => 'nullable|date',
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

            // Create folder name: {name}_{nik}
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $folderPath = $folderName . '/dokumenLegalitas';

            // Use original filename
            $fileName = $file->getClientOriginalName();
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Check if document already exists for this user and type
            $document = DokumenLegalitas::where('user_id', $user->id)
                ->where('jenis_dokumen', $request->jenis_dokumen)
                ->first();

            if ($document) {
                // Delete old file if exists
                if (Storage::disk('public')->exists($document->file_path)) {
                    Storage::disk('public')->delete($document->file_path);
                }

                // Update existing document
                $document->update([
                    'nomor_sk' => $request->nomor_sk,
                    'tanggal_mulai' => $request->tanggal_mulai,
                    'tanggal_berlaku' => $request->tanggal_berlaku,
                    'file_path' => $filePath,
                ]);

                // Log update activity
                ActivityLog::create([
                    'user_id' => $user->id,
                    'type' => 'upload',
                    'action' => 'Updated dokumen legalitas',
                    'metadata' => [
                        'jenis_dokumen' => $request->jenis_dokumen,
                        'nomor_sk' => $request->nomor_sk,
                    ]
                ]);
            } else {
                // Create new document
                $document = DokumenLegalitas::create([
                    'user_id' => $user->id,
                    'jenis_dokumen' => $request->jenis_dokumen,
                    'nomor_sk' => $request->nomor_sk,
                    'tanggal_mulai' => $request->tanggal_mulai,
                    'tanggal_berlaku' => $request->tanggal_berlaku,
                    'file_path' => $filePath,
                ]);

                // Log upload activity
                ActivityLog::create([
                    'user_id' => $user->id,
                    'type' => 'upload',
                    'action' => 'Uploaded dokumen legalitas',
                    'metadata' => [
                        'jenis_dokumen' => $request->jenis_dokumen,
                        'nomor_sk' => $request->nomor_sk,
                    ]
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded successfully',
                'data' => $document
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload document',
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
            $document = DokumenLegalitas::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

            $filePath = storage_path('app/public/' . $document->file_path);

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
     * Delete a document
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $document = DokumenLegalitas::where('user_id', $user->id)
                ->where('id', $id)
                ->firstOrFail();

            $jenisDokumen = $document->jenis_dokumen;
            $nomorSk = $document->nomor_sk;

            // Delete file from storage
            if (Storage::disk('public')->exists($document->file_path)) {
                Storage::disk('public')->delete($document->file_path);
            }

            // Delete database record
            $document->delete();

            // Log delete activity
            ActivityLog::create([
                'user_id' => $user->id,
                'type' => 'delete',
                'action' => 'Deleted dokumen legalitas',
                'metadata' => [
                    'jenis_dokumen' => $jenisDokumen,
                    'nomor_sk' => $nomorSk,
                ]
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document',
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
