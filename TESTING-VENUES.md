# 🧪 Testing Venue Management UI - Quick Start Guide

## Prerequisites

✅ You have:
- Node.js 18+ installed
- Docker Desktop installed and running
- `.env` file configured (✅ already exists!)

---

## Step-by-Step Testing Instructions

### **Step 1: Start PostgreSQL Database**

```bash
cd /Users/pindaco/Downloads/saas-starter-kit-main

# Start the database
docker compose up -d db

# Verify it's running
docker compose ps
```

You should see the `db` container running and healthy.

---

### **Step 2: Set Up Database Schema**

```bash
# Push the schema to the database (includes Venue tables)
npx prisma db push

# (Optional) Open Prisma Studio to see the database
npx prisma studio
```

Prisma Studio will open at `http://localhost:5555` where you can see the `Venue` table.

---

### **Step 3: Install Dependencies** (if not done)

```bash
npm install
```

---

### **Step 4: Start the Development Server**

```bash
npm run dev
```

The app will start at **`http://localhost:4002`**

---

### **Step 5: Access the Application**

1. Open your browser: **`http://localhost:4002`**
2. You should see the landing page

---

### **Step 6: Create an Account**

1. Click **"Get Started"** or **"Create a free account"**
2. Fill in:
   - **Name**: Your Name
   - **Email**: test@example.com
   - **Password**: password123
3. Click **"Sign up"**

*Note: If email confirmation is required, check your .env for `CONFIRM_EMAIL=false` to bypass.*

---

### **Step 7: Create a Team**

1. After login, you'll be prompted to create a team
2. Enter a team name: **"My Music Company"**
3. Click **"Create Team"**

---

### **Step 8: Navigate to Venues** 🎵

1. Look at the **left sidebar**
2. Click on **"Venues"** (musical note icon 🎵)
3. You'll see the empty state!

---

### **Step 9: Create Your First Venue**

1. Click **"Create Your First Venue"** button
2. Fill in the form:

   ```
   Venue Name: The Groove Bar
   Venue Slug: (leave empty, auto-generated)
   Address: 123 Main Street, Downtown
   Operating Mode: Queue Mode
   ☑ Enable Paid Song Requests
   Price Per Song: 2.99
   Currency: USD
   ☑ Venue is Active
   ```

3. Click **"Create Venue"**
4. 🎉 You should see a success toast!

---

### **Step 10: Test All Features**

#### **View Venue**
- See your venue in the list with:
  - Name and badges
  - Address
  - Pricing info (💰 USD 2.99 per song)
  - Spotify status (⚠ Spotify Not Connected)

#### **Edit Venue**
1. Click **"Edit"** button
2. Change the price to `3.99`
3. Change mode to "Playlist Mode"
4. Click **"Save Changes"**
5. ✅ Verify the changes appear in the list

#### **Create More Venues**
1. Click **"Create Venue"** in header
2. Add another venue:
   ```
   Name: Jazz Club Downtown
   Mode: Automation Mode
   Pricing: Disabled
   ```

#### **Delete Venue**
1. Click **"Delete"** on any venue
2. Confirm in the dialog
3. ✅ Venue disappears from list

---

## 🎯 What to Look For

### **Visual Elements**
- ✅ Musical note icon (🎵) in navigation
- ✅ Venue cards with badges
- ✅ Mode badges color-coded:
  - Queue = Primary (blue)
  - Playlist = Secondary (purple)
  - Automation = Accent (teal)
- ✅ Status badges (Active/Inactive)
- ✅ Spotify connection indicator

### **Interactions**
- ✅ Modals open/close smoothly
- ✅ Forms validate (try submitting empty)
- ✅ Toast notifications appear
- ✅ Loading states during save/delete
- ✅ Confirmation before delete

### **Data Persistence**
- ✅ Refresh the page - venues stay
- ✅ Create venue - appears immediately
- ✅ Edit venue - changes save
- ✅ Delete venue - really gone

---

