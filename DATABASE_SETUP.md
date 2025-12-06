# Database Setup Instructions

## 1. Create MySQL Database

Open your MySQL client (phpMyAdmin, MySQL Workbench, or command line) and run:

```sql
CREATE DATABASE IF NOT EXISTS `keperawatan-pku` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
```

## 2. Update Laravel Environment File

Edit the `.env` file and set your MySQL credentials:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=keperawatan-pku
DB_USERNAME=root
DB_PASSWORD=your_mysql_password_here
```

**Important:** Replace `your_mysql_password_here` with your actual MySQL root password.

## 3. Run Laravel Migrations

After updating the `.env` file, run:

```bash
cd C:\Users\aqefh\Documents\Projects\web-rs
php artisan migrate
```

## Database Schema

The migration will create a `users_registration` table with these fields:

| Field     | Type         | Description                    |
|-----------|--------------|--------------------------------|
| id        | BIGINT       | Primary key (auto-increment)   |
| nip       | VARCHAR(18)  | NIP (unique)                   |
| nik       | VARCHAR(16)  | NIK (unique)                   |
| name      | VARCHAR(255) | Full name                      |
| email     | VARCHAR(255) | Email (unique)                 |
| phone     | VARCHAR(15)  | Phone number                   |
| province  | VARCHAR(255) | Province name                  |
| regency   | VARCHAR(255) | Regency/City name              |
| district  | VARCHAR(255) | District name                  |
| village   | VARCHAR(255) | Village name                   |
| address   | TEXT         | Detailed address               |
| password  | VARCHAR(255) | Hashed password                |
| created_at| TIMESTAMP    | Record creation time           |
| updated_at| TIMESTAMP    | Record last update time        |

## Migration File Location

The migration file is located at:
```
database/migrations/2025_12_06_143053_create_users_registration_table.php
```

## Troubleshooting

### If you get "Access denied" error:
1. Check your MySQL password in the `.env` file
2. Make sure MySQL service is running
3. Verify your MySQL user has proper permissions

### If database already exists:
Use `php artisan migrate:fresh` to drop all tables and re-run migrations (⚠️ This will delete all data!)

### To rollback the migration:
```bash
php artisan migrate:rollback
```
