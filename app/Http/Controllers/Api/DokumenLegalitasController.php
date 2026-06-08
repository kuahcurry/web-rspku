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
            
            // Get all documents ordered by creation date
            $documents = DokumenLegalitas::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get();

            // Group documents by type for easier frontend handling
            $groupedDocuments = [
                'Surat Keterangan' => [],
                'STR' => [],
                'SIP' => []
            ];

            foreach ($documents as $doc) {
                if (isset($groupedDocuments[$doc->jenis_dokumen])) {
                    $groupedDocuments[$doc->jenis_dokumen][] = $doc;
                }
            }

            return response()->json([
                'success' => true,
                'data' => $groupedDocuments
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
        $jenisDokumen = $request->input('jenis_dokumen');
        
        // Dynamic validation based on document type
        $rules = [
            'jenis_dokumen' => 'required|string|in:Surat Keterangan,STR,SIP',
            'nomor_sk' => 'nullable|string|max:255',
            'file' => 'required|file|mimes:pdf|max:10240', // Max 10MB
        ];

        // For STR and Surat Keterangan: tanggal_lulus is required (graduation date)
        // For SIP: berlaku_sampai is required, tanggal_lulus will be auto-set to upload date
        if ($jenisDokumen === 'STR' || $jenisDokumen === 'Surat Keterangan') {
            $rules['tanggal_lulus'] = 'required|date';
        } elseif ($jenisDokumen === 'SIP') {
            $rules['berlaku_sampai'] = 'required|date';
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

            // Create folder name: {name}_{nik}
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $folderPath = $folderName . '/dokumenLegalitas';

            // Use original filename
            $fileName = $file->getClientOriginalName();
            
            // Store file in public storage
            $filePath = $file->storeAs($folderPath, $fileName, 'public');

            // Prepare document data
            $documentData = [
                'user_id' => $user->id,
                'jenis_dokumen' => $jenisDokumen,
                'nomor_sk' => $request->nomor_sk,
                'file_path' => $filePath,
            ];

            // Set dates based on document type
            if ($jenisDokumen === 'STR' || $jenisDokumen === 'Surat Keterangan') {
                // For STR & Surat Keterangan: use tanggal_lulus, no berlaku_sampai
                $documentData['tanggal_lulus'] = $request->tanggal_lulus;
                $documentData['berlaku_sampai'] = null;
            } elseif ($jenisDokumen === 'SIP') {
                // For SIP: auto-set tanggal_lulus to today (upload date), use berlaku_sampai
                $documentData['tanggal_lulus'] = now()->toDateString();
                $documentData['berlaku_sampai'] = $request->berlaku_sampai;
            }

            // Create new document (no update logic, always create new)
            $document = DokumenLegalitas::create($documentData);

            // Log upload activity
            ActivityLog::create([
                'user_id' => $user->id,
                'type' => 'upload',
                'action' => 'Uploaded dokumen legalitas',
                'metadata' => [
                    'jenis_dokumen' => $jenisDokumen,
                    'nomor_sk' => $request->nomor_sk,
                ]
            ]);

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
     * Download a document (force download instead of inline view)
     */
    public function download($id)
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
