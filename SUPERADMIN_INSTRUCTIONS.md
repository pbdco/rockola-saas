# SUPERADMIN Management Instructions

## Quick Start

All SUPERADMIN management is handled by the `manage-superadmin.sh` bash script.

## Commands

### 1. List Current SUPERADMIN Users

```bash
./manage-superadmin.sh list
```

This will show all users with the SUPERADMIN role, including their email, name, and creation date.

### 2. Create/Update User to SUPERADMIN

**Step 1:** First, sign up a user via the UI:
- Go to `http://localhost:4002/auth/join`
- Create an account with your desired email and password

**Step 2:** Then run the script to promote them to SUPERADMIN:

```bash
./manage-superadmin.sh create [email] [name]
```

**Examples:**
```bash
./manage-superadmin.sh create admin@rockola.com "Super Admin"
./manage-superadmin.sh create john@example.com "John Doe"
```

**Note:** The user must already exist (created via signup) before you can promote them.

### 3. Remove SUPERADMIN Role

To downgrade a SUPERADMIN back to a regular USER:

```bash
./manage-superadmin.sh remove [email]
```

**Example:**
```bash
./manage-superadmin.sh remove admin@rockola.com
```

## Complete Workflow Example

```bash
# 1. List existing SUPERADMIN users
./manage-superadmin.sh list

# 2. Sign up at http://localhost:4002/auth/join
#    (Use email: admin@rockola.com, password: yourpassword)

# 3. Promote the new user to SUPERADMIN
./manage-superadmin.sh create admin@rockola.com "Super Admin"

# 4. Verify it worked
./manage-superadmin.sh list

# 5. Log in at http://localhost:4002/auth/login
#    You should now see the "Admin" link in the navigation
```

## Alternative Methods

If you prefer not to use the script, you can also:

### Using Prisma Studio (GUI)
```bash
docker compose exec app npx prisma studio
```
Then navigate to `http://localhost:5555`, find the User table, and update the role field.

### Using Direct SQL
```bash
docker compose exec db psql -U admin -d saas-starter-kit -c "UPDATE \"User\" SET role = 'SUPERADMIN' WHERE email = 'your-email@example.com';"
```

## Troubleshooting

**"User does not exist" error:**
- Make sure you've signed up first at `http://localhost:4002/auth/join`
- Check the email address is correct (case-sensitive)

**"Permission denied" error:**
- Make sure the script is executable: `chmod +x manage-superadmin.sh`
- Make sure Docker containers are running: `docker compose ps`

**Database connection error:**
- Make sure the database container is running: `docker compose up -d`
- Wait a few seconds for the database to be ready

