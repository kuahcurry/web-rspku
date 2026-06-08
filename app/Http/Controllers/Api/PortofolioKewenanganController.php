<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PortofolioKewenangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PortofolioKewenanganController extends Controller
{
    /**
     * List all portofolio for the authenticated user
     */
    public function index(Request $request)
    {
        try {
            $user = auth()->user();
            $records = PortofolioKewenangan::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(fn($r) => [
                    'id' => $r->id,
                    'file_name' => $r->file_name,
                    'file_url' => $r->file_url,
                    'created_at' => $r->created_at?->toDateTimeString(),
                ]);

            return response()->json(['success' => true, 'data' => $records]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memuat data', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Upload one or more portofolio files
     * Accepts: files[] (array) OR file (single)
     */
    public function store(Request $request)
    {
        $request->validate([
            'files' => 'nullable|array',
            'files.*' => 'file|mimes:pdf,doc,docx|max:10240',
            'file' => 'nullable|file|mimes:pdf,doc,docx|max:10240',
        ]);

        try {
            $user = auth()->user();
            $folderName = $this->sanitizeFolderName($user->name) . '_' . $user->nik;
            $folderPath = $folderName . '/kredensial&kewenanganKlinis/portofolio';

            $uploaded = [];

            // Handle array of files
            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    $fileName = $file->getClientOriginalName();
                    $filePath = $file->storeAs($folderPath, $fileName, 'public');
                    $record = PortofolioKewenangan::create([
                        'user_id' => $user->id,
                        'file_path' => $filePath,
                        'file_name' => $fileName,
                    ]);
                    $uploaded[] = ['id' => $record->id, 'file_name' => $fileName];
                }
            }

            // Handle single file
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = $file->getClientOriginalName();
                $filePath = $file->storeAs($folderPath, $fileName, 'public');
                $record = PortofolioKewenangan::create([
                    'user_id' => $user->id,
                    'file_path' => $filePath,
                    'file_name' => $fileName,
                ]);
                $uploaded[] = ['id' => $record->id, 'file_name' => $fileName];
            }

            if (empty($uploaded)) {
                return response()->json(['success' => false, 'message' => 'Tidak ada file yang diunggah'], 422);
            }

            return response()->json(['success' => true, 'message' => 'File berhasil diunggah', 'data' => $uploaded], 201);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengunggah file', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * View / serve a portofolio file inline
     */
    public function view($id)
    {
        try {
            $user = auth()->user();
            $record = PortofolioKewenangan::where('user_id', $user->id)->where('id', $id)->firstOrFail();

            $filePath = storage_path('app/public/' . $record->file_path);

            if (!file_exists($filePath)) {
                return response()->json(['success' => false, 'message' => 'File tidak ditemukan'], 404);
            }

            $mime = mime_content_type($filePath) ?: 'application/octet-stream';

            return response()->file($filePath, [
                'Content-Type' => $mime,
                'Content-Disposition' => 'inline; filename="' . $record->file_name . '"'
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal memuat file', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a single portofolio record
     */
    public function delete($id)
    {
        try {
            $user = auth()->user();
            $record = PortofolioKewenangan::where('user_id', $user->id)->where('id', $id)->first();

            if (!$record) {
                return response()->json(['success' => false, 'message' => 'Data tidak ditemukan'], 404);
            }

            if ($record->file_path && Storage::disk('public')->exists($record->file_path)) {
                Storage::disk('public')->delete($record->file_path);
            }

            $record->delete();

            return response()->json(['success' => true, 'message' => 'File berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus file', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Bulk delete
     */
    public function bulkDelete(Request $request)
    {
        $request->validate(['ids' => 'required|array', 'ids.*' => 'integer']);

        try {
            $user = auth()->user();
            $records = PortofolioKewenangan::where('user_id', $user->id)->whereIn('id', $request->ids)->get();

            foreach ($records as $record) {
                if ($record->file_path && Storage::disk('public')->exists($record->file_path)) {
                    Storage::disk('public')->delete($record->file_path);
                }
                $record->delete();
            }

            return response()->json(['success' => true, 'message' => count($records) . ' file berhasil dihapus']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menghapus file', 'error' => $e->getMessage()], 500);
        }
    }

    private function sanitizeFolderName(string $name): string
    {
        return preg_replace('/[^a-zA-Z0-9_\-]/', '_', $name);
    }
}
