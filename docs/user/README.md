# 👤 User API Module

> Profile management API for updating user information and uploading avatars

## 📌 Overview

The User API module provides endpoints for authenticated users to update their profile information. This includes basic account details (name, phone), profile pictures, and detailed profile information (for certain roles).

**Base URL:** `http://localhost:8000/api/v1/user`

**Module:** User Profile Management

**Status:** ✅ Production Ready

---

## ✅ Available Endpoints

### All Roles

All of the following roles can use these endpoints:
- customer
- transporter
- company
- staff
- regional_admin

#### Update Account Details
- **Method:** `PATCH`
- **Endpoint:** `/{role}/update_account_details`
- **Purpose:** Update name and phone number
- **Auth:** Required

#### Upload Avatar
- **Method:** `PATCH`
- **Endpoint:** `/{role}/update_avatar`
- **Purpose:** Upload or change profile picture
- **Auth:** Required
- **Content-Type:** `multipart/form-data`

### Customer & Transporter Only

#### Update Profile
- **Method:** `PATCH`
- **Endpoint:** `/{role}/update_profile`
- **Purpose:** Update bio, gender, and date of birth
- **Auth:** Required
- **Roles:** customer, transporter

---

## 📚 Quick Start

### 1. Update Your Account Details

```javascript
const token = localStorage.getItem('access_token');

const response = await fetch('http://localhost:8000/api/v1/user/customer/update_account_details', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    first_name: 'John',
    last_name: 'Doe',
    phone_number: '+919876543210',
  }),
});

const data = await response.json();
console.log(data);
```

### 2. Upload Profile Picture

```javascript
const fileInput = document.getElementById('avatarInput');
const file = fileInput.files[0];

const formData = new FormData();
formData.append('avatar', file);

const response = await fetch('http://localhost:8000/api/v1/user/customer/update_avatar', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    // Don't set Content-Type - browser will handle it
  },
  body: formData,
});

const data = await response.json();
console.log('Avatar URL:', data.data.avatar_url);
```

### 3. Update Your Profile (Customers & Transporters)

```javascript
const response = await fetch('http://localhost:8000/api/v1/user/customer/update_profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bio: 'I love electric vehicles!',
    gender: 'male',
    dateOfBirth: '1990-05-15',
  }),
});

const data = await response.json();
console.log(data);
```

---

## 📖 Detailed Documentation

### Update Account Details

**Endpoint:** `PATCH /api/v1/user/{role}/update_account_details`

**Authentication:** Bearer token required

**Request:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "phone_number": "+919876543210"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account details updated successfully",
  "data": {
    "user": {
      "_id": "507f1f77bcf86cd799439011",
      "first_name": "Jane",
      "last_name": "Smith",
      "email": "jane@example.com",
      "phone_number": "+919876543210"
    }
  }
}
```

### Upload Avatar

**Endpoint:** `PATCH /api/v1/user/{role}/update_avatar`

**Authentication:** Bearer token required

**Content-Type:** `multipart/form-data`

**Form Params:**
- `avatar` (file, required): Image file

**Supported Formats:** JPEG, PNG, GIF, WebP

**Response:**
```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": {
    "avatar_url": "https://example.com/avatars/user_id.jpg"
  }
}
```

### Update Profile (Customer/Transporter)

**Endpoint:** `PATCH /api/v1/user/{role}/update_profile`

**Authentication:** Bearer token required

**Available Roles:** customer, transporter

**Request:**
```json
{
  "bio": "Brief description about yourself",
  "gender": "male", // or "female", "other"
  "dateOfBirth": "1990-05-15" // YYYY-MM-DD format
}
```

**Response:**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "bio": "Brief description about yourself",
      "gender": "male",
      "dateOfBirth": "1990-05-15",
      "profileCompleted": true
    }
  }
}
```

---

## 🛠️ Implementation Examples

### React Component

```jsx
import { useState } from 'react';

export function ProfileManager() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem('access_token');

  const handleUpdateAccount = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        'http://localhost:8000/api/v1/user/customer/update_account_details',
        {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            first_name: firstName,
            last_name: lastName,
            phone_number: phone,
          }),
        }
      );
      
      const data = await response.json();
      if (data.success) {
        alert('Account updated!');
      } else {
        alert('Error: ' + data.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        placeholder="First Name"
        value={firstName}
        onChange={(e) => setFirstName(e.target.value)}
      />
      <input 
        placeholder="Last Name"
        value={lastName}
        onChange={(e) => setLastName(e.target.value)}
      />
      <input 
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <button onClick={handleUpdateAccount} disabled={loading}>
        {loading ? 'Updating...' : 'Update'}
      </button>
    </div>
  );
}
```

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> updateUserProfile() async {
  final token = await storage.read(key: 'access_token');
  
  final response = await http.patch(
    Uri.parse('http://YOUR_IP:8000/api/v1/user/customer/update_account_details'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'first_name': 'John',
      'last_name': 'Doe',
      'phone_number': '+919876543210',
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    print('Success: ${data['message']}');
  } else {
    print('Error: ${response.statusCode}');
  }
}
```

---

## ❌ Common Errors

| Error | Status | Solution |
|-------|--------|----------|
| Invalid token | 401 | Re-login to get a new token |
| Validation failed | 400 | Check field names and formats |
| User not found | 404 | Ensure token is valid |
| File too large | 413 | Reduce image size |
| Not authorized for endpoint | 403 | Check your role supports this endpoint |

---

## 📋 Request/Response Examples

### Successful Update
```
Request:
PATCH /api/v1/user/customer/update_account_details
Authorization: Bearer eyJhbGc...

Response (200):
{
  "success": true,
  "message": "Account details updated successfully",
  "data": { "user": { ... } }
}
```

### File Upload
```
Request:
PATCH /api/v1/user/customer/update_avatar
Authorization: Bearer eyJhbGc...
Content-Type: multipart/form-data

[Binary image data]

Response (200):
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": { "avatar_url": "https://..." }
}
```

---

## 🔐 Authentication

All endpoints require Bearer token authentication:

```
Authorization: Bearer {access_token}
```

Get your access token from the Auth API login endpoint.

---

## 📞 Support

For issues or questions:
1. Check the [API Reference](./API_REFERENCE.md)
2. Review the [Integration Guide](./INTEGRATION_GUIDE.md)
3. Check endpoint examples above

---

**Last Updated:** March 15, 2026  
**Version:** 1.0.0  
**Documentation Status:** ✅ Complete and Verified
