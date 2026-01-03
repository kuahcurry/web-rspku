<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
</head>
<body style="margin:0;padding:0;background-color:#F2F4F7;font-family:Arial,Helvetica,sans-serif;color:#1D1E20;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
        Kode OTP reset password untuk {{ config('app.name') }} (berlaku 15 menit).
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F2F4F7;padding:28px 0;">
        <tr>
            <td align="center" style="padding:0 16px;">
                <table role="presentation" width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;background-color:#FFFFFF;border:1px solid #E0E4EA;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.06);">
                    <tr>
                        <td style="height:4px;background:linear-gradient(135deg,#2929C3 0%,#00A8E8 100%);"></td>
                    </tr>

                    <tr>
                        <td style="padding:18px 22px 14px;border-bottom:1px solid #E0E4EA;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td valign="middle">
                                        <div style="font-size:14px;font-weight:700;color:#2929C3;letter-spacing:0.2px;">
                                            {{ config('app.name') }}
                                        </div>
                                        <div style="font-size:12px;color:#6E7277;margin-top:2px;">
                                            Reset Password
                                        </div>
                                    </td>
                                    <td align="right" valign="middle">
                                        <span style="display:inline-block;padding:6px 10px;border-radius:8px;background-color:#E7E9FF;color:#2020A0;font-size:11px;font-weight:700;letter-spacing:0.4px;">
                                            OTP - 15 MENIT
                                        </span>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:22px;">
                            <div style="font-size:14px;line-height:1.7;">
                                <p style="margin:0 0 10px;">Halo <strong>{{ $userName ?? 'Rekan' }}</strong>,</p>
                                <p style="margin:0 0 12px;color:#2F3135;">Kami menerima permintaan untuk mereset password akun Anda.</p>
                                <p style="margin:0 0 12px;color:#6E7277;">Gunakan kode OTP di bawah ini dan selesaikan proses reset dalam <strong style="color:#1D1E20;">15 menit</strong>.</p>

                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:16px 0 18px;">
                                    <tr>
                                        <td align="center" style="padding:16px;border:1px dashed #2929C3;border-radius:10px;background-color:#F8FAFF;">
                                            <div style="font-size:28px;font-weight:800;letter-spacing:8px;color:#2020A0;font-family:'Courier New',monospace;">
                                                {{ $code }}
                                            </div>
                                        </td>
                                    </tr>
                                </table>

                                <div style="margin:0 0 14px;padding:12px 14px;border-left:4px solid #F59E0B;background-color:#FFFBEB;border-radius:6px;color:#854D0E;">
                                    Jika Anda tidak meminta reset password, abaikan email ini dan akun Anda tetap aman.
                                </div>

                                <p style="margin:0;color:#2F3135;">Terima kasih,<br><strong>Tim {{ config('app.name') }}</strong></p>
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