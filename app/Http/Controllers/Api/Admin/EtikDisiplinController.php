<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\EtikDisiplin;
use App\Models\UserRegistration;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class EtikDisiplinController extends Controller
{
    /**
     * Display a listing of etik-disiplin records with search and filter
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = EtikDisiplin::with(['user:id,name,nip']);

            // Filter by jenis (etik or disiplin)
            if ($request->has('jenis') && in_array($request->jenis, ['etik', 'disiplin'])) {
                $query->where('jenis', $request->jenis);
            }

            // Search by jenis_pelanggaran and pegawai name
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('jenis_pelanggaran', 'LIKE', "%{$searchTerm}%")
                      ->orWhereHas('user', function($userQuery) use ($searchTerm) {
                          $userQuery->where('name', 'LIKE', "%{$searchTerm}%");
                      });
                });
            }

            // Filter by pegawai (user_id)
            if ($request->has('pegawai') && !empty($request->pegawai) && $request->pegawai !== 'Semua') {
                $query->where('user_id', $request->pegawai);
            }

            // Filter by tahun (from tanggal_kejadian)
            if ($request->has('tahun') && !empty($request->tahun) && $request->tahun !== 'Semua') {
                $query->whereYear('tanggal_kejadian', $request->tahun);
            }

            // Filter by status
            if ($request->has('status') && !empty($request->status) && $request->status !== 'Semua') {
                $query->where('status_penyelesaian', $request->status);
            }

            // Order by tanggal_kejadian desc (newest first)
            $query->orderBy('tanggal_kejadian', 'desc');

            // Paginate with 10 per page
            $records = $query->paginate(10);

            // Format the response
            $formattedRecords = $records->map(function($record) {
                return [
                    'id' => $record->id,
                    'user_id' => $record->user_id,
                    'user_name' => $record->user->name ?? 'Unknown',
                    'user_nip' => $record->user->nip ?? '-',
                    'jenis' => $record->jenis,
                    'tanggal_kejadian' => $record->tanggal_kejadian?->format('Y-m-d'),
                    'tanggal_penyelesaian' => $record->tanggal_penyelesaian?->format('Y-m-d'),
                    'jenis_pelanggaran' => $record->jenis_pelanggaran,
                    'uraian_singkat' => $record->uraian_singkat,
                    'tingkat' => $record->tingkat,
                    'tindakan' => $record->tindakan,
                    'status_penyelesaian' => $record->status_penyelesaian,
                    'catatan' => $record->catatan,
                    'file_path' => $record->file_path,
                    'file_url' => $record->url ?? null,
                    'file_name' => $record->file_name ?? null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Records retrieved successfully',
                'data' => $formattedRecords,
                'meta' => [
                    'current_page' => $records->currentPage(),
                    'from' => $records->firstItem(),
                    'last_page' => $records->lastPage(),
                    'per_page' => $records->perPage(),
                    'to' => $records->lastItem(),
                    'total' => $records->total(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve records',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created record
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        try {
            // Validation rules
            $rules = [
                'user_id' => 'required|exists:users_registration,id',
                'jenis' => 'required|in:etik,disiplin',
                'tanggal_kejadian' => 'required|date',
                'jenis_pelanggaran' => 'required|string|max:255',
                'uraian_singkat' => 'required|string',
                'status_penyelesaian' => 'required|in:Proses,Selesai,Pending',
                'tanggal_penyelesaian' => 'nullable|date|after_or_equal:tanggal_kejadian',
                'catatan' => 'nullable|string',
                'file' => 'required|file|mimes:pdf|max:2048', // 2MB max
            ];

            // Add conditional validation based on jenis
            if ($request->jenis === 'etik') {
                $rules['tingkat'] = 'required|in:Ringan,Sedang,Berat';
            } else if ($request->jenis === 'disiplin') {
                $rules['tindakan'] = 'required|string|max:255';
            }

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Handle file upload
            $filePath = null;
            if ($request->hasFile('file')) {
                $file = $request->file('file');
                $fileName = time() . '_' . $file->getClientOriginalName();
                $filePath = $file->storeAs('etik_disiplin', $fileName, 'public');
            }

            // Create record
            $data = [
                'user_id' => $request->user_id,
                'jenis' => $request->jenis,
                'tanggal_kejadian' => $request->tanggal_kejadian,
                'jenis_pelanggaran' => $request->jenis_pelanggaran,
                'uraian_singkat' => $request->uraian_singkat,
                'status_penyelesaian' => $request->status_penyelesaian,
                'tanggal_penyelesaian' => $request->tanggal_penyelesaian,
                'catatan' => $request->catatan,
                'file_path' => $filePath,
            ];

            // Add tingkat or tindakan based on jenis
            if ($request->jenis === 'etik') {
                $data['tingkat'] = $request->tingkat;
            } else if ($request->jenis === 'disiplin') {
                $data['tindakan'] = $request->tindakan;
            }

            $record = EtikDisiplin::create($data);

            // Load user relationship
            $record->load('user:id,name,nip');

            return response()->json([
                'success' => true,
                'message' => 'Record created successfully',
                'data' => [
                    'id' => $record->id,
                    'user_id' => $record->user_id,
                    'user_name' => $record->user->name ?? 'Unknown',
                    'user_nip' => $record->user->nip ?? '-',
                    'jenis' => $record->jenis,
                    'tanggal_kejadian' => $record->tanggal_kejadian?->format('Y-m-d'),
                    'tanggal_penyelesaian' => $record->tanggal_penyelesaian?->format('Y-m-d'),
                    'jenis_pelanggaran' => $record->jenis_pelanggaran,
                    'uraian_singkat' => $record->uraian_singkat,
                    'tingkat' => $record->tingkat,
                    'tindakan' => $record->tindakan,
                    'status_penyelesaian' => $record->status_penyelesaian,
                    'catatan' => $record->catatan,
                    'file_path' => $record->file_path,
                    'file_url' => $record->url ?? null,
                    'file_name' => $record->file_name ?? null,
                ]
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create record',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified record
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $record = EtikDisiplin::find($id);

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
     * Bulk delete multiple records
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function bulkDelete(Request $request)
    {
        try {
            $validator = Validator::make($request->all(), [
                'ids' => 'required|array|min:1',
                'ids.*' => 'integer|exists:etik_disiplin,id'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors()
                ], 422);
            }

            $records = EtikDisiplin::whereIn('id', $request->ids)->get();

            if ($records->isEmpty()) {
                return response()->json([
                    'success' => false,
                    'message' => 'No records found'
                ], 404);
            }

            // Delete files from storage
            foreach ($records as $record) {
                if ($record->file_path && Storage::disk('public')->exists($record->file_path)) {
                    Storage::disk('public')->delete($record->file_path);
                }
            }

            // Delete records
            EtikDisiplin::whereIn('id', $request->ids)->delete();

            return response()->json([
                'success' => true,
                'message' => count($request->ids) . ' record(s) deleted successfully'
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
     * Get list of approved users for dropdown
     * 
     * @return \Illuminate\Http\JsonResponse
     */
    public function getApprovedUsers()
    {
        try {
            $users = UserRegistration::whereNotNull('email_verified_at')
                ->select('id', 'name', 'nip')
                ->orderBy('name', 'asc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $users
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
