# 📧 Document Expiration Warning System

## Overview
Automated email notification system that warns users about expiring legal documents at three critical stages: 30 days, 14 days, and 7 days before expiration.

---

## 🎯 Features

### 1. **Three-Stage Warning System**
- **30 Days Before** - Early warning (Yellow alert)
- **14 Days Before** - Medium warning (Orange alert)
- **7 Days Before** - Urgent warning (Red alert)

### 2. **Smart Tracking**
- Prevents duplicate emails
- Tracks when each warning was sent
- Automatic daily checks at 8:00 AM (Asia/Jakarta timezone)

### 3. **Professional Email Templates**
- Color-coded urgency levels
- Detailed document information
- Action items checklist
- Responsive design

### 4. **Comprehensive Logging**
- All sent emails are logged
- Error tracking
- Audit trail for compliance

---

## 📁 Files Created/Modified

### New Files
1. **Migration**: `database/migrations/2026_01_04_000001_add_warning_tracking_to_dokumen_legalitas.php`
   - Adds tracking fields for sent warnings
   - Adds index for efficient queries

2. **Mail Class**: `app/Mail/DocumentExpirationWarning.php`
   - Handles email generation
   - Dynamic subject lines
   - Color-coded urgency

3. **Email Template**: `resources/views/emails/document-expiration-warning.blade.php`
   - Professional HTML design
   - Responsive layout
   - Color-coded warnings

4. **Console Command**: `app/Console/Commands/CheckDocumentExpirations.php`
   - Main logic for checking expirations
   - Sends appropriate warnings
   - Supports test mode and force mode

### Modified Files
1. **Model**: `app/Models/DokumenLegalitas.php`
   - Added warning tracking fields
   - Added helper methods (isExpiringSoon, isExpired, daysUntilExpiry, getExpiryStatus)

2. **Console Routes**: `routes/console.php`
   - Scheduled daily execution at 8:00 AM
   - Automatic logging
   - Email on failure

---

## 🚀 Setup & Deployment

### Step 1: Run Migration
```bash
php artisan migrate
```

This will add the following columns to `dokumen_legalitas`:
- `warning_30_days_sent_at`
- `warning_14_days_sent_at`
- `warning_7_days_sent_at`

### Step 2: Test the Command
```bash
# Test mode - see what would be sent without actually sending
php artisan documents:check-expirations --test

# Force mode - send emails even if already sent (for testing)
php artisan documents:check-expirations --force

# Normal mode - send emails for documents that haven't been warned
php artisan documents:check-expirations
```

### Step 3: Configure Scheduler (Production)

#### Option A: Using Cron (Linux/macOS)
```bash
# Edit crontab
crontab -e

# Add this line:
* * * * * cd /path/to/your/app && php artisan schedule:run >> /dev/null 2>&1
```

#### Option B: Using Windows Task Scheduler
1. Open Task Scheduler
2. Create a new task
3. Trigger: Daily at any time
4. Action: Run program
   - Program: `php`
   - Arguments: `artisan schedule:run`
   - Start in: `C:\path\to\your\app`

#### Option C: Using systemd (Linux)
Create `/etc/systemd/system/laravel-scheduler.service`:
```ini
[Unit]
Description=Laravel Scheduler
After=network.target

[Service]
Type=oneshot
User=www-data
WorkingDirectory=/path/to/your/app
ExecStart=/usr/bin/php artisan schedule:run

[Install]
WantedBy=multi-user.target
```

Create `/etc/systemd/system/laravel-scheduler.timer`:
```ini
[Unit]
Description=Laravel Scheduler Timer
Requires=laravel-scheduler.service

[Timer]
OnCalendar=*:0/1
Persistent=true

[Install]
WantedBy=timers.target
```

Enable and start:
```bash
sudo systemctl enable laravel-scheduler.timer
sudo systemctl start laravel-scheduler.timer
```

---

## 📊 How It Works

### Daily Process Flow

```
08:00 AM (Asia/Jakarta)
    ↓
Check for documents expiring in 30 days
    ↓ (if found and not warned)
Send 30-day warning email
    ↓
Mark as warned (warning_30_days_sent_at)
    ↓
Check for documents expiring in 14 days
    ↓ (if found and not warned)
Send 14-day warning email
    ↓
Mark as warned (warning_14_days_sent_at)
    ↓
Check for documents expiring in 7 days
    ↓ (if found and not warned)
Send 7-day warning email
    ↓
Mark as warned (warning_7_days_sent_at)
    ↓
Log results to storage/logs/document-expiration-checks.log
```

