# 📡 NavSwap — Backend API Reference

> Complete API documentation for frontend & mobile app integration.

**Base URL:** `http://localhost:8000/api/v1`

---

## 📑 Table of Contents

- [Authentication Overview](#-authentication-overview)
- [Standard Response Format](#-standard-response-format)
- [Error Response Format](#-error-response-format)
- [Company (Super Admin) API](#-company-super-admin-api)
- [Customer API](#-customer-api)
- [Transporter API](#-transporter-api)
- [Staff API](#-staff-api)
- [Regional Admin API](#-regional-admin-api)
- [Healthcheck API](#-healthcheck-api)
- [Data Models / Schemas](#-data-models--schemas)
- [Environment Variables](#-environment-variables)

---

## 🔐 Authentication Overview

The API uses **JWT (JSON Web Tokens)** for authentication with a **dual-token strategy**:

| Token | Delivery | Lifetime | Purpose |
|-------|----------|----------|---------|
| `access_token` | Cookie + JSON body | Short-lived (configured via `ACESS_TOKEN_EXPIRY`) | Authenticates every request |
| `refresh_token` | Cookie + JSON body | Long-lived (configured via `REFRESH_TOKEN_EXPIRY`) | Used to get a new access token |

### How to send tokens

**Option A — Cookies (automatic in browsers):**
Tokens are set as `httpOnly` cookies on login/register. The browser sends them automatically.

**Option B — Authorization Header (mobile apps / Postman):**
```
Authorization: Bearer <access_token>
```

### Secured vs Public routes

| Type | Requires Token? | Example |
|------|----------------|---------|
| **Public** | No | `/register`, `/login`, `/refresh_access_token`, `/change_password` |
| **Secured** | Yes (`access_token`) | `/logout`, `/current_user`, `/update_account_details`, `/update_avatar` |

---

## 📦 Standard Response Format

Every successful response follows this structure:

```json
{
  "status_code": 200,
  "message": "Descriptive success message",
  "data": { ... },
  "success": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `status_code` | `number` | HTTP status code |
| `message` | `string` | Human-readable message |
| `data` | `object` | Response payload |
| `success` | `boolean` | `true` if `status_code < 400` |

---

## ❌ Error Response Format

```json
{
  "status_code": 400,
  "message": "All fields are required",
  "data": null,
  "success": false,
  "errors": []
}
```

### Common Error Codes

| Status | Meaning |
|--------|---------|
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — invalid/missing token or wrong password |
| `404` | Not Found — user doesn't exist |
| `409` | Conflict — email already registered |
| `500` | Internal Server Error |

---

## 🏢 Company (Super Admin) API

**Base path:** `/api/v1/companies`

### 1. Register Company

Creates a new company account with `super_admin` role.

| | |
|---|---|
| **URL** | `POST /api/v1/companies/register` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "full_name": "NavSwap Corp",
  "email": "admin@navswap.com",
  "phone_number": "9876543210",
  "country_code": "+91",
  "role": "super_admin",
  "password": "securePass123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `full_name` | `string` | Yes | Min 5 chars |
| `email` | `string` | Yes | Must contain `@`, unique |
| `phone_number` | `string` | Yes | Exactly 10 digits, unique |
| `country_code` | `string` | Yes | e.g. `"+91"` |
| `role` | `string` | Yes | Must be `"super_admin"` |
| `password` | `string` | Yes | Min 6 chars |

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Company registered successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "full_name": "NavSwap Corp",
      "user_name": "NavSwap Corp_a1b2c3",
      "email": "admin@navswap.com",
      "phone_number": "9876543210",
      "country_code": "+91",
      "role": "super_admin",
      "avatar": "N/A",
      "isProfileCompleted": false,
      "kyc_status": "pending",
      "createdAt": "2026-03-02T10:30:00.000Z",
      "updatedAt": "2026-03-02T10:30:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `400` | `"All fields are required"` |
| `400` | `"Invalid role"` |
| `400` | `"Email is not valid"` |
| `409` | `"Company already exists with this email"` |
| `500` | `"Company registration failed"` |

**Cookies Set:**
- `access_token` (httpOnly)
- `refresh_token` (httpOnly)

---

### 2. Login Company

| | |
|---|---|
| **URL** | `POST /api/v1/companies/login` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body (login by email):**

```json
{
  "email": "admin@navswap.com",
  "password": "securePass123"
}
```

**Request Body (login by username):**

```json
{
  "user_name": "NavSwap Corp_a1b2c3",
  "password": "securePass123"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | `string` | Either email or user_name | |
| `user_name` | `string` | Either email or user_name | |
| `password` | `string` | Yes | |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Company logged in successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "full_name": "NavSwap Corp",
      "user_name": "NavSwap Corp_a1b2c3",
      "email": "admin@navswap.com",
      "phone_number": "9876543210",
      "country_code": "+91",
      "role": "super_admin",
      "avatar": "N/A",
      "isProfileCompleted": false,
      "kyc_status": "pending",
      "createdAt": "2026-03-02T10:30:00.000Z",
      "updatedAt": "2026-03-02T10:30:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `400` | `"Company name or email is required"` |
| `400` | `"Password is required"` |
| `401` | `"Invalid password"` |
| `404` | `"Company not found with this user name"` |

---

### 3. Logout Company

| | |
|---|---|
| **URL** | `POST /api/v1/companies/logout` |
| **Auth** | Required (`access_token`) |

**Request Body:** None

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Company logged out successfully",
  "data": {},
  "success": true
}
```

**Cookies Cleared:** `access_token`, `refresh_token`

**Error Responses:**

| Status | Message |
|--------|---------|
| `401` | `"Unauthorized request"` |

---

### 4. Refresh Access Token

| | |
|---|---|
| **URL** | `POST /api/v1/companies/refresh_access_token` |
| **Auth** | Requires `refresh_token` via cookie or `Authorization: Bearer <refresh_token>` |

**Request Body:** None

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Access token refreshed successfully",
  "data": {
    "user": { ... },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `401` | `"Unauthorized request, refresh token is required"` |
| `401` | `"Invalid Refresh Token"` |

---

### 5. Change Password

| | |
|---|---|
| **URL** | `POST /api/v1/companies/change_password` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "email": "admin@navswap.com",
  "new_password": "newSecurePass456",
  "confirm_password": "newSecurePass456"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `email` | `string` | Either email or user_name | |
| `user_name` | `string` | Either email or user_name | |
| `new_password` | `string` | Yes | Min 6 chars, must not match old password |
| `confirm_password` | `string` | Yes | Must match `new_password` |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Password changed successfully",
  "data": {},
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `400` | `"Password and confirm password are required"` |
| `400` | `"Company name or email is required"` |
| `400` | `"Company dosen't exist"` |
| `400` | `"Password dosen't match"` |
| `400` | `"Password must be at least 6 characters long"` |
| `400` | `"New password can't be same as old password, kindly choose a new password"` |

---

### 6. Get Current User

| | |
|---|---|
| **URL** | `GET /api/v1/companies/current_user` |
| **Auth** | Required (`access_token`) |

**Request Body:** None

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Current user fetched successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0d",
      "full_name": "NavSwap Corp",
      "user_name": "NavSwap Corp_a1b2c3",
      "email": "admin@navswap.com",
      "phone_number": "9876543210",
      "country_code": "+91",
      "role": "super_admin",
      "avatar": "N/A",
      "isProfileCompleted": false,
      "kyc_status": "pending",
      "createdAt": "2026-03-02T10:30:00.000Z",
      "updatedAt": "2026-03-02T10:30:00.000Z"
    }
  },
  "success": true
}
```

> **Note:** The `password` and `refresh_token` fields are stripped from the response by the auth middleware.

---

### 7. Update Account Details

| | |
|---|---|
| **URL** | `PATCH /api/v1/companies/update_account_details` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "full_name": "NavSwap Corp Updated",
  "email": "newemail@navswap.com"
}
```

| Field | Type | Required |
|-------|------|----------|
| `full_name` | `string` | Yes |
| `email` | `string` | Yes |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Company details updated successfully",
  "data": {
    "user": { ... }
  },
  "success": true
}
```

---

### 8. Update Avatar

| | |
|---|---|
| **URL** | `PATCH /api/v1/companies/update_avatar` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `multipart/form-data` |

**Request Body (form-data):**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `avatar` | `file` | Yes | Image file (jpg, png, etc.) |

**Example (cURL):**

```bash
curl -X PATCH http://localhost:8000/api/v1/companies/update_avatar \
  -H "Authorization: Bearer <access_token>" \
  -F "avatar=@/path/to/photo.jpg"
```

**Example (JavaScript — Fetch):**

```javascript
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

const response = await fetch('http://localhost:8000/api/v1/companies/update_avatar', {
  method: 'PATCH',
  headers: {
    'Authorization': 'Bearer ' + accessToken
  },
  body: formData
});
```

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Company avatar updated successfully",
  "data": {
    "user": {
      "avatar": "https://res.cloudinary.com/xxx/image/upload/v123/photo.jpg",
      ...
    }
  },
  "success": true
}
```

---

## 👤 Customer API

**Base path:** `/api/v1/customers`

### 1. Register Customer

| | |
|---|---|
| **URL** | `POST /api/v1/customers/register` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "full_name": "Rahul Sharma",
  "email": "rahul@example.com",
  "phone_number": "9123456789",
  "country_code": "+91",
  "role": "customer",
  "driving_license_number": "DL-0420110012345",
  "password": "myPassword123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `full_name` | `string` | Yes | Min 5 chars |
| `email` | `string` | Yes | Must contain `@`, unique |
| `phone_number` | `string` | Yes | Exactly 10 digits, unique |
| `country_code` | `string` | Yes | e.g. `"+91"` |
| `role` | `string` | Yes | Must be `"customer"` |
| `driving_license_number` | `string` | Yes | Exactly 15 chars, unique |
| `password` | `string` | Yes | Min 6 chars |

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Customer registered successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0e",
      "full_name": "Rahul Sharma",
      "user_name": "Rahul Sharma_x7y8z9",
      "email": "rahul@example.com",
      "phone_number": "9123456789",
      "country_code": "+91",
      "role": "customer",
      "driving_license_number": "DL-0420110012345",
      "isProfileCompleted": false,
      "createdAt": "2026-03-02T11:00:00.000Z",
      "updatedAt": "2026-03-02T11:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `400` | `"All fields are required"` |
| `400` | `"Invalid role"` |
| `400` | `"Email is not valid"` |
| `409` | `"Customer already exists with this email"` |
| `500` | `"Customer registration failed"` |

---

### 2. Login Customer

| | |
|---|---|
| **URL** | `POST /api/v1/customers/login` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "email": "rahul@example.com",
  "password": "myPassword123"
}
```

_Or by username:_

```json
{
  "user_name": "Rahul Sharma_x7y8z9",
  "password": "myPassword123"
}
```

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Customer logged in successfully",
  "data": {
    "user": { ... },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

---

### 3. Logout Customer

| | |
|---|---|
| **URL** | `POST /api/v1/customers/logout` |
| **Auth** | Required (`access_token`) |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Customer logged out successfully",
  "data": {},
  "success": true
}
```

---

### 4. Refresh Access Token

| | |
|---|---|
| **URL** | `POST /api/v1/customers/refresh_access_token` |
| **Auth** | Requires `refresh_token` |

Same pattern as [Company Refresh Token](#4-refresh-access-token).

---

### 5. Change Password

| | |
|---|---|
| **URL** | `POST /api/v1/customers/change_password` |
| **Auth** | None |

Same pattern as [Company Change Password](#5-change-password).

---

### 6. Get Current User

| | |
|---|---|
| **URL** | `GET /api/v1/customers/current_user` |
| **Auth** | Required (`access_token`) |

Same pattern as [Company Get Current User](#6-get-current-user).

---

### 7. Update Account Details

| | |
|---|---|
| **URL** | `PATCH /api/v1/customers/update_account_details` |
| **Auth** | Required (`access_token`) |

Same pattern as [Company Update Account Details](#7-update-account-details).

---

### 8. Update Avatar

| | |
|---|---|
| **URL** | `PATCH /api/v1/customers/update_avatar` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `multipart/form-data` |

Same pattern as [Company Update Avatar](#8-update-avatar).

---

## 🚛 Transporter API

**Base path:** `/api/v1/transporters`

### 1. Register Transporter

| | |
|---|---|
| **URL** | `POST /api/v1/transporters/register` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "full_name": "Suresh Kumar",
  "email": "suresh@transport.com",
  "phone_number": "9988776655",
  "country_code": "+91",
  "role": "transporter",
  "driving_license_number": "KA-0120200054321",
  "password": "transportPass123"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `full_name` | `string` | Yes | Min 5 chars |
| `email` | `string` | Yes | Must contain `@`, unique |
| `phone_number` | `string` | Yes | Exactly 10 digits, unique |
| `country_code` | `string` | Yes | e.g. `"+91"` |
| `role` | `string` | Yes | Must be `"transporter"` |
| `driving_license_number` | `string` | Yes | Exactly 15 chars, unique |
| `password` | `string` | Yes | Min 6 chars |

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Transporter registered successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c0f",
      "full_name": "Suresh Kumar",
      "user_name": "Suresh Kumar_p4q5r6",
      "email": "suresh@transport.com",
      "phone_number": "9988776655",
      "country_code": "+91",
      "role": "transporter",
      "driving_license_number": "KA-0120200054321",
      "isProfileCompleted": false,
      "createdAt": "2026-03-02T12:00:00.000Z",
      "updatedAt": "2026-03-02T12:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

---

### 2–8. Other Transporter Endpoints

All other endpoints follow the **same pattern** as the Company API:

| # | Method | Endpoint | Auth |
|---|--------|----------|------|
| 2 | `POST` | `/api/v1/transporters/login` | None |
| 3 | `POST` | `/api/v1/transporters/logout` | Required |
| 4 | `POST` | `/api/v1/transporters/refresh_access_token` | `refresh_token` |
| 5 | `POST` | `/api/v1/transporters/change_password` | None |
| 6 | `GET` | `/api/v1/transporters/current_user` | Required |
| 7 | `PATCH` | `/api/v1/transporters/update_account_details` | Required |
| 8 | `PATCH` | `/api/v1/transporters/update_avatar` | Required |

---

## 👷 Staff API

**Base path:** `/api/v1/staff`

> **Important:** Staff accounts are created by admins. The password is **auto-generated** and **emailed** to the staff member. Staff must change the password after the first login.

### 1. Register Staff

| | |
|---|---|
| **URL** | `POST /api/v1/staff/register` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "full_name": "Amit Verma",
  "email": "amit@navswap.com",
  "phone_number": "9112233445",
  "country_code": "+91",
  "role": "staff",
  "addhar_card_number": "123456789012"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `full_name` | `string` | Yes | Min 5 chars |
| `email` | `string` | Yes | Must contain `@`, unique |
| `phone_number` | `string` | Yes | Exactly 10 digits, unique |
| `country_code` | `string` | Yes | e.g. `"+91"` |
| `role` | `string` | Yes | Must be `"staff"` |
| `addhar_card_number` | `string` | Yes | Exactly 12 digits, unique |

> **Note:** No `password` field is needed. The system auto-generates a password and emails it to the provided email address.

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Staff registered successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c10",
      "full_name": "Amit Verma",
      "user_name": "Amit Verma_m3n4o5",
      "email": "amit@navswap.com",
      "phone_number": "9112233445",
      "country_code": "+91",
      "role": "staff",
      "addhar_card_number": "123456789012",
      "isProfileCompleted": false,
      "createdAt": "2026-03-02T13:00:00.000Z",
      "updatedAt": "2026-03-02T13:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

**Side Effect:** An email is sent to `amit@navswap.com` with the auto-generated username and password.

---

### 2–8. Other Staff Endpoints

| # | Method | Endpoint | Auth |
|---|--------|----------|------|
| 2 | `POST` | `/api/v1/staff/login` | None |
| 3 | `POST` | `/api/v1/staff/logout` | Required |
| 4 | `POST` | `/api/v1/staff/refresh_access_token` | `refresh_token` |
| 5 | `POST` | `/api/v1/staff/change_password` | None |
| 6 | `GET` | `/api/v1/staff/current_user` | Required |
| 7 | `PATCH` | `/api/v1/staff/update_account_details` | Required |
| 8 | `PATCH` | `/api/v1/staff/update_avatar` | Required |

---

## 🌍 Regional Admin API

**Base path:** `/api/v1/regional_admins`

> **Important:** Regional Admin accounts are created by super admins. The password is **auto-generated** and **emailed** to the regional admin. They must change the password after the first login.

### 1. Register Regional Admin

| | |
|---|---|
| **URL** | `POST /api/v1/regional_admins/register` |
| **Auth** | None |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "full_name": "Priya Patil",
  "email": "priya@navswap.com",
  "phone_number": "9001122334",
  "country_code": "+91",
  "role": "regional_admin",
  "addhar_card_number": "987654321098"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| `full_name` | `string` | Yes | Min 5 chars |
| `email` | `string` | Yes | Must contain `@`, unique |
| `phone_number` | `string` | Yes | Exactly 10 digits, unique |
| `country_code` | `string` | Yes | e.g. `"+91"` |
| `role` | `string` | Yes | Must be `"regional_admin"` |
| `addhar_card_number` | `string` | Yes | Exactly 12 digits, unique |

> **Note:** No `password` field is needed. The system auto-generates a password and emails it.

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "RegionalAdmin registered successfully",
  "data": {
    "user": {
      "_id": "665f1a2b3c4d5e6f7a8b9c11",
      "full_name": "Priya Patil",
      "user_name": "Priya Patil_d7e8f9",
      "email": "priya@navswap.com",
      "phone_number": "9001122334",
      "country_code": "+91",
      "role": "regional_admin",
      "addhar_card_number": "987654321098",
      "isProfileCompleted": false,
      "createdAt": "2026-03-02T14:00:00.000Z",
      "updatedAt": "2026-03-02T14:00:00.000Z"
    },
    "access_token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
  },
  "success": true
}
```

**Side Effect:** An email is sent to `priya@navswap.com` with the auto-generated username and password.

---

### 2–8. Other Regional Admin Endpoints

| # | Method | Endpoint | Auth |
|---|--------|----------|------|
| 2 | `POST` | `/api/v1/regional_admins/login` | None |
| 3 | `POST` | `/api/v1/regional_admins/logout` | Required |
| 4 | `POST` | `/api/v1/regional_admins/refresh_access_token` | `refresh_token` |
| 5 | `POST` | `/api/v1/regional_admins/change_password` | None |
| 6 | `GET` | `/api/v1/regional_admins/current_user` | Required |
| 7 | `PATCH` | `/api/v1/regional_admins/update_account_details` | Required |
| 8 | `PATCH` | `/api/v1/regional_admins/update_avatar` | Required |

---

## 💚 Healthcheck API

**Base path:** `/api/v1/healthcheck`

### Health Check

| | |
|---|---|
| **URL** | `GET /api/v1/healthcheck/health` |
| **Auth** | None |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "OK",
  "data": {},
  "success": true
}
```

---

## 📐 Data Models / Schemas

### Company (Super Admin)

```
{
  _id:                 ObjectId (auto)
  full_name:           String   (required, min 5 chars)
  user_name:           String   (auto-generated, unique)
  email:               String   (required, unique, lowercase)
  phone_number:        String   (required, 10 digits, unique)
  country_code:        String   (required)
  avatar:              String   (default: "N/A")
  password:            String   (required, min 6 chars, hashed)
  refresh_token:       String
  role:                String   (enum: super_admin | staff | regional_admin | transporter | customer)
  isProfileCompleted:  Boolean  (default: false)
  kyc_status:          String   (enum: pending | approved | rejected, default: "pending")
  createdAt:           Date     (auto)
  updatedAt:           Date     (auto)
}
```

### Customer

```
{
  _id:                    ObjectId (auto)
  full_name:              String   (required, min 5 chars)
  user_name:              String   (auto-generated, unique)
  email:                  String   (required, unique, lowercase)
  phone_number:           String   (required, 10 digits, unique)
  country_code:           String   (required)
  driving_license_number: String   (required, 15 chars, unique)
  avatar:                 String
  password:               String   (min 6 chars, hashed)
  refresh_token:          String
  role:                   String   (enum: super_admin | staff | regional_admin | customer)
  isProfileCompleted:     Boolean  (default: false)
  createdAt:              Date     (auto)
  updatedAt:              Date     (auto)
}
```

### Transporter

```
{
  _id:                    ObjectId (auto)
  full_name:              String   (required, min 5 chars)
  user_name:              String   (auto-generated, unique)
  email:                  String   (required, unique, lowercase)
  phone_number:           String   (required, 10 digits, unique)
  country_code:           String   (required)
  driving_license_number: String   (required, 15 chars, unique)
  avatar:                 String
  password:               String   (min 6 chars, hashed)
  refresh_token:          String
  role:                   String   (enum: super_admin | staff | regional_admin | transporter | customer)
  isProfileCompleted:     Boolean  (default: false)
  createdAt:              Date     (auto)
  updatedAt:              Date     (auto)
}
```

### Staff

```
{
  _id:                 ObjectId (auto)
  full_name:           String   (required, min 5 chars)
  user_name:           String   (auto-generated, unique)
  email:               String   (required, unique, lowercase)
  phone_number:        String   (required, 10 digits, unique)
  country_code:        String   (required)
  addhar_card_number:  String   (required, 12 digits, unique)
  avatar:              String
  password:            String   (auto-generated, emailed, hashed)
  refresh_token:       String
  role:                String   (enum: super_admin | staff | regional_admin | transporter | customer)
  isProfileCompleted:  Boolean  (default: false)
  createdAt:           Date     (auto)
  updatedAt:           Date     (auto)
}
```

### Regional Admin

```
{
  _id:                 ObjectId (auto)
  full_name:           String   (required, min 5 chars)
  user_name:           String   (auto-generated, unique)
  email:               String   (required, unique, lowercase)
  phone_number:        String   (required, 10 digits, unique)
  country_code:        String   (required)
  addhar_card_number:  String   (required, 12 digits, unique)
  avatar:              String
  password:            String   (auto-generated, emailed, hashed)
  refresh_token:       String
  role:                String   (enum: super_admin | staff | regional_admin | transporter | customer)
  isProfileCompleted:  Boolean  (default: false)
  createdAt:           Date     (auto)
  updatedAt:           Date     (auto)
}
```

---

## ⚙️ Environment Variables

Create a `.env` file in the project root with the following:

```env
# Server
PORT=8000
CORS_ORIGIN=*

# MongoDB
MONGO_URI=mongodb://localhost:27017

# JWT Tokens
ACESS_TOKEN_SECRET=your_access_token_secret_here
ACESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret_here
REFRESH_TOKEN_EXPIRY=10d

# Cloudinary (for avatar uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail SMTP for sending credentials)
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
```

---

## 🔗 Related Documentation

- [Main Project README](../README.md) — Project overview, architecture, quick start
- [Quick Start & Integration Guide](./INTEGRATION_GUIDE.md) — Step-by-step frontend integration
- [Endpoint Summary (Cheat Sheet)](./ENDPOINTS_CHEATSHEET.md) — One-page endpoint list

---

_Last updated: March 2, 2026_
