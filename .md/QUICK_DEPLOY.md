# 🚀 QUICK DEPLOYMENT GUIDE

## 🔴 CRITICAL - DO THIS FIRST (5 minutes)

### 1. Update Credentials in `.env`
```bash
# Replace these lines:
DB_PASSWORD=CHANGE_THIS_PASSWORD_IMMEDIATELY
MAIL_USERNAME=CHANGE_THIS_EMAIL@gmail.com
MAIL_PASSWORD=GENERATE_NEW_APP_PASSWORD
MAIL_FROM_ADDRESS="CHANGE_THIS_EMAIL@gmail.com"
```

### 2. Update Domain (Find & Replace)
```bash
# Replace all instances of 'yourdomain.com' with your actual domain
APP_URL=https://your-actual-domain.com
SESSION_DOMAIN=.your-actual-domain.com
SANCTUM_STATEFUL_DOMAINS=your-actual-domain.com
CORS_ALLOWED_ORIGINS=https://your-actual-domain.com
```

---

## 📦 DEPLOYMENT COMMANDS (2 minutes)

```bash
# 1. Upload files to server
# 2. SSH into server
# 3. Run these commands:

cd /path/to/your/app

# Install dependencies
composer install --no-dev --optimize-autoloader
npm install
npm run build

# Run migrations
php artisan migrate --force

# Create storage link
php artisan storage:link

# Cache everything
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Fix permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

---

## ✅ VERIFY DEPLOYMENT (3 minutes)

### 1. Check HTTPS Redirect
```bash
curl -I http://your-domain.com
# Should redirect to https://
```

### 2. Check API Health
```bash
curl https://your-domain.com/up
# Should return: healthy
```

### 3. Test Login Rate Limit
Try logging in with wrong password 6 times.
→ Should be blocked after 5 attempts

### 4. Check Security Headers
```bash
curl -I https://your-domain.com/api/me
# Should show: X-Frame-Options, X-Content-Type-Options, etc.
```

---

## 🎯 WHAT'S PROTECTED

✅ Brute force attacks (rate limiting)  
✅ SQL injection (Eloquent ORM)  
✅ XSS attacks (React + CSP)  
✅ CSRF attacks (Laravel tokens)  
✅ Clickjacking (X-Frame-Options)  
✅ MIME sniffing (X-Content-Type-Options)  
✅ Man-in-the-middle (HTTPS + HSTS)  
✅ Unauthorized access (JWT auth)  
✅ File upload attacks (validation)  
✅ API quota abuse (authentication required)

---

## 📞 EMERGENCY ROLLBACK

If something breaks:

```bash
# 1. Switch back to local environment
APP_ENV=local
APP_DEBUG=true

# 2. Clear caches
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan cache:clear

# 3. Check logs
tail -f storage/logs/laravel.log
```

---

## 📚 FULL DOCUMENTATION

- [SECURITY_SUMMARY.md](SECURITY_SUMMARY.md) - Complete overview
- [SECURITY_DEPLOYMENT.md](SECURITY_DEPLOYMENT.md) - Detailed checklist
- [.env.INSTRUCTIONS](.env.INSTRUCTIONS) - Credential setup

---

**Estimated Total Time:** 10 minutes  
**Difficulty:** Easy  
**Your app is ready to deploy! 🎉**
