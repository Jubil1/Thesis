-- ==========================================================
-- Barangay Profiling System — Database Schema
-- ==========================================================
-- This file creates all the tables we need.
-- Run it with:  psql -U postgres -d barangay -f db/schema.sql
-- ==========================================================

-- ── Users (admins & residents who can log in) ────────────
-- Replaces: data/users.json
CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,      -- auto-incrementing ID
    name          TEXT NOT NULL,
    username      TEXT NOT NULL UNIQUE,     -- must be unique
    email         TEXT DEFAULT '',
    password      TEXT NOT NULL,            -- bcrypt hash
    role          TEXT NOT NULL DEFAULT 'resident',  -- 'admin' or 'resident'
    super_admin   BOOLEAN DEFAULT FALSE,
    permissions   TEXT[] DEFAULT '{}'       -- array of strings like {'fees','puroks'}
);

-- ── Residents (full profile records) ─────────────────────
-- Replaces: data/residents.json
CREATE TABLE IF NOT EXISTS residents (
    id                   SERIAL PRIMARY KEY,
    first_name           TEXT NOT NULL,
    middle_name          TEXT DEFAULT '',
    last_name            TEXT NOT NULL,
    suffix               TEXT DEFAULT '',
    sex                  TEXT DEFAULT '',
    civil_status         TEXT DEFAULT '',
    birthdate            TEXT DEFAULT '',
    birthplace           TEXT DEFAULT '',
    religion             TEXT DEFAULT '',
    citizenship          TEXT DEFAULT '',
    purok                TEXT DEFAULT '',
    barangay             TEXT DEFAULT 'Tibanga',
    city                 TEXT DEFAULT 'Iligan City',
    mobile_number        TEXT DEFAULT '',
    email                TEXT DEFAULT '',
    mothers_maiden_name  TEXT DEFAULT '',
    fathers_name         TEXT DEFAULT '',
    spouses_name         TEXT DEFAULT '',
    childs_name          TEXT DEFAULT '',
    childs_mother        TEXT DEFAULT '',
    children             TEXT[] DEFAULT '{}',
    username             TEXT DEFAULT '',
    password             TEXT DEFAULT '',
    id_picture           TEXT DEFAULT ''    -- base64-encoded image (can be very long)
);

-- ── Requests (document requests from residents) ──────────
-- Replaces: data/requests.json (top-level fields)
CREATE TABLE IF NOT EXISTS requests (
    id                BIGSERIAL PRIMARY KEY,       -- BIGSERIAL because IDs are timestamps
    request_no        TEXT NOT NULL,
    resident_name     TEXT NOT NULL,
    total_amount      NUMERIC(10,2) DEFAULT 0,
    date              TEXT DEFAULT '',
    status            TEXT DEFAULT 'pending',     -- pending, approved, completed, rejected
    payment_method    TEXT DEFAULT 'cash',
    reference_no      TEXT DEFAULT '',
    rejection_reason  TEXT DEFAULT ''
);

-- ── Request Documents (items inside each request) ────────
-- Replaces: the "documents" array nested inside each request
-- Each row is one document line-item that belongs to a request.
CREATE TABLE IF NOT EXISTS request_documents (
    id          BIGSERIAL PRIMARY KEY,
    request_id  BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    quantity    INTEGER DEFAULT 1,
    unit_price  NUMERIC(10,2) DEFAULT 0,
    total       NUMERIC(10,2) DEFAULT 0
);

-- ── Documents (template files the admin uploads) ─────────
-- Replaces: data/documents.json
CREATE TABLE IF NOT EXISTS documents (
    id             BIGSERIAL PRIMARY KEY,  -- BIGSERIAL because IDs are timestamps
    name           TEXT NOT NULL,
    preview        TEXT DEFAULT '',   -- path to preview image
    file           TEXT DEFAULT '',   -- path to the document file
    date_modified  TEXT DEFAULT '',
    date_uploaded  TEXT DEFAULT ''
);

-- ── Settings (key-value store for system config) ─────────
-- Replaces: data/settings.json
-- We store the documentFees array and puroks array as JSONB.
-- JSONB = JSON stored in a binary format — PostgreSQL can search inside it.
CREATE TABLE IF NOT EXISTS settings (
    key    TEXT PRIMARY KEY,
    value  JSONB NOT NULL DEFAULT '[]'
);

-- ── Announcements ────────────────────────────────────────
-- Replaces: data/announcements.json
CREATE TABLE IF NOT EXISTS announcements (
    id             SERIAL PRIMARY KEY,
    title          TEXT DEFAULT '',
    content        TEXT DEFAULT '',
    date           TEXT DEFAULT '',
    date_modified  TEXT DEFAULT ''
);

-- ── Homepage Content ─────────────────────────────────────
-- Replaces: data/homepage.json
-- Single-row table, the whole homepage JSON is stored in `value`.
CREATE TABLE IF NOT EXISTS homepage (
    key    TEXT PRIMARY KEY,
    value  JSONB NOT NULL DEFAULT '{}'
);
