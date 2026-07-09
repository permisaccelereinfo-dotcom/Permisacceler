-- Migration: Add email tracking fields to bookings
-- Run this in your Supabase SQL Editor

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS confirmation_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS receipt_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS auto_ecole_notified_at TIMESTAMPTZ;
