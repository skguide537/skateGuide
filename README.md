# SkateGuide

A Next.js application for finding and sharing skate spots.

## Features

- Interactive map with skate spot locations
- User authentication (login/register)
- Add and manage skate spots
- View spot details and information

## Tech Stack

- Next.js 14
- TypeScript
- MongoDB
- React Leaflet
- MUI
- JWT Authentication

## Prerequisites

- Node.js 18+ 
- MongoDB Atlas account or local MongoDB instance
- Google Maps API key (for map functionality)

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd skateGuide
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
- Copy `.env.example` to `.env.local`
- Fill in the required environment variables

4. Run the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
src/
├── app/              # Next.js app router
│   ├── (auth)/      # Authentication routes
│   ├── (main)/      # Main application routes
│   └── api/         # API routes
├── components/       # React components
├── lib/             # Utility functions
├── models/          # Database models
└── services/        # Business logic
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
