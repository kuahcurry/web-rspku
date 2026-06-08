<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PengajuanKredensial extends Model
{
    use HasFactory;

    protected $table = 'pengajuan_kredensial';

    protected $fillable = [
        'user_id',
        'nomor_pengajuan',
        'jenis_kredensial',
        'tipe_pengajuan',
        'surat_permohonan_path',
        'surat_permohonan_name',
        'form_k1_path',
        'form_k1_name',
        'form_k3_path',
        'form_k3_name',
        'formulir_kewenangan_path',
        'formulir_kewenangan_name',
        'logbook_path',
        'logbook_name',
        'hasil_dokumen_path',
        'hasil_dokumen_name',
        'berlaku_sampai',
        'catatan',
        'status',
    ];

    protected $casts = [
        'berlaku_sampai' => 'date',
    ];

    // Accessor helpers
    public function getSuratPermohonanUrlAttribute()
    {
        return $this->surat_permohonan_path ? asset('storage/' . $this->surat_permohonan_path) : null;
    }

    public function getFormK1UrlAttribute()
    {
        return $this->form_k1_path ? asset('storage/' . $this->form_k1_path) : null;
    }

    public function getFormK3UrlAttribute()
    {
        return $this->form_k3_path ? asset('storage/' . $this->form_k3_path) : null;
    }

    public function getSuratPermohonanNameAttribute()
    {
        return $this->surat_permohonan_path ? basename($this->surat_permohonan_path) : null;
    }

    public function getFormK1NameAttribute()
    {
        return $this->form_k1_path ? basename($this->form_k1_path) : null;
    }

    public function getFormK3NameAttribute()
    {
        return $this->form_k3_path ? basename($this->form_k3_path) : null;
    }

    public function getFormulirKewenanganUrlAttribute()
    {
        return $this->formulir_kewenangan_path ? asset('storage/' . $this->formulir_kewenangan_path) : null;
    }

    public function getLogbookUrlAttribute()
    {
        return $this->logbook_path ? asset('storage/' . $this->logbook_path) : null;
    }

    public function getHasilDokumenUrlAttribute()
    {
        return $this->hasil_dokumen_path ? asset('storage/' . $this->hasil_dokumen_path) : null;
    }

    // Relationship to user (applicant)
    public function user()
    {
        return $this->belongsTo(\App\Models\UserRegistration::class, 'user_id');
    }

}
