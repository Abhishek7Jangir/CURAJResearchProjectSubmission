# MongoDB Database Setup Explanation

## How MongoDB Creates Databases

**Yes, MongoDB automatically creates databases and collections!** Here's how it works:

### Database Creation
- MongoDB **automatically creates a database** when you first write data to it
- If your connection string doesn't specify a database name, MongoDB uses the default database name from the connection string or creates one based on the URI
- In your case, you're connected to the **"test"** database

### Collection Creation
- Collections (similar to tables in SQL) are **automatically created** when you first insert a document
- No need to explicitly create collections beforehand

## Current Database Status

Based on your MongoDB Atlas output:
- **Database:** `test`
- **Collections:** `users`, `projects`
- **Users collection:** Already has data with schema:
  - `userName` (not `name`)
  - `email`
  - `password`
  - `designation`
  - `department`
  - `profilePic`
  - `createdAt`
  - `updatedAt`

## What the Code Does

1. **Connects to MongoDB** using the connection string from `.env`
2. **Uses existing collections** if they exist, or **creates them automatically** when first document is inserted
3. **Validates data** using Mongoose schemas (application-level validation)

## Schema Updates Made

I've updated the models to match your existing database schema:

### User Model (`backend/models/User.js`)
- Changed `name` → `userName` to match existing schema
- Added `profilePic` field (defaults to empty string)
- All other fields remain the same

### Collections That Will Be Created Automatically

When you start using the application, these collections will be created automatically:

1. **users** ✅ (already exists)
2. **projects** ✅ (already exists, but empty)
3. **approvalhistories** (will be created when first approval is made)
4. **equipmentrequests** (will be created when first equipment request is submitted)
5. **equipmentapprovalhistories** (will be created when first equipment approval is made)

## Database Name Configuration

Your current connection string connects to the **"test"** database. If you want to use a different database name, update your `.env`:

```env
MONGO_URI=mongodb+srv://tejasvaidya123580_db_user:9R_DB_NAME?appName=Cluster0
```

Replace `YOUR_DB_NAME` with your desired database name. If omitted, MongoDB uses "test" as default.

## Testing the Setup

1. **Start the server:**
   ```bash
   cd backend
   npm start
   ```

2. **Check MongoDB Atlas** - You should see:
   - Collections being created as you use the app
   - Documents being inserted into collections

3. **Verify in MongoDB shell:**
   ```javascript
   use test
   show collections
   db.users.find()
   db.projects.find()
   ```

## Important Notes

- **No manual database creation needed** - MongoDB handles it automatically
- **Schema validation** happens at the application level (Mongoose)
- **Existing data** in your `users` collection will work with the updated models
- **New collections** will be created automatically when needed

## Next Steps

1. The database is ready to use
2. Start the server and test user signup/login
3. Submit a project - this will create the `projects` collection if it doesn't exist
4. All other collections will be created automatically as you use the application




