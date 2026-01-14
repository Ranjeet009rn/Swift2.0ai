# Tally Support Mobile App

A React Native mobile application for Tally support ticket management with OTP authentication.

## Features

- OTP-based authentication
- Support ticket management (create, view, track)
- Client profile management
- Real-time ticket progress tracking
- Responsive design (web and mobile)

## Tech Stack

- **Frontend:** React Native, Expo
- **Backend:** PHP, MySQL
- **Authentication:** OTP via SMS
- **Storage:** AsyncStorage
- **Navigation:** React Navigation

## Getting Started

### Prerequisites
- Node.js
- Expo CLI
- PHP server with MySQL

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Set up PHP backend in `php-backend/` directory

### Configuration

Update API configuration in `src/config/apiConfig.ts`:
- Set your backend URL
- Configure environment settings

## Project Structure

```
src/
├── components/          # Reusable UI components
├── contexts/           # React contexts (Auth, Theme, CRM)
├── navigation/         # Navigation configuration
├── screens/           # App screens
└── config/           # Configuration files

php-backend/          # PHP API endpoints
```

## Core Features

### Authentication
- License number and mobile-based login
- OTP verification via SMS
- Secure session management

### Ticket Management
- Create support tickets
- View ticket list and details
- Track ticket progress
- Real-time status updates

### Profile Management
- View client information
- Account details
- Contact information

## API Endpoints

- `client_send_otp.php` - Send OTP
- `client_verify_otp.php` - Verify OTP & login
- `client_get_tickets.php` - Get tickets
- `client_create_ticket.php` - Create ticket
- `client_get_ticket_detail.php` - Get ticket details

## License

Private project for SG Connect.
