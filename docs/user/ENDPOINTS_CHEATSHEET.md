# 📋 User API — Endpoints Cheatsheet

Quick reference for all user profile update endpoints.

---

## 📌 Summary

Only **3 types of operations**:
1. Update account details (name, phone)
2. Upload avatar (profile picture)
3. Update profile (bio, gender, DOB — customer/transporter only)

---

## 👤 Customer Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `PATCH` | `/api/v1/user/customer/update_account_details` | Update name & phone | ✅ Required |
| `PATCH` | `/api/v1/user/customer/update_avatar` | Upload profile picture | ✅ Required |
| `PATCH` | `/api/v1/user/customer/update_profile` | Update bio, gender, DOB | ✅ Required |

---

## 🚛 Transporter Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `PATCH` | `/api/v1/user/transporter/update_account_details` | Update name & phone | ✅ Required |
| `PATCH` | `/api/v1/user/transporter/update_avatar` | Upload profile picture | ✅ Required |
| `PATCH` | `/api/v1/user/transporter/update_profile` | Update bio, gender, DOB | ✅ Required |

---

## 🏢 Company Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `PATCH` | `/api/v1/user/company/update_account_details` | Update company info | ✅ Required |
| `PATCH` | `/api/v1/user/company/update_avatar` | Upload logo | ✅ Required |

---

## 👷 Staff Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `PATCH` | `/api/v1/user/staff/update_account_details` | Update name & phone | ✅ Required |
| `PATCH` | `/api/v1/user/staff/update_avatar` | Upload profile picture | ✅ Required |

---

## 🌍 Regional Admin Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| `PATCH` | `/api/v1/user/regional_admin/update_account_details` | Update name & phone | ✅ Required |
| `PATCH` | `/api/v1/user/regional_admin/update_avatar` | Upload profile picture | ✅ Required |

---

## 🔧 Example Requests

### Update Account Details
```bash
curl -X PATCH http://localhost:8000/api/v1/user/customer/update_account_details \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "phone_number": "+919876543210"
  }'
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Account details updated successfully",
  "success": true,
  "data": {
    "user": {
      "_id": "user_123",
      "first_name": "Jane",
      "last_name": "Doe",
      "phone_number": "+919876543210"
    }
  }
}
```

---

### Upload Avatar
```bash
curl -X PATCH http://localhost:8000/api/v1/user/customer/update_avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/image.jpg"
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Avatar updated successfully",
  "success": true,
  "data": {
    "avatar_url": "https://cdn.example.com/avatars/user_123.jpg"
  }
}
```

---

### Update Profile (Customer/Transporter)
```bash
curl -X PATCH http://localhost:8000/api/v1/user/customer/update_profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bio": "Electric vehicle enthusiast",
    "gender": "male",
    "dateOfBirth": "1990-01-15"
  }'
```

**Response:**
```json
{
  "status_code": 200,
  "message": "Profile updated successfully",
  "success": true,
  "data": {
    "profile": {
      "bio": "Electric vehicle enthusiast",
      "gender": "male",
      "dateOfBirth": "1990-01-15",
      "profileCompleted": true
    }
  }
}
```

---

## ❌ HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `400` | Bad request — invalid fields |
| `401` | Unauthorized — missing/invalid token |
| `403` | Forbidden — endpoint not available for this role |
| `422` | Validation error |
| `500` | Server error |

---

**Last Updated:** March 14, 2026

---

## � Quick Examples
{
  "transportVehicle": {},
  "bankDetails": {},
  "preferences": {},
  "emergencyContact": {}
}
```

**Response Codes:**
- `200 OK` — Success
- `400 Bad Request` — Invalid data
- `401 Unauthorized` — Missing/invalid token
- `404 Not Found` — Transporter not found
- `500 Server Error` — Internal error

---

## 🔐 Error Handling

All error responses follow this format:

```json
{
  "status_code": 400,
  "message": "Error description",
  "success": false,
  "errors": []
}
```

Common errors:
- `401 Unauthorized` — Token missing or invalid
- `403 Forbidden` — Creating/updating someone else's profile
- `404 Not Found` — Resource doesn't exist
- `400 Bad Request` — Invalid input data

---

## 📚 Related Documentation

- [Full API Reference](./API_REFERENCE.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Auth API Reference](../auth/API_REFERENCE.md)

