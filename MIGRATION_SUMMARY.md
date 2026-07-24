# MongoDB & Cloudinary Migration Summary

## Overview
The application has been successfully migrated from SQLite to MongoDB and integrated Cloudinary for PDF storage.

## Changes Made

### 1. Database Migration
- **From:** SQLite (local file-based database)
- **To:** MongoDB (cloud-hosted MongoDB Atlas)

### 2. File Storage Migration
- **From:** Base64 encoded files stored in database
- **To:** Cloudinary cloud storage for PDF files

### 3. Environment Variables
Create a `.env` file in the `backend` directory with the following variables:

```env
PORT=3000
MONGO_URI=mongodb+srv://
JWT_SECRET=s
NODE_ENV=development
CLOUDINARY_NAME=dz6
CLOUDINARY_API_KEY=47471
CLOUDINARY_API_SECRET=Rd
```

**Note:** The `.env` file is gitignored. Copy `.env.example` to `.env` and update with your credentials.

### 4. New Dependencies
- `mongoose` - MongoDB ODM
- `cloudinary` - Cloudinary SDK for file uploads
- `multer` - File upload handling (installed but not actively used - Cloudinary handles uploads)

### 5. Database Models Created
All models are in `backend/models/`:
- `User.js` - User authentication and profile
- `Project.js` - Research projects
- `ApprovalHistory.js` - Project approval history
- `EquipmentRequest.js` - Equipment purchase requests
- `EquipmentApprovalHistory.js` - Equipment approval history

### 6. Updated Files
- `backend/database.js` - Now uses MongoDB connection
- `backend/routes/auth.js` - Updated to use MongoDB User model
- `backend/routes/projects.js` - Updated to use MongoDB and Cloudinary
- `backend/routes/equipment.js` - Updated to use MongoDB
- `backend/middleware/auth.js` - Updated to use MongoDB User model
- `backend/utils/cloudinary.js` - New utility for Cloudinary operations
- `frontend/src/components/common/modals/ProjectDetailModal.jsx` - Updated to handle Cloudinary URLs

## Setup Instructions

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. **Start the Server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

## Database Schema

The MongoDB collections follow the same structure as the previous SQLite tables:

- **users** - User accounts with authentication
- **projects** - Research project proposals
- **approvalhistories** - Project approval workflow history
- **equipmentrequests** - Equipment purchase requests
- **equipmentapprovalhistories** - Equipment approval workflow history

## File Storage

- PDF files are uploaded to Cloudinary in the `research-proposals` folder
- Files are stored with unique public IDs based on timestamp and filename
- File URLs are stored in the `fileUrl` field of projects
- Legacy `fileData` (base64) is still supported for backward compatibility

## API Changes

### Projects API
- `POST /api/projects/submit` - Now accepts `fileData` (base64) and uploads to Cloudinary
- Response includes `fileUrl` instead of `fileData` for new projects
- `GET /api/projects/my-projects` - Returns projects with `fileUrl` field
- `GET /api/projects/for-approval` - Returns projects with `fileUrl` field

### Equipment API
- No changes to API structure, only internal MongoDB implementation

### Auth API
- No changes to API structure, only internal MongoDB implementation

## Migration Notes

- Existing SQLite data will need to be migrated separately if needed
- Old projects with `fileData` will continue to work (backward compatibility)
- New projects will use Cloudinary URLs
- All new data will be stored in MongoDB

## Testing

After setup, test the following:
1. User signup/login
2. Project submission with PDF upload
3. Project approval workflow
4. Equipment request submission
5. Equipment approval workflow
6. File download from Cloudinary URLs

