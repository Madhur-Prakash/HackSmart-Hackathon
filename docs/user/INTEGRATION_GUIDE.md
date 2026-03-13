# 🔗 User API — Integration Guide

> Update user profiles and basic account details after authentication.

---

## 📑 Table of Contents

1. [Available Endpoints](#-available-endpoints)
2. [Update Account Details](#-update-account-details)
3. [Upload Avatar](#-upload-avatar)
4. [Update Profile](#-update-profile-customer--transporter-only)
5. [Error Handling](#-error-handling)
6. [Code Examples](#-code-examples)

---

## ✅ Available Endpoints

All endpoints are under `/api/v1/user/{role}/` where role is one of:
- `customer`
- `transporter`
- `company`
- `staff`
- `regional_admin`

### All Roles Support:
- ✅ `PATCH /update_account_details` - Update basic user information
- ✅ `PATCH /update_avatar` - Upload profile picture (multipart/form-data)

### Customer & Transporter Only:
- ✅ `PATCH /update_profile` - Update detailed profile

### Full Examples:
```
PATCH /api/v1/user/customer/update_account_details
PATCH /api/v1/user/customer/update_avatar
PATCH /api/v1/user/customer/update_profile

PATCH /api/v1/user/transporter/update_account_details
PATCH /api/v1/user/transporter/update_avatar
PATCH /api/v1/user/transporter/update_profile

PATCH /api/v1/user/company/update_account_details
PATCH /api/v1/user/company/update_avatar

PATCH /api/v1/user/staff/update_account_details
PATCH /api/v1/user/staff/update_avatar

PATCH /api/v1/user/regional_admin/update_account_details
PATCH /api/v1/user/regional_admin/update_avatar
```

---

## 📝 Update Account Details

Update basic user information like name and phone number.

**Endpoint:** `PATCH /api/v1/user/{role}/update_account_details`

**Auth:** Required ✅

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Doe",
  "phone_number": "+919876543210"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Account details updated successfully",
  "data": {
    "user": {
      "_id": "user_id",
      "first_name": "Jane",
      "last_name": "Doe",
      "email": "jane@example.com",
      "phone_number": "+919876543210"
    }
  }
}
```

### JavaScript Example

```javascript
async function updateAccountDetails(token, firstName, lastName, phone) {
  const response = await fetch('http://localhost:8000/api/v1/user/customer/update_account_details', {
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
  });

  const data = await response.json();
  if (data.success) {
    console.log('Account updated:', data.data.user);
  } else {
    console.error('Update failed:', data.message);
  }
  return data;
}
```

### React Example

```jsx
import { useState } from 'react';

export function UpdateAccountForm() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:8000/api/v1/user/customer/update_account_details', {
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
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      alert('Account updated successfully');
    } else {
      alert('Error: ' + data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input 
        type="text" 
        value={firstName} 
        onChange={(e) => setFirstName(e.target.value)} 
        placeholder="First Name"
      />
      <input 
        type="text" 
        value={lastName} 
        onChange={(e) => setLastName(e.target.value)} 
        placeholder="Last Name"
      />
      <input 
        type="tel" 
        value={phone} 
        onChange={(e) => setPhone(e.target.value)} 
        placeholder="Phone Number"
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Account'}
      </button>
    </form>
  );
}
```

### Flutter/Dart Example

```dart
Future<Map<String, dynamic>> updateAccountDetails({
  required String token,
  required String firstName,
  required String lastName,
  required String phoneNumber,
}) async {
  final response = await http.patch(
    Uri.parse('http://YOUR_IP:8000/api/v1/user/customer/update_account_details'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'first_name': firstName,
      'last_name': lastName,
      'phone_number': phoneNumber,
    }),
  );

  return jsonDecode(response.body);
}
```

---

## 🖼️ Upload Avatar

Upload a profile picture. Only supports image files.

**Endpoint:** `PATCH /api/v1/user/{role}/update_avatar`

**Auth:** Required ✅

**Content-Type:** `multipart/form-data`

**Form Data:**
- Key: `avatar`
- Value: Image file (JPEG, PNG, GIF, WebP, etc.)

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Avatar updated successfully",
  "data": {
    "avatar_url": "https://example.com/avatars/user_123.jpg"
  }
}
```

### JavaScript Example

```javascript
async function uploadAvatar(token, file) {
  const formData = new FormData();
  formData.append('avatar', file);

  const response = await fetch('http://localhost:8000/api/v1/user/customer/update_avatar', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      // Do NOT set Content-Type — browser handles it with multipart/form-data
    },
    body: formData,
  });

  return response.json();
}
```

### React Example with File Input

```jsx
import { useState } from 'react';

export function AvatarUpload() {
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch('http://localhost:8000/api/v1/user/customer/update_avatar', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      alert('Avatar uploaded successfully');
      console.log('Avatar URL:', data.data.avatar_url);
    } else {
      alert('Error: ' + data.message);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileChange}
        disabled={loading}
      />
      {loading && <p>Uploading...</p>}
    </div>
  );
}
```

### React Native Example

```javascript
import * as ImagePicker from 'expo-image-picker';

async function pickAndUploadAvatar(token) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    const formData = new FormData();
    formData.append('avatar', {
      uri: result.assets[0].uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });

    const response = await fetch('http://YOUR_IP:8000/api/v1/user/customer/update_avatar', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    return response.json();
  }
}
```

### Flutter/Dart Example

```dart
import 'dart:io';
import 'package:image_picker/image_picker.dart';

Future<Map<String, dynamic>> uploadAvatar(File imageFile, String token) async {
  final request = http.MultipartRequest(
    'PATCH',
    Uri.parse('http://YOUR_IP:8000/api/v1/user/customer/update_avatar'),
  );

  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(
    await http.MultipartFile.fromPath('avatar', imageFile.path),
  );

  final response = await request.send();
  final responseBody = await response.stream.bytesToString();

  return jsonDecode(responseBody);
}

// Usage with image picker
Future<void> pickAndUploadAvatar(String token) async {
  final ImagePicker picker = ImagePicker();
  final XFile? image = await picker.pickImage(source: ImageSource.gallery);

  if (image != null) {
    final result = await uploadAvatar(File(image.path), token);
    if (result['success']) {
      print('Avatar updated: ${result['data']['avatar_url']}');
    }
  }
}
```

---

## 📋 Update Profile (Customer & Transporter Only)

Update detailed profile information beyond basic account details.

**Endpoint:** `PATCH /api/v1/user/{role}/update_profile`

**Auth:** Required ✅

**Role:** Customer or Transporter only

**Request Body Example:**
```json
{
  "bio": "I love electric vehicles",
  "gender": "male",
  "dateOfBirth": "1990-01-15"
}
```

**Response (Success - 200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "profile": {
      "bio": "I love electric vehicles",
      "gender": "male",
      "dateOfBirth": "1990-01-15",
      "profileCompleted": true
    }
  }
}
```

### JavaScript Example

```javascript
async function updateCustomerProfile(token, profileData) {
  const response = await fetch('http://localhost:8000/api/v1/user/customer/update_profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  return response.json();
}

// Usage
const result = await updateCustomerProfile(token, {
  bio: 'Electric vehicle enthusiast',
  gender: 'female',
  dateOfBirth: '1992-03-15',
});
```

### React Example

```jsx
import { useState } from 'react';

export function UpdateProfileForm() {
  const [bio, setBio] = useState('');
  const [gender, setGender] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('access_token');
    const response = await fetch('http://localhost:8000/api/v1/user/customer/update_profile', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bio,
        gender,
        dateOfBirth,
      }),
    });

    const data = await response.json();
    setLoading(false);

    if (data.success) {
      alert('Profile updated successfully');
    } else {
      alert('Error: ' + data.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        value={bio}
        onChange={(e) => setBio(e.target.value)}
        placeholder="Your bio"
      />
      <select value={gender} onChange={(e) => setGender(e.target.value)}>
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
      </select>
      <input
        type="date"
        value={dateOfBirth}
        onChange={(e) => setDateOfBirth(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Updating...' : 'Update Profile'}
      </button>
    </form>
  );
}
```

### Flutter/Dart Example

```dart
Future<Map<String, dynamic>> updateCustomerProfile({
  required String token,
  required String bio,
  required String gender,
  required String dateOfBirth, // Format: YYYY-MM-DD
}) async {
  final response = await http.patch(
    Uri.parse('http://YOUR_IP:8000/api/v1/user/customer/update_profile'),
    headers: {
      'Authorization': 'Bearer $token',
      'Content-Type': 'application/json',
    },
    body: jsonEncode({
      'bio': bio,
      'gender': gender,
      'dateOfBirth': dateOfBirth,
    }),
  );

  return jsonDecode(response.body);
}
```

---

## ❌ Error Handling

Common error codes and how to handle them:

| Status Code | Error | Solution |
|----------|-------|----------|
| 400 | Bad Request | Check request body format and required fields |
| 401 | Unauthorized | Token expired or invalid. Re-login to get new token |
| 404 | Not Found | User not found in database |
| 413 | Payload Too Large | File/data size exceeds limit |
| 500 | Server Error | Try again later |

### Error Handling Example

```javascript
async function handleApiCall(endpoint, method, data, token) {
  try {
    const response = await fetch(`http://localhost:8000${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': method === 'PATCH' ? 'application/json' : undefined,
      },
      body: data ? JSON.stringify(data) : undefined,
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle specific error codes
      switch (response.status) {
        case 400:
          console.error('Validation Error:', result.message);
          break;
        case 401:
          console.error('Token expired, redirecting to login');
          localStorage.removeItem('access_token');
          window.location.href = '/login';
          break;
        case 404:
          console.error('User not found');
          break;
        default:
          console.error('Error:', result.message);
      }
      return { success: false, error: result.message };
    }

    return result;
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error' };
  }
}
```

---

## 💻 Complete Usage Example

```javascript
const API_BASE = 'http://localhost:8000/api/v1';

class UserProfileManager {
  constructor(token) {
    this.token = token;
  }

  async updateAccountDetails(firstName, lastName, phone) {
    const response = await fetch(
      `${API_BASE}/user/customer/update_account_details`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: phone,
        }),
      }
    );
    return response.json();
  }

  async uploadAvatar(file) {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await fetch(
      `${API_BASE}/user/customer/update_avatar`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
        body: formData,
      }
    );
    return response.json();
  }

  async updateProfile(bio, gender, dateOfBirth) {
    const response = await fetch(
      `${API_BASE}/user/customer/update_profile`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bio,
          gender,
          dateOfBirth,
        }),
      }
    );
    return response.json();
  }
}

// Usage
const token = localStorage.getItem('access_token');
const manager = new UserProfileManager(token);

// Update account
await manager.updateAccountDetails('John', 'Doe', '+919876543210');

// Upload avatar
const file = document.getElementById('avatarInput').files[0];
await manager.uploadAvatar(file);

// Update profile (customer/transporter only)
await manager.updateProfile('Tech enthusiast', 'male', '1990-05-15');
```

---

**Last Updated:** March 15, 2026  
**Version:** 1.1.0  
**Status:** ✅ All endpoints documented and verified against live codebase
