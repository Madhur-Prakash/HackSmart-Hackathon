# 📋 NavSwap — User API Reference

> Complete API documentation for user profile management (separated from authentication).

**Base URL:** `http://localhost:8000/api/v1`

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Standard Response Format](#-standard-response-format)
- [Error Response Format](#-error-response-format)
- [Customer Profile Management](#-customer-profile-management)
- [Transporter Profile Management](#-transporter-profile-management)
- [Profile Data Models](#-profile-data-models)

---

## 🎯 Overview

The **User API** handles all profile-related operations for customers and transporters. This is **separate from authentication** — all profile management requires an authenticated user with a valid `access_token`.

### Key Principles

- **Module Separation**: Auth handles credentials/login, User handles profile/personal data
- **Authentication Required**: All endpoints require a valid `access_token`
- **Versioning**: All endpoints follow `/api/v1/` prefix
- **User Role Support**: Different endpoints for `customer` and `transporter` roles

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
  "message": "Error description",
  "data": null,
  "success": false,
  "errors": []
}
```

### Common Error Codes

| Status | Meaning |
|--------|---------|
| `400` | Bad Request — missing or invalid fields |
| `401` | Unauthorized — invalid/missing token |
| `403` | Forbidden — insufficient permissions |
| `404` | Not Found — user doesn't exist |
| `500` | Internal Server Error |

---

## 👤 Customer Profile Management

**Base path:** `/api/v1/users/customers`

### 1. Get Customer Profile

Retrieve the complete customer profile including vehicles, addresses, preferences, and stats.

| | |
|---|---|
| **URL** | `GET /api/v1/users/customers/profile` |
| **Auth** | Required (`access_token`) |
| **Method** | GET |

**Request Body:** None

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Customer profile fetched successfully",
  "data": {
    "profile": {
      "vehicles": [
        {
          "id": "vehicle_1", 
          "userId": "665f1a2b3c4d5e6f7a8b9c0e",
          "type": "ev",
          "make": "Tesla",
          "model": "Model 3",
          "registrationNumber": "MH02AB1234",
          "color": "White",
          "manufacturingYear": 2023,
          "batteryCapacity": 75,
          "batteryType": "Li-ion",
          "isDefault": true,
          "createdAt": "2026-03-02T10:30:00.000Z",
          "updatedAt": "2026-03-02T10:30:00.000Z"
        }
      ],
      "addresses": [
        {
          "id": "addr_1",
          "userId": "665f1a2b3c4d5e6f7a8b9c0e",
          "label": "Home",
          "addressLine1": "123 Main Street",
          "addressLine2": "Apartment 5B",
          "city": "Mumbai",
          "state": "Maharashtra",
          "postalCode": "400001",
          "country": "India",
          "latitude": 19.0760,
          "longitude": 72.8777,
          "isDefault": true,
          "createdAt": "2026-03-02T10:30:00.000Z",
          "updatedAt": "2026-03-02T10:30:00.000Z"
        }
      ],
      "preferences": {
        "enableNotifications": true,
        "enableLocationServices": true,
        "enableAIRecommendations": true,
        "notificationChannels": ["push", "email"],
        "autoJoinQueue": false,
        "maxWaitTimeMinutes": 30,
        "maxDistanceKm": 10.0,
        "preferredStations": ["station_1", "station_2"],
        "languageCode": "en",
        "theme": "auto",
        "showNearbyStationsOnMap": true,
        "saveSwapHistory": true
      },
      "stats": {
        "totalSwaps": 5,
        "totalSpent": 250.50,
        "favoriteStationCount": 3,
        "averageWaitTime": 15.5,
        "reliabilityScore": 4.8,
        "streakDays": 7
      },
      "subscriptionPlan": "premium",
      "subscriptionExpiresAt": "2026-06-02T10:30:00.000Z",
      "paymentMethods": [
        {
          "id": "pm_1",
          "userId": "665f1a2b3c4d5e6f7a8b9c0e",
          "type": "card",
          "cardLast4": "1234",
          "cardBrand": "Visa",
          "isDefault": true,
          "expiryDate": "2026-12-31",
          "createdAt": "2026-03-02T10:30:00.000Z"
        }
      ]
    }
  },
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `401` | `"Unauthorized request"` |
| `404` | `"Customer profile not found"` |
| `500` | `"Error fetching customer profile"` |

---

### 2. Update Customer Profile

Update customer profile information including vehicles, addresses, preferences, and payment methods.

| | |
|---|---|
| **URL** | `PATCH /api/v1/users/customers/profile` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "vehicles": [
    {
      "id": "vehicle_1",
      "type": "ev",
      "make": "Tesla",
      "model": "Model 3",
      "registrationNumber": "MH02AB1234",
      "color": "White",
      "manufacturingYear": 2023,
      "batteryCapacity": 75,
      "batteryType": "Li-ion",
      "isDefault": true
    }
  ],
  "addresses": [
    {
      "id": "addr_1",
      "label": "Home",
      "addressLine1": "123 Main Street",
      "addressLine2": "Apartment 5B",
      "city": "Mumbai",
      "state": "Maharashtra",
      "postalCode": "400001",
      "country": "India",
      "latitude": 19.0760,
      "longitude": 72.8777,
      "isDefault": true
    }
  ],
  "preferences": {
    "enableNotifications": true,
    "enableLocationServices": true,
    "notificationChannels": ["push", "email"],
    "maxWaitTimeMinutes": 45,
    "maxDistanceKm": 15.0,
    "theme": "dark"
  },
  "subscriptionPlan": "premium",
  "paymentMethods": [
    {
      "id": "pm_1",
      "type": "card",
      "cardLast4": "1234",
      "cardBrand": "Visa",
      "isDefault": true,
      "expiryDate": "2026-12-31"
    }
  ]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `vehicles` | `array` | No | Array of vehicle objects |
| `addresses` | `array` | No | Array of address objects |
| `preferences` | `object` | No | Partial preference object (merged with existing) |
| `subscriptionPlan` | `string` | No | `free`, `basic`, `premium`, `enterprise` |
| `paymentMethods` | `array` | No | Array of payment method objects |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Customer profile updated successfully",
  "data": {
    "profile": { ... }
  },
  "success": true
}
```

**Error Responses:**

| Status | Message |
|--------|---------|
| `400` | `"Invalid profile data"` |
| `401` | `"Unauthorized request"` |
| `404` | `"Customer not found"` |
| `500` | `"Error updating customer profile"` |

---

### 3. Add Vehicle

Add a new vehicle to customer's vehicle list.

| | |
|---|---|
| **URL** | `POST /api/v1/users/customers/vehicles` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "type": "ev",
  "make": "BMW",
  "model": "i3",
  "registrationNumber": "DL01AB5678",
  "color": "Blue",
  "manufacturingYear": 2023,
  "batteryCapacity": 42,
  "batteryType": "Li-ion",
  "isDefault": false
}
```

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Vehicle added successfully",
  "data": {
    "vehicle": {
      "id": "vehicle_2",
      "userId": "665f1a2b3c4d5e6f7a8b9c0e",
      "type": "ev",
      "make": "BMW",
      "model": "i3",
      "registrationNumber": "DL01AB5678",
      "color": "Blue",
      "manufacturingYear": 2023,
      "batteryCapacity": 42,
      "batteryType": "Li-ion",
      "isDefault": false,
      "createdAt": "2026-03-14T10:30:00.000Z"
    }
  },
  "success": true
}
```

---

### 4. Delete Vehicle

Remove a vehicle from customer's list.

| | |
|---|---|
| **URL** | `DELETE /api/v1/users/customers/vehicles/:vehicleId` |
| **Auth** | Required (`access_token`) |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Vehicle deleted successfully",
  "data": {},
  "success": true
}
```

---

### 5. Add Address

Add a new address to customer's address list.

| | |
|---|---|
| **URL** | `POST /api/v1/users/customers/addresses` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "label": "Work",
  "addressLine1": "456 Business Park",
  "addressLine2": "Building A",
  "city": "Bangalore",
  "state": "Karnataka",
  "postalCode": "560001",
  "country": "India",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "isDefault": false
}
```

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Address added successfully",
  "data": {
    "address": {
      "id": "addr_2",
      "userId": "665f1a2b3c4d5e6f7a8b9c0e",
      "label": "Work",
      "addressLine1": "456 Business Park",
      "addressLine2": "Building A",
      "city": "Bangalore",
      "state": "Karnataka",
      "postalCode": "560001",
      "country": "India",
      "latitude": 12.9716,
      "longitude": 77.5946,
      "isDefault": false,
      "createdAt": "2026-03-14T10:30:00.000Z"
    }
  },
  "success": true
}
```

---

### 6. Update Preferences

Update customer notification and app preferences.

| | |
|---|---|
| **URL** | `PATCH /api/v1/users/customers/preferences` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "enableNotifications": true,
  "notificationChannels": ["push", "email", "sms"],
  "theme": "dark",
  "maxWaitTimeMinutes": 45,
  "maxDistanceKm": 20.0,
  "autoJoinQueue": true,
  "showNearbyStationsOnMap": true
}
```

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Preferences updated successfully",
  "data": {
    "preferences": { ... }
  },
  "success": true
}
```

---

## 🚛 Transporter Profile Management

**Base path:** `/api/v1/users/transporters`

### 1. Get Transporter Profile

Retrieve the complete transporter profile including vehicles, verification status, preferences, stats, and banking details.

| | |
|---|---|
| **URL** | `GET /api/v1/users/transporters/profile` |
| **Auth** | Required (`access_token`) |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Transporter profile fetched successfully",
  "data": {
    "profile": {
      "tier": "bronze",
      "stats": {
        "totalEarnings": 5000.00,
        "totalDeliveries": 25,
        "efficiencyScore": 4.7,
        "onTimePercentage": 95.0,
        "todayDeliveries": 3,
        "todayEarnings": 450.00,
        "averageRating": 4.8,
        "totalRatings": 120,
        "cancelledTasks": 1,
        "rejectedTasks": 0
      },
      "verification": {
        "idVerification": "approved",
        "vehicleVerification": "pending",
        "backgroundCheck": "approved"
      },
      "transportVehicle": {
        "id": "vehicle_1",
        "type": "truck",
        "make": "Mahindra",
        "model": "Bolero",
        "registrationNumber": "MH02AB9876",
        "color": "White",
        "manufacturingYear": 2022,
        "batteryCapacity": null,
        "batteryType": null,
        "isDefault": true
      },
      "bankDetails": {
        "id": "bank_1",
        "userId": "665f1a2b3c4d5e6f7a8b9c0f",
        "bankName": "HDFC Bank",
        "accountHolderName": "Suresh Kumar",
        "accountNumber": "****5678",
        "ifscCode": "HDFC0000123",
        "isDefault": true,
        "createdAt": "2026-03-02T10:30:00.000Z"
      },
      "preferences": {
        "enableNotifications": true,
        "enableLocationTracking": true,
        "notificationChannels": ["push", "email"],
        "autoAcceptTasks": true,
        "minTaskReward": 100.0,
        "maxTaskDistanceKm": 50.0,
        "preferredAreas": ["zone_1", "zone_2"],
        "languageCode": "en",
        "theme": "auto",
        "shareLocationWithCustomers": true,
        "offlineDuringBreaks": true
      },
      "isAvailable": true,
      "isOnline": true,
      "walletBalance": 2500.75,
      "certifications": ["DL", "Insurance", "SafetyTraining"],
      "certifications": [
        {
          "name": "DL",
          "issuedAt": "2020-01-15",
          "expiresAt": "2030-01-15"
        }
      ],
      "emergencyContact": {
        "id": "ec_1",
        "userId": "665f1a2b3c4d5e6f7a8b9c0f",
        "name": "Savitri Kumar",
        "relationship": "Spouse",
        "phoneNumber": "9988776655",
        "createdAt": "2026-03-02T10:30:00.000Z"
      }
    }
  },
  "success": true
}
```

