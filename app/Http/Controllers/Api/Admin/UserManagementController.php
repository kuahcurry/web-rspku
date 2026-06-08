<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserRegistration;
use App\Helpers\RegionHelper;
use App\Models\DokumenLegalitas;
use App\Models\RiwayatPendidikan;
use App\Models\Penugasan;
use App\Models\PrestasiPenghargaan;
use App\Models\EtikDisiplin;
use App\Models\Kredensial;
use App\Models\StatusKewenangan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\QueryException;
use RuntimeException;

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

            // Define active kepegawaian statuses
            $activeStatuses = [
                'Karyawan Tetap',
                'Karyawan Kontrak',
                'Tenaga Honorer/Sukarelawan',
                'Perawat Praktik Mandiri'
            ];

            // Enhanced full-text search across all user fields
            if ($request->has('search') && !empty($request->search)) {
                $searchTerm = $request->search;
                $query->where(function($q) use ($searchTerm) {
                    $q->where('nip', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('nik', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('name', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('email', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('phone', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('alamat_lengkap', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('jenis_kelamin', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('agama', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('tempat', 'LIKE', "%{$searchTerm}%")
                      ->orWhereRaw("DATE_FORMAT(tanggal_lahir, '%Y-%m-%d') LIKE ?", ["%{$searchTerm}%"])
                      ->orWhere('status_kepegawaian', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('jabatan', 'LIKE', "%{$searchTerm}%")
                      ->orWhere('unit_kerja', 'LIKE', "%{$searchTerm}%")
                      ->orWhereRaw("DATE_FORMAT(tanggal_mulai_kerja, '%Y-%m-%d') LIKE ?", ["%{$searchTerm}%"]);
                });
            }

            // Filter by status_kepegawaian: accept 'Aktif' or 'Tidak Aktif'
            if ($request->has('status_kepegawaian') && !empty($request->status_kepegawaian)) {
                $statusFilter = $request->status_kepegawaian;
                if (strtolower($statusFilter) === 'aktif') {
                    $query->whereIn('status_kepegawaian', $activeStatuses);
                } elseif (strtolower($statusFilter) === 'tidak aktif') {
                    $query->whereNotIn('status_kepegawaian', $activeStatuses);
                } else {
                    // fallback to exact match for backward compatibility
                    $query->where('status_kepegawaian', $request->status_kepegawaian);
                }
            }
            // Filter by jenis_kelamin
            if ($request->has('jenis_kelamin') && !empty($request->jenis_kelamin)) {
                $query->where('jenis_kelamin', $request->jenis_kelamin);
            }

            // Order by created_at desc (newest first)
            $query->orderBy('created_at', 'desc');

            // Paginate with 15 per page
            $users = $query->paginate(15);

            // Format the response
            $formattedUsers = $users->map(function($user) use ($activeStatuses) {
                // Lowercase all, then ucfirst the first letter only
                $alamat_lengkap = $user->alamat_lengkap ? ucfirst(mb_strtolower($user->alamat_lengkap)) : '';
                $province = RegionHelper::getProvinceName($user->province);
                $regency = RegionHelper::getRegencyName($user->regency);
                $district = RegionHelper::getDistrictName($user->district);
                $village = RegionHelper::getVillageName($user->village);
                // Normalize displayed status to 'Aktif' or 'Tidak Aktif'
                $displayStatus = in_array($user->status_kepegawaian, $activeStatuses) ? 'Aktif' : 'Tidak Aktif';

                return [
                    'id' => $user->id,
                    'nip' => $user->nip,
                    'nik' => $user->nik,
                    'name' => $user->name,
                    'email' => $user->email,
                    'status_kepegawaian' => $displayStatus,
                    'province' => $province,
                    'regency' => $regency,
                    'district' => $district,
                    'village' => $village,
                    'alamat_lengkap' => $alamat_lengkap,
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
     * Download all user-related documents as a single ZIP
     *
     * @param int $id
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\JsonResponse
     */
    public function downloadAllDocuments($id)
    {
        try {
            $user = UserRegistration::find($id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $files = [];

            // Collect file paths from various models
            $collectors = [
                DokumenLegalitas::where('user_id', $id)->get(),
                RiwayatPendidikan::where('user_id', $id)->get(),
                Penugasan::where('user_id', $id)->get(),
                PrestasiPenghargaan::where('user_id', $id)->get(),
                EtikDisiplin::where('user_id', $id)->get(),
                Kredensial::where('user_id', $id)->get(),
                StatusKewenangan::where('user_id', $id)->get(),
            ];

            foreach ($collectors as $collection) {
                foreach ($collection as $item) {
                    // common field names: file_path, file_path (some records might use file_path or file)
                    if (!empty($item->file_path)) {
                        $files[] = [
                            'path' => $item->file_path,
                            'name' => basename($item->file_path)
                        ];
                    } elseif (!empty($item->file)) {
                        $files[] = [
                            'path' => $item->file,
                            'name' => basename($item->file)
                        ];
                    }
                }
            }

            if (empty($files)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No files available for this user'
                ], 404);
            }

            $zipFileName = preg_replace('/[^A-Za-z0-9_-]/', '_', ($user->name ?? 'user')) . '-dokumen.zip';

            $headers = [
                'Content-Type' => 'application/octet-stream',
                'Content-Disposition' => 'attachment; filename="' . $zipFileName . '"'
            ];

            $disk = Storage::disk('public');

            $response = response()->stream(function () use ($files, $disk) {
                $zip = new \ZipArchive();
                $tmpFile = tempnam(sys_get_temp_dir(), 'user_docs_');
                if ($zip->open($tmpFile, \ZipArchive::CREATE) !== true) {
                    throw new \Exception('Could not create ZIP archive');
                }

                foreach ($files as $f) {
                    try {
                        // resolve path on disk
                        if ($disk->exists($f['path'])) {
                            $realPath = $disk->path($f['path']);
                            $zip->addFile($realPath, $f['name']);
                        } else {
                            // try storage/app path fallback
                            $fallback = storage_path('app/public/' . ltrim($f['path'], '/'));
                            if (file_exists($fallback)) {
                                $zip->addFile($fallback, $f['name']);
                            }
                        }
                    } catch (\Exception $e) {
                        // skip problematic file
                        continue;
                    }
                }

                $zip->close();

                // stream the file contents and then delete
                $stream = fopen($tmpFile, 'rb');
                while (!feof($stream)) {
                    echo fread($stream, 1024 * 8);
                    flush();
                }
                fclose($stream);
                @unlink($tmpFile);
            }, 200, $headers);

            return $response;

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create ZIP file',
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
                    'tanggal_lulus' => $doc->tanggal_lulus?->format('Y-m-d'),
                    'berlaku_sampai' => $doc->berlaku_sampai?->format('Y-m-d'),
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
                    'ruang' => $assignment->ruang,
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
            $province = RegionHelper::getProvinceName($user->province);
            $regency = RegionHelper::getRegencyName($user->regency);
            $district = RegionHelper::getDistrictName($user->district);
            $village = RegionHelper::getVillageName($user->village);
            $alamat_lengkap = trim(implode(', ', array_filter([
                $user->address,
                $village,
                $district,
                $regency,
                $province
            ])));
            // Determine display status (Aktif / Tidak Aktif)
            $activeStatuses = [
                'Karyawan Tetap',
                'Karyawan Kontrak',
                'Tenaga Honorer/Sukarelawan',
                'Perawat Praktik Mandiri'
            ];

            $displayStatus = in_array($user->status_kepegawaian, $activeStatuses) ? 'Aktif' : 'Tidak Aktif';

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
                'province' => $province,
                'regency' => $regency,
                'district' => $district,
                'village' => $village,
                'address' => $user->address,
                'alamat_lengkap' => $alamat_lengkap,
                'status_kepegawaian' => $displayStatus,
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
    /**
     * Delete a user (super admin only)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy($id)
    {
        try {
            $user = UserRegistration::find($id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Save previous status for potential reactivation, then mark as non-active
            $user->previous_status_kepegawaian = $user->status_kepegawaian;
            $user->status_kepegawaian = 'Tidak Aktif';
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'User has been deactivated (status set to Tidak Aktif)'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reactivate a previously deactivated user (super admin only)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function reactivate($id)
    {
        try {
            $user = UserRegistration::find($id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            // Only reactivate if currently marked as Tidak Aktif
            if (strtolower($user->status_kepegawaian) !== 'tidak aktif') {
                return response()->json([
                    'success' => false,
                    'message' => 'User is not deactivated'
                ], 400);
            }

            // Restore previous status if available, otherwise set a sensible default
            $activeStatuses = [
                'Karyawan Tetap',
                'Karyawan Kontrak',
                'Tenaga Honorer/Sukarelawan',
                'Perawat Praktik Mandiri'
            ];

            $restore = $user->previous_status_kepegawaian ?: $activeStatuses[0];

            $user->status_kepegawaian = $restore;
            $user->previous_status_kepegawaian = null;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'User reactivated successfully'
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to reactivate user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Permanently delete a user and related records (super admin only)
     *
     * @param int $id
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroyPermanent($id)
    {
        try {
            $user = UserRegistration::find($id);
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found'
                ], 404);
            }

            $connectionName = $user->getConnectionName();

            try {
                DB::connection($connectionName)->transaction(function () use ($id, $user, $connectionName) {
                    // Lock parent row to block concurrent child inserts via FK checks while deleting.
                    $lockedUser = UserRegistration::on($connectionName)
                        ->whereKey($id)
                        ->lockForUpdate()
                        ->first();

                    if (!$lockedUser) {
                        throw new RuntimeException('USER_NOT_FOUND_DURING_DELETE');
                    }

                    // Delete children explicitly before parent delete.
                    // Some production schemas can drift and not honor CASCADE as expected.
                    $relatedTargets = [
                        ['table' => 'dokumen_legalitas', 'files' => ['file_path', 'file']],
                        ['table' => 'riwayat_pendidikan', 'files' => ['file_path', 'file']],
                        ['table' => 'penugasan', 'files' => ['file_path', 'file']],
                        ['table' => 'prestasi_penghargaan', 'files' => ['file_path', 'file']],
                        ['table' => 'etik_disiplin', 'files' => ['file_path', 'file']],
                        ['table' => 'kredensial', 'files' => ['file_path', 'file']],
                        ['table' => 'status_kewenangan', 'files' => ['file_path', 'file']],
                        ['table' => 'pengajuan_kredensial', 'files' => ['surat_permohonan_path', 'form_k1_path', 'form_k3_path']],
                        ['table' => 'activity_logs', 'files' => []],
                    ];

                    $disk = Storage::disk('public');

                    foreach ($relatedTargets as $target) {
                        $table = $target['table'];
                        $this->cleanupFilesByUserId($table, $target['files'], $id, $disk, $connectionName);
                        $this->safeDeleteByColumn($table, 'user_id', $id, $connectionName);
                    }

                    // Also cleanup any FK-linked table discovered dynamically.
                    $fkTargets = $this->getUserRegistrationForeignKeyTargets($connectionName);
                    foreach ($fkTargets as $fkTarget) {
                        $table = $fkTarget['table'];
                        $column = $fkTarget['column'];
                        $this->safeDeleteByColumn($table, $column, $id, $connectionName);
                    }

                    // Safety check: if anything still references the user, block delete with details.
                    $blocking = [];
                    foreach ($fkTargets as $fkTarget) {
                        $table = $fkTarget['table'];
                        $column = $fkTarget['column'];

                        $remaining = $this->safeCountByColumn($table, $column, $id, $connectionName);
                        if ($remaining > 0) {
                            $blocking[] = [
                                'table' => $table,
                                'column' => $column,
                                'count' => $remaining,
                            ];
                        }
                    }

                    if (!empty($blocking)) {
                        throw new RuntimeException('USER_DELETE_BLOCKED:' . json_encode($blocking));
                    }

                    $lockedUser->delete();
                });
            } catch (RuntimeException $re) {
                if ($re->getMessage() === 'USER_NOT_FOUND_DURING_DELETE') {
                    return response()->json([
                        'success' => false,
                        'message' => 'User not found'
                    ], 404);
                }

                if (str_starts_with($re->getMessage(), 'USER_DELETE_BLOCKED:')) {
                    $detail = substr($re->getMessage(), strlen('USER_DELETE_BLOCKED:'));
                    return response()->json([
                        'success' => false,
                        'message' => 'User cannot be deleted because related rows still exist',
                        'detail' => json_decode($detail, true),
                    ], 409);
                }

                throw $re;
            } catch (QueryException $qe) {
                return response()->json([
                    'success' => false,
                    'message' => 'User cannot be deleted due to related data constraints',
                    'error' => $qe->getMessage()
                ], 409);
            } catch (\Throwable $te) {
                // Treat low-level DB/FK errors as conflicts instead of opaque 500s.
                if ($this->isIntegrityViolationMessage($te->getMessage())) {
                    return response()->json([
                        'success' => false,
                        'message' => 'User cannot be deleted due to related data constraints',
                        'error' => $te->getMessage(),
                    ], 409);
                }

                throw $te;
            }

            return response()->json([
                'success' => true,
                'message' => 'User permanently deleted'
            ], 200);
        } catch (\Throwable $e) {
            if ($this->isIntegrityViolationMessage($e->getMessage())) {
                return response()->json([
                    'success' => false,
                    'message' => 'User cannot be deleted due to related data constraints',
                    'error' => $e->getMessage()
                ], 409);
            }

            return response()->json([
                'success' => false,
                'message' => 'Failed to permanently delete user',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all FK targets that reference users_registration.id.
     * This keeps delete logic resilient against schema drift in production.
     *
     * @return array<int, array{table: string, column: string}>
     */
    private function getUserRegistrationForeignKeyTargets(?string $connectionName = null): array
    {
        $targets = [
            ['table' => 'dokumen_legalitas', 'column' => 'user_id'],
            ['table' => 'riwayat_pendidikan', 'column' => 'user_id'],
            ['table' => 'penugasan', 'column' => 'user_id'],
            ['table' => 'prestasi_penghargaan', 'column' => 'user_id'],
            ['table' => 'etik_disiplin', 'column' => 'user_id'],
            ['table' => 'kredensial', 'column' => 'user_id'],
            ['table' => 'status_kewenangan', 'column' => 'user_id'],
            ['table' => 'pengajuan_kredensial', 'column' => 'user_id'],
            ['table' => 'activity_logs', 'column' => 'user_id'],
        ];

        try {
            $connection = DB::connection($connectionName);
            $databaseName = $connection->getDatabaseName();

            $rows = $connection->select(
                'SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE REFERENCED_TABLE_SCHEMA = ?
                   AND REFERENCED_TABLE_NAME = ?
                   AND REFERENCED_COLUMN_NAME = ?',
                [$databaseName, 'users_registration', 'id']
            );

            foreach ($rows as $row) {
                $tableName = $row->table_name ?? null;
                $columnName = $row->column_name ?? null;

                if (empty($tableName) || empty($columnName)) {
                    continue;
                }

                $key = $tableName . '::' . $columnName;
                $exists = false;
                foreach ($targets as $target) {
                    if (($target['table'] . '::' . $target['column']) === $key) {
                        $exists = true;
                        break;
                    }
                }

                if (!$exists) {
                    $targets[] = ['table' => $tableName, 'column' => $columnName];
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Unable to query information_schema for user delete targets', [
                'error' => $e->getMessage(),
            ]);
        }

        return $targets;
    }

    /**
     * Delete rows by a specific column value while tolerating missing table/column.
     */
    private function safeDeleteByColumn(string $table, string $column, int $id, ?string $connectionName = null): void
    {
        try {
            DB::connection($connectionName)->table($table)->where($column, $id)->delete();
        } catch (QueryException $e) {
            if ($this->isMissingTableOrColumn($e)) {
                Log::warning('Skipping delete on missing table/column during permanent user delete', [
                    'table' => $table,
                    'column' => $column,
                    'user_id' => $id,
                ]);

                return;
            }

            throw $e;
        }
    }

    /**
     * Count rows by a specific column value while tolerating missing table/column.
     */
    private function safeCountByColumn(string $table, string $column, int $id, ?string $connectionName = null): int
    {
        try {
            return (int) DB::connection($connectionName)->table($table)->where($column, $id)->count();
        } catch (QueryException $e) {
            if ($this->isMissingTableOrColumn($e)) {
                return 0;
            }

            throw $e;
        }
    }

    /**
     * Cleanup related files (best effort) for rows belonging to a user.
     */
    private function cleanupFilesByUserId(string $table, array $fileColumns, int $id, $disk, ?string $connectionName = null): void
    {
        if (empty($fileColumns)) {
            return;
        }

        try {
            $rows = DB::connection($connectionName)->table($table)->where('user_id', $id)->get($fileColumns);

            foreach ($rows as $row) {
                foreach ($fileColumns as $fileColumn) {
                    $path = $row->{$fileColumn} ?? null;
                    if (!empty($path) && $disk->exists($path)) {
                        $disk->delete($path);
                    }
                }
            }
        } catch (QueryException $e) {
            if ($this->isMissingTableOrColumn($e)) {
                return;
            }

            throw $e;
        }
    }

    /**
     * Detect common integrity-violation signatures from SQL errors.
     */
    private function isIntegrityViolationMessage(string $message): bool
    {
        return str_contains($message, 'SQLSTATE[23000]')
            || str_contains($message, 'Integrity constraint violation')
            || str_contains($message, 'foreign key constraint fails')
            || str_contains($message, 'Cannot delete or update a parent row');
    }

    /**
     * Detect common SQLSTATE codes for missing table/column.
     */
    private function isMissingTableOrColumn(QueryException $e): bool
    {
        $code = (string) $e->getCode();
        if ($code === '42S02' || $code === '42S22') {
            return true;
        }

        $message = $e->getMessage();

        return str_contains($message, 'Base table or view not found')
            || str_contains($message, 'Unknown column');
    }
}
