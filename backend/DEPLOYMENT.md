# Driver Management System - VPS Deployment Guide

Complete deployment guide for Hetzner CX23 VPS (Ubuntu 22.04).

## Architecture

```
Internet → Nginx (HTTPS) → Node.js (PM2) → PostgreSQL (localhost)
```

## Table of Contents

1. [Initial Server Setup](#1-initial-server-setup)
2. [Install Node.js 20](#2-install-nodejs-20)
3. [Install PostgreSQL 15](#3-install-postgresql-15)
4. [Configure PostgreSQL](#4-configure-postgresql)
5. [Deploy Application](#5-deploy-application)
6. [Configure PM2](#6-configure-pm2)
7. [Configure Nginx](#7-configure-nginx)
8. [SSL Certificate](#8-ssl-certificate)
9. [Firewall Setup](#9-firewall-setup)
10. [Security Checklist](#10-security-checklist)

---

## 1. Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Set timezone
sudo timedatectl set-timezone Europe/Berlin

# Create app user (non-root)
sudo adduser --disabled-password --gecos "" driverapp
sudo usermod -aG sudo driverapp

# Set up SSH key for driverapp user (optional but recommended)
sudo mkdir -p /home/driverapp/.ssh
sudo cp ~/.ssh/authorized_keys /home/driverapp/.ssh/
sudo chown -R driverapp:driverapp /home/driverapp/.ssh
sudo chmod 700 /home/driverapp/.ssh
sudo chmod 600 /home/driverapp/.ssh/authorized_keys
```

---

## 2. Install Node.js 20

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version

# Install yarn globally
sudo npm install -g yarn
```

---

## 3. Install PostgreSQL 15

```bash
# Add PostgreSQL repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -
sudo apt update

# Install PostgreSQL 15
sudo apt install -y postgresql-15 postgresql-contrib-15

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
sudo -u postgres psql -c "SELECT version();"
```

---

## 4. Configure PostgreSQL

### 4.1 Secure PostgreSQL (localhost only)

```bash
# Edit postgresql.conf
sudo nano /etc/postgresql/15/main/postgresql.conf

# Ensure these settings:
listen_addresses = 'localhost'
port = 5432
```

### 4.2 Configure Authentication

```bash
# Edit pg_hba.conf
sudo nano /etc/postgresql/15/main/pg_hba.conf

# Ensure these lines (local connections only):
local   all             postgres                                peer
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256
host    all             all             ::1/128                 scram-sha-256
```

### 4.3 Create Database and User

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database user (use a STRONG password!)
CREATE USER driveradmin WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

# Create database
CREATE DATABASE driverdb OWNER driveradmin;

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE driverdb TO driveradmin;

# Exit psql
\q

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### 4.4 Test Connection

```bash
psql -h localhost -U driveradmin -d driverdb -c "SELECT 1;"
```

---

## 5. Deploy Application

### 5.1 Create Application Directory

```bash
sudo mkdir -p /var/www/driver-management
sudo chown driverapp:driverapp /var/www/driver-management
```

### 5.2 Upload Application Files

**Option A: From Git repository**
```bash
sudo -u driverapp git clone https://github.com/YOUR_REPO/driver-management.git /var/www/driver-management
```

**Option B: Using SCP**
```bash
# From your local machine:
scp -r ./backend/* driverapp@YOUR_SERVER_IP:/var/www/driver-management/
```

### 5.3 Configure Environment

```bash
cd /var/www/driver-management

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

**Required .env settings:**
```env
DATABASE_URL=postgresql://driveradmin:YOUR_STRONG_PASSWORD@localhost:5432/driverdb
SESSION_SECRET=YOUR_32_CHAR_SECRET_HERE
NODE_ENV=production
PORT=3000
```

Generate SESSION_SECRET:
```bash
openssl rand -hex 32
```

### 5.4 Install Dependencies

```bash
cd /var/www/driver-management
yarn install --production
```

### 5.5 Build Tailwind CSS

```bash
yarn build:css
```

### 5.6 Initialize Database

```bash
node db/seed.js
```

**IMPORTANT:** Note the temporary admin password shown. You MUST change it on first login.

---

## 6. Configure PM2

### 6.1 Install PM2

```bash
sudo npm install -g pm2
```

### 6.2 Create PM2 Logs Directory

```bash
sudo mkdir -p /var/log/pm2
sudo chown driverapp:driverapp /var/log/pm2
```

### 6.3 Start Application

```bash
cd /var/www/driver-management
pm2 start ecosystem.config.js

# Check status
pm2 status

# View logs
pm2 logs driver-management
```

### 6.4 Configure PM2 Startup

```bash
# Generate startup script
pm2 startup systemd -u driverapp --hp /home/driverapp

# Save current process list
pm2 save
```

### 6.5 PM2 Management Commands

```bash
pm2 restart driver-management  # Restart app
pm2 stop driver-management     # Stop app
pm2 delete driver-management   # Remove from PM2
pm2 logs driver-management     # View logs
pm2 monit                      # Monitor dashboard
```

---

## 7. Configure Nginx

### 7.1 Install Nginx

```bash
sudo apt install -y nginx
```

### 7.2 Create Nginx Configuration

```bash
# Copy example config
sudo cp /var/www/driver-management/nginx.conf.example /etc/nginx/sites-available/driver-management

# Edit and replace YOUR_DOMAIN.com
sudo nano /etc/nginx/sites-available/driver-management
```

### 7.3 Enable Site

```bash
# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Enable driver-management site
sudo ln -s /etc/nginx/sites-available/driver-management /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## 8. SSL Certificate (Let's Encrypt)

### 8.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Obtain Certificate

```bash
# Make sure DNS is pointing to your server first!
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com
```

### 8.3 Auto-Renewal

Certbot automatically creates a renewal timer. Verify:
```bash
sudo systemctl status certbot.timer
```

Test renewal:
```bash
sudo certbot renew --dry-run
```

---

## 9. Firewall Setup (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH (IMPORTANT: do this first!)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Nginx Full'

# Deny direct access to Node.js port
sudo ufw deny 3000

# Check status
sudo ufw status
```

**Expected output:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
Nginx Full                 ALLOW       Anywhere
3000                       DENY        Anywhere
```

---

## 10. Security Checklist

### Pre-Deployment
- [ ] Strong PostgreSQL password (min 16 chars, mixed case, numbers, symbols)
- [ ] Strong SESSION_SECRET (32+ random hex characters)
- [ ] No default credentials in production
- [ ] `.env` file has correct permissions (chmod 600)

### Post-Deployment
- [ ] Changed default admin password on first login
- [ ] SSL certificate installed and working
- [ ] HTTP redirects to HTTPS
- [ ] Firewall enabled (UFW)
- [ ] Port 3000 not accessible from internet
- [ ] PostgreSQL only listening on localhost
- [ ] PM2 configured for auto-restart

### Ongoing
- [ ] Regular system updates: `sudo apt update && sudo apt upgrade`
- [ ] Monitor logs: `pm2 logs` and `/var/log/nginx/`
- [ ] Backup database regularly

---

## Maintenance Commands

### View Application Logs
```bash
pm2 logs driver-management
tail -f /var/www/driver-management/logs/access.log
```

### View Nginx Logs
```bash
sudo tail -f /var/log/nginx/driver-management.access.log
sudo tail -f /var/log/nginx/driver-management.error.log
```

### Database Backup
```bash
pg_dump -h localhost -U driveradmin driverdb > backup_$(date +%Y%m%d).sql
```

### Database Restore
```bash
psql -h localhost -U driveradmin driverdb < backup_20240101.sql
```

### Application Update
```bash
cd /var/www/driver-management
git pull origin main  # or upload new files
yarn install --production
yarn build:css
pm2 restart driver-management
```

---

## Troubleshooting

### App Not Starting
```bash
# Check PM2 logs
pm2 logs driver-management --lines 100

# Check if port is in use
sudo lsof -i :3000
```

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -h localhost -U driveradmin -d driverdb -c "SELECT 1;"
```

### Nginx 502 Bad Gateway
```bash
# Check if Node.js is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/driver-management.error.log
```

### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Force renewal
sudo certbot renew --force-renewal
```
