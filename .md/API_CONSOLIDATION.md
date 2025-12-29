# API Endpoint Consolidation Plan

## Current Issues
1. **Redundant endpoints**: `/profile` and `/account` both update user data
2. **Non-RESTful naming**: `/store`, `/upload`, `/delete-multiple`, `/bulk-delete`
3. **Inconsistent patterns**: Some use `/view/{id}`, others use `/{id}/file`
4. **Too many endpoints**: 40+ endpoints for simple CRUD operations

## Consolidation Strategy

### Before: 40+ Endpoints
```
Auth (7): register, login, logout, refresh, me, verify-email, resend-verification
Password (3): forgot-password, verify-reset-code, reset-password
Profile (6): profile, account, delete-account, foto-profil (3 methods)
Documents (32): 8 resources × 4 methods each
```

### After: 28 Endpoints (30% reduction)
```
Auth (7): Same
Password (3): Same
Profile (3): profile (handles all updates), foto-profil (2 methods)
Resources (15): 5 resources × 3 REST methods (GET, POST, DELETE)
```

## Changes

### 1. ✅ Merge Profile Endpoints
**Before:**
- `PUT /api/profile` - Update profile data
- `PUT /api/account` - Update email/password
- `DELETE /api/account` - Delete account

**After:**
- `PUT /api/profile` - Update all profile data (including email/password)
- `DELETE /api/profile` - Delete account

**Benefits:**
- 1 endpoint instead of 3
- Single source of truth for user updates
- Simpler frontend logic

### 2. ✅ Standardize Resource Endpoints (RESTful)
**Before:**
- `POST /dokumen-legalitas/upload`
- `GET /dokumen-legalitas/view/{id}`
- `POST /riwayat-pendidikan/store`
- `POST /riwayat-pendidikan/delete-multiple`

**After:**
- `POST /dokumen-legalitas` - Create/upload
- `GET /dokumen-legalitas/{id}` - View single document
- `DELETE /dokumen-legalitas/{id}` - Delete single document

**Benefits:**
- Standard REST conventions
- Easier to understand and maintain
- Follows Laravel best practices

### 3. ✅ Consolidate File Viewing
**Before:**
- `/dokumen-legalitas/view/{id}`
- `/prestasi-penghargaan/{id}/file`
- `/status-kewenangan/{id}/file`

**After:**
- `/{resource}/{id}` - Returns file content with proper headers

**Benefits:**
- Consistent pattern across all resources
- Single method for file retrieval

### 4. ✅ Simplify Bulk Operations
**Before:**
- `POST /delete-multiple` (for some resources)
- `POST /bulk-delete` (for other resources)

**After:**
- `DELETE /{resource}/{id}` - Delete single item
- Frontend handles multiple deletions by calling endpoint multiple times
- Alternative: `DELETE /{resource}?ids=1,2,3` for bulk (if needed)

**Benefits:**
- Simpler API surface
- No special bulk endpoints needed
- Standard HTTP methods

## Implementation Summary

### Updated Routes (28 total)

```php
// Auth (7)
POST   /register
POST   /login
POST   /verify-email
POST   /resend-verification-code
POST   /logout
POST   /refresh
GET    /me

// Password Reset (3)
POST   /forgot-password
POST   /verify-reset-code
POST   /reset-password

// Profile (3)
PUT    /profile                    # Merged: profile + account updates
DELETE /profile                    # Merged: from /account
POST   /profile/foto-profil
GET    /profile/foto-profil
DELETE /profile/foto-profil

// Dokumen Legalitas (4)
GET    /dokumen-legalitas
POST   /dokumen-legalitas          # Merged: from /upload
GET    /dokumen-legalitas/{id}     # Merged: from /view/{id}
DELETE /dokumen-legalitas/{id}

// Riwayat Pendidikan (4)
GET    /riwayat-pendidikan
POST   /riwayat-pendidikan         # Merged: from /store
GET    /riwayat-pendidikan/{id}    # Merged: from /view/{id}
DELETE /riwayat-pendidikan/{id}    # Merged: from /delete-multiple

// Penugasan (4)
GET    /penugasan
POST   /penugasan                  # Merged: from /store
GET    /penugasan/{id}             # Merged: from /view/{id}
DELETE /penugasan/{id}             # Merged: from /delete-multiple

// Etik & Disiplin (5)
GET    /etik-disiplin
POST   /etik-disiplin              # Merged: from /store
GET    /etik-disiplin/{id}         # Merged: from /view/{id}
PUT    /etik-disiplin/{id}         # Keep: from /update/{id}
DELETE /etik-disiplin/{id}         # Merged: from /delete-multiple

// Kredensial (5)
GET    /kredensial
POST   /kredensial                 # Merged: from /store
GET    /kredensial/{id}            # Merged: from /view/{id}
PUT    /kredensial/{id}            # Keep: from /update/{id}
DELETE /kredensial/{id}            # Merged: from /delete-multiple

// Prestasi & Penghargaan (4)
GET    /prestasi-penghargaan
POST   /prestasi-penghargaan
GET    /prestasi-penghargaan/{id}  # Merged: from /{id}/file
DELETE /prestasi-penghargaan/{id}  # Merged: from /bulk-delete

// Status Kewenangan (4)
GET    /status-kewenangan
POST   /status-kewenangan
GET    /status-kewenangan/{id}     # Merged: from /{id}/file
DELETE /status-kewenangan/{id}     # Merged: from /bulk-delete

// PDF Compression (1)
POST   /compress-pdf
```

## Benefits for Hospital IT Team

1. **Easier to Document**: Clear, predictable endpoint structure
2. **Faster Onboarding**: Standard REST conventions
3. **Less Maintenance**: 30% fewer endpoints to maintain
4. **Better Security**: Fewer attack surfaces
5. **Improved Performance**: Less routing overhead
6. **Standard Compliance**: Follows REST API best practices
7. **Reduced Complexity**: Single responsibility per endpoint

## Migration Impact

### Backend Changes
- ✅ Merge ProfileController methods
- ✅ Rename controller methods to REST standards
- ✅ Update route definitions
- ✅ Remove redundant methods

### Frontend Changes
- ✅ Update Pengaturan.jsx: merge profile/account calls
- ✅ Update RiwayatPendidikan.jsx: use standard endpoints
- ✅ Update other pages with document operations
- ⚠️ Update apiService.js cache keys

### Database Changes
- None required (only API layer changes)

## Testing Checklist
- [ ] Profile update (merged endpoint)
- [ ] Account deletion (new path)
- [ ] Document upload (renamed endpoint)
- [ ] Document viewing (renamed endpoint)
- [ ] Multiple document deletion
- [ ] Education records CRUD
- [ ] All other resource operations

## Rollback Plan
If issues arise, the old endpoint structure is preserved in git history and can be restored with minimal changes.