### Example Scenario

**Document Details:**
- Type: STR (Surat Tanda Registrasi)
- Expiry Date: February 15, 2026

**Warning Timeline:**
- **January 16, 2026** (30 days before) → First warning email sent
- **February 1, 2026** (14 days before) → Second warning email sent
- **February 8, 2026** (7 days before) → Final urgent warning email sent

---

## 🧪 Testing

### Test Command Options

```bash
# 1. Test mode - Shows what would be sent without sending
php artisan documents:check-expirations --test

# 2. Force mode - Sends emails even if already sent
php artisan documents:check-expirations --force

# 3. Combined - Test force mode
php artisan documents:check-expirations --test --force
```

### Manual Testing Checklist

1. **Create Test Documents**
```php
// In tinker: php artisan tinker
$user = \App\Models\UserRegistration::first();

// Document expiring in 30 days
\App\Models\DokumenLegalitas::create([
    'user_id' => $user->id,
    'jenis_dokumen' => 'STR Test',
    'nomor_sk' => 'TEST-001',
    'tanggal_mulai' => now(),
    'tanggal_berlaku' => now()->addDays(30),
    'file_path' => 'test/path.pdf'
]);

// Document expiring in 14 days
\App\Models\DokumenLegalitas::create([
    'user_id' => $user->id,
    'jenis_dokumen' => 'SIP Test',
    'nomor_sk' => 'TEST-002',
    'tanggal_mulai' => now(),
    'tanggal_berlaku' => now()->addDays(14),
    'file_path' => 'test/path2.pdf'
]);

// Document expiring in 7 days
\App\Models\DokumenLegalitas::create([
    'user_id' => $user->id,
    'jenis_dokumen' => 'SK Test',
    'nomor_sk' => 'TEST-003',
    'tanggal_mulai' => now(),
    'tanggal_berlaku' => now()->addDays(7),
    'file_path' => 'test/path3.pdf'
]);
```

2. **Run Test Command**
```bash
php artisan documents:check-expirations --test
```

3. **Send Test Emails**
```bash
php artisan documents:check-expirations
```

4. **Check Email Inbox**
- Verify email received
- Check formatting
- Verify urgency colors
- Check all information is correct

5. **Verify Database Updates**
```sql
SELECT id, jenis_dokumen, tanggal_berlaku, 
       warning_30_days_sent_at, 
       warning_14_days_sent_at, 
       warning_7_days_sent_at
FROM dokumen_legalitas
WHERE tanggal_berlaku IS NOT NULL;
```

---

## 📝 Email Template Details

### Urgency Levels

