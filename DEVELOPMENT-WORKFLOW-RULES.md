# 🛡️ Development Workflow Rules - Rockola Project

**Purpose:** Prevent breaking changes, ensure schema consistency, and maintain code quality during development.

**For:** Cursor AI Agent, Developers, Code Reviewers

---

## 🚨 Critical Rules (MUST FOLLOW)

### 1. Database Schema Changes

**ALWAYS:**
- ✅ Update `prisma/schema.prisma` FIRST before any code changes
- ✅ Create migration file in `prisma/migrations/` with descriptive name
- ✅ Test migration on local database before committing
- ✅ Run `scripts/verify-database-schema.sh` after migration
- ✅ Check for existing data that needs migration
- ✅ Use `IF NOT EXISTS` / `IF EXISTS` in SQL for idempotency

**NEVER:**
- ❌ Modify database directly without Prisma schema update
- ❌ Skip migration files
- ❌ Use hardcoded column names that don't match schema
- ❌ Assume database state matches schema

**Example Workflow:**
```bash
# 1. Update schema.prisma
# 2. Create migration
docker-compose exec app npx prisma migrate dev --name descriptive_name

# 3. Verify schema
./scripts/verify-database-schema.sh

# 4. Test in application
# 5. Commit both schema.prisma and migration file
```

---

### 2. Model Relationship Changes

**ALWAYS:**
- ✅ Check ALL related models when changing relationships
- ✅ Update foreign keys in migration
- ✅ Handle data migration if changing relationship type
- ✅ Update all queries that use the relationship
- ✅ Check for cascade delete implications

**Common Issues:**
- `teamId` → `userId` migrations (Venue, ApiKey, etc.)
- Adding/removing relations
- Changing cascade behavior

**Checklist:**
- [ ] All foreign keys updated
- [ ] Old columns removed
- [ ] Indexes updated
- [ ] All queries updated
- [ ] Data migrated (if needed)

---

### 3. API Endpoint Changes

**ALWAYS:**
- ✅ Check database schema before writing queries
- ✅ Use Prisma types, not raw SQL when possible
- ✅ Handle errors gracefully
- ✅ Log operations (already set up)
- ✅ Test with actual database state

**NEVER:**
- ❌ Assume database columns exist
- ❌ Use `_count` on relations without verifying schema
- ❌ Hardcode field names

**Example:**
```typescript
// ❌ BAD - Assumes apiKeys relation exists
_count: { select: { apiKeys: true } }

// ✅ GOOD - Check schema first, handle gracefully
_count: { 
  select: { 
    venues: true,
    // apiKeys: true, // Only if schema verified
  } 
}
```

---

### 4. TypeScript Type Safety

**ALWAYS:**
- ✅ Use Prisma generated types
- ✅ Update types when schema changes
- ✅ Run `npx prisma generate` after schema changes
- ✅ Fix TypeScript errors before committing

**NEVER:**
- ❌ Use `any` types for database models
- ❌ Ignore TypeScript errors
- ❌ Skip type generation

---

### 5. Docker & Environment

**ALWAYS:**
- ✅ Test changes in Docker environment
- ✅ Check logs: `docker-compose logs app`
- ✅ Verify database connection
- ✅ Rebuild if schema changed: `docker-compose build app`

**NEVER:**
- ❌ Assume local environment matches Docker
- ❌ Skip Docker testing
- ❌ Ignore container logs

---

## 📋 Pre-Commit Checklist

Before committing ANY changes:

### Database Changes
- [ ] `prisma/schema.prisma` updated
- [ ] Migration file created and tested
- [ ] `scripts/verify-database-schema.sh` passes
- [ ] No hardcoded column names
- [ ] All relations updated

### Code Changes
- [ ] TypeScript compiles without errors
- [ ] No `any` types for models
- [ ] All queries use Prisma (not raw SQL)
- [ ] Error handling in place
- [ ] Logging added (if new operations)

### Testing
- [ ] Tested in Docker environment
- [ ] Database queries work
- [ ] API endpoints tested
- [ ] No console errors in browser
- [ ] Logs checked for errors

---

## 🔍 Verification Scripts

### Database Schema Verification

**Run after EVERY migration:**
```bash
./scripts/verify-database-schema.sh
```

**What it checks:**
- Required Venue columns exist
- `userId` column exists (not `teamId`)
- Old columns removed
- Foreign keys correct

**Update script when:**
- Adding new models
- Adding critical columns
- Changing relationships

---

## 🐛 Common Issues & Solutions

### Issue 1: "Column does not exist"
**Cause:** Schema not migrated or mismatch
**Solution:**
1. Check `prisma/schema.prisma`
2. Run migration
3. Verify with `verify-database-schema.sh`
4. Rebuild Docker container

### Issue 2: "Relation does not exist"
**Cause:** Foreign key missing or wrong column name
**Solution:**
1. Check migration file
2. Verify foreign key constraint
3. Check Prisma schema relations

### Issue 3: "Type error: Property does not exist"
**Cause:** Prisma client not regenerated
**Solution:**
```bash
docker-compose exec app npx prisma generate
docker-compose restart app
```

