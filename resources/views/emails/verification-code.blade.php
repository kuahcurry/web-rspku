<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 24px;
        }
        .content {
            margin-bottom: 30px;
        }
        .code-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            text-align: center;
            border-radius: 10px;
            margin: 30px 0;
        }
        .code {
            font-size: 42px;
            font-weight: bold;
            color: white;
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
        }
        .info {
            background: #f8f9fa;
            padding: 15px;
            border-left: 4px solid #2563eb;
            margin: 20px 0;
            border-radius: 4px;
        }
        .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
        .warning {
            color: #dc2626;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✉️ Verifikasi Email Anda</h1>
        </div>
        
        <div class="content">
            <p>Halo <strong>{{ $userName }}</strong>,</p>
            
            <p>Terima kasih telah mendaftar di {{ config('app.name') }}. Untuk menyelesaikan pendaftaran, silakan gunakan kode verifikasi berikut:</p>
            
            <div class="code-box">
                <div class="code">{{ $code }}</div>
            </div>
            
            <div class="info">
                <p style="margin: 0;">
                    Kode ini akan <span class="warning">kedaluwarsa dalam 15 menit</span>
                </p>
            </div>
            
            <p>Masukkan kode ini di halaman verifikasi untuk mengaktifkan akun Anda.</p>
            
            <p style="color: #666; font-size: 14px;">
                <strong>Catatan:</strong> Jika Anda tidak melakukan pendaftaran ini, abaikan email ini. Akun tidak akan dibuat tanpa verifikasi.
            </p>
        </div>
        
        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
