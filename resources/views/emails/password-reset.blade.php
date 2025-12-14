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
            color: #0D9488;
            margin: 0;
            font-size: 24px;
        }
        .logo {
            font-size: 32px;
            margin-bottom: 10px;
        }
        .content {
            margin-bottom: 30px;
        }
        .code-box {
            background: linear-gradient(135deg, #DC2626 0%, #991B1B 100%);
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
            background: #FEF2F2;
            padding: 15px;
            border-left: 4px solid #DC2626;
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
        .security-notice {
            background: #FFFBEB;
            border: 1px solid #F59E0B;
            padding: 15px;
            border-radius: 8px;
            margin-top: 20px;
        }
        .security-notice h4 {
            color: #B45309;
            margin: 0 0 10px 0;
            font-size: 14px;
        }
        .security-notice p {
            margin: 0;
            font-size: 13px;
            color: #92400E;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <img src="https://i.ibb.co.com/vCXfmN5b/GOMBONG.png" alt="Logo PKU" style="width: 80px; height: auto; margin-bottom: 10px;">
            <h1>{{ config('app.name') }}</h1>
            <p style="color: #666; margin-top: 5px;">Reset Password</p>
        </div>
        
        <div class="content">
            <p>Halo <strong>{{ $userName }}</strong>,</p>
            
            <p>Kami menerima permintaan untuk mereset password akun Anda. Gunakan kode berikut untuk melanjutkan:</p>
            
            <div class="code-box">
                <div class="code">{{ $code }}</div>
            </div>
            
            <div class="info">
                <p style="margin: 0;">
                    ⏰ Kode ini akan <span class="warning">kedaluwarsa dalam 15 menit</span>
                </p>
            </div>
            
            <p>Masukkan kode ini di halaman reset password untuk membuat password baru.</p>
            
            <div class="security-notice">
                <h4>🔒 Peringatan Keamanan</h4>
                <p>Jika Anda tidak meminta reset password ini, abaikan email ini dan pastikan akun Anda aman. Password Anda tidak akan berubah tanpa memasukkan kode di atas.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Email ini dikirim secara otomatis, mohon tidak membalas.</p>
            <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
