# 👤 User Profile Management API

> API for managing customer and transporter profile information in NavSwap.

---

## 📌 Overview

The **User API** is a separate module from authentication that handles:

✅ **Customer Profile Management:**
- Vehicles (add, update, delete)
- Delivery addresses
- Preferences & settings
- Payment methods
- Subscription management
- User statistics

✅ **Transporter Profile Management:**
- Transport vehicle details
- Bank account information
- Verification documents
- Certifications
- Availability status
- Preferences & settings
- Wallet balance
- Performance statistics

---

## 🏗️ Architecture

```
src/services/
├── auth/                  # Authentication only (register, login, logout, password reset)
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── schemas/
│
└── user/                  # Profile management (vehicles, addresses, preferences, stats)
    ├── controllers/
    ├── models/
    ├── routes/
    └── schemas/
```

### Module Separation

| Module | Responsibility | Examples |
|--------|-----------------|----------|
| **Auth** | Authentication & Credentials | Register, Login, Logout, Change Password, Token Refresh |
| **User** | Profile & Personal Data | Vehicles, Addresses, Preferences, Verification, Banking details |

---

## 🚀 Getting Started

### Prerequisites

- Valid `access_token` from authentication
- Node.js backend running on `http://localhost:8000`
- Base API path: `/api/v1`

### Authentication

All user profile endpoints require authentication. Include token in:

**Option A — Authorization Header:**
```bash
Authorization: Bearer <access_token>
```

**Option B — Cookie (for browsers):**
Automatically sent if cookies are enabled.

---

## 📚 Documentation Files

- **[API_REFERENCE.md](./API_REFERENCE.md)** — Complete endpoint documentation with request/response examples
- **[ENDPOINTS_CHEATSHEET.md](./ENDPOINTS_CHEATSHEET.md)** — Quick reference for all endpoints
- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** — Step-by-step integration examples

---

## ⚡ Common Tasks

### 1. Get Customer Profile
```javascript
const response = await fetch('/api/v1/users/customers/profile', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${access_token}`
  }
});
const data = await response.json();
```

### 2. Add Vehicle
```javascript
const newVehicle = {
  type: 'ev',
  make: 'Tesla',
  model: 'Model 3',
  registrationNumber: 'MH02AB1234',
  color: 'White',
  manufacturingYear: 2023,
  batteryCapacity: 75,
  batteryType: 'Li-ion'
};

const response = await fetch('/api/v1/users/customers/vehicles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(newVehicle)
});
```

### 3. Update Customer Preferences
```javascript
const preferences = {
  enableNotifications: true,
  notificationChannels: ['push', 'email'],
  theme: 'dark',
  maxWaitTimeMinutes: 45
};

const response = await fetch('/api/v1/users/customers/preferences', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(preferences)
});
```

### 4. Update Transporter Availability
```javascript
const response = await fetch('/api/v1/users/transporters/availability', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    isAvailable: true,
    isOnline: true
  })
});
```

---

## 🔄 Common Patterns

### Pattern 1: Full Profile Update

When updating profile, you can send partial data — only fields provided are updated:

```javascript
// Only update subscriptionPlan and preferences
const update = {
  subscriptionPlan: 'premium',
  preferences: {
    theme: 'dark'
  }
};

const response = await fetch('/api/v1/users/customers/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(update)
});
```

### Pattern 2: Add Sub-Resources

Add vehicles, addresses, certifications as separate endpoints:

```javascript
// Add new vehicle
POST /api/v1/users/customers/vehicles
Body: { type, make, model, registrationNumber, ... }

// Add new address
POST /api/v1/users/customers/addresses
Body: { label, addressLine1, city, state, ... }

// Add new certification
POST /api/v1/users/transporters/certifications
Body: { name, issuedAt, expiresAt }
```

### Pattern 3: Error Handling

All errors follow standard format:

```json
{
  "status_code": 400,
  "message": "Invalid profile data",
  "success": false,
  "errors": []
}
```

---

## 📊 Data Models

### Customer Profile

```typescript
interface CustomerProfile {
  vehicles: Vehicle[];
  addresses: Address[];
  preferences: CustomerPreferences;
  stats: CustomerStats;
  subscriptionPlan: SubscriptionPlan;
  paymentMethods: PaymentMethod[];
}
```

### Transporter Profile

```typescript
interface TransporterProfile {
  tier: TransporterTier;
  stats: TransporterStats;
  verification: TransporterVerification;
  transportVehicle: Vehicle;
  bankDetails: BankDetails;
  preferences: TransporterPreferences;
  isAvailable: boolean;
  isOnline: boolean;
  walletBalance: number;
  certifications: Certification[];
  emergencyContact: EmergencyContact;
}
```

---

## 🛠️ Implementation Notes

### Response Format

All responses (success and error) follow this structure:

```json
{
  "status_code": 200,
  "message": "Descriptive message",
  "data": { /* response payload */ },
  "success": true
}
```

### Status Codes

| Code | Meaning |
|------|---------|
| `200` | Success (GET, PATCH, DELETE) |
| `201` | Created (POST) |
| `400` | Bad Request |
| `401` | Unauthorized |
| `403` | Forbidden |
| `404` | Not Found |
| `500` | Server Error |

### Validation

- All input fields are validated server-side
- Invalid data returns `400 Bad Request`
- Missing required fields return descriptive error messages
- Duplicate resources (e.g., duplicate email) return `409 Conflict`

---

## 🔐 Security Considerations

✅ **Always include access_token** — All endpoints require authentication
✅ **Use HTTPS in production** — Protect tokens in transit
✅ **Token expiry** — Access tokens expire; use refresh token to get new one
✅ **HttpOnly cookies** — Tokens are set as `httpOnly` for security
✅ **CORS enabled** — Cross-origin requests supported

See [Auth API Reference](../auth/API_REFERENCE.md) for token management.

---

## 📞 Support & Examples

For more detailed examples and specific use cases:

1. **API Reference** — Full endpoint documentation with all fields
2. **Endpoints Cheatsheet** — Quick copy-paste examples
3. **Integration Guide** — Step-by-step integration walkthrough

---

## 🔗 Related Resources

- [Auth API Documentation](../auth/README.md) — Authentication endpoints
- [Full API Reference](./API_REFERENCE.md) — Complete endpoint documentation
- [Backend Repository](https://github.com/your-org/navswap-backend)

---

**Last Updated:** March 14, 2026  
**Version:** 1.0.0  
**Status:** 🟢 Production Ready

