# 📋 User API — Endpoints Cheatsheet

Quick reference for all user profile management endpoints.

---

## 👤 Customer Profile Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/users/customers/profile` | Get customer profile | ✅ Required |
| `PATCH` | `/api/v1/users/customers/profile` | Update customer profile | ✅ Required |
| `POST` | `/api/v1/users/customers/vehicles` | Add vehicle | ✅ Required |
| `DELETE` | `/api/v1/users/customers/vehicles/:vehicleId` | Delete vehicle | ✅ Required |
| `POST` | `/api/v1/users/customers/addresses` | Add address | ✅ Required |
| `DELETE` | `/api/v1/users/customers/addresses/:addressId` | Delete address | ✅ Required |
| `PATCH` | `/api/v1/users/customers/preferences` | Update preferences | ✅ Required |

---

## 🚛 Transporter Profile Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/v1/users/transporters/profile` | Get transporter profile | ✅ Required |
| `PATCH` | `/api/v1/users/transporters/profile` | Update transporter profile | ✅ Required |
| `PATCH` | `/api/v1/users/transporters/availability` | Update availability status | ✅ Required |
| `POST` | `/api/v1/users/transporters/certifications` | Add certification | ✅ Required |
| `DELETE` | `/api/v1/users/transporters/certifications/:certId` | Delete certification | ✅ Required |
| `GET` | `/api/v1/users/transporters/verification` | Get verification status | ✅ Required |

---

## 🔑 Quick Examples

### Get Customer Profile
```bash
curl -X GET http://localhost:8000/api/v1/users/customers/profile \
  -H "Authorization: Bearer <access_token>"
```

### Update Customer Profile
```bash
curl -X PATCH http://localhost:8000/api/v1/users/customers/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionPlan": "premium",
    "preferences": {
      "enableNotifications": true,
      "theme": "dark"
    }
  }'
```

### Add Vehicle
```bash
curl -X POST http://localhost:8000/api/v1/users/customers/vehicles \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ev",
    "make": "Tesla",
    "model": "Model 3",
    "registrationNumber": "MH02AB1234",
    "color": "White",
    "manufacturingYear": 2023,
    "batteryCapacity": 75,
    "batteryType": "Li-ion"
  }'
```

### Get Transporter Profile
```bash
curl -X GET http://localhost:8000/api/v1/users/transporters/profile \
  -H "Authorization: Bearer <access_token>"
```

### Update Transporter Profile
```bash
curl -X PATCH http://localhost:8000/api/v1/users/transporters/profile \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "bankDetails": {
      "bankName": "HDFC Bank",
      "accountHolderName": "Suresh Kumar",
      "accountNumber": "1234567890",
      "ifscCode": "HDFC0000123"
    },
    "preferences": {
      "autoAcceptTasks": true,
      "maxTaskDistanceKm": 75
    }
  }'
```

### Update Availability Status
```bash
curl -X PATCH http://localhost:8000/api/v1/users/transporters/availability \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "isAvailable": true,
    "isOnline": true
  }'
```

### Add Certification
```bash
curl -X POST http://localhost:8000/api/v1/users/transporters/certifications \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "SafetyTraining",
    "issuedAt": "2026-01-15",
    "expiresAt": "2027-01-15"
  }'
```

---

## 📋 Request/Response Summary

### Customer Profile Update

**Request:**
```json
{
  "vehicles": [],
  "addresses": [],
  "preferences": { /* partial or full */ },
  "subscriptionPlan": "premium",
  "paymentMethods": []
}
```

**Response Codes:**
- `200 OK` — Success
- `400 Bad Request` — Invalid data
- `401 Unauthorized` — Missing/invalid token
- `404 Not Found` — Customer not found
- `500 Server Error` — Internal error

---

### Transporter Profile Update

**Request:**
```json
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