---

### 2. Update Transporter Profile

Update transporter profile with vehicle, bank details, preferences, and emergency contact.

| | |
|---|---|
| **URL** | `PATCH /api/v1/users/transporters/profile` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "transportVehicle": {
    "type": "truck",
    "make": "Mahindra",
    "model": "Bolero",
    "registrationNumber": "MH02AB9876",
    "color": "White",
    "manufacturingYear": 2022,
    "isDefault": true
  },
  "bankDetails": {
    "bankName": "HDFC Bank",
    "accountHolderName": "Suresh Kumar",
    "accountNumber": "1234567890",
    "ifscCode": "HDFC0000123",
    "isDefault": true
  },
  "preferences": {
    "enableNotifications": true,
    "enableLocationTracking": true,
    "autoAcceptTasks": true,
    "minTaskReward": 150.0,
    "maxTaskDistanceKm": 75.0,
    "theme": "dark"
  },
  "emergencyContact": {
    "name": "Savitri Kumar",
    "relationship": "Spouse",
    "phoneNumber": "9988776655"
  }
}
```

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Transporter profile updated successfully",
  "data": {
    "profile": { ... }
  },
  "success": true
}
```

---

### 3. Update Availability Status

Toggle transporter availability and online status.

| | |
|---|---|
| **URL** | `PATCH /api/v1/users/transporters/availability` |
| **Auth** | Required (`access_token`) |
| **Content-Type** | `application/json` |

