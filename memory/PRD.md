# Driver Management System PRD

## Architecture
```
Internet → Nginx (HTTPS) → Node.js (PM2) → PostgreSQL (localhost)
```

**Deployment Target:** Hetzner CX23 VPS (Ubuntu 22.04)

## Tech Stack
- Node.js 20 + Express 4
- PostgreSQL 15 (local installation)
- EJS templating
- TailwindCSS (built for production)
- PM2 process manager
- Nginx reverse proxy
- Let's Encrypt SSL

## User Personas
1. **Admin** - Full CRUD access, CSV export, user management
2. **Partner** - Read-only with status change capability

## Implemented Features (Feb 12, 2026)

### Authentication & Security
- [x] Session-based auth with secure cookies
- [x] bcrypt password hashing (12 rounds)
- [x] Rate limiting on login (5/15min)
- [x] Forced password change on first login
- [x] Helmet security headers
- [x] Compression middleware
- [x] Morgan logging

### Dashboard
- [x] Stats cards (Total, Aktiv, Inaktiv, Neu)
- [x] Driver table with CRUD operations
- [x] Status dropdown (all users)
- [x] CSV export (admin only)

### Additional Pages
- [x] Extra Sticker management
- [x] Empfehlungscode management
- [x] Password change page

### Production Optimizations
- [x] Built Tailwind CSS (not CDN)
- [x] PM2 configuration
- [x] Nginx reverse proxy config
- [x] SSL via Let's Encrypt

## Database Schema
- users (UUID, username, password, role, must_change_password)
- drivers (UUID, vorname, nachname, email, phone, status, fahrzeugtyp, kennzeichen, sticker, app)
- extra_sticker (UUID, kennzeichen)
- empfehlungen (UUID, vorname, nachname, abholort, abgabeort)

## Security Checklist
- [x] No hardcoded credentials
- [x] SESSION_SECRET required (32+ chars)
- [x] DATABASE_URL from environment
- [x] PostgreSQL localhost only
- [x] Firewall (UFW) configuration
- [x] HTTPS enforced

## Deployment Files
- DEPLOYMENT.md - Complete VPS setup guide
- ecosystem.config.js - PM2 configuration
- nginx.conf.example - Nginx template
- schema.sql - Database schema

## Next Tasks
1. Deploy to Hetzner VPS
2. Configure domain and DNS
3. Set up SSL certificate
4. Run database seed
5. Configure monitoring (optional)
