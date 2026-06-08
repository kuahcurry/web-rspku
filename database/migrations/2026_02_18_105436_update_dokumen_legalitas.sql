-- Migration: Update dokumen_legalitas for multiple documents
-- Date: 2026-02-18
-- Purpose: Allow multiple documents per type per user and adjust field names

-- IMPORTANT: If you get error about foreign key constraint, use the alternative method below

-- Method 1: Standard approach (try this first)
-- =============================================

-- Step 1: Drop unique constraint
ALTER TABLE `dokumen_legalitas` DROP INDEX IF EXISTS `dokumen_legalitas_user_id_jenis_dokumen_unique`;

-- Step 2: Rename tanggal_berlaku to berlaku_sampai
ALTER TABLE `dokumen_legalitas` CHANGE COLUMN `tanggal_berlaku` `berlaku_sampai` DATE NULL;

-- Step 3: Rename tanggal_mulai to tanggal_lulus
ALTER TABLE `dokumen_legalitas` CHANGE COLUMN `tanggal_mulai` `tanggal_lulus` DATE NULL;


-- Method 2: If you get FK constraint error (use this instead)
-- =============================================
-- This error happens when the unique index is part of a foreign key constraint

-- Step 1: Show all constraints to identify the FK name
-- Run this first to see constraint names:
-- SELECT 
--     CONSTRAINT_NAME, 
--     TABLE_NAME,
--     CONSTRAINT_TYPE
-- FROM information_schema.TABLE_CONSTRAINTS 
-- WHERE TABLE_NAME = 'dokumen_legalitas' 
--     AND TABLE_SCHEMA = 'u814122097_keperawatanpku';

-- Step 2: If there's a FK using this index, you might need to:
-- a) Drop the FK first
-- b) Drop the unique index
-- c) Recreate the FK (if needed)

-- Example (adjust FK name based on your database):
-- ALTER TABLE `dokumen_legalitas` DROP FOREIGN KEY `fk_name_here`;
-- ALTER TABLE `dokumen_legalitas` DROP INDEX `dokumen_legalitas_user_id_jenis_dokumen_unique`;
-- ALTER TABLE `dokumen_legalitas` ADD CONSTRAINT `fk_name_here` 
--     FOREIGN KEY (`user_id`) REFERENCES `users_registration` (`id`) ON DELETE CASCADE;

-- Step 3: Then do the renames
-- ALTER TABLE `dokumen_legalitas` CHANGE COLUMN `tanggal_berlaku` `berlaku_sampai` DATE NULL;
-- ALTER TABLE `dokumen_legalitas` CHANGE COLUMN `tanggal_mulai` `tanggal_lulus` DATE NULL;


-- Method 3: Nuclear option - if nothing else works
-- =============================================
-- Create new table, copy data, drop old, rename new

-- CREATE TABLE `dokumen_legalitas_new` LIKE `dokumen_legalitas`;

-- ALTER TABLE `dokumen_legalitas_new` DROP INDEX IF EXISTS `dokumen_legalitas_user_id_jenis_dokumen_unique`;
-- ALTER TABLE `dokumen_legalitas_new` CHANGE COLUMN `tanggal_berlaku` `berlaku_sampai` DATE NULL;
-- ALTER TABLE `dokumen_legalitas_new` CHANGE COLUMN `tanggal_mulai` `tanggal_lulus` DATE NULL;

-- INSERT INTO `dokumen_legalitas_new` 
--     SELECT `id`, `user_id`, `jenis_dokumen`, `nomor_sk`, 
--            `tanggal_lulus`, `berlaku_sampai`, `file_path`, 
--            `created_at`, `updated_at`, 
--            `warning_30_days_sent_at`, `warning_14_days_sent_at`, 
--            `warning_7_days_sent_at`, `warning_180_days_sent_at`, 
--            `warning_90_days_sent_at`
--     FROM `dokumen_legalitas`;

-- DROP TABLE `dokumen_legalitas`;
-- RENAME TABLE `dokumen_legalitas_new` TO `dokumen_legalitas`;


-- Verification Query
-- =============================================
-- Run this after migration to verify changes:
-- DESCRIBE `dokumen_legalitas`;
-- SHOW INDEX FROM `dokumen_legalitas`;


-- Rollback SQL (if needed)
-- =============================================
-- ALTER TABLE `dokumen_legalitas` CHANGE COLUMN `tanggal_lulus` `tanggal_mulai` DATE NULL;
-- ALTER TABLE `dokumen_legalitas` CHANGE COLUMN `berlaku_sampai` `tanggal_berlaku` DATE NULL;
-- ALTER TABLE `dokumen_legalitas` ADD UNIQUE KEY `dokumen_legalitas_user_id_jenis_dokumen_unique` (`user_id`, `jenis_dokumen`);
