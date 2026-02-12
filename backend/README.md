# Driver Management System

A production-ready driver management system built with Node.js, Express, PostgreSQL, and EJS.

## Features

- **Role-based Authentication**: Admin and Partner roles with different permissions
- **Dashboard**: Overview of all drivers with statistics
- **Driver Management**: Add, edit, delete, and change status of drivers (Admin)
- **Status Changes**: Partners can change driver status
- **Extra Sticker List**: Manage additional stickers
- **Empfehlungscode**: Manage recommendations
- **CSV Export**: Export driver data (Admin only)
- **Mobile Responsive**: Works on all devices

## Tech Stack

- Node.js + Express
- PostgreSQL (no JSON storage)
- EJS templating
- TailwindCSS
- bcrypt for password hashing
- express-session for authentication
- express-rate-limit for security

## Database Tables

1. **users** - User authentication
2. **drivers** - Driver information
3. **extra_sticker** - Extra sticker entries
4. **empfehlungen** - Recommendations

## Deployment on Render

### Prerequisites

1. Create a PostgreSQL database (e.g., on Supabase)
2. Create a Render account

### Environment Variables

Set these in Render dashboard:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Random secret for sessions (min 32 chars) |
| `NODE_ENV` | Set to `production` |
| `PORT` | Render sets this automatically |

### Deployment Steps

1. Push code to GitHub
2. Create new Web Service on Render
3. Connect your GitHub repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy

### Initialize Database

After deployment, run the seed script to create the admin user:

```bash
npm run seed
```

Or run SQL schema manually in your PostgreSQL client.

## Default Admin Credentials

- **Username**: admin
- **Password**: Admin123!

⚠️ **Change the password after first login in production!**

## Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create `.env` file:
   ```
   DATABASE_URL=postgresql://user:password@localhost:5432/driver_management
   SESSION_SECRET=your-secret-key-min-32-characters-long
   NODE_ENV=development
   PORT=3000
   ```
4. Run migrations/seed:
   ```bash
   npm run seed
   ```
5. Start development server:
   ```bash
   npm run dev
   ```

## Security Features

- Password hashing with bcrypt (12 rounds)
- Session-based authentication
- Rate limiting on login (5 attempts per 15 minutes)
- HTTP-only cookies
- Role-based access control enforced on backend
- No credentials logged to console
- Environment variables for all secrets

## API Routes

| Route | Method | Description | Access |
|-------|--------|-------------|--------|
| `/auth/login` | GET/POST | Login page | Public |
| `/auth/logout` | GET | Logout | Authenticated |
| `/dashboard` | GET | Dashboard with stats | Authenticated |
| `/dashboard/export` | GET | CSV export | Admin |
| `/drivers/add` | POST | Add driver | Admin |
| `/drivers/update/:id` | POST | Update driver | Admin |
| `/drivers/status/:id` | POST | Change status | Authenticated |
| `/drivers/delete/:id` | POST | Delete driver | Admin |
| `/sticker` | GET | Sticker list | Authenticated |
| `/sticker/add` | POST | Add sticker | Admin |
| `/sticker/delete/:id` | POST | Delete sticker | Admin |
| `/empfehlungen` | GET | Empfehlungen list | Authenticated |
| `/empfehlungen/add` | POST | Add empfehlung | Admin |
| `/empfehlungen/delete/:id` | POST | Delete empfehlung | Admin |
