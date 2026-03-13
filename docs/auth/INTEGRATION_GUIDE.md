# 🚀 Auth API — Integration Guide

> Step-by-step guide to implement authentication in your frontend or mobile app.

---

## 📑 Table of Contents

1. [Getting Started](#-getting-started)
2. [Authentication Flow](#-authentication-flow)
3. [Available Endpoints](#-available-endpoints)
4. [Storing Tokens](#-storing-tokens)
5. [Making Authenticated Requests](#-making-authenticated-requests)
6. [File Upload (Avatar)](#-file-upload-avatar)
7. [Error Handling](#-error-handling)
8. [Code Examples](#-code-examples)

---

## 🏁 Getting Started

1. Ensure the backend server is running on `http://localhost:8000`
2. All API routes are prefixed with `/api/v1`
3. Responses follow a consistent JSON format (see [API Reference](./API_REFERENCE.md))

---

---

## Available Endpoints

All Auth endpoints are under `/api/v1/auth/{role}/` where role is one of:
- `customers`
- `transporters`
- `companies`
- `staff`
- `regional_admins`

### All Roles Support:
- ✅ `POST /register` - User registration
- ✅ `POST /login` - User login
- ✅ `POST /refresh_access_token` - Refresh tokens
- ✅ `POST /change_password` - Change password
- ✅ `POST /logout` - Logout (requires auth)
- ✅ `GET /current_user` - Get current user (requires auth)

### Transporters Only Support:
- ✅ `PATCH /update_account_details` - Update basic details
- ✅ `PATCH /update_avatar` - Upload avatar image (multipart/form-data)

---

## 🔐 Authentication Flow

```
1. POST /api/v1/auth/{role}/register
   ↓ Returns: { user, access_token, refresh_token }
   ↓ Sets httpOnly cookies

2. Use access_token for protected endpoints
   Header: Authorization: Bearer {access_token}
   
   Available operations:
   - GET /api/v1/auth/{role}/current_user
   - POST /api/v1/auth/{role}/logout
   - PATCH /api/v1/auth/transporters/update_account_details (transporters only)
   - PATCH /api/v1/auth/transporters/update_avatar (transporters only)

3. When access_token expires → GET 401 response
   POST /api/v1/auth/{role}/refresh_access_token
   ↓ Returns new { access_token, refresh_token }

4. POST /api/v1/auth/{role}/logout
   ↓ Clears tokens and ends session
```

---

## 💾 Storing Tokens

### Web (React / Next.js)

Tokens are automatically stored as **httpOnly cookies** by the browser. For SPAs that need to send tokens via headers:

```javascript
// Store in memory (most secure for SPAs)
let accessToken = null;
let refreshToken = null;

function setTokens(access, refresh) {
  accessToken = access;
  refreshToken = refresh;
}

function getAccessToken() {
  return accessToken;
}
```

> **⚠️ Warning:** Never store tokens in `localStorage` — they are vulnerable to XSS attacks. Use httpOnly cookies or in-memory storage.

### Mobile (React Native / Flutter)

Use secure storage:

```javascript
// React Native — use react-native-keychain or expo-secure-store
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('access_token', token);
const token = await SecureStore.getItemAsync('access_token');
```

```dart
// Flutter — use flutter_secure_storage
final storage = FlutterSecureStorage();
await storage.write(key: 'access_token', value: token);
String? token = await storage.read(key: 'access_token');
```

---

## 📡 Making Authenticated Requests

### JavaScript (Fetch)

```javascript
const API_BASE = 'http://localhost:8000/api/v1';

async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await response.json();

  // Handle 401 — try refreshing token
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry with new token
      return apiRequest(endpoint, options);
    }
  }

  return data;
}

async function refreshAccessToken() {
  const token = localStorage.getItem('refresh_token');
  const role = localStorage.getItem('user_role'); // store this after login
  
  try {
    const response = await fetch(
      `${API_BASE}/auth/${role}/refresh_access_token`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();
    if (data.success) {
      localStorage.setItem('access_token', data.data.access_token);
      localStorage.setItem('refresh_token', data.data.refresh_token);
      return true;
    }
  } catch (err) {
    console.error('Token refresh failed:', err);
  }
  
  return false;
}
```

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const role = localStorage.getItem('user_role');
        const refreshToken = localStorage.getItem('refresh_token');
        
        const response = await axios.post(
          `/auth/${role}/refresh_access_token`,
          {},
          {
            headers: { 'Authorization': `Bearer ${refreshToken}` },
          }
        );

        const { access_token, refresh_token } = response.data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);

        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
```

---

## 📁 File Upload (Avatar — Transporters Only)

Only transporters can upload avatars. The endpoint is `PATCH /api/v1/auth/transporters/update_avatar`.

Upload uses `multipart/form-data`. Do **not** set Content-Type manually — the client library handles this.

### JavaScript

```javascript
const API_BASE = 'http://localhost:8000/api/v1';

async function uploadAvatar(file, token) {
  const formData = new FormData();
  formData.append('avatar', file); // key MUST be "avatar"

  const response = await fetch(
    `${API_BASE}/auth/transporters/update_avatar`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Do NOT set Content-Type
      },
      body: formData,
    }
  );

  return response.json();
}
```

### React Native

```javascript
import * as ImagePicker from 'expo-image-picker';

async function selectAndUploadAvatar(token) {
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

    const response = await fetch(
      'http://YOUR_IP:8000/api/v1/auth/transporters/update_avatar',
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      }
    );

    return response.json();
  }
}
```

### Flutter/Dart

```dart
import 'package:http/http.dart' as http;

Future<Map<String, dynamic>> uploadTransporterAvatar(
  File file,
  String token,
) async {
  final request = http.MultipartRequest(
    'PATCH',
    Uri.parse('http://YOUR_IP:8000/api/v1/auth/transporters/update_avatar'),
  );

  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath('avatar', file.path));

  final response = await request.send();
  final responseBody = await response.stream.bytesToString();

  return jsonDecode(responseBody);
}
```

---

## 💻 Complete Code Examples

### React/Next.js — Customer Registration & Login

```jsx
import { useState } from 'react';

export function CustomerAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const register = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/customers/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'John',
          last_name: 'Doe',
          email,
          password,
          phone_number: '+919876543210',
          country_code: '+91',
        }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user_role', 'customers');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/customers/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('access_token', data.data.access_token);
        localStorage.setItem('refresh_token', data.data.refresh_token);
        localStorage.setItem('user_role', 'customers');
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Login failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
      <input value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" />
      <button onClick={register} disabled={loading}>Register</button>
      <button onClick={login} disabled={loading}>Login</button>
    </div>
  );
}
```

### React Native/Expo — Transporter Auth

```javascript
import { useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export function TransporterAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const response = await fetch('http://YOUR_IP:8000/api/v1/auth/transporters/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (data.success) {
      await SecureStore.setItemAsync('access_token', data.data.access_token);
      await SecureStore.setItemAsync('refresh_token', data.data.refresh_token);
      // Navigate to home
    }
  };

  return (
    <View>
      <TextInput value={email} onChangeText={setEmail} placeholder="Email" />
      <TextInput value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
      <Button title="Login" onPress={handleLogin} />
    </View>
  );
}
```

### Flutter/Dart — Complete Authentication

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const baseUrl = 'http://YOUR_IP:8000/api/v1';
  final storage = const FlutterSecureStorage();

  Future<bool> customerRegister({
    required String firstName,
    required String lastName,
    required String email,
    required String password,
    required String phoneNumber,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/customers/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'first_name': firstName,
        'last_name': lastName,
        'email': email,
        'password': password,
        'phone_number': phoneNumber,
        'country_code': '+91',
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      await storage.write(
        key: 'access_token',
        value: data['data']['access_token'],
      );
      await storage.write(
        key: 'refresh_token',
        value: data['data']['refresh_token'],
      );
      return true;
    }
    return false;
  }

  Future<bool> transporterLogin(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/transporters/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await storage.write(
        key: 'access_token',
        value: data['data']['access_token'],
      );
      await storage.write(
        key: 'refresh_token',
        value: data['data']['refresh_token'],
      );
      return true;
    }
    return false;
  }

  Future<bool> updateTransporterAccountDetails({
    required String firstName,
    required String lastName,
    required String phoneNumber,
  }) async {
    final token = await storage.read(key: 'access_token');

    final response = await http.patch(
      Uri.parse('$baseUrl/auth/transporters/update_account_details'),
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

    return response.statusCode == 200;
  }
}
```

---

## 🔗 Related Documentation

- [API Reference (full)](./API_REFERENCE.md)
- [Endpoint Cheat Sheet](./ENDPOINTS_CHEATSHEET.md)
- [Main Project README](../../README.md)

---

_Last updated: March 13, 2026_
