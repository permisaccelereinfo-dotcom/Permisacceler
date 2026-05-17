-- Migration: Add address and birth info fields to public.users
-- Run this in your Supabase SQL Editor

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS date_naissance DATE,
  ADD COLUMN IF NOT EXISTS ville_naissance TEXT,
  ADD COLUMN IF NOT EXISTS adresse TEXT,
  ADD COLUMN IF NOT EXISTS complement_adresse TEXT,
  ADD COLUMN IF NOT EXISTS code_postal TEXT;
