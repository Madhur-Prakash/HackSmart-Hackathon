# 📋 User API — Reference

> Complete documentation for user profile update endpoints.

**Base URL:** `http://localhost:8000/api/v1/user`

**Authentication:** All endpoints require `Bearer {access_token}` in Authorization header

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Response Format](#-response-format)
3. [Endpoints](#-endpoints)
4. [Error Codes](#-error-codes)

---

## 🎯 Overview

The **User API** allows authenticated users to update their profile information after login. All endpoints require a valid `access_token` from the Auth API.

### Available Operations

**All Roles (customer, transporter, company, staff, regional_admin):**
- ✅ `PATCH /update_account_details` - Update name and phone
- ✅ `PATCH /update_avatar` - Upload profile picture

**Customer & Transporter Only:**
- ✅ `PATCH /update_profile` - Update detailed profile (bio, gender, DOB)

---

## 📦 Response Format

All responses follow this standard structure:

```json
{
  "status_code": 200,
  "message": "Operation successful",
  "data": { /* endpoint-specific data */ },
  "success": true
}
```

### Error Response Format

```json
{
  "status_code": 400,
  "message": "Validation failed",
  "errors": ["field_name: error message"],
  "success": false
}
```

---

## 🔑 Endpoints

### 1. Update Account Details

Update basic user information available to all roles.

**HTTP Method:** `PATCH`

**Endpoint:** `/user/{role}/update_account_details`

**Roles:** All (customer, transporter, company, staff, regional_admin)

**Authentication:** Required ✅

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "phone_number": "+919876543210"
}
```

**Response (Status 200):**
```json
{
  "status_code": 200,
  "message": "Account details updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone_number": "+919876543210",
      "role": "customer"
    }
  },
  "success": true
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid phone format or missing required fields
- `401 Unauthorized` - Invalid or expired token
- `404 Not Found` - User not found

---

### 2. Upload Avatar

Upload or update a user's profile picture.

**HTTP Method:** `PATCH`

**Endpoint:** `/user/{role}/update_avatar`

**Roles:** All (customer, transporter, company, staff, regional_admin)

**Authentication:** Required ✅

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: multipart/form-data
```

**Form Data:**
- Key: `avatar`
- Value: Image file (JPEG, PNG, GIF, WebP, etc.)
- Max Size: Typically 5MB (depends on server config)

**Response (Status 200):**
```json
{
  "status_code": 200,
  "message": "Avatar updated successfully",
  "data": {
    "avatar_url": "https://cdn.example.com/avatars/507f1f77bcf86cd799439011.jpg"
  },
  "success": true
}
```

**Possible Errors:**
- `400 Bad Request` - File is not an image or is too large
- `401 Unauthorized` - Invalid or expired token
- `404 Not Found` - User not found
- `413 Payload Too Large` - File exceeds size limit

---

### 3. Update Profile (Customer & Transporter Only)

Update detailed profile information for customer or transporter roles.

**HTTP Method:** `PATCH`

**Endpoint:** `/user/{role}/update_profile`

**Roles:** customer, transporter

**Authentication:** Required ✅

**Request Headers:**
```
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "bio": "I love electric vehicles",
  "gender": "male",
  "dateOfBirth": "1990-05-15"
}
```

**Response (Status 200):**
```json
{
  "status_code": 200,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "_id": "507f1f77bcf86cd799439011",
      "bio": "I love electric vehicles",
      "gender": "male",
      "dateOfBirth": "1990-05-15",
      "profileCompleted": true,
      "lastUpdated": "2024-03-15T10:30:00Z"
    }
  },
  "success": true
}
```

**Possible Errors:**
- `400 Bad Request` - Invalid date format or missing required fields
- `401 Unauthorized` - Invalid or expired token
- `403 Forbidden` - Endpoint not available for this role
- `404 Not Found` - User not found

---

## ❌ Error Codes

| Status | Error | Meaning | Solution |
|--------|-------|---------|----------|
| 200 | N/A | Success | Operation completed successfully |
| 400 | Bad Request | Invalid data format or validation failed | Check request body format and field types |
| 401 | Unauthorized | Missing or invalid token | Re-login to get a new access token |
| 403 | Forbidden | Endpoint not available for this role | Check that your role supports this endpoint |
| 404 | Not Found | User not found | Check token validity |
| 413 | Payload Too Large | File or data exceeds limit | Reduce file size or data size |
| 500 | Server Error | Unexpected server error | Try again later or contact support |

---

## 📌 Notes

1. **Token Management:** Tokens expire after a set time. Use the refresh_token endpoint from Auth API to get a new access_token
2. **File Uploads:** Only `avatar` field is required for the upload. Multiple files are not supported
3. **Phone Format:** Should include country code (e.g., +1 for US, +91 for India)
4. **Roles:** Some endpoints are role-specific. Check the "Roles" field for each endpoint
5. **Rate Limiting:** API may enforce rate limits. Check response headers for limit information

---

**Last Updated:** March 15, 2026  
**Version:** 1.0.0  
**Status:** ✅ All endpoints verified against live codebase
