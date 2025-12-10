# Email Verification Testing Guide

## ✅ Complete Implementation Summary

### Backend
- ✅ Database migration with verification fields
- ✅ Email template with beautiful design
- ✅ Mailable class (`VerificationCodeMail.php`)
- ✅ Registration sends verification code automatically
- ✅ API endpoints:
  - `POST /api/verify-email`
  - `POST /api/resend-verification-code`

### Frontend
- ✅ Verification page (`VerifyEmail.jsx`) with:
  - 6 separate digit inputs with auto-focus
  - 15-minute countdown timer
  - Paste support (Ctrl+V)
  - Auto-submit when all 6 digits entered
  - Resend code button (disabled until timer expires)
  - Beautiful gradient background
  - Mobile responsive
  - Error handling
- ✅ Updated Register.jsx to redirect to verification
- ✅ Route added to App.jsx

## 🧪 Testing the Complete Flow

### Test 1: Full Registration Flow

1. **Start the servers**:
   ```bash
   # Terminal 1: Frontend
   npm run dev

   # Terminal 2: Backend
   php artisan serve
   ```

2. **Register a new user**:
   - Go to: http://localhost:8000/register
   - Fill in all fields with valid data
   - Use a unique email (can be fake like test123@example.com)
   - Click "Daftar"

3. **Check Mailtrap**:
   - Open: https://mailtrap.io/inboxes
   - Login with your credentials
   - You should see the verification email
   - Note the 6-digit code

4. **Verify email**:
   - You should be automatically redirected to `/verify-email`
   - Enter the 6-digit code (or paste it)
   - Watch the auto-submit happen
   - Should show "Email berhasil diverifikasi!" alert
   - Redirects to login page

5. **Login**:
   - Use the NIK and password you registered with
   - Should login successfully!

### Test 2: Code Expiration & Resend

1. **Register another user**
2. **Wait on verification page** (don't enter code)
3. **Watch the timer** count down from 15:00
4. **When timer reaches 0:00**:
   - "Resend Code" button becomes enabled
   - Click "Kirim Ulang Kode"
5. **Check Mailtrap** for new email with new code
6. **Timer resets** to 15:00
7. **Enter the new code** to verify

### Test 3: Invalid Code

1. **Register a user**
2. **On verification page**, enter wrong code: `999999`
3. **Should show error**: "Kode verifikasi tidak valid"
4. **Inputs clear automatically**
5. **Try again with correct code**

### Test 4: Paste Functionality

1. **Register a user**
2. **Copy the code from Mailtrap**: e.g., `123456`
3. **On verification page**:
   - Click on first input
   - Press Ctrl+V (or Cmd+V on Mac)
4. **Code auto-fills all 6 boxes**
5. **Auto-submits immediately**

### Test 5: Direct Navigation (Without Registration)

1. **Go directly to**: http://localhost:8000/verify-email
2. **Should redirect to** `/register` (no email stored)

## 📧 Mailtrap Credentials Check

Your `.env` should have:
```env
MAIL_MAILER=smtp
MAIL_HOST=sandbox.smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=8154cc8d85b726
MAIL_PASSWORD=****3358
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

## 🔍 Debugging

### Check Logs
```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Look for:
# - "Verification email sent"
# - "Failed to send verification email"
```

### Test Email Sending
```bash
php artisan email:test test@example.com
```

### Check Database
```sql
SELECT email, email_verification_code, email_verified_at 
FROM users_registration 
ORDER BY id DESC 
LIMIT 5;
```

## 🎯 API Testing with Postman/Thunder Client

### Register
```http
POST http://localhost:8000/api/register
Content-Type: application/json

{
  "nip": "12345678",
  "nik": "1234567890123456",
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "081234567890",
  "province": "JAWA BARAT",
  "regency": "KOTA BANDUNG",
  "district": "BANDUNG WETAN",
  "village": "CIHAPIT",
  "address": "Jl. Test",
  "password": "password123",
  "confirmPassword": "password123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "data": {
    "user_id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "requires_verification": true
  }
}
```

### Verify Email
```http
POST http://localhost:8000/api/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Email berhasil diverifikasi"
}
```

### Resend Code
```http
POST http://localhost:8000/api/resend-verification-code
Content-Type: application/json

{
  "email": "john@example.com"
}
```

## 🐛 Common Issues & Solutions

### Issue 1: Email not sending
**Solution**: Check `.env` credentials and run:
```bash
php artisan config:clear
php artisan cache:clear
php artisan email:test test@example.com
```

### Issue 2: "User not found" error
**Solution**: Make sure you registered first and using the exact email

### Issue 3: Code expired immediately
**Solution**: Check server time is correct:
```bash
php -r "echo date('Y-m-d H:i:s');"
```

### Issue 4: Can't paste code
**Solution**: Click on first input box, then Ctrl+V

### Issue 5: Auto-submit not working
**Solution**: Make sure all 6 digits are entered

## ✨ Features Summary

### Frontend Features
- ✅ 6 separate input boxes with auto-focus
- ✅ Keyboard navigation (Backspace, Arrow keys)
- ✅ Paste support (Ctrl+V)
- ✅ Auto-submit on completion
- ✅ 15-minute countdown timer
- ✅ Resend button (enables when timer expires)
- ✅ Beautiful gradient design
- ✅ Mobile responsive
- ✅ Loading states
- ✅ Error messages with animation
- ✅ Email display
- ✅ Direct login link

### Backend Features
- ✅ 6-digit random code generation
- ✅ 15-minute expiration
- ✅ Email sending with retry logic
- ✅ Code validation
- ✅ Expiration check
- ✅ Duplicate verification prevention
- ✅ Logging for debugging
- ✅ Clean up after verification

## 📱 Mobile Testing

1. Open on mobile browser
2. Inputs should be large enough to tap
3. Number keyboard should appear (inputMode="numeric")
4. Layout should stack properly
5. Timer should remain visible

## 🚀 Next Steps

### Optional Enhancements
1. Add verification requirement to login (block unverified users)
2. Add rate limiting (max 3 resend requests per hour)
3. Add reCAPTCHA to prevent abuse
4. Show "Check your spam folder" message
5. Add email change functionality

### Production Checklist
- [ ] Replace Mailtrap with real SMTP
- [ ] Update MAIL_FROM_ADDRESS
- [ ] Test with real email addresses
- [ ] Add monitoring for failed emails
- [ ] Set up proper error logging
- [ ] Add email delivery confirmation

## 🎉 Success Indicators

You'll know it's working when:
1. ✅ Registration redirects to verification page
2. ✅ Email appears in Mailtrap inbox within 5 seconds
3. ✅ Code entry auto-submits on 6th digit
4. ✅ Success alert shows and redirects to login
5. ✅ Can login with verified account
6. ✅ Timer counts down correctly
7. ✅ Resend button works when timer expires
