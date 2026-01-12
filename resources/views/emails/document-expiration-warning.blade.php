<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background-color:#F2F4F7;font-family:Arial,Helvetica,sans-serif;color:#1D1E20;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Dokumen {{ $document->jenis_dokumen }} akan berakhir dalam {{ $daysRemaining }} hari.
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F4F7;padding:28px 0;">
        <tr>
            <td align="center" style="padding:0 16px;">
                <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#FFFFFF;border:1px solid #E0E4EA;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="height:4px;background:{{ $urgencyColor }};"></td>
                    </tr>

                    <tr>
                        <td style="padding:18px 22px 14px;border-bottom:1px solid #E0E4EA;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td valign="middle">
                                        <div style="font-size:14px;font-weight:700;color:#1D1E20;letter-spacing:0.2px;">
                                            {{ config('app.name') }}
                                        </div>
                                        <div style="font-size:12px;color:#6E7277;margin-top:2px;">
                                            Peringatan Dokumen Berakhir
                                        </div>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="display:inline-block;padding:6px 10px;border-radius:999px;background-color:{{ $urgencyColor }};color:#FFFFFF;font-size:11px;font-weight:700;letter-spacing:0.4px;">
                                            {{ $urgencyLevel }}
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:22px;">
                            <div style="font-size:14px;line-height:1.7;">
                                <p style="margin:0 0 10px;">Yth. <strong>{{ $userName }}</strong>,</p>
                                <p style="margin:0 0 12px;color:#2F3135;">Salah satu dokumen legalitas Anda akan segera berakhir masa berlakunya.</p>

                                <div style="margin:14px 0 16px;padding:14px 16px;border-left:4px solid {{ $urgencyColor }};background-color:#F8FAFF;border-radius:8px;">
                                    <div style="font-size:12px;color:#6E7277;">Sisa waktu</div>
                                    <div style="font-size:24px;font-weight:800;color:{{ $urgencyColor }};">{{ $daysRemaining }} hari</div>
                                    <div style="font-size:12px;color:#6E7277;">Harap segera memperbarui dokumen Anda.</div>
                                </div>

                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #E0E4EA;border-radius:10px;overflow:hidden;margin-bottom:16px;">
                                    <tr>
                                        <td style="padding:10px 12px;border-bottom:1px solid #E0E4EA;background-color:#FAFAFA;font-size:12px;color:#6E7277;">Jenis Dokumen</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid #E0E4EA;font-size:13px;color:#1D1E20;font-weight:600;">{{ $document->jenis_dokumen }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:10px 12px;border-bottom:1px solid #E0E4EA;background-color:#FAFAFA;font-size:12px;color:#6E7277;">Nomor SK/Dokumen</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid #E0E4EA;font-size:13px;color:#1D1E20;">{{ $document->nomor_sk ?? '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:10px 12px;border-bottom:1px solid #E0E4EA;background-color:#FAFAFA;font-size:12px;color:#6E7277;">Tanggal Mulai</td>
                                        <td style="padding:10px 12px;border-bottom:1px solid #E0E4EA;font-size:13px;color:#1D1E20;">{{ $document->tanggal_mulai ? $document->tanggal_mulai->format('d F Y') : '-' }}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding:10px 12px;background-color:#FAFAFA;font-size:12px;color:#6E7277;">Tanggal Berakhir</td>
                                        <td style="padding:10px 12px;font-size:13px;color:{{ $urgencyColor }};font-weight:700;">{{ $document->tanggal_berlaku ? $document->tanggal_berlaku->format('d F Y') : '-' }}</td>
                                    </tr>
                                </table>

                                <div style="margin:0 0 16px;padding:12px 14px;border:1px solid #F5C26B;border-radius:8px;background-color:#FFFBEB;color:#854D0E;">
                                    <strong>Tindakan yang disarankan:</strong>
                                    <ul style="margin:8px 0 0;padding-left:18px;">
                                        <li>Siapkan dokumen persyaratan perpanjangan</li>
                                        <li>Hubungi instansi terkait untuk proses perpanjangan</li>
                                        <li>Unggah dokumen baru setelah perpanjangan selesai</li>
                                    </ul>
                                </div>

                                <div style="text-align:center;margin:18px 0 8px;">
                                    <a href="{{ env('APP_URL') }}/dokumen-legalitas" style="display:inline-block;background-color:{{ $urgencyColor }};color:#FFFFFF;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;">
                                        Lihat Dokumen Saya
                                    </a>
                                </div>

                                <p style="margin:8px 0 0;color:#6E7277;font-size:12px;">
                                    @if($daysRemaining <= 7)
                                        Peringatan mendesak. Dokumen Anda akan berakhir dalam waktu kurang dari seminggu.
                                    @elseif($daysRemaining <= 14)
                                        Peringatan kedua. Segera persiapkan perpanjangan dokumen Anda.
                                    @else
                                        Peringatan awal. Anda masih memiliki waktu untuk mempersiapkan perpanjangan dokumen.
                                    @endif
                                </p>
                            </div>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:14px 22px;border-top:1px solid #E0E4EA;background-color:#FAFAFA;text-align:center;">
                            <div style="font-size:12px;line-height:1.5;color:#6E7277;">
                                Email ini dikirim otomatis oleh sistem. Mohon tidak membalas email ini.
                            </div>
                        </td>
                    </tr>
                </table>

                <div style="font-size:12px;color:#9CA3AF;margin-top:10px;text-align:center;">
                    (c) {{ date('Y') }} {{ config('app.name') }}. Hak cipta dilindungi.
                </div>
            </td>
        </tr>
    </table>
</body>
</html>