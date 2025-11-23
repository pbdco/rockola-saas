# Creating a SUPERADMIN User

There are several ways to create a SUPERADMIN user:

## Option 1: Using the Script (Recommended)

Run the script with environment variables:

```bash
SUPERADMIN_EMAIL=admin@rockola.com SUPERADMIN_PASSWORD=yourpassword SUPERADMIN_NAME="Super Admin" npm run create-superadmin
```

Or set them in your `.env` file and run:

```bash
npm run create-superadmin
```

Default values:
- Email: `admin@rockola.com`
- Password: `admin123`
- Name: `Super Admin`

## Option 2: Using Docker

If running in Docker, execute the script inside the container:

```bash
docker compose exec app npx ts-node scripts/create-superadmin.ts
```

Or with environment variables:

```bash
docker compose exec -e SUPERADMIN_EMAIL=admin@rockola.com -e SUPERADMIN_PASSWORD=yourpassword app npx ts-node scripts/create-superadmin.ts
```

## Option 3: Direct Database Update

You can also update an existing user directly in the database:

### Using Prisma Studio:
```bash
npx prisma studio
```
Then navigate to the User table and update the `role` field to `SUPERADMIN` for the desired user.

### Using SQL:
```sql
UPDATE "User" SET role = 'SUPERADMIN' WHERE email = 'your-email@example.com';
```

### Using Docker + psql:
```bash
docker compose exec db psql -U admin -d saas-starter-kit -c "UPDATE \"User\" SET role = 'SUPERADMIN' WHERE email = 'your-email@example.com';"
```

## Option 4: Create via Signup then Update

1. Sign up normally through the UI
2. Then run the script or update the database to change the role to SUPERADMIN
