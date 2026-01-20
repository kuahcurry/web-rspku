# Production Deployment Steps

## Critical Issues Fixed

### 1. Profile Edit Redirect Issue ✅
**Problem:** Users were redirected to login when editing profile  
**Root Cause:** JWT authentication token handling  
**Solution:** Enhanced authentication middleware and proper token refresh

### 2. Profile Picture URLs ✅
**Problem:** Profile pictures not loading correctly  
**Root Cause:** Relative paths instead of absolute URLs  
**Solution:** Updated ProfileController to return full URLs: `https://keperawatanpkugombong.com/storage/{path}`

### 3. Document Viewing/Downloading ✅
**Problem:** PDFs corrupted or not accessible  
**Root Cause:** Missing download routes and storage symlink issues  
**Solution:** 
- Added download routes for all document types
- Created proper download methods in controllers
- Ensured proper Content-Type headers

## Required Actions on Production Server

### 1. **CRITICAL: Relink Storage Symbolic Link**
```bash
cd /path/to/web-deploy
php artisan storage:link
```
This creates: `public/storage` → `storage/app/public`

**Verify the link exists:**
```bash
ls -la public/storage
```
You should see a symlink pointing to `../../storage/app/public`

### 2. Verify .env Configuration
Ensure your `.env` file has:
```env
APP_URL=https://keperawatanpkugombong.com
FILESYSTEM_DISK=public
```

### 3. Clear Caches
```bash
php artisan config:clear
php artisan cache:clear
php artisan route:clear
```

### 4. Set Proper Permissions
```bash
chmod -R 775 storage
chmod -R 775 bootstrap/cache
chown -R www-data:www-data storage
chown -R www-data:www-data bootstrap/cache
```

### 5. Test File Access
Create test file:
```bash
touch storage/app/public/test.txt
```

Try accessing:
`https://keperawatanpkugombong.com/storage/test.txt`

If it works, the symlink is correct!

## Changes Made

### Routes Added (routes/api.php)
- `/api/dokumen-legalitas/{id}/download`
- `/api/penugasan/{id}/download`
- `/api/etik-disiplin/{id}/download`
- `/api/kredensial/{id}/download`

### Controllers Updated
1. **ProfileController.php**
   - Fixed `uploadProfilePicture()` to return full URLs
   - Fixed `getProfilePicture()` to return full URLs

2. **DokumenLegalitasController.php**
   - Added `download()` method

3. **PenugasanController.php**
   - Added `download()` method

4. **EtikDisiplinController.php**
   - Added `download()` method

5. **KredensialController.php**
   - Added `download()` method

## URL Structure

### User Domain
- **Main:** https://keperawatanpkugombong.com
- **Login:** https://keperawatanpkugombong.com/login
- **Storage:** https://keperawatanpkugombong.com/storage/

### Admin Domain
- **Main:** https://komite.keperawatanpkugombong.com
- **Login:** https://komite.keperawatanpkugombong.com/login (auto-detects admin)
- **Dashboard:** https://komite.keperawatanpkugombong.com/dashboard

## File Storage Structure
```
storage/app/public/
├── {Nama}_{NIK}/
│   ├── profile_timestamp.jpg         (Profile pictures)
│   ├── dokumenLegalitas/             (Legal documents)
│   ├── penugasan/                    (Assignment docs)
│   ├── etik-disiplin/                (Ethics docs)
│   └── kredensial/                   (Credential docs)
```

Accessible via:
`https://keperawatanpkugombong.com/storage/{Nama}_{NIK}/...`

## Testing Checklist

### Profile Features
- [ ] Login as user
- [ ] Edit profile information
- [ ] Upload profile picture
- [ ] View profile picture on beranda
- [ ] Edit profile from pengaturan page

### Document Features
- [ ] Upload document in dokumen legalitas
- [ ] View PDF inline (click eye icon)
- [ ] Download PDF (click download icon)
- [ ] Repeat for penugasan, etik-disiplin, kredensial

### Admin Features
- [ ] Login at komite.keperawatanpkugombong.com
- [ ] Access dashboard
- [ ] Navigate to etik-disiplin page
- [ ] Use PDF tools

## Troubleshooting

### Profile Pictures Not Showing
1. Check storage link exists: `ls -la public/storage`
2. Check file exists: `ls storage/app/public/{Nama}_{NIK}/`
3. Check URL format: Should be `https://keperawatanpkugombong.com/storage/...`
4. Check browser console for 404 errors

### PDFs Corrupted/Can't Download
1. Check file exists: `ls storage/app/public/{Nama}_{NIK}/dokumenLegalitas/`
2. Try direct URL: `https://keperawatanpkugombong.com/storage/{path}`
3. Check file permissions: `ls -la storage/app/public/`
4. Check PHP built-in server is serving static files

### Profile Edit Redirects to Login
1. Check JWT token in localStorage: Open DevTools > Application > Local Storage
2. Check token expiry: `token_expires_at` should be future timestamp
3. Check API response: Network tab > /api/profile > Check status code
4. If 401: Token expired or invalid
5. If 500: Server error, check Laravel logs

### For PHP Built-in Server
If using `php artisan serve`:
```bash
# Make sure to run from project root
cd /path/to/web-deploy
php artisan serve --host=0.0.0.0 --port=8000
```

**Note:** For production, consider using Nginx or Apache instead of PHP built-in server for better performance and security.

## Support
If issues persist after following these steps, check:
1. Laravel logs: `storage/logs/laravel.log`
2. Browser console (F12)
3. Network tab in DevTools
4. PHP error logs
