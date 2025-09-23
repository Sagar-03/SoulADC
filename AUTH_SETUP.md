# SoulADC Authentication Setup

## Admin Credentials (Hardcoded)
- **Email**: `admin@souladc.com`
- **Password**: `admin123`

## Authentication Flow

### 1. Login Process
- Users can login through the Auth modal component
- For admin access, use the hardcoded credentials above
- Regular users need to register first, then login

### 2. Role-based Redirection
- **Admin users**: Redirected to `/admin` (Admin Dashboard)
- **Regular users**: Redirected to `/student-portal` (Student Dashboard)

### 3. Backend API Endpoints
- `POST /api/auth/login` - Login endpoint
- `POST /api/auth/register` - User registration endpoint
- `GET /api/admin/dashboard` - Admin dashboard data (protected)

### 4. Frontend Routes
- `/admin` - Admin dashboard
- `/student-portal` - Student dashboard
- `/admindashboard` - Alternative admin route
- `/studentdashboard` - Alternative student route

## Database Schema

### User Model
```javascript
{
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  phone: String (optional),
  role: String (enum: ["user", "admin"], default: "user"),
  timestamps: true
}
```

## Security Features
- JWT token authentication
- Password hashing with bcrypt
- Role-based access control
- Protected admin routes

## Environment Variables Required
- `PORT` - Server port (default: 7001)
- `ConnectionString` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `CORS_ORIGIN` - Frontend URL for CORS

## Notes
- Video logic has been removed from backend as requested
- Admin authentication is hardcoded for security
- Regular users are stored in MongoDB
- All passwords are hashed before storage