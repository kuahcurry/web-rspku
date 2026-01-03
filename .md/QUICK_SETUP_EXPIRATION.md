# 🚀 Quick Setup Guide - Document Expiration Warning System

## ⏱️ 5-Minute Setup

### Step 1: Run Migration (30 seconds)
```bash
php artisan migrate
```
✅ This adds warning tracking columns to your database.

---

### Step 2: Test the System (2 minutes)

#### A. Test Mode (see what would be sent)
```bash
php artisan documents:check-expirations --test
```

#### B. Send Test Email (if you have test documents)
```bash
php artisan documents:check-expirations --force
```

---

### Step 3: Setup Automatic Scheduling (2 minutes)

#### For Linux/Mac (Using Cron)
```bash
# Open crontab editor
crontab -e

# Add this line (runs every minute, Laravel handles scheduling)
* * * * * cd /path/to/web-rs && php artisan schedule:run >> /dev/null 2>&1
```

#### For Windows (Using Task Scheduler)
1. Open "Task Scheduler"
2. Click "Create Basic Task"
3. Name: "Laravel Scheduler"
4. Trigger: Daily at any time
5. Action: "Start a program"
   - Program: `C:\path\to\php.exe`
   - Arguments: `artisan schedule:run`
   - Start in: `C:\Users\aqefh\Documents\Projects\web-rs`
6. Finish

---

### Step 4: Verify (30 seconds)

#### Check if scheduler is configured
```bash
php artisan schedule:list
```

You should see:
```
0 8 * * * documents:check-expirations .......... Next Due: Tomorrow at 8:00 AM
```

---

## 🎯 What Happens Now?

### Automatic Daily Checks
Every day at **8:00 AM (Asia/Jakarta timezone)**, the system will:

1. ✅ Check for documents expiring in 30 days → Send yellow warning
2. ✅ Check for documents expiring in 14 days → Send orange warning  
3. ✅ Check for documents expiring in 7 days → Send red urgent warning
4. ✅ Log all activities to `storage/logs/document-expiration-checks.log`

---

## 📧 Email Preview

Users will receive beautiful, color-coded emails with:
- **Warning Badge** (Yellow/Orange/Red based on urgency)
- **Countdown Timer** (Days remaining in large text)
- **Document Details** (Type, number, expiry date)
- **Action Checklist** (Steps to renew document)
- **Direct Link** to document management page

---

## 🧪 Testing Without Real Data

### Create Test Documents in Tinker
```bash
php artisan tinker
```

```php
// Get a user
$user = \App\Models\UserRegistration::first();

// Create document expiring in 30 days
\App\Models\DokumenLegalitas::create([
    'user_id' => $user->id,
    'jenis_dokumen' => 'STR Test',
    'nomor_sk' => 'TEST-001',
    'tanggal_mulai' => now(),
    'tanggal_berlaku' => now()->addDays(30),
    'file_path' => 'test/path.pdf'
]);

// Create document expiring in 14 days
\App\Models\DokumenLegalitas::create([
    'user_id' => $user->id,
    'jenis_dokumen' => 'SIP Test',
    'nomor_sk' => 'TEST-002',
    'tanggal_mulai' => now(),
    'tanggal_berlaku' => now()->addDays(14),
    'file_path' => 'test/path2.pdf'
]);

// Create document expiring in 7 days
\App\Models\DokumenLegalitas::create([
    'user_id' => $user->id,
    'jenis_dokumen' => 'SK Test',
    'nomor_sk' => 'TEST-003',
    'tanggal_mulai' => now(),
    'tanggal_berlaku' => now()->addDays(7),
    'file_path' => 'test/path3.pdf'
]);

exit
```

### Run Check
```bash
php artisan documents:check-expirations
```

### Check Your Email Inbox! 📬

---

## 📊 Monitor the System

### View Logs
```bash
# Today's checks
tail -f storage/logs/document-expiration-checks.log

# Detailed Laravel logs
tail -f storage/logs/laravel.log
```

### Check Database
```sql
-- See which warnings have been sent
SELECT 
    jenis_dokumen,
    tanggal_berlaku,
    warning_30_days_sent_at,
    warning_14_days_sent_at,
    warning_7_days_sent_at
FROM dokumen_legalitas
WHERE tanggal_berlaku IS NOT NULL;
```

---

## ⚙️ Configuration

### Change Email Time
Edit `routes/console.php`, line 13:
```php
->dailyAt('08:00')  // Change to your preferred time
```

### Change Timezone
Edit `routes/console.php`, line 14:
```php
->timezone('Asia/Jakarta')  // Change to your timezone
```

---

## 🆘 Troubleshooting

### "No documents found"
✅ Normal! Means no documents expiring at those specific stages today.

### Emails not sending
1. Check mail config in `.env`
2. Test with: `php artisan documents:check-expirations --test`
3. Check logs: `tail -f storage/logs/laravel.log`

### Scheduler not running
1. Verify cron/task scheduler is set up
2. Test manually: `php artisan schedule:run`
3. Check: `php artisan schedule:list`

---

## ✅ You're Done!

The system is now:
- ✅ Installed
- ✅ Configured  
- ✅ Ready to automatically warn users

**No more expired documents!** 🎉

---

**Need more details?** See full documentation: [DOCUMENT_EXPIRATION_SYSTEM.md](DOCUMENT_EXPIRATION_SYSTEM.md)
