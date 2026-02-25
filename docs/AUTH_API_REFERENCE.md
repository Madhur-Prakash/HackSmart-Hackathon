# 🔐 Authentication API Reference

Complete API documentation for the NavSwap EV Charging Platform Authentication System.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Base URL](#base-url)
- [Authentication](#authentication)
- [User Roles](#user-roles)
- [API Endpoints](#api-endpoints)
  - [Regional Admin](#regional-admin-endpoints)
  - [Company](#company-endpoints)
  - [Customer](#customer-endpoints)
  - [Staff](#staff-endpoints)
  - [Transporter](#transporter-endpoints)
  - [Health Check](#health-check)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

The NavSwap Authentication API provides secure user management for multiple user types in the EV charging ecosystem.

### Features
- ✅ JWT-based authentication
- ✅ Role-based access control (RBAC)
- ✅ Secure password hashing (bcrypt)
- ✅ Email notifications
- ✅ File uploads (Cloudinary)
- ✅ Refresh token rotation

---

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://api.navswap.com/api/v1
```

---

## Authentication

### Token Types

**Access Token:**
- Short-lived (15 minutes)
- Used for API requests
- Sent in `Authorization` header or cookie

**Refresh Token:**
- Long-lived (7 days)
- Used to obtain new access tokens
- Stored in HTTP-only cookie

### Headers

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

---

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `regional_admin` | System administrators | Full system access, manage all users |
| `company` | EV charging companies | Manage stations, view analytics |
| `customer` | End users | Book charging slots, view history |
| `staff` | Station staff | Manage station operations |
| `transporter` | Battery transporters | Manage deliveries, logistics |

---

## API Endpoints

### Regional Admin Endpoints

#### Register Regional Admin

```http
POST /regional-admin/register
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "1234567890",
  "addhar_card_number": "123456789012",
  "country_code": "+1",
  "role": "regional_admin"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "full_name": "John Doe",
      "user_name": "john_doe_123",
      "email": "john@example.com",
      "phone_number": "1234567890",
      "role": "regional_admin"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "RegionalAdmin registered successfully",
  "success": true
}
```

**Notes:**
- Password is auto-generated and sent via email
- Username is auto-generated from full name
- Tokens are set in HTTP-only cookies

---

#### Login Regional Admin

```http
POST /regional-admin/login
```

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "john_doe_123456789"
}
```

**Alternative (Username):**
```json
{
  "user_name": "john_doe_123",
  "password": "john_doe_123456789"
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "full_name": "John Doe",
      "user_name": "john_doe_123",
      "email": "john@example.com",
      "role": "regional_admin"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "RegionalAdmin logged in successfully",
  "success": true
}
```

---

### Company Endpoints

#### Register Company

```http
POST /company/register
```

**Request Body:**
```json
{
  "full_name": "Tesla Charging Inc",
  "email": "contact@tesla-charging.com",
  "phone_number": "9876543210",
  "country_code": "+1",
  "password": "123456",
  "role": "super_admin"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439012",
      "full_name": "Tesla Charging Inc",
      "user_name": "tesla_charging_inc_456",
      "email": "contact@tesla-charging.com",
      "role": "company",
      "company_name": "Tesla Charging",
      "company_address": "123 Electric Ave, San Francisco, CA"
    },
    "access_token": "...",
    "refresh_token": "..."
  },
  "message": "Company registered successfully",
  "success": true
}
```

---

#### Login Company

```http
POST /company/login
```

**Request Body:**
```json
{
  "email": "contact@tesla-charging.com",
  "password": "auto_generated_password"
}
```

**Response:** `200 OK`

---

### Customer Endpoints

#### Register Customer

```http
POST /customer/register
```

**Request Body:**
```json
{
  "full_name": "Alice Smith",
  "email": "alice@example.com",
  "phone_number": "5551234567",
  "addhar_card_number": "555123456789",
  "country_code": "+1",
  "role": "customer",
  "password": "SecurePass123!",
  "vehicle_type": "Tesla Model 3",
  "vehicle_number": "CA-1234"
}
```

**Response:** `201 Created`
```json
{
  "statusCode": 201,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "full_name": "Alice Smith",
      "user_name": "alice_smith_789",
      "email": "alice@example.com",
      "role": "customer",
      "vehicle_type": "Tesla Model 3",
      "vehicle_number": "CA-1234"
    },
    "access_token": "...",
    "refresh_token": "..."
  },
  "message": "Customer registered successfully",
  "success": true
}
```

**Notes:**
- Customers provide their own password
- Vehicle information is optional but recommended

---

#### Login Customer

```http
POST /customer/login
```

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`

---

#### Update Customer Profile

```http
PATCH /customer/update-profile
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "full_name": "Alice Johnson",
  "phone_number": "5559876543",
  "vehicle_type": "Tesla Model Y"
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "full_name": "Alice Johnson",
      "phone_number": "5559876543",
      "vehicle_type": "Tesla Model Y"
    }
  },
  "message": "Profile updated successfully",
  "success": true
}
```

---

#### Upload Profile Picture

```http
POST /customer/upload-avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

**Form Data:**
```
avatar: <file>
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "avatar_url": "https://res.cloudinary.com/navswap/image/upload/v1234567890/avatars/user123.jpg"
  },
  "message": "Avatar uploaded successfully",
  "success": true
}
```

---

### Staff Endpoints

#### Register Staff

```http
POST /staff/register
```

**Request Body:**
```json
{
  "full_name": "Bob Worker",
  "email": "bob@station.com",
  "phone_number": "5551112222",
  "addhar_card_number": "111222333444",
  "country_code": "+1",
  "role": "staff",
  "station_id": "ST_101",
  "shift_timing": "morning"
}
```

**Response:** `201 Created`

---

#### Login Staff

```http
POST /staff/login
```

**Request Body:**
```json
{
  "email": "bob@station.com",
  "password": "auto_generated_password"
}
```

**Response:** `200 OK`

---

### Transporter Endpoints

#### Register Transporter

```http
POST /transporter/register
```

**Request Body:**
```json
{
  "full_name": "Charlie Transport",
  "email": "charlie@logistics.com",
  "phone_number": "5553334444",
  "addhar_card_number": "333444555666",
  "country_code": "+1",
  "role": "transporter",
  "vehicle_number": "TRK-5678",
  "vehicle_type": "Electric Truck",
  "license_number": "DL123456"
}
```

**Response:** `201 Created`

---

#### Login Transporter

```http
POST /transporter/login
```

**Request Body:**
```json
{
  "email": "charlie@logistics.com",
  "password": "auto_generated_password"
}
```

**Response:** `200 OK`

---

### Common Endpoints

#### Logout

```http
POST /{role}/logout
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {},
  "message": "User logged out successfully",
  "success": true
}
```

**Notes:**
- Clears access and refresh tokens
- Invalidates refresh token in database

---

#### Refresh Access Token

```http
POST /{role}/refresh-token
Cookie: refresh_token=<refresh_token>
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Access token refreshed successfully",
  "success": true
}
```

---

#### Change Password

```http
POST /{role}/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "old_password": "OldPass123!",
  "new_password": "NewSecurePass456!"
}
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {},
  "message": "Password changed successfully",
  "success": true
}
```

---

#### Get Current User

```http
GET /{role}/current-user
Authorization: Bearer <access_token>
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439013",
      "full_name": "Alice Smith",
      "user_name": "alice_smith_789",
      "email": "alice@example.com",
      "role": "customer",
      "vehicle_type": "Tesla Model 3"
    }
  },
  "message": "User fetched successfully",
  "success": true
}
```

---

### Health Check

#### Check API Health

```http
GET /healthcheck
```

**Response:** `200 OK`
```json
{
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2026-02-01T10:00:00.000Z",
    "uptime": 3600,
    "database": "connected"
  },
  "message": "API is healthy",
  "success": true
}
```

---

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "data": null,
  "message": "Validation failed",
  "success": false,
  "errors": [
    {
      "field": "email",
      "message": "Email is not valid"
    }
  ]
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Invalid credentials |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `500` | Internal Server Error |

---

## Rate Limiting

- **Rate Limit:** 100 requests per minute per IP
- **Headers:**
  - `X-RateLimit-Limit`: Maximum requests
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

**Example:**
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1738396800
```

---

## Security Best Practices

1. **Always use HTTPS** in production
2. **Store tokens securely** (HTTP-only cookies recommended)
3. **Implement CSRF protection** for cookie-based auth
4. **Rotate refresh tokens** after each use
5. **Validate all inputs** on client and server
6. **Use strong passwords** (min 8 chars, mixed case, numbers, symbols)
7. **Enable 2FA** for sensitive operations (coming soon)

---

## SDK Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true
});

// Register customer
const register = async () => {
  const response = await api.post('/customer/register', {
    full_name: 'Alice Smith',
    email: 'alice@example.com',
    password: 'SecurePass123!',
    phone_number: '5551234567',
    addhar_card_number: '555123456789',
    country_code: '+1',
    role: 'customer'
  });
  return response.data;
};

// Login
const login = async () => {
  const response = await api.post('/customer/login', {
    email: 'alice@example.com',
    password: 'SecurePass123!'
  });
  
  // Store access token
  const { access_token } = response.data.data;
  api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
  
  return response.data;
};

// Get current user
const getCurrentUser = async () => {
  const response = await api.get('/customer/current-user');
  return response.data;
};
```

### Python

```python
import requests

BASE_URL = 'http://localhost:8000/api/v1'

# Register customer
def register():
    response = requests.post(f'{BASE_URL}/customer/register', json={
        'full_name': 'Alice Smith',
        'email': 'alice@example.com',
        'password': 'SecurePass123!',
        'phone_number': '5551234567',
        'addhar_card_number': '555123456789',
        'country_code': '+1',
        'role': 'customer'
    })
    return response.json()

# Login
def login():
    response = requests.post(f'{BASE_URL}/customer/login', json={
        'email': 'alice@example.com',
        'password': 'SecurePass123!'
    })
    data = response.json()
    return data['data']['access_token']

# Get current user
def get_current_user(access_token):
    headers = {'Authorization': f'Bearer {access_token}'}
    response = requests.get(f'{BASE_URL}/customer/current-user', headers=headers)
    return response.json()
```

---

## Support

For issues or questions:
- 📧 Email: support@navswap.com
- 📚 Documentation: https://docs.navswap.com
- 🐛 Issues: https://github.com/navswap/issues
