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

## Comments API

The Comments API allows users to post, edit, and delete comments on skateparks.

### Endpoints

#### GET /api/comments
List comments for a skatepark with pagination.

**Query Parameters:**
- `skateparkId` (required): The ID of the skatepark
- `page` (optional): Page number (default: 1)
- `limit` (optional): Comments per page (default: 20, max: 50)

**Response:**
```json
{
  "items": [
    {
      "id": "comment_id",
      "skateparkId": "skatepark_id", 
      "userId": "user_id",
      "body": "Comment text",
      "isDeleted": false,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "editedAt": "2024-01-01T00:00:00.000Z",
      "canEdit": true,
      "canDelete": true
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 5
}
```

#### POST /api/comments
Create a new comment (requires authentication).

**Request Body:**
```json
{
  "skateparkId": "skatepark_id",
  "commentBody": "Comment text"
}
```

**Response:** CommentDTO object (same as above)

#### PATCH /api/comments/[id]
Edit a comment (requires authentication, owner or admin only).

**Request Body:**
```json
{
  "commentBody": "Updated comment text"
}
```

**Response:** CommentDTO object

#### DELETE /api/comments/[id]
Delete a comment (requires authentication, owner or admin only).

**Query Parameters:**
- `hard` (optional): Set to "true" for hard delete (admin only)

**Response:** 
- Soft delete: CommentDTO object with `isDeleted: true`
- Hard delete: `{ "success": true }`

### Validation Rules
- Comment body: 1-2000 characters
- Page: minimum 1
- Limit: 1-50 (clamped automatically)
- All IDs must be valid MongoDB ObjectIds

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
