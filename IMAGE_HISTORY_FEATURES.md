# Image History & User Authentication Features

This document describes the new image history and user authentication features added to the Interior Designer AI application.

## Features Added

### 1. User Authentication (LocalStorage-based)

- **User ID Generation**: Each user gets a unique UUID stored in localStorage
- **Persistence**: User ID persists across browser sessions
- **No Server Authentication**: Lightweight solution using only client-side storage

### 2. Image History Storage

- **Database**: SQLite with Prisma ORM
- **Table**: `ImageHistory` with fields:
  - `id` (Int, primary key, autoincrement)
  - `userId` (String)
  - `imageUrl` (String)
  - `createdAt` (DateTime, default now())

### 3. API Routes

#### New API Route: `/api/images`

- **POST** `/api/images` - Save image URL to history
  - Body: `{ userId, imageUrl }`
- **GET** `/api/images?userId=...` - Get all images for a user (most recent first)

#### Modified API Routes

- **POST** `/api/design` - Now accepts `userId` parameter and saves generated images
- **POST** `/api/generate/variations` - Now accepts `userId` parameter and saves all variations

### 4. Frontend Components

#### Updated ImageHistory Component

- Loads images from database instead of localStorage
- Displays user's image history with timestamps
- Download and view functionality
- Real-time updates

#### Test Page

- **URL**: `/test-history`
- Displays all images for the current user
- Shows user ID and image count
- Refresh functionality

## Database Setup

The database is automatically set up with:

```bash
npx prisma generate
npx prisma migrate dev --name init
```

## Usage

1. **Generate Images**: Use the main app to generate interior designs
2. **View History**: Click the history button (eye icon) in the top-right corner
3. **Test Page**: Visit `/test-history` to see all stored images
4. **Download**: Click download buttons to save images locally

## Technical Details

### File Structure

```
lib/
  ├── prisma.ts          # Prisma client singleton
  └── user.ts            # User ID management utilities

app/api/
  ├── images/route.ts    # Image history API
  ├── design/route.ts    # Modified to save history
  └── generate/variations/route.ts  # Modified to save history

app/components/
  └── ImageHistory.tsx   # Updated history component

app/test-history/
  └── page.tsx           # Test page for history
```

### Environment Variables

- `DATABASE_URL`: SQLite database file path (default: `file:./dev.db`)

## Benefits

1. **User Experience**: Users can view and download their previously generated designs
2. **Data Persistence**: Images are stored in a database, not just localStorage
3. **Scalability**: Easy to extend with additional user features
4. **Lightweight**: No complex authentication system required
5. **Privacy**: Each user's images are isolated by their unique ID

## Future Enhancements

- Add image deletion functionality
- Implement image sharing between users
- Add image metadata (style, room type, settings used)
- Implement user preferences storage
- Add image search and filtering

