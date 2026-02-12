# Driver Management System

Production-ready driver management system for Hetzner VPS deployment.

## Architecture

```
Internet → Nginx (HTTPS) → Node.js (PM2) → PostgreSQL (localhost)
```

## Tech Stack

- **Backend:** Node.js 20, Express 4
- **Database:** PostgreSQL 15 (local)
- **Templates:** EJS
- **Styling:** TailwindCSS (built for production)
- **Process Manager:** PM2
- **Reverse Proxy:** Nginx
- **SSL:** Let's Encrypt

## Features

- Role-based authentication (admin/partner)
- Dashboard with driver statistics
- Driver management (CRUD)
- Extra sticker list
- Empfehlungscode management
- CSV export
- Mobile responsive
- Forced password change on first login

## Folder Structure

```
driver-management/
├── db/
│   ├── database.js        # Database connection pool
│   └── seed.js            # Database initialization script
├── middleware/
│   └── auth.js            # Authentication middleware
├── public/
│   └── css/
│       └── style.css      # Built Tailwind CSS (production)
├── routes/
│   ├── auth.js            # Login/logout/password change
│   ├── dashboard.js       # Dashboard & CSV export
│   ├── drivers.js         # Driver CRUD
│   ├── empfehlungen.js    # Empfehlungen CRUD
│   └── sticker.js         # Extra sticker CRUD
├── src/
│   └── input.css          # Tailwind source CSS
├── views/
│   ├── change-password.ejs
│   ├── dashboard.ejs
│   ├── empfehlungen.ejs
│   ├── error.ejs
│   ├── layout.ejs
│   ├── login.ejs
│   └── sticker.ejs
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example           # Environment template
├── DEPLOYMENT.md          # Full VPS deployment guide
├── ecosystem.config.js    # PM2 configuration
├── nginx.conf.example     # Nginx configuration template
├── package.json
├── schema.sql             # PostgreSQL schema
├── server.js              # Main application entry
└── tailwind.config.js     # Tailwind configuration
```

## Quick Start (Development)

```bash
# Install dependencies
yarn install

# Create .env from template
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
node db/seed.js

# Start development server
yarn dev
```

## Production Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete Hetzner VPS deployment guide.

### Quick Reference

```bash
# Build CSS for production
yarn build:css

# Start with PM2
pm2 start ecosystem.config.js

# View logs
pm2 logs driver-management
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | Min 32 character secret |
| `NODE_ENV` | Yes | `production` or `development` |
| `PORT` | No | Default: 3000 |

## Security Features

- bcrypt password hashing (12 rounds)
- Session-based auth with secure cookies
- Rate limiting on login (5 attempts/15 min)
- Forced password change on first login
- Helmet security headers
- HTTPS enforced via Nginx
- PostgreSQL localhost only

## API Routes

| Route | Method | Access | Description |
|-------|--------|--------|-------------|
| `/auth/login` | GET/POST | Public | Login page |
| `/auth/logout` | GET | Auth | Logout |
| `/auth/change-password` | GET/POST | Auth | Change password |
| `/dashboard` | GET | Auth | Dashboard |
| `/dashboard/export` | GET | Admin | CSV export |
| `/drivers/add` | POST | Admin | Add driver |
| `/drivers/update/:id` | POST | Admin | Update driver |
| `/drivers/status/:id` | POST | Auth | Change status |
| `/drivers/delete/:id` | POST | Admin | Delete driver |
| `/sticker` | GET | Auth | Sticker list |
| `/sticker/add` | POST | Admin | Add sticker |
| `/empfehlungen` | GET | Auth | Empfehlungen list |
| `/empfehlungen/add` | POST | Admin | Add empfehlung |

## License

Private - All rights reserved