### Issue 4: "Migration fails"
**Cause:** Existing data conflicts or syntax error
**Solution:**
1. Check migration SQL syntax
2. Handle existing data
3. Use `IF EXISTS` / `IF NOT EXISTS`
4. Test on empty database first

---

## 📝 Migration Best Practices

### 1. Naming Convention
```
YYYYMMDDHHMMSS_descriptive_name
Example: 20251125000000_fix_apikey_userid
```

### 2. Idempotency
Always use:
```sql
-- ✅ GOOD
ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "column" TEXT;
DROP INDEX IF EXISTS "index_name";
ALTER TABLE "Table" DROP COLUMN IF EXISTS "old_column";

-- ❌ BAD
ALTER TABLE "Table" ADD COLUMN "column" TEXT;  -- Fails if exists
```

### 3. Data Migration
```sql
-- Check if data exists first
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Table" WHERE "oldColumn" IS NOT NULL) THEN
    -- Migrate data
    UPDATE "Table" SET "newColumn" = "oldColumn" WHERE "newColumn" IS NULL;
  END IF;
END $$;
```

### 4. Column Renames
```sql
-- Step 1: Add new column
ALTER TABLE "Table" ADD COLUMN IF NOT EXISTS "newColumn" TEXT;

-- Step 2: Migrate data
UPDATE "Table" SET "newColumn" = "oldColumn" WHERE "newColumn" IS NULL;

-- Step 3: Make NOT NULL (if needed)
ALTER TABLE "Table" ALTER COLUMN "newColumn" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "Table" DROP COLUMN IF EXISTS "oldColumn";
```

---

## 🔄 Workflow for Schema Changes

### Step-by-Step Process

1. **Plan the Change**
   - Identify all affected models
   - Check for existing data
   - Plan migration strategy

2. **Update Schema**
   - Edit `prisma/schema.prisma`
   - Update types and relations

3. **Create Migration**
   - Create migration file manually or via Prisma
   - Write idempotent SQL
   - Handle data migration if needed

4. **Test Migration**
   ```bash
   # Apply migration
   docker-compose exec db psql -U admin -d saas-starter-kit -f migration.sql
   
   # Verify schema
   ./scripts/verify-database-schema.sh
   
   # Test queries
   docker-compose logs app | grep -i error
   ```

5. **Update Code**
   - Update all queries
   - Regenerate Prisma client
   - Fix TypeScript errors

6. **Test Application**
   - Test affected features
   - Check logs for errors
   - Verify UI works

7. **Commit**
   - Commit schema.prisma
   - Commit migration file
   - Commit code changes
   - All together in one commit

---

## 🛠️ Tools & Commands

### Database
```bash
# Check schema
docker-compose exec db psql -U admin -d saas-starter-kit -c "\d TableName"

# Run migration
docker-compose exec db psql -U admin -d saas-starter-kit -f migration.sql

# Verify schema
./scripts/verify-database-schema.sh
```

### Prisma
```bash
# Generate client
docker-compose exec app npx prisma generate

# Check schema
docker-compose exec app npx prisma validate

# Format schema
docker-compose exec app npx prisma format
```

### Docker
```bash
# Rebuild after schema changes
docker-compose build app
docker-compose up -d app

# Check logs
docker-compose logs -f app | grep -i error

# Restart
docker-compose restart app
```

---

## 📚 Reference Documents

- **Schema:** `prisma/schema.prisma`
- **Migrations:** `prisma/migrations/`
- **Verification:** `scripts/verify-database-schema.sh`
- **API Docs:** `ROCKOLA-API-FOR-N8N.md`
- **Backlog:** `PRODUCT-BACKLOG.md`

---

## ⚠️ Red Flags (Stop and Fix)

If you see these, STOP and fix before continuing:

1. **Database errors in logs:**
   - "Column does not exist"
   - "Relation does not exist"
   - "Foreign key constraint"

2. **TypeScript errors:**
   - Type mismatches with Prisma models
   - Missing properties on models

3. **Migration failures:**
   - Migration file has syntax errors
   - Migration fails to apply

4. **Schema mismatch:**
   - `verify-database-schema.sh` fails
   - Database columns don't match schema

---

## ✅ Success Criteria

A change is ready when:
- ✅ Schema matches database
- ✅ All migrations applied
- ✅ TypeScript compiles
- ✅ No errors in logs
- ✅ Verification script passes
- ✅ Application works in Docker
- ✅ All tests pass (if applicable)

---

## 🎯 For Cursor AI Agent

**When making database changes:**
1. Always check `prisma/schema.prisma` first
2. Create migration file with idempotent SQL
3. Run verification script
4. Update all related code
5. Test in Docker environment
6. Check logs for errors

**When writing queries:**
1. Use Prisma types, not raw SQL
2. Check schema for available fields
3. Handle missing relations gracefully
4. Add error handling
5. Log operations

**When fixing errors:**
1. Check database schema first
2. Verify migration was applied
3. Check Prisma client is generated
4. Review logs for details
5. Test fix in Docker

---

**Last Updated:** 2025-11-25  
**Maintained By:** Development Team
