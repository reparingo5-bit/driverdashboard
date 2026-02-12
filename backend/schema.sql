-- ===========================================
-- Driver Management System - PostgreSQL Schema
-- Version: 1.0.0
-- ===========================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===========================================
-- USERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'partner')),
    must_change_password BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- DRIVERS TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vorname VARCHAR(255) NOT NULL,
    nachname VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    status VARCHAR(50) NOT NULL DEFAULT 'neu' CHECK (status IN ('aktiv', 'inaktiv', 'neu')),
    fahrzeugtyp VARCHAR(50) NOT NULL CHECK (fahrzeugtyp IN ('Fahrrad', 'PKW', 'Caddy', 'Transporter')),
    kennzeichen VARCHAR(50),
    sticker BOOLEAN DEFAULT false,
    app BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- EXTRA STICKER TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS extra_sticker (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kennzeichen VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- EMPFEHLUNGEN TABLE
-- ===========================================
CREATE TABLE IF NOT EXISTS empfehlungen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vorname VARCHAR(255) NOT NULL,
    nachname VARCHAR(255) NOT NULL,
    abholort VARCHAR(255) NOT NULL,
    abgabeort VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON drivers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extra_sticker_created_at ON extra_sticker(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_empfehlungen_created_at ON empfehlungen(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ===========================================
-- TRIGGER FOR updated_at
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at
    BEFORE UPDATE ON drivers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
