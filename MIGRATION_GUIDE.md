# 🔄 Migration Guide - Role & Contractor System

## Overview

This guide documents the migration from a simple single-role system to a multi-tenant, multi-role system with contractor scoping.

### What Changed?

**Old System:**
- Single role: `driver` or `admin`
- No contractor/company separation
- All deliveries accessible by admin

**New System:**
- Three roles: `MOTORISTA` (driver), `CONTRATADO` (contractor/company), `ADMIN` (administrator)
- Contractor-scoped access: 
  - MOTORISTA can only see/manage their own deliveries
  - CONTRATADO can manage drivers and deliveries assigned to them
  - ADMIN has full access
- Required fields: `contractorId` on drivers and deliveries

## Migration Steps

### 1. **Update Dependencies (Optional)**

```bash
cd backend
npm install
```

New dev dependencies added for code quality:
- `eslint` - Code linting
- `prettier` - Code formatting
- `nodemon` - Development server reload

### 2. **Run Data Migration**

> ⚠️  **Backup your database first!**

```bash
cd backend
npm run migrate-data
```

**What this does:**
- ✅ Normalizes all driver roles: `driver` → `MOTORISTA`, `admin` → `ADMIN`
- ✅ Sets `contractorId` for all MOTORISTA users
- ✅ Ensures CONTRATADO users have `contractorId = _id`
- ✅ Creates a default contractor if none exists
- ✅ Updates all deliveries with `driverId` and `contractorId`

**Output example:**
```
═════════════════════════════════════════
  Data Migration: Roles & Contractor IDs
═════════════════════════════════════════

ℹ Starting driver migration...
ℹ Found 3 drivers
  Normalized role: motorista1 (driver -> MOTORISTA)
  Normalized role: motorista2 (driver -> MOTORISTA)
  Normalized role: admin (admin -> ADMIN)
✓ Migrated 3 drivers. Found 1 contractors.
ℹ Starting delivery migration...
ℹ Found 4 deliveries
  Set driverId from userId: ENT001
  Set contractorId from driver: ENT001
✓ Migrated 4 deliveries

═════════════════════════════════════════
✓ Migration completed successfully!
═════════════════════════════════════════

Drivers updated: 3
Contractors found: 1
Deliveries updated: 4
```

### 3. **Verify Migration**

Test the system by:

1. **Start the backend:**
   ```bash
   npm run dev
   ```

2. **Check endpoints:**
   - Health check: GET `/api/health`
   - Readiness: GET `/api/ready`

3. **Login with existing users:**
   - Username: `admin` / Password: `admin123`
   - Username: `motorista1` / Password: `driver123`

4. **Test role-based access:**
   - Admin can see all deliveries
   - Motorista can only see their own deliveries
   - Contractor (company) can manage their drivers

## New Role System Details

### MOTORISTA (Driver)
- Can create deliveries
- Can upload documents to their own deliveries
- Can only see/edit their own deliveries
- Must be assigned to a CONTRATADO (contractor)
- Cannot access admin panel

**Required fields:**
- `contractorId` - References the CONTRATADO who manages them

### CONTRATADO (Contractor/Company)
- Can manage MOTORISTA users in their company
- Can create deliveries for their drivers
- Can view deliveries of all their drivers
- Cannot access global admin panel
- `contractorId` points to their own ID

**Required fields:**
- `contractorId = _id` (self-reference)

### ADMIN (Administrator)
- Full system access
- Can view/manage all users and deliveries
- Can create other ADMIN, CONTRATADO, MOTORISTA users
- No `contractorId` (null or empty)

## User Creation Rules

### During Registration (Public)

Default to MOTORISTA:
```json
{
  "name": "João Silva",
  "email": "joao@example.com",
  "username": "joaonew",
  "password": "password123",
  "phone": "11987654321"
  // role and contractorId omitted - defaults to MOTORISTA
}
```

⚠️ **Note:** Registrations must provide `contractorId` if not using default

### During Admin Creation

Full control over role and contractor assignment:
```json
{
  "name": "Maria Santos",
  "email": "maria@empresa.com",
  "username": "maria-driver",
  "password": "password123",
  "role": "MOTORISTA",
  "contractorId": "contractor_uuid_here"
}
```

**Or create a contractor:**
```json
{
  "name": "Empresa XYZ",
  "email": "empresa@xyz.com",
  "username": "empresa-xyz",
  "password": "password123",
  "role": "CONTRATADO"
  // contractorId will be set to _id automatically
}
```

## Environment Variables

No new environment variables are required, but these remain important:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/delivery-docs
# Or MongoDB Atlas:
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/delivery-docs

# JWT
JWT_SECRET=your-super-secret-key-change-in-production

# Server
PORT=5000
NODE_ENV=production

# Optional: file uploads
BACKEND_UPLOADS_DIR=/path/to/persistent/uploads
```

## Troubleshooting Migration

### Error: "no CONTRATADO users found"

**Cause:** All existing users were admins or the system is new
**Solution:** Migration creates a default contractor automatically. You can rename it in admin panel.

### Error: "MOTORISTA need contractorId"

**Cause:** A motorista user exists without an assigned contractor
**Solution:** Migration assigns all unassigned motoristas to the first contractor. Manually reassign in admin panel if needed.

### Error: "contractorId invalid or not CONTRATADO"

**Cause:** Invalid contractor ID when creating a user
**Solution:** Verify the contractor exists and has role CONTRATADO:
```bash
# In admin panel, check contractors list
# GET /api/admin/users (filter by role: CONTRATADO)
```

## Reverting Migration (Rollback)

If you need to rollback:

1. **Restore database backup:**
   ```bash
   # MongoDB
   mongorestore /path/to/backup
   ```

2. **Restart server:**
   ```bash
   npm run dev
   ```

**Note:** Code changes are not reverted automatically. You'll need to git revert if rolling back codebase.

## FAQ

### Q: Can I have MOTORISTA without a contractor?
**A:** No, the system enforces `contractorId` for all MOTORISTA. Every driver must be assigned to a company/contractor.

### Q: Can a MOTORISTA belong to multiple CONTRATADO?
**A:** No, each MOTORISTA has a single `contractorId`. If needed, create a separate account for each contractor.

### Q: How do I create a new CONTRATADO?
**A:** Via admin panel:
```bash
POST /api/admin/users
{
  "username": "new-company",
  "email": "contact@company.com",
  "name": "Company Name",
  "password": "temp-password",
  "role": "CONTRATADO"
}
```

### Q: What happens to old deliveries after migration?
**A:** All deliveries are updated with:
- `driverId` (from `userId`)
- `contractorId` (from driver's contractor or first available)

They remain accessible according to new role rules.

### Q: How do I seed test data?
**A:** Run the seed script which creates sample users with proper roles:
```bash
npm run seed
```

Creates:
- 1 ADMIN (admin/admin123)
- 1 CONTRATADO (contratado1/contractor123)
- 2 MOTORISTA (motorista1, motorista2 / driver123)
- 4 sample deliveries

## Next Steps

1. ✅ [Run the migration](#2-run-data-migration)
2. ✅ [Test the system](#3-verify-migration)
3. 📖 [Read role-based access rules](./ARCHITECTURE.md#role-based-access-control)
4. 🚀 [Deploy to production](./DEPLOY.md)

---

**Questions?** Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) or create an issue.