## 🛠️ Troubleshooting

### **Problem: Port 4002 already in use**
```bash
# Kill the process on port 4002
lsof -ti:4002 | xargs kill -9

# Or use a different port
npm run dev -- --port 3000
```

### **Problem: Database connection error**
```bash
# Check if PostgreSQL is running
docker compose ps

# Restart the database
docker compose restart db

# Check the DATABASE_URL in .env matches:
# postgresql://admin:admin@localhost:5432/saas-starter-kit
```

### **Problem: "Team not found" or redirect issues**
```bash
# Clear browser cookies and local storage
# Or use incognito/private mode
```

### **Problem: Prisma errors**
```bash
# Regenerate Prisma client
npx prisma generate

# Reset and re-push schema
npx prisma db push --force-reset
```

### **Problem: "Venues" menu doesn't appear**
- Make sure `FEATURE_TEAM_VENUES=true` in `.env` (or not set, defaults to true)
- Hard refresh browser (Cmd+Shift+R / Ctrl+Shift+F5)

---

## 🔍 Verify Database

```bash
# Open Prisma Studio
npx prisma studio
```

Navigate to the `Venue` table to see:
- All your created venues
- Fields: id, name, slug, mode, pricing, etc.

---

## 📸 Expected Screens

### **1. Empty State**
```
╔════════════════════════════════════════╗
║         🎵 No venues yet               ║
║                                        ║
║  Create your first venue to start     ║
║  managing music playback...           ║
║                                        ║
║     [Create Your First Venue]         ║
╚════════════════════════════════════════╝
```

### **2. Venues List**
```
╔════════════════════════════════════════╗
║ Venues                [Create Venue]   ║
║ Manage your music venues...            ║
║----------------------------------------║
║ The Groove Bar        [QUEUE] [ACTIVE] ║
║ 123 Main Street                        ║
║ 💰 USD 2.99 per song                   ║
║ ⚠ Spotify Not Connected                ║
║                      [Edit]  [Delete]  ║
║----------------------------------------║
║ Jazz Club Downtown [AUTOMATION][ACTIVE]║
║ 456 Jazz Ave                           ║
║ ✓ Spotify Connected                    ║
║                      [Edit]  [Delete]  ║
╚════════════════════════════════════════╝
```

---

## ✅ Testing Checklist

Use this to verify everything works:

- [ ] Database starts successfully
- [ ] Schema pushed without errors
- [ ] Dev server starts on port 4002
- [ ] Can create an account
- [ ] Can create a team
- [ ] "Venues" appears in navigation
- [ ] Empty state shows initially
- [ ] "Create Venue" modal opens
- [ ] Can create a venue with all fields
- [ ] Venue appears in list immediately
- [ ] Badges display correctly
- [ ] Can open edit modal
- [ ] Can update venue
- [ ] Changes reflect immediately
- [ ] Delete confirmation appears
- [ ] Can delete venue
- [ ] Venue removed from list
- [ ] Toast notifications work
- [ ] Page refresh preserves data

---

## 🚀 Quick Commands Reference

```bash
# Start everything
docker compose up -d db
npx prisma db push
npm run dev

# Stop everything
docker compose down

# Reset database
npx prisma db push --force-reset

# View database
npx prisma studio

# Run linting
npm run check-lint

# Run type check
npm run check-types
```

---

## 🎉 Success Criteria

You know it's working when:

1. ✅ You can navigate to Venues page
2. ✅ You can create a venue
3. ✅ The venue appears with correct information
4. ✅ You can edit and see changes
5. ✅ You can delete and it disappears
6. ✅ All forms validate properly
7. ✅ No console errors in browser DevTools

---

## 📞 Need Help?

If something doesn't work:

1. Check browser console (F12) for errors
2. Check terminal for server errors
3. Verify `.env` has required variables
4. Try clearing browser cache/cookies
5. Restart dev server
6. Check Docker container logs: `docker compose logs db`

---

**Happy Testing! 🎵**



