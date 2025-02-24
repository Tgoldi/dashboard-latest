# Dashboard Latest - Admin Management System

A modern, secure, and feature-rich dashboard for managing assistants, users, and permissions with role-based access control.

## Features

- 🔐 **Role-Based Access Control (RBAC)**:
  - Owner: Full system access and management
  - Admin: Manage assigned assistants and created users
  - Editor: Access to assigned assistants and QA form
  - User: Basic access to assigned assistants

- 👥 **User Management**:
  - Create and manage users with different roles
  - Assign assistants to users
  - QA form for editors with multilingual support

- 🤖 **Assistant Management**:
  - View and manage AI assistants
  - Track assistant analytics and performance
  - Monitor call statistics and transcripts

- 🌐 **Multilingual Support**:
  - English and Hebrew interfaces
  - Translatable QA forms and content
  - RTL support for Hebrew

- 📊 **Analytics & Monitoring**:
  - Call statistics and metrics
  - Cost tracking and analysis
  - Performance monitoring

## Tech Stack

- **Frontend**:
  - React with TypeScript
  - Tailwind CSS
  - Shadcn UI Components
  - Framer Motion for animations

- **Backend**:
  - Node.js/Express
  - Supabase for database and authentication
  - Row Level Security (RLS) for data protection

- **APIs & Services**:
  - VAPI AI integration
  - Real-time updates
  - WebSocket support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- VAPI AI account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Tgoldi/dashboard-latest.git
   cd dashboard-latest
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase and VAPI credentials

4. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Database Setup

1. Run Supabase migrations:
   ```bash
   supabase db reset
   ```

2. Apply RLS policies:
   ```bash
   supabase db push
   ```

## Security Model

### Role-Based Access Control

- **Owner**:
  - Full access to all users and assistants
  - Can manage system settings and permissions

- **Admin**:
  - Can create editors and users
  - Can manage assistants assigned to users they created
  - Limited to viewing and managing their created users

- **Editor**:
  - Access to assigned assistants
  - Can submit and manage QA forms
  - Limited to their assigned resources

- **User**:
  - Basic access to assigned assistants
  - View-only permissions for most features

### Row Level Security (RLS)

Detailed RLS policies ensure data security:

- User table policies control access to user data
- Assistant table policies manage assistant visibility
- Cross-table policies maintain referential integrity

## API Documentation

### Authentication Endpoints

- `POST /api/auth/signup`: Create new user account
- `POST /api/auth/login`: User authentication
- `POST /api/auth/logout`: End user session

### User Management

- `GET /api/users`: List users (role-based results)
- `POST /api/users`: Create new user
- `PUT /api/users/:id`: Update user details
- `DELETE /api/users/:id`: Remove user

### Assistant Management

- `GET /api/assistants`: List assistants (role-based results)
- `GET /api/assistants/:id/analytics`: Get assistant analytics
- `GET /api/assistants/:id/calls`: Get call history

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@example.com or open an issue in the GitHub repository. 