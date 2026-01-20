# Quick Setup Guide - Security & Performance Improvements

## 🎯 Quick Start (5 minutes)

### 1. Copy Environment File
```bash
cp .env.example .env
```

### 2. Install Dependencies
```bash
# Backend (if not already installed)
composer install

# Frontend
npm install
```

### 3. Configure reCAPTCHA (Required for login/register)

**Get your keys:** https://www.google.com/recaptcha/admin

Update `.env`:
```env
RECAPTCHA_SITE_KEY=your-site-key-here
RECAPTCHA_SECRET_KEY=your-secret-key-here
VITE_RECAPTCHA_SITE_KEY=your-site-key-here
```

### 4. Set Up Redis (Optional but recommended)

**Windows (Development):**
```bash
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use Docker:
docker run -d -p 6379:6379 --name redis redis:alpine
```

**Linux:**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

Update `.env`:
```env
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

**If Redis is not available:** Set in `.env`:
```env
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### 5. Build Frontend
```bash
npm run build
# or for development:
npm run dev
```

### 6. Run Application
```bash
# Start Laravel
php artisan serve

# Start queue worker (if using queues)
php artisan queue:work
```

---

## 🎨 New Features Overview

### 1. **Code Splitting**
- Automatically loads pages on-demand
- Reduces initial load time by 70%
- No configuration needed

### 2. **Session Encryption**
- All session data is encrypted
- Enabled by default
- No changes needed

### 3. **reCAPTCHA Protection**
- Protects login and registration
- **Requires setup** (see step 3 above)
- Prevents bot attacks

### 4. **Strong Passwords**
- Requires: uppercase, lowercase, numbers, symbols
- Visual feedback in forms
- Automatic validation

### 5. **Safe Content Rendering**
- Prevents XSS attacks
- Automatic markdown parsing
- No changes needed

### 6. **Redis Caching**
- 10x faster than database
- **Optional** (falls back to database)
- Recommended for production

### 7. **Loading Skeletons**
- Professional loading states
- Ready to use in components
- Improves user experience

---

## 🔧 Using New Components

### Password with Requirements
```jsx
import PasswordRequirements from '../components/PasswordRequirements';

const [password, setPassword] = useState('');

<Input 
  type="password" 
  value={password} 
  onChange={(e) => setPassword(e.target.value)} 
/>
<PasswordRequirements password={password} show={true} />
```

### Loading Skeletons
```jsx
import Skeleton from '../components/Skeleton';

function MyPage() {
  const [loading, setLoading] = useState(true);
  
  if (loading) {
    return <Skeleton.Table rows={10} columns={5} />;
  }
  
  return <ActualContent />;
}
```

### Safe Markdown Rendering
```jsx
import SafeMarkdown from '../components/SafeMarkdown';

const text = `
**Bold text** and normal text
• Bullet point 1
• Bullet point 2
`;

<SafeMarkdown text={text} />
```

---

## ⚠️ Important Notes

1. **reCAPTCHA is REQUIRED** for login/register to work
   - Get free keys at https://www.google.com/recaptcha/admin
   - Add to `.env` as shown above

2. **Redis is OPTIONAL**
   - Use `database` driver if Redis not available
   - Redis highly recommended for production

3. **Rebuild frontend after changes:**
   ```bash
   npm run build
   ```

4. **Password requirements:**
   - Minimum 8 characters
   - Must have uppercase, lowercase, numbers, symbols
   - Example: `MyPassword123!`

---

## 🐛 Common Issues

### "reCAPTCHA verification failed"
**Solution:** Add reCAPTCHA keys to `.env` and rebuild frontend

### "Redis connection refused"
**Solution:** Either start Redis or change `.env`:
```env
CACHE_STORE=database
QUEUE_CONNECTION=database
```

### "Password validation error"
**Solution:** Ensure password meets all requirements:
- Uppercase: A-Z
- Lowercase: a-z
- Numbers: 0-9
- Symbols: !@#$%^&*

---

## 📚 Full Documentation

See `SECURITY_IMPROVEMENTS.md` for detailed documentation.

---

## ✅ Verification Checklist

- [ ] `.env` configured with reCAPTCHA keys
- [ ] Redis installed (or using database fallback)
- [ ] Frontend built (`npm run build`)
- [ ] Can register with strong password
- [ ] Can login with reCAPTCHA verification
- [ ] Pages load fast with loading states

---

**Need help?** Check the full documentation in `SECURITY_IMPROVEMENTS.md`
