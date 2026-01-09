-- Add role column to users_registration table
ALTER TABLE users_registration ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' AFTER email;
ALTER TABLE users_registration ADD INDEX users_registration_role_index (role);

-- Set first user as admin
UPDATE users_registration SET role = 'admin' WHERE id = 1;

-- Delete and re-add migration record
DELETE FROM migrations WHERE migration = '2026_01_09_090522_add_role_to_users_registration_table';
INSERT INTO migrations (migration, batch) VALUES ('2026_01_09_090522_add_role_to_users_registration_table', 3);
