# Medicine Calendar

A Next.js web application for managing medicine schedules and tracking intake.

## Features

- **User Authentication**: Secure registration and login system using NextAuth.js
- **Medicine Management**: Add medicines with custom schedules (multiple times per day)
- **Calendar View**: Visual weekly calendar showing all scheduled medicines
- **Intake Tracking**: Mark doses as taken or pending with real-time updates
- **PostgreSQL Database**: Persistent storage for all user data

## Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

## Quick Start with Docker

1. Clone the repository:
```bash
git clone <repository-url>
cd medicine-cal
```

2. Create a `.env` file from the example:
```bash
cp .env.example .env
```

3. Update the `.env` file with secure values:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/medicine_cal?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secure-secret-key-here"
```

**Important**: Generate a secure `NEXTAUTH_SECRET` using:
```bash
openssl rand -base64 32
```

4. Start the application:
```bash
docker-compose up
```

The application will be available at http://localhost:3000

## Local Development

1. Install dependencies:
```bash
npm install
```

2. Set up the database:
```bash
# Start PostgreSQL container
docker-compose up postgres -d

# Run database migrations
npx prisma migrate dev
```

3. Start the development server:
```bash
npm run dev
```

## Project Structure

```
medicine-cal/
├── src/
│   ├── pages/           # Next.js pages and API routes
│   ├── components/      # React components
│   ├── lib/            # Utility functions and configurations
│   ├── styles/         # Global styles
│   └── types/          # TypeScript type definitions
├── prisma/
│   └── schema.prisma   # Database schema
├── docker-compose.yml  # Docker configuration
└── Dockerfile         # Container build instructions
```

## Environment Variables

- `DATABASE_URL`: PostgreSQL connection string
- `NEXTAUTH_URL`: Application URL (http://localhost:3000 for local)
- `NEXTAUTH_SECRET`: Secret key for NextAuth.js session encryption

## Database Schema

The application uses the following main entities:
- **Users**: Registered users with authentication
- **Medicines**: Medicine records with date ranges
- **MedicineTimes**: Scheduled times for each medicine
- **Intakes**: Individual dose records with taken status

## Scripts

- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run prisma:migrate`: Run database migrations
- `npm run prisma:studio`: Open Prisma Studio for database inspection

## Security Notes

- Always use strong, unique values for `NEXTAUTH_SECRET` in production
- The default PostgreSQL credentials in docker-compose.yml should be changed for production
- Enable HTTPS in production environments
- Consider adding rate limiting for API endpoints
