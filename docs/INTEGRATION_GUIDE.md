# 🚀 Frontend / Mobile App Integration Guide

> Step-by-step guide to connect your frontend or mobile app to the NavSwap backend.

---

## 📑 Table of Contents

- [Getting Started](#-getting-started)
- [Base URL](#-base-url)
- [Authentication Flow](#-authentication-flow)
- [Storing Tokens](#-storing-tokens)
- [Making Authenticated Requests](#-making-authenticated-requests)
- [Token Refresh Flow](#-token-refresh-flow)
- [File Upload (Avatar)](#-file-upload-avatar)
- [Error Handling](#-error-handling)
- [Code Examples](#-code-examples)
  - [React / Next.js](#reactnextjs)
  - [React Native / Expo](#react-nativeexpo)
  - [Flutter / Dart](#flutterdart)

---

## 🏁 Getting Started

1. Ensure the backend server is running on `http://localhost:8000`
2. All API routes are prefixed with `/api/v1`
3. Responses follow a consistent JSON format (see [API Reference](./API_REFERENCE.md))

---

## 🌐 Base URL

```
Development:  http://localhost:8000/api/v1
Production:   https://your-domain.com/api/v1
```

---

## 🔐 Authentication Flow

### Registration → Login → Use App → Refresh → Logout

```
┌──────────────────────────────────────────────────────────────────────┐
│                        AUTH FLOW DIAGRAM                              │
│                                                                       │
│   1. POST /register                                                   │
│       ↓ Returns: { user, access_token, refresh_token }               │
│       ↓ Sets cookies: access_token, refresh_token                    │
│                                                                       │
│   2. Use access_token for all protected endpoints                     │
│       GET  /current_user  (Header: Authorization: Bearer <token>)    │
│       POST /logout                                                    │
│       PATCH /update_account_details                                   │
│       PATCH /update_avatar                                            │
│                                                                       │
│   3. When access_token expires → 401 error                           │
│       POST /refresh_access_token  (send refresh_token)               │
│       ↓ Returns new { access_token, refresh_token }                  │
│                                                                       │
│   4. POST /logout                                                     │
│       ↓ Clears cookies, removes refresh_token from DB                │
└──────────────────────────────────────────────────────────────────────┘
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

// Helper function for authenticated requests
async function apiRequest(endpoint, options = {}) {
  const token = getAccessToken();
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_BASE}${endpoint}`, config);
  const data = await response.json();

  // Auto-refresh on 401
  if (response.status === 401 && data.message !== 'Invalid password') {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      // Retry the original request with new token
      config.headers['Authorization'] = `Bearer ${getAccessToken()}`;
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, config);
      return retryResponse.json();
    }
  }

  return data;
}
```

### Axios (with interceptors)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
  withCredentials: true, // sends cookies automatically
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const { data } = await api.post('/companies/refresh_access_token');
        setTokens(data.data.access_token, data.data.refresh_token);
        originalRequest.headers.Authorization = `Bearer ${data.data.access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Redirect to login
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

## 🔄 Token Refresh Flow

When the `access_token` expires, you'll get a `401` response. Use the refresh token to get new tokens:

```javascript
async function refreshAccessToken() {
  try {
    const response = await fetch(`${API_BASE}/companies/refresh_access_token`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getRefreshToken()}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) throw new Error('Refresh failed');

    const data = await response.json();
    setTokens(data.data.access_token, data.data.refresh_token);
    return true;
  } catch (error) {
    // Both tokens expired — redirect to login
    clearTokens();
    return false;
  }
}
```

> **Note:** Use the correct base path for refresh based on user role:
> - Company: `/api/v1/companies/refresh_access_token`
> - Customer: `/api/v1/customers/refresh_access_token`
> - Transporter: `/api/v1/transporters/refresh_access_token`
> - Staff: `/api/v1/staff/refresh_access_token`
> - Regional Admin: `/api/v1/regional_admins/refresh_access_token`

---

## 📁 File Upload (Avatar)

Avatar upload uses `multipart/form-data`. Do **not** set `Content-Type` manually — the browser/client sets the boundary automatically.

### JavaScript

```javascript
async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file); // key MUST be "avatar"

  const response = await fetch(`${API_BASE}/companies/update_avatar`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${getAccessToken()}`,
      // Do NOT set Content-Type here
    },
    body: formData,
  });

  return response.json();
}
```

### React Native (Expo)

```javascript
import * as ImagePicker from 'expo-image-picker';

async function pickAndUploadAvatar() {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
  });

  if (!result.canceled) {
    const uri = result.assets[0].uri;
    const formData = new FormData();
    formData.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });

    const response = await fetch(`${API_BASE}/customers/update_avatar`, {
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

### Flutter / Dart

```dart
import 'package:http/http.dart' as http;

Future<void> uploadAvatar(String filePath, String token) async {
  var request = http.MultipartRequest(
    'PATCH',
    Uri.parse('http://localhost:8000/api/v1/customers/update_avatar'),
  );
  
  request.headers['Authorization'] = 'Bearer $token';
  request.files.add(await http.MultipartFile.fromPath('avatar', filePath));
  
  var response = await request.send();
  var responseBody = await response.stream.bytesToString();
  print(responseBody);
}
```

---

## ⚠️ Error Handling

All errors follow a consistent format:

```json
{
  "status_code": 400,
  "message": "All fields are required",
  "data": null,
  "success": false,
  "errors": []
}
```

### Recommended error handler:

```javascript
function handleApiError(response) {
  switch (response.status_code) {
    case 400:
      // Show validation error to user
      showToast(response.message);
      break;
    case 401:
      // Token expired or invalid — trigger refresh or redirect to login
      handleUnauthorized();
      break;
    case 404:
      // Resource not found
      showToast('Not found');
      break;
    case 409:
      // Conflict (e.g., email already exists)
      showToast(response.message);
      break;
    case 500:
      // Server error
      showToast('Something went wrong. Please try again.');
      break;
    default:
      showToast(response.message || 'Unknown error');
  }
}
```

---

## 💻 Code Examples

### React/Next.js

**Complete Auth Context:**

```jsx
// contexts/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState({ access: null, refresh: null });
  const [loading, setLoading] = useState(true);

  const API = 'http://localhost:8000/api/v1';

  async function register(userData, role = 'customer') {
    const basePath = role === 'customer' ? 'customers' : 'companies';
    const res = await fetch(`${API}/${basePath}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data.user);
      setTokens({ access: data.data.access_token, refresh: data.data.refresh_token });
    }
    return data;
  }

  async function login(credentials, role = 'customer') {
    const basePath = role === 'customer' ? 'customers' : 'companies';
    const res = await fetch(`${API}/${basePath}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (data.success) {
      setUser(data.data.user);
      setTokens({ access: data.data.access_token, refresh: data.data.refresh_token });
    }
    return data;
  }

  async function logout() {
    await fetch(`${API}/companies/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${tokens.access}` },
      credentials: 'include',
    });
    setUser(null);
    setTokens({ access: null, refresh: null });
  }

  async function fetchCurrentUser(role = 'customer') {
    const basePath = role === 'customer' ? 'customers' : 'companies';
    const res = await fetch(`${API}/${basePath}/current_user`, {
      headers: { 'Authorization': `Bearer ${tokens.access}` },
      credentials: 'include',
    });
    const data = await res.json();
    if (data.success) setUser(data.data.user);
    setLoading(false);
    return data;
  }

  return (
    <AuthContext.Provider value={{ user, tokens, loading, register, login, logout, fetchCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### React Native/Expo

```javascript
// services/api.js
import * as SecureStore from 'expo-secure-store';

const API_BASE = 'http://YOUR_IP:8000/api/v1';

export async function registerCustomer(data) {
  const res = await fetch(`${API_BASE}/customers/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: data.fullName,
      email: data.email,
      phone_number: data.phone,
      country_code: '+91',
      role: 'customer',
      driving_license_number: data.license,
      password: data.password,
    }),
  });

  const result = await res.json();
  if (result.success) {
    await SecureStore.setItemAsync('access_token', result.data.access_token);
    await SecureStore.setItemAsync('refresh_token', result.data.refresh_token);
  }
  return result;
}

export async function loginCustomer(email, password) {
  const res = await fetch(`${API_BASE}/customers/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const result = await res.json();
  if (result.success) {
    await SecureStore.setItemAsync('access_token', result.data.access_token);
    await SecureStore.setItemAsync('refresh_token', result.data.refresh_token);
  }
  return result;
}

export async function getCurrentUser() {
  const token = await SecureStore.getItemAsync('access_token');
  const res = await fetch(`${API_BASE}/customers/current_user`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });
  return res.json();
}
```

### Flutter/Dart

```dart
// lib/services/auth_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class AuthService {
  static const String baseUrl = 'http://YOUR_IP:8000/api/v1';
  final storage = const FlutterSecureStorage();

  Future<Map<String, dynamic>> registerCustomer({
    required String fullName,
    required String email,
    required String phone,
    required String license,
    required String password,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/customers/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'full_name': fullName,
        'email': email,
        'phone_number': phone,
        'country_code': '+91',
        'role': 'customer',
        'driving_license_number': license,
        'password': password,
      }),
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      await storage.write(key: 'access_token', value: data['data']['access_token']);
      await storage.write(key: 'refresh_token', value: data['data']['refresh_token']);
    }
    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/customers/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    final data = jsonDecode(response.body);
    if (data['success'] == true) {
      await storage.write(key: 'access_token', value: data['data']['access_token']);
      await storage.write(key: 'refresh_token', value: data['data']['refresh_token']);
    }
    return data;
  }

  Future<Map<String, dynamic>> getCurrentUser() async {
    final token = await storage.read(key: 'access_token');
    final response = await http.get(
      Uri.parse('$baseUrl/customers/current_user'),
      headers: {'Authorization': 'Bearer $token'},
    );
    return jsonDecode(response.body);
  }
}
```

---

## 🔗 Related Documentation

- [API Reference (full)](./API_REFERENCE.md)
- [Endpoint Cheat Sheet](./ENDPOINTS_CHEATSHEET.md)
- [Main Project README](../README.md)

---

_Last updated: March 2, 2026_