**Request Body:**

```json
{
  "isAvailable": true,
  "isOnline": true
}
```

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Availability status updated successfully",
  "data": {
    "isAvailable": true,
    "isOnline": true
  },
  "success": true
}
```

---

### 4. Add Certification

Add a new certification.

| | |
|---|---|
| **URL** | `POST /api/v1/users/transporters/certifications` |
| **Auth** | Required (`access_token`) |

**Request Body:**

```json
{
  "name": "SafetyTraining",
  "issuedAt": "2026-01-15",
  "expiresAt": "2027-01-15"
}
```

**Success Response — `201 Created`:**

```json
{
  "status_code": 201,
  "message": "Certification added successfully",
  "data": {
    "certification": { ... }
  },
  "success": true
}
```

---

### 5. Get Verification Status

Check verification status for all documents.

| | |
|---|---|
| **URL** | `GET /api/v1/users/transporters/verification` |
| **Auth** | Required (`access_token`) |

**Success Response — `200 OK`:**

```json
{
  "status_code": 200,
  "message": "Verification status fetched successfully",
  "data": {
    "verification": {
      "idVerification": "approved",
      "vehicleVerification": "pending",
      "backgroundCheck": "approved"
    }
  },
  "success": true
}
```

---

## 📊 Profile Data Models

### Customer Profile Schema

```typescript
{
  vehicles: Array<Vehicle>,
  addresses: Array<Address>,
  defaultAddress?: Address,
  preferences: CustomerPreferences,
  stats: CustomerStats,
  subscriptionPlan: string,
  subscriptionExpiresAt?: Date,
  paymentMethods: Array<PaymentMethod>,
  defaultPaymentMethod?: PaymentMethod
}
```

### Transporter Profile Schema

```typescript
{
  tier: string,
  stats: TransporterStats,
  verification: TransporterVerification,
  transportVehicle?: Vehicle,
  bankDetails?: BankDetails,
  preferences: TransporterPreferences,
  isAvailable: boolean,
  isOnline: boolean,
  walletBalance: number,
  certifications: Array<{name, issuedAt, expiresAt}>,
  emergencyContact?: EmergencyContact
}
```

### Common Schemas

**Vehicle:**
```json
{
  "id": "string",
  "userId": "string",
  "type": "ev|car|bike|truck|other",
  "make": "string",
  "model": "string",
  "registrationNumber": "string",
  "color": "string",
  "manufacturingYear": "number",
  "batteryCapacity": "number (kWh)",
  "batteryType": "string",
  "isDefault": "boolean"
}
```

**Address:**
```json
{
  "id": "string",
  "userId": "string",
  "label": "Home|Work|Other",
  "addressLine1": "string",
  "addressLine2": "string",
  "city": "string",
  "state": "string",
  "postalCode": "string",
  "country": "string",
  "latitude": "number",
  "longitude": "number",
  "isDefault": "boolean"
}
```

---

## 🔐 Authentication Notes

All user profile endpoints require:

- **Header:** `Authorization: Bearer <access_token>` OR
- **Cookie:** `access_token` (automatically sent by browsers)

Tokens are obtained during authentication:

```bash
# After customer/transporter registration or login
POST /api/v1/customers/register
POST /api/v1/customers/login
POST /api/v1/transporters/register
POST /api/v1/transporters/login
```

See [Auth API Reference](../auth/API_REFERENCE.md) for authentication endpoints.

---

**Last Updated:** March 14, 2026  
**Version:** 1.0.0