| Days Remaining | Level | Color | Badge |
|----------------|-------|-------|-------|
| 30 days | Peringatan Awal | Yellow (#ffc107) | ⚠️ PENTING |
| 14 days | Peringatan Menengah | Orange (#fd7e14) | ⚠️ PENTING |
| 7 days | Peringatan Mendesak | Red (#dc3545) | ⚠️ MENDESAK |

### Email Content Includes

1. **Header**
   - Logo
   - Color-coded alert badge
   - Urgency level

2. **Warning Box**
   - Large countdown (days remaining)
   - Clear call to action

3. **Document Details Table**
   - Document type
   - Document number
   - Start date
   - Expiry date (highlighted)

4. **Action Items**
   - Checklist of required actions
   - Preparation steps

5. **CTA Button**
   - Direct link to document management page

6. **Footer**
   - Contact information
   - Auto-response notice

---

## 🔍 Monitoring & Logs

### Log Files

1. **Daily Check Logs**
   - Location: `storage/logs/document-expiration-checks.log`
   - Contains: Daily execution results

2. **Laravel Logs**
   - Location: `storage/logs/laravel.log`
   - Contains: Detailed email sending logs and errors

### Log Examples

```
[2026-01-04 08:00:00] Document expiration warning sent
    user_id: 1
    user_email: user@example.com
    document_id: 5
    document_type: STR
    expiry_date: 2026-02-03
    days_remaining: 30
    stage: 30_days
```

### Monitoring Queries

```sql
-- Check how many warnings sent today
SELECT 
    COUNT(*) as total_warnings,
    SUM(CASE WHEN warning_30_days_sent_at >= CURDATE() THEN 1 ELSE 0 END) as '30_day_warnings',
    SUM(CASE WHEN warning_14_days_sent_at >= CURDATE() THEN 1 ELSE 0 END) as '14_day_warnings',
    SUM(CASE WHEN warning_7_days_sent_at >= CURDATE() THEN 1 ELSE 0 END) as '7_day_warnings'
FROM dokumen_legalitas;

-- Documents expiring soon
SELECT 
    u.name,
    u.email,
    dl.jenis_dokumen,
    dl.tanggal_berlaku,
    DATEDIFF(dl.tanggal_berlaku, CURDATE()) as days_remaining
FROM dokumen_legalitas dl
JOIN users_registration u ON dl.user_id = u.id
WHERE dl.tanggal_berlaku BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
ORDER BY dl.tanggal_berlaku;
```

---

## 🛠️ Troubleshooting

### Issue: Emails not being sent

**Check:**
1. Mail configuration in `.env`
```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
```

2. Run test command
```bash
php artisan documents:check-expirations --test
```

3. Check Laravel logs
```bash
tail -f storage/logs/laravel.log
```

### Issue: Scheduler not running

**Check:**
1. Cron job is configured
```bash
crontab -l
```

2. Laravel scheduler is working
```bash
php artisan schedule:list
```

3. Manually run the command
```bash
php artisan documents:check-expirations
```

### Issue: Duplicate emails

**Cause:** Warning tracking not working

**Fix:**
1. Ensure migration was run
2. Check database columns exist
```sql
DESCRIBE dokumen_legalitas;
```

3. Don't use `--force` flag in production

### Issue: Wrong timezone

**Fix:** Update timezone in `routes/console.php`
```php
Schedule::command('documents:check-expirations')
    ->dailyAt('08:00')
    ->timezone('Asia/Jakarta') // Change this to your timezone
```

---

## 🎨 Customization

### Change Warning Stages

Edit `app/Console/Commands/CheckDocumentExpirations.php`:
```php
private const WARNING_STAGES = [
    45 => 'warning_45_days_sent_at', // Add 45-day warning
    30 => 'warning_30_days_sent_at',
    14 => 'warning_14_days_sent_at',
    7 => 'warning_7_days_sent_at',
];
```

Don't forget to add migration for new column!

### Change Email Time

Edit `routes/console.php`:
```php
Schedule::command('documents:check-expirations')
    ->dailyAt('09:00') // Change to 9 AM
```

### Customize Email Template

Edit `resources/views/emails/document-expiration-warning.blade.php`:
- Change colors
- Modify layout
- Add/remove sections
- Update contact information

### Add Additional Recipients

Edit `app/Console/Commands/CheckDocumentExpirations.php`:
```php
Mail::to($user->email)
    ->cc('admin@example.com') // Add CC
    ->bcc('audit@example.com') // Add BCC
    ->send(new DocumentExpirationWarning(...));
```

---

## 📈 Performance Considerations

### Database Optimization

The system includes an index on `tanggal_berlaku` for efficient queries:
```sql
ALTER TABLE dokumen_legalitas ADD INDEX idx_tanggal_berlaku (tanggal_berlaku);
```

### Queue Emails (Recommended for Production)

Edit `app/Console/Commands/CheckDocumentExpirations.php`:
```php
// Instead of:
Mail::to($user->email)->send(new DocumentExpirationWarning(...));

// Use:
Mail::to($user->email)->queue(new DocumentExpirationWarning(...));
```

Then configure queue worker:
```bash
php artisan queue:work --daemon
```

---

## 🔐 Security Considerations

1. **Rate Limiting**: Already implemented in API routes
2. **Email Validation**: User emails are validated during registration
3. **Authorization**: Documents are tied to users (can only receive own documents)
4. **Logging**: All actions are logged for audit trail
5. **Error Handling**: Failures don't stop processing other documents

---

## ✅ Deployment Checklist

- [ ] Run migration: `php artisan migrate`
- [ ] Test command: `php artisan documents:check-expirations --test`
- [ ] Send test email: `php artisan documents:check-expirations --force`
- [ ] Verify email received and formatted correctly
- [ ] Configure cron job or Task Scheduler
- [ ] Verify scheduler is running: `php artisan schedule:list`
- [ ] Check logs after first automated run
- [ ] Monitor for 1 week
- [ ] Document any customizations made

---

## 📞 Support & Maintenance

### Monthly Tasks
- Review sent warnings in logs
- Check for failed emails
- Verify scheduler is running correctly

### Quarterly Tasks
- Review warning stages (are they appropriate?)
- Update email template if needed
- Check system performance

---

**System Status:** ✅ Production Ready  
**Implementation Date:** January 4, 2026  
**Last Updated:** January 4, 2026  
**Version:** 1.0.0
