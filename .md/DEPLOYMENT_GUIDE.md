# Production Deployment Guide

## Server Information
- **Host:** 145.223.108.68
- **Port:** 65002
- **User:** u814122097
- **Path:** `/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod`

---

## Quick Deployment (Standard Process)

### 1. Build the Application
```powershell
cd "c:\Projects\Website\web prod ready\web-deploy"
npm run build
```

### 2. Upload Build Files
```powershell
scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/
```

### 3. Clear Laravel Cache (Recommended)
```powershell
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear && php artisan config:clear && php artisan view:clear"
```

---

## SCP Command Reference

### Upload Entire Build Directory
```powershell
scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/
```

### Upload Single File
```powershell
scp -P 65002 public/build/manifest.json u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/
```

### Upload Specific Directory
```powershell
scp -P 65002 -r public/build/assets u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/
```

**Command Breakdown:**
- `scp` - Secure Copy Protocol
- `-P 65002` - Port number (uppercase P)
- `-r` - Recursive (for directories)
- `source` - Local path
- `user@host:destination` - Remote server and path

---

## SSH Commands

### Connect to Server
```powershell
ssh -p 65002 u814122097@145.223.108.68
```

### Execute Command Without Connecting
```powershell
ssh -p 65002 u814122097@145.223.108.68 "command here"
```

### List Files on Server
```powershell
ssh -p 65002 u814122097@145.223.108.68 "ls -lh /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/"
```

---

## Complete Deployment Workflow

### Standard Deployment
```powershell
# 1. Build locally
npm run build

# 2. Upload to server
scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/

# 3. Clear cache
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear && php artisan config:clear && php artisan view:clear"
```

### One-Line Deployment
```powershell
npm run build && scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/
```

---

## Safety: Backup Before Deployment

### Create Backup
```powershell
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public && cp -r build build_backup_$(date +%Y%m%d_%H%M%S)"
```

### Restore from Backup
```powershell
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public && rm -rf build && cp -r build_backup_YYYYMMDD_HHMMSS build"
```

### List Backups
```powershell
ssh -p 65002 u814122097@145.223.108.68 "ls -lh /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/ | grep build_backup"
```

---

## Advanced: SSH Config Setup (Optional)

To avoid typing the full server details every time:

### 1. Create/Edit SSH Config
```powershell
# On Windows, edit: C:\Users\YourUsername\.ssh\config
# On Linux/Mac: ~/.ssh/config
```

### 2. Add Server Configuration
```
Host keperawatan
    HostName 145.223.108.68
    Port 65002
    User u814122097
```

### 3. Use Short Commands
```powershell
# Upload with alias
scp -r public/build keperawatan:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/

# SSH with alias
ssh keperawatan

# Execute command
ssh keperawatan "ls -lh /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/"
```

---

## Laravel Artisan Commands

### Clear All Cache
```powershell
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear && php artisan config:clear && php artisan view:clear && php artisan route:clear"
```

### Individual Cache Commands
```powershell
# Clear application cache
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear"

# Clear configuration cache
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan config:clear"

# Clear view cache
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan view:clear"

# Clear route cache
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan route:clear"
```

### Optimize for Production
```powershell
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan config:cache && php artisan route:cache && php artisan view:cache"
```

---

## Troubleshooting

### Verify Upload Success
```powershell
ssh -p 65002 u814122097@145.223.108.68 "ls -lhR /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/"
```

### Check File Permissions
```powershell
ssh -p 65002 u814122097@145.223.108.68 "ls -la /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/"
```

### Fix Permissions (if needed)
```powershell
ssh -p 65002 u814122097@145.223.108.68 "chmod -R 755 /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build"
```

### Check Disk Space
```powershell
ssh -p 65002 u814122097@145.223.108.68 "df -h"
```

### View Laravel Logs
```powershell
ssh -p 65002 u814122097@145.223.108.68 "tail -n 50 /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/storage/logs/laravel.log"
```

---

## Common Deployment Scenarios

### Frontend Changes Only (React/JS/CSS)
```powershell
npm run build
scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/
```

### Backend Changes (Laravel/PHP)
```powershell
# Upload specific PHP files
scp -P 65002 app/Http/Controllers/YourController.php u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/app/Http/Controllers/

# Clear cache after backend changes
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear && php artisan config:clear"
```

### Database Migrations
```powershell
# Upload migration file
scp -P 65002 database/migrations/new_migration.php u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/database/migrations/

# Run migrations
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan migrate"
```

### Full Application Deployment
```powershell
# 1. Build frontend
npm run build

# 2. Upload build
scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/

# 3. Upload backend changes (if any)
scp -P 65002 -r app routes config u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/

# 4. Run migrations (if needed)
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan migrate"

# 5. Clear all caches
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear && php artisan config:clear && php artisan view:clear && php artisan route:clear"

# 6. Optimize for production
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan config:cache && php artisan route:cache && php artisan view:cache"
```

---

## Best Practices

1. **Always build before uploading**
   - Ensure `npm run build` completes without errors
   - Check build size warnings

2. **Test locally first**
   - Run `npm run dev` and test changes
   - Fix any console errors before building

3. **Backup before major changes**
   - Create backup of current build
   - Note the timestamp for easy recovery

4. **Clear cache after deployment**
   - Laravel caches can cause old code to run
   - Always clear after backend changes

5. **Verify deployment**
   - Check the live site after uploading
   - Test critical functionality
   - Check browser console for errors

6. **Monitor logs**
   - Check Laravel logs after deployment
   - Watch for any PHP errors

---

## Emergency Rollback

If something goes wrong after deployment:

```powershell
# 1. Stop - don't make it worse
# 2. Restore from backup
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public && rm -rf build && cp -r build_backup_YYYYMMDD_HHMMSS build"

# 3. Clear cache
ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear && php artisan config:clear && php artisan view:clear"

# 4. Verify rollback worked
# 5. Fix the issue locally
# 6. Test thoroughly
# 7. Deploy again
```

---

## Quick Reference

| Action | Command |
|--------|---------|
| Build | `npm run build` |
| Upload | `scp -P 65002 -r public/build u814122097@145.223.108.68:/home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/` |
| Connect | `ssh -p 65002 u814122097@145.223.108.68` |
| Clear Cache | `ssh -p 65002 u814122097@145.223.108.68 "cd /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod && php artisan cache:clear"` |
| List Files | `ssh -p 65002 u814122097@145.223.108.68 "ls -lh /home/u814122097/domains/keperawatanpkugombong.com/web-rspkuprod/public/build/"` |

---

## Notes

- **Password Required:** You'll be prompted for password on each SCP/SSH command
- **Port 65002:** Always use `-p 65002` for SSH and `-P 65002` for SCP (note the case difference)
- **Build Files:** Only upload `public/build` directory for frontend changes
- **Backend Changes:** Require separate upload of PHP files and cache clearing

---

**Last Updated:** January 19, 2026
**Project:** RS PKU Gombong - Web Application
**Environment:** Production
