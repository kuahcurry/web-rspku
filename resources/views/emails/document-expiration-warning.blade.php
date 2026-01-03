<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Peringatan Dokumen Berakhir</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, {{ $urgencyColor }} 0%, {{ $urgencyColor }}dd 100%);
            padding: 30px 20px;
            text-align: center;
            color: #ffffff;
        }
        .header img {
            width: 80px;
            height: auto;
            margin-bottom: 15px;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header .urgency-badge {
            display: inline-block;
            background-color: rgba(255, 255, 255, 0.3);
            padding: 8px 20px;
            border-radius: 20px;
            margin-top: 10px;
            font-size: 14px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .warning-box {
            background-color: {{ $urgencyColor }}15;
            border-left: 4px solid {{ $urgencyColor }};
            padding: 20px;
            margin: 25px 0;
            border-radius: 4px;
        }
        .warning-box h2 {
            margin: 0 0 15px 0;
            color: {{ $urgencyColor }};
            font-size: 20px;
        }
        .warning-box .countdown {
            font-size: 36px;
            font-weight: 700;
            color: {{ $urgencyColor }};
            margin: 15px 0;
        }
        .document-details {
            background-color: #f8f9fa;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .document-details table {
            width: 100%;
            border-collapse: collapse;
        }
        .document-details td {
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }
        .document-details td:first-child {
            font-weight: 600;
            color: #555;
            width: 40%;
        }
        .document-details td:last-child {
            color: #333;
        }
        .document-details tr:last-child td {
            border-bottom: none;
        }
        .action-required {
            background-color: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 6px;
            padding: 20px;
            margin: 25px 0;
        }
        .action-required h3 {
            margin: 0 0 15px 0;
            color: #856404;
            font-size: 18px;
        }
        .action-required ul {
            margin: 0;
            padding-left: 20px;
            color: #856404;
        }
        .action-required li {
            margin: 8px 0;
        }
        .cta-button {
            display: inline-block;
            background-color: {{ $urgencyColor }};
            color: #ffffff;
            padding: 14px 35px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
            transition: opacity 0.3s;
        }
        .cta-button:hover {
            opacity: 0.9;
        }
        .footer {
            background-color: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e0e0e0;
        }
        .footer p {
            margin: 8px 0;
        }
        .footer .small-text {
            font-size: 12px;
            color: #999;
            margin-top: 15px;
        }
        .icon {
            display: inline-block;
            width: 24px;
            height: 24px;
            margin-right: 8px;
            vertical-align: middle;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="header">
            <img src="https://i.ibb.co.com/vCXfmN5b/GOMBONG.png" alt="Logo PKU">
            <h1>⚠️ Peringatan Dokumen Berakhir</h1>
            <div class="urgency-badge">{{ $urgencyLevel }}</div>
        </div>

        <!-- Content -->
        <div class="content">
            <div class="greeting">
                Yth. <strong>{{ $userName }}</strong>,
            </div>

            <p style="line-height: 1.6; color: #555;">
                Kami ingin mengingatkan Anda bahwa salah satu dokumen legalitas Anda akan segera berakhir masa berlakunya.
            </p>

            <!-- Warning Box -->
            <div class="warning-box">
                <h2>🔔 Dokumen Akan Berakhir</h2>
                <div class="countdown">{{ $daysRemaining }} HARI LAGI</div>
                <p style="margin: 0; font-size: 16px; color: #666;">
                    Harap segera mengambil tindakan untuk memperbarui dokumen Anda.
                </p>
            </div>

            <!-- Document Details -->
            <div class="document-details">
                <table>
                    <tr>
                        <td>Jenis Dokumen</td>
                        <td><strong>{{ $document->jenis_dokumen }}</strong></td>
                    </tr>
                    <tr>
                        <td>Nomor SK/Dokumen</td>
                        <td>{{ $document->nomor_sk ?? '-' }}</td>
                    </tr>
                    <tr>
                        <td>Tanggal Mulai</td>
                        <td>{{ $document->tanggal_mulai ? $document->tanggal_mulai->format('d F Y') : '-' }}</td>
                    </tr>
                    <tr>
                        <td>Tanggal Berakhir</td>
                        <td><strong style="color: {{ $urgencyColor }};">{{ $document->tanggal_berlaku ? $document->tanggal_berlaku->format('d F Y') : '-' }}</strong></td>
                    </tr>
                </table>
            </div>

            <!-- Action Required -->
            <div class="action-required">
                <h3>📋 Tindakan yang Perlu Dilakukan:</h3>
                <ul>
                    <li>Siapkan dokumen persyaratan perpanjangan</li>
                    <li>Hubungi instansi terkait untuk proses perpanjangan</li>
                    <li>Lengkapi formulir perpanjangan yang diperlukan</li>
                    <li>Upload dokumen baru setelah perpanjangan selesai</li>
                </ul>
            </div>

            <center>
                <a href="{{ env('APP_URL') }}/dokumen-legalitas" class="cta-button">
                    Lihat Dokumen Saya
                </a>
            </center>

            <p style="line-height: 1.6; color: #666; margin-top: 30px; font-size: 14px;">
                <strong>Catatan Penting:</strong><br>
                @if($daysRemaining <= 7)
                    ⚠️ Ini adalah <strong style="color: #dc3545;">peringatan MENDESAK</strong>. Dokumen Anda akan berakhir dalam waktu kurang dari seminggu. Harap segera mengambil tindakan!
                @elseif($daysRemaining <= 14)
                    ⚠️ Ini adalah <strong style="color: #fd7e14;">peringatan kedua</strong>. Segera persiapkan perpanjangan dokumen Anda.
                @else
                    ℹ️ Ini adalah <strong style="color: #ffc107;">peringatan awal</strong>. Anda masih memiliki waktu untuk mempersiapkan perpanjangan dokumen.
                @endif
            </p>

            @if($daysRemaining > 7)
            <p style="line-height: 1.6; color: #666; font-size: 14px;">
                Anda akan menerima email pengingat berikutnya pada:
                <ul style="color: #666;">
                    @if($daysRemaining > 14)
                        <li>14 hari sebelum berakhir</li>
                    @endif
                    @if($daysRemaining > 7)
                        <li>7 hari sebelum berakhir</li>
                    @endif
                </ul>
            </p>
            @endif
        </div>

        <!-- Footer -->
        <div class="footer">
            <p><strong>Komite Keperawatan PKU</strong></p>
            <p>RS PKU Muhammadiyah Gombong</p>
            <p style="margin-top: 15px;">
                Email: info@rsukgombong.com<br>
                Telepon: (0287) 472130
            </p>
            <div class="small-text">
                <p>Email ini dikirim secara otomatis oleh sistem. Harap tidak membalas email ini.</p>
                <p>Jika Anda memiliki pertanyaan, silakan hubungi administrator sistem.</p>
                <p style="margin-top: 15px;">© {{ date('Y') }} Komite Keperawatan PKU. All rights reserved.</p>
            </div>
        </div>
    </div>
</body>
</html>
