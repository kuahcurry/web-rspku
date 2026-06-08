-- DIAGNOSTIC SCRIPT
-- Run this first to see what constraints exist on dokumen_legalitas table
-- This will help you understand what needs to be dropped

-- 1. Show all constraints on the table
SELECT 
    CONSTRAINT_NAME, 
    CONSTRAINT_TYPE,
    TABLE_NAME
FROM information_schema.TABLE_CONSTRAINTS 
WHERE TABLE_NAME = 'dokumen_legalitas' 
    AND TABLE_SCHEMA = 'u814122097_keperawatanpku';

-- 2. Show all indexes on the table
SHOW INDEX FROM `dokumen_legalitas`;

-- 3. Show foreign key details
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_NAME = 'dokumen_legalitas'
    AND TABLE_SCHEMA = 'u814122097_keperawatanpku'
    AND REFERENCED_TABLE_NAME IS NOT NULL;

-- 4. Show table structure
DESCRIBE `dokumen_legalitas`;


-- BASED ON THE OUTPUT ABOVE, USE ONE OF THESE SOLUTIONS:
-- ========================================================

-- SOLUTION A: If you see the unique index is NOT tied to any FK
-- Just drop the index by name
ALTER TABLE `dokumen_legalitas` DROP INDEX `dokumen_legalitas_user_id_jenis_dokumen_unique`;


-- SOLUTION B: If the index IS tied to a FK (most likely your case)
-- Replace 'dokumen_legalitas_user_id_foreign' with actual FK name from query above
ALTER TABLE `dokumen_legalitas` DROP FOREIGN KEY `dokumen_legalitas_user_id_foreign`;
ALTER TABLE `dokumen_legalitas` DROP INDEX `dokumen_legalitas_user_id_jenis_dokumen_unique`;

-- Recreate the FK without the unique constraint on jenis_dokumen
ALTER TABLE `dokumen_legalitas` 
    ADD CONSTRAINT `dokumen_legalitas_user_id_foreign` 
    FOREIGN KEY (`user_id`) 
    REFERENCES `users_registration` (`id`) 
    ON DELETE CASCADE;


-- SOLUTION C: If you just want to allow duplicates without touching anything else
-- Create a temporary table without the unique constraint
CREATE TABLE `dokumen_legalitas_temp` (
    `id` bigint unsigned NOT NULL AUTO_INCREMENT,
    `user_id` bigint unsigned NOT NULL,
    `jenis_dokumen` varchar(255) NOT NULL,
    `nomor_sk` varchar(255) DEFAULT NULL,
    `tanggal_lulus` date DEFAULT NULL,
    `berlaku_sampai` date DEFAULT NULL,
    `file_path` varchar(255) NOT NULL,
    `created_at` timestamp NULL DEFAULT NULL,
    `updated_at` timestamp NULL DEFAULT NULL,
    `warning_30_days_sent_at` timestamp NULL DEFAULT NULL,
    `warning_14_days_sent_at` timestamp NULL DEFAULT NULL,
    `warning_7_days_sent_at` timestamp NULL DEFAULT NULL,
    `warning_180_days_sent_at` timestamp NULL DEFAULT NULL,
    `warning_90_days_sent_at` timestamp NULL DEFAULT NULL,
    PRIMARY KEY (`id`),
    KEY `dokumen_legalitas_user_id_foreign` (`user_id`),
    CONSTRAINT `dokumen_legalitas_user_id_foreign_temp` 
        FOREIGN KEY (`user_id`) 
        REFERENCES `users_registration` (`id`) 
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Copy data with column renames
INSERT INTO `dokumen_legalitas_temp` 
    (`id`, `user_id`, `jenis_dokumen`, `nomor_sk`, `tanggal_lulus`, `berlaku_sampai`, 
     `file_path`, `created_at`, `updated_at`, 
     `warning_30_days_sent_at`, `warning_14_days_sent_at`, `warning_7_days_sent_at`, 
     `warning_180_days_sent_at`, `warning_90_days_sent_at`)
SELECT 
    `id`, `user_id`, `jenis_dokumen`, `nomor_sk`, 
    `tanggal_mulai` AS `tanggal_lulus`, 
    `tanggal_berlaku` AS `berlaku_sampai`, 
    `file_path`, `created_at`, `updated_at`,
    `warning_30_days_sent_at`, `warning_14_days_sent_at`, `warning_7_days_sent_at`,
    `warning_180_days_sent_at`, `warning_90_days_sent_at`
FROM `dokumen_legalitas`;

-- Backup old table (just in case)
RENAME TABLE `dokumen_legalitas` TO `dokumen_legalitas_backup`;

-- Use new table
RENAME TABLE `dokumen_legalitas_temp` TO `dokumen_legalitas`;

-- After verifying everything works, you can drop the backup:
-- DROP TABLE `dokumen_legalitas_backup`;


-- AFTER MIGRATION - VERIFY:
-- =========================
DESCRIBE `dokumen_legalitas`;
SHOW INDEX FROM `dokumen_legalitas`;
SELECT COUNT(*) FROM `dokumen_legalitas`;
