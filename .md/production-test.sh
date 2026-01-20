#!/bin/bash

# Production Quick Test Script
# Run this on your production server after deployment

echo "========================================="
echo "Production Server Quick Test"
echo "========================================="
echo ""

# Test 1: Check storage symlink
echo "1. Checking storage symlink..."
if [ -L "public/storage" ]; then
    echo "   ✅ Symlink exists: $(readlink public/storage)"
else
    echo "   ❌ Symlink NOT found! Run: php artisan storage:link"
fi
echo ""

# Test 2: Check storage directories
echo "2. Checking storage directories..."
if [ -d "storage/app/public" ]; then
    echo "   ✅ storage/app/public exists"
    echo "   Files: $(find storage/app/public -type f | wc -l) files"
else
    echo "   ❌ storage/app/public NOT found!"
fi
echo ""

# Test 3: Check permissions
echo "3. Checking permissions..."
STORAGE_PERM=$(stat -c %a storage 2>/dev/null || stat -f %A storage 2>/dev/null)
echo "   storage: $STORAGE_PERM (should be 775 or 777)"
BOOTSTRAP_PERM=$(stat -c %a bootstrap/cache 2>/dev/null || stat -f %A bootstrap/cache 2>/dev/null)
echo "   bootstrap/cache: $BOOTSTRAP_PERM (should be 775 or 777)"
echo ""

# Test 4: Check .env configuration
echo "4. Checking .env configuration..."
if [ -f ".env" ]; then
    APP_URL=$(grep "^APP_URL=" .env | cut -d '=' -f2)
    FILESYSTEM_DISK=$(grep "^FILESYSTEM_DISK=" .env | cut -d '=' -f2)
    echo "   APP_URL: $APP_URL"
    echo "   FILESYSTEM_DISK: $FILESYSTEM_DISK"
    
    if [ "$APP_URL" = "https://keperawatanpkugombong.com" ]; then
        echo "   ✅ APP_URL correct"
    else
        echo "   ⚠️  APP_URL might be incorrect"
    fi
else
    echo "   ❌ .env file not found!"
fi
echo ""

# Test 5: Test file creation and access
echo "5. Testing file creation..."
TEST_FILE="storage/app/public/test_$(date +%s).txt"
echo "test content" > $TEST_FILE
if [ -f "$TEST_FILE" ]; then
    echo "   ✅ Can create files in storage"
    
    # Check if accessible via symlink
    SYMLINK_FILE="public/storage/$(basename $TEST_FILE)"
    if [ -f "$SYMLINK_FILE" ]; then
        echo "   ✅ File accessible via symlink"
    else
        echo "   ❌ File NOT accessible via symlink!"
    fi
    
    # Cleanup
    rm $TEST_FILE
else
    echo "   ❌ Cannot create files in storage!"
fi
echo ""

# Test 6: Check Laravel cache
echo "6. Laravel cache status..."
if [ -f "bootstrap/cache/config.php" ]; then
    echo "   ✅ Config cached (run 'php artisan config:clear' if you changed .env)"
else
    echo "   ℹ️  Config not cached"
fi
echo ""

# Test 7: Check routes
echo "7. Checking API routes..."
php artisan route:list --json > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "   ✅ Routes loaded successfully"
    PROFILE_ROUTE=$(php artisan route:list | grep "api/profile" | wc -l)
    echo "   Profile routes: $PROFILE_ROUTE"
else
    echo "   ❌ Error loading routes!"
fi
echo ""

echo "========================================="
echo "Test Complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. If symlink missing: php artisan storage:link"
echo "2. If permission issues: chmod -R 775 storage bootstrap/cache"
echo "3. Clear cache: php artisan config:clear && php artisan cache:clear"
echo "4. Test in browser:"
echo "   - https://keperawatanpkugombong.com/login (User login)"
echo "   - https://komite.keperawatanpkugombong.com/login (Admin login)"
echo ""
