-- SQL Schema for Driver Management System
-- PostgreSQL

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'partner')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Drivers table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extra Sticker table
CREATE TABLE IF NOT EXISTS extra_sticker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kennzeichen VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Empfehlungen table
CREATE TABLE IF NOT EXISTS empfehlungen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vorname VARCHAR(255) NOT NULL,
  nachname VARCHAR(255) NOT NULL,
  abholort VARCHAR(255) NOT NULL,
  abgabeort VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_created_at ON drivers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_extra_sticker_created_at ON extra_sticker(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_empfehlungen_created_at ON empfehlungen(created_at DESC);
