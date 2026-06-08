<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\PengajuanKredensial;

class PengajuanKredensialController extends Controller
{
    // List all pengajuan (admin view)
    public function index(Request $request)
    {
        $q = PengajuanKredensial::query();

        // optional filtering by status
        if ($request->has('status')) {
            $q->where('status', $request->get('status'));
        }

        $data = $q->orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'user_id' => $item->user_id,
                'jenis_kredensial' => $item->jenis_kredensial,
                'surat_permohonan_path' => $item->surat_permohonan_path,
                'surat_permohonan_url' => $item->surat_permohonan_url,
                'surat_permohonan_name' => $item->surat_permohonan_name,
                'form_k1_path' => $item->form_k1_path,
                'form_k1_url' => $item->form_k1_url,
                'form_k1_name' => $item->form_k1_name,
                'form_k3_path' => $item->form_k3_path,
                'form_k3_url' => $item->form_k3_url,
                'form_k3_name' => $item->form_k3_name,
                'catatan' => $item->catatan,
                'status' => $item->status,
                'created_at' => $item->created_at?->toDateTimeString(),
                'updated_at' => $item->updated_at?->toDateTimeString(),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // List pengajuan for authenticated user
    public function indexUser(Request $request)
    {
        $user = $request->user();
        if (! $user) {
            return response()->json(['success' => false, 'message' => 'Unauthorized'], 401);
        }

        $q = PengajuanKredensial::where('user_id', $user->id);

        $data = $q->orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'jenis_kredensial' => $item->jenis_kredensial,
                'surat_permohonan_path' => $item->surat_permohonan_path,
                'surat_permohonan_url' => $item->surat_permohonan_url,
                'surat_permohonan_name' => $item->surat_permohonan_name,
                'form_k1_path' => $item->form_k1_path,
                'form_k1_url' => $item->form_k1_url,
                'form_k1_name' => $item->form_k1_name,
                'form_k3_path' => $item->form_k3_path,
                'form_k3_url' => $item->form_k3_url,
                'form_k3_name' => $item->form_k3_name,
                'catatan' => $item->catatan,
                'status' => $item->status,
                'created_at' => $item->created_at?->toDateTimeString(),
                'updated_at' => $item->updated_at?->toDateTimeString(),
            ];
        });

        return response()->json(['success' => true, 'data' => $data]);
    }

    // Show single pengajuan
    public function show($id)
    {
        $item = PengajuanKredensial::find($id);
        if (! $item) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        return response()->json(['success' => true, 'data' => [
            'id' => $item->id,
            'user_id' => $item->user_id,
            'jenis_kredensial' => $item->jenis_kredensial,
            'surat_permohonan_path' => $item->surat_permohonan_path,
            'surat_permohonan_url' => $item->surat_permohonan_url,
            'surat_permohonan_name' => $item->surat_permohonan_name,
            'form_k1_path' => $item->form_k1_path,
            'form_k1_url' => $item->form_k1_url,
            'form_k1_name' => $item->form_k1_name,
            'form_k3_path' => $item->form_k3_path,
            'form_k3_url' => $item->form_k3_url,
            'form_k3_name' => $item->form_k3_name,
            'catatan' => $item->catatan,
            'status' => $item->status,
            'created_at' => $item->created_at?->toDateTimeString(),
            'updated_at' => $item->updated_at?->toDateTimeString(),
        ]]);
    }

    // Store new pengajuan (user upload)
    public function store(Request $request)
    {
        $request->validate([
            'jenis_kredensial' => 'required|string',
            'surat_permohonan' => 'nullable|file',
            'form_k1' => 'nullable|file',
            'form_k3' => 'nullable|file',
        ]);

        $data = $request->only(['jenis_kredensial']);

        // handle uploads
        if ($request->hasFile('surat_permohonan')) {
            $path = $request->file('surat_permohonan')->store('pengajuan_kredensial', 'public');
            $data['surat_permohonan_path'] = $path;
        }
        if ($request->hasFile('form_k1')) {
            $path = $request->file('form_k1')->store('pengajuan_kredensial', 'public');
            $data['form_k1_path'] = $path;
        }
        if ($request->hasFile('form_k3')) {
            $path = $request->file('form_k3')->store('pengajuan_kredensial', 'public');
            $data['form_k3_path'] = $path;
        }

        // attach user if available via guard
        if ($request->user()) {
            $data['user_id'] = $request->user()->id;
        }

        $item = PengajuanKredensial::create($data);

        return response()->json(['success' => true, 'data' => $item], 201);
    }

    // Update catatan or status (admin)
    public function update(Request $request, $id)
    {
        $item = PengajuanKredensial::find($id);
        if (! $item) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $request->validate([
            'catatan' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        if ($request->has('catatan')) {
            $item->catatan = $request->get('catatan');
        }
        if ($request->has('status')) {
            $item->status = $request->get('status');
        }

        $item->save();

        return response()->json(['success' => true, 'data' => $item]);
    }
}
