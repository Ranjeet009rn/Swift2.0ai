# MLM Swift API Documentation

## Auth
- **POST** `/api/auth/register.php` - Register new user (Creates User + Hierarchy Node + Wallet)
- **POST** `/api/auth/login.php` - Returns Token + Role + User Details

## User Dashboard
- **GET** `/api/user/dashboard.php` - General Stats (Wallet, Team Size)
- **GET** `/api/user/tree.php` - Returns recursive Binary Tree structure
- **GET** `/api/user/wallet.php` - Wallet Balance & History

## Franchise Dashboard
- **GET** `/api/franchise/dashboard.php` - Stock & Sales Stats
- **GET** `/api/franchise/tree.php` - Returns Supply Chain Tree

## Admin Dashboard
- **GET** `/api/admin/dashboard.php` - System-wide Stats
- **GET** `/api/admin/tree.php` - Internal Org Chart
