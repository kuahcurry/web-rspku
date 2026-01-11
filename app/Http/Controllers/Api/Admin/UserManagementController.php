<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserRegistration;
use App\Models\DokumenLegalitas;
use App\Models\RiwayatPendidikan;
use App\Models\Penugasan;
use App\Models\PrestasiPenghargaan;
use App\Models\EtikDisiplin;
use App\Models\Kredensial;
use App\Models\StatusKewenangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class UserManagementController extends Controller
{
    /**
     * Display a listing of approved users with search and filter
     * 
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        try {
            $query = UserRegistration::whereNotNull('email_verified_at');

            // Search functionality (NIP, NIK, name, email)
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('nip', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('nik', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('email', 'LIKE', "%{$searchTerm}%");
                });
            }

            // Filter by status_kepegawaian
            if ($request->has('status_kepegawaian') && !empty($request->status_kepegawaian)) {
                $query->where('status_kepegawaian', $request->status_kepegawaian);
            }

            // Order by created_at desc (newest first)
            $query->orderBy('created_at', 'desc');

            // Paginate with 15 per page
            $users = $query->paginate(15);

            // Format the response
            $formattedUsers = $users->map(function($user) {
                return [
                    'id' => $user->id,
                    'nip' => $user->nip,
                    'nik' => $user->nik,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status_kepegawaian' => $user->status_kepegawaian,
                    'foto_profil' => $user->foto_profil ? asset('storage/' . $user->foto_profil) : null,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Users retrieved successfully',
                'data' => $formattedUsers,
                'meta' => [
                    'current_page' => $users->currentPage(),
                    'from' => $users->firstItem(),
                    'last_page' => $users->lastPage(),
                    'per_page' => $users->perPage(),
                    'to' => $users->lastItem(),
                    'total' => $users->total(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve users',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified user with all related data
     * 
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function show($id)
    {
        try {
            // Get user with email_verified_at check
            $user = UserRegistration::whereNotNull('email_verified_at')->find($id);

            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found or not approved'
                ], 404);
            }

            // Get all related data
            $dokumenLegalitas = DokumenLegalitas::where('user_id', $id)->get()->map(function($doc) {
                return [
                    'id' => $doc->id,
                    'jenis_dokumen' => $doc->jenis_dokumen,
                    'nomor_sk' => $doc->nomor_sk,
                    'tanggal_mulai' => $doc->tanggal_mulai?->format('Y-m-d'),
                    'tanggal_berlaku' => $doc->tanggal_berlaku?->format('Y-m-d'),
                    'file_path' => $doc->file_path,
                    'file_url' => $doc->file_path ? asset('storage/' . $doc->file_path) : null,
                    'file_name' => $doc->file_path ? basename($doc->file_path) : null,
                ];
            });

            $riwayatPendidikan = RiwayatPendidikan::where('user_id', $id)->get()->map(function($edu) {
                return [
                    'id' => $edu->id,
                    'jenis' => $edu->jenis,
                    'judul' => $edu->judul,
                    'institusi' => $edu->institusi,
                    'tahun_lulus' => $edu->tahun_lulus,
                    'file_path' => $edu->file_path,
                    'file_url' => $edu->url ?? null,
                    'file_name' => $edu->file_name ?? null,
                ];
            });

            $penugasan = Penugasan::where('user_id', $id)->get()->map(function($assignment) {
                return [
                    'id' => $assignment->id,
                    'jenis' => $assignment->jenis,
                    'unit' => $assignment->unit,
                    'penanggung_jawab' => $assignment->penanggung_jawab,
                    'tanggal_mulai' => $assignment->tanggal_mulai?->format('Y-m-d'),
                    'tanggal_selesai' => $assignment->tanggal_selesai?->format('Y-m-d'),
                    'status' => $assignment->status ?? null,
                    'file_path' => $assignment->file_path,
                    'file_url' => $assignment->url ?? null,
                    'file_name' => $assignment->file_name ?? null,
                ];
            });

            $prestasiPenghargaan = PrestasiPenghargaan::where('user_id', $id)->get()->map(function($achievement) {
                return [
                    'id' => $achievement->id,
                    'achievement_type' => $achievement->achievement_type,
                    'judul' => $achievement->judul,
                    'penyelenggara' => $achievement->penyelenggara,
                    'tahun' => $achievement->tahun,
                    'file_path' => $achievement->file_path,
                    'file_url' => $achievement->url ?? null,
                    'file_name' => $achievement->file_name ?? null,
                ];
            });

            $etikDisiplin = EtikDisiplin::where('user_id', $id)->get()->map(function($etik) {
                return [
                    'id' => $etik->id,
                    'jenis' => $etik->jenis,
                    'tanggal_kejadian' => $etik->tanggal_kejadian?->format('Y-m-d'),
                    'tanggal_penyelesaian' => $etik->tanggal_penyelesaian?->format('Y-m-d'),
                    'jenis_pelanggaran' => $etik->jenis_pelanggaran,
                    'uraian_singkat' => $etik->uraian_singkat,
                    'tingkat' => $etik->tingkat,
                    'tindakan' => $etik->tindakan,
                    'status_penyelesaian' => $etik->status_penyelesaian,
                    'catatan' => $etik->catatan,
                    'file_path' => $etik->file_path,
                    'file_url' => $etik->url ?? null,
                    'file_name' => $etik->file_name ?? null,
                ];
            });

            $kredensial = Kredensial::where('user_id', $id)->get()->map(function($kred) {
                return [
                    'id' => $kred->id,
                    'tanggal_berlaku' => $kred->tanggal_berlaku?->format('Y-m-d'),
                    'tanggal_selesai' => $kred->tanggal_selesai?->format('Y-m-d'),
                    'nama_kegiatan' => $kred->nama_kegiatan,
                    'jenis_kegiatan' => $kred->jenis_kegiatan,
                    'kredensial_type' => $kred->kredensial_type,
                    'hasil_penilaian' => $kred->hasil_penilaian,
                    'catatan' => $kred->catatan,
                    'file_path' => $kred->file_path,
                    'file_url' => $kred->url ?? null,
                    'file_name' => $kred->file_name ?? null,
                ];
            });

            $statusKewenangan = StatusKewenangan::where('user_id', $id)->get()->map(function($kewenangan) {
                return [
                    'id' => $kewenangan->id,
                    'jenis' => $kewenangan->jenis,
                    'nomor_dokumen' => $kewenangan->nomor_dokumen,
                    'tanggal_terbit' => $kewenangan->tanggal_terbit?->format('Y-m-d'),
                    'masa_berlaku' => $kewenangan->masa_berlaku?->format('Y-m-d'),
                    'status' => $kewenangan->status,
                    'file_path' => $kewenangan->file_path,
                    'file_url' => $kewenangan->url ?? null,
                    'file_name' => $kewenangan->file_name ?? null,
                ];
            });

            // Format user data
            $userData = [
                'id' => $user->id,
                'nip' => $user->nip,
                'nik' => $user->nik,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'jenis_kelamin' => $user->jenis_kelamin,
                'agama' => $user->agama,
                'tempat' => $user->tempat,
                'tanggal_lahir' => $user->tanggal_lahir?->format('Y-m-d'),
                'province' => $user->province,
                'regency' => $user->regency,
                'district' => $user->district,
                'village' => $user->village,
                'address' => $user->address,
                'status_kepegawaian' => $user->status_kepegawaian,
                'jabatan' => $user->jabatan,
                'unit_kerja' => $user->unit_kerja,
                'tanggal_mulai_kerja' => $user->tanggal_mulai_kerja?->format('Y-m-d'),
                'foto_profil' => $user->foto_profil ? asset('storage/' . $user->foto_profil) : null,
                'email_verified_at' => $user->email_verified_at?->format('Y-m-d H:i:s'),
                'last_login_at' => $user->last_login_at?->format('Y-m-d H:i:s'),
            ];

            return response()->json([
                'success' => true,
                'message' => 'User detail retrieved successfully',
                'data' => [
                    'user' => $userData,
                    'dokumen_legalitas' => $dokumenLegalitas,
                    'riwayat_pendidikan' => $riwayatPendidikan,
                    'penugasan' => $penugasan,
                    'prestasi_penghargaan' => $prestasiPenghargaan,
                    'etik_disiplin' => $etikDisiplin,
                    'kredensial' => $kredensial,
                    'status_kewenangan' => $statusKewenangan,
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve user detail',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
