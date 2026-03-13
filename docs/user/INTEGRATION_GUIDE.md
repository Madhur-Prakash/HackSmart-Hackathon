# 🔗 User API — Integration Guide

Step-by-step guide to integrate user profile management into your frontend/mobile app.

---

## 📑 Table of Contents

1. [Initial Setup](#-initial-setup)
2. [Customer Integration](#-customer-integration)
3. [Transporter Integration](#-transporter-integration)
4. [Error Handling](#-error-handling)
5. [TypeScript Definitions](#-typescript-definitions)

---

## 🎯 Initial Setup

### 1. Base Configuration

```javascript
const API_BASE_URL = 'http://localhost:8000/api/v1';

const apiClient = {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const accessToken = localStorage.getItem('access_token');
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'API request failed');
    }
    
    return data;
  },
  
  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },
  
  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  
  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  
  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};
```

---

## 👤 Customer Integration

### Step 1: Fetch Customer Profile

```javascript
async function loadCustomerProfile() {
  try {
    const response = await apiClient.get('/users/customers/profile');
    
    const {
      vehicles,
      addresses,
      preferences,
      stats,
      subscriptionPlan,
      paymentMethods,
    } = response.data.profile;
    
    // Store in state management (Redux, Zustand, etc.)
    store.dispatch(setCustomerProfile({
      vehicles,
      addresses,
      preferences,
      stats,
      subscriptionPlan,
      paymentMethods,
    }));
    
    return response.data.profile;
  } catch (error) {
    console.error('Failed to load profile:', error);
    throw error;
  }
}
```

### Step 2: Add Vehicle UI

```javascript
async function addVehicle(vehicleData) {
  try {
    const response = await apiClient.post('/users/customers/vehicles', {
      type: vehicleData.type,
      make: vehicleData.make,
      model: vehicleData.model,
      registrationNumber: vehicleData.registrationNumber,
      color: vehicleData.color,
      manufacturingYear: vehicleData.year,
      batteryCapacity: vehicleData.batteryCapacity,
      batteryType: vehicleData.batteryType,
      isDefault: vehicleData.isDefault || false,
    });
    
    // Show success toast
    Toast.success('Vehicle added successfully');
    
    // Refresh profile
    await loadCustomerProfile();
    
    return response.data.vehicle;
  } catch (error) {
    Toast.error(error.message || 'Failed to add vehicle');
    throw error;
  }
}
```

### Step 3: Update Preferences

```javascript
async function updatePreferences(preferences) {
  try {
    const response = await apiClient.patch(
      '/users/customers/preferences',
      {
        enableNotifications: preferences.notifications,
        notificationChannels: preferences.channels,
        theme: preferences.theme,
        maxWaitTimeMinutes: preferences.maxWaitTime,
        maxDistanceKm: preferences.maxDistance,
        autoJoinQueue: preferences.autoJoin,
        // ... other preferences
      }
    );
    
    Toast.success('Preferences updated');
    store.dispatch(setPreferences(response.data.preferences));
    
    return response.data.preferences;
  } catch (error) {
    Toast.error('Failed to update preferences');
    throw error;
  }
}
```

### Step 4: Delete Address

```javascript
async function deleteAddress(addressId) {
  try {
    await apiClient.delete(`/users/customers/addresses/${addressId}`);
    Toast.success('Address deleted');
    await loadCustomerProfile();
  } catch (error) {
    Toast.error('Failed to delete address');
    throw error;
  }
}
```

### Step 5: Update Subscription

```javascript
async function upgradeSubscription(plan) {
  try {
    const response = await apiClient.patch(
      '/users/customers/profile',
      { subscriptionPlan: plan }
    );
    
    Toast.success(`Upgraded to ${plan} plan`);
    store.dispatch(setSubscriptionPlan(plan));
    
    return response.data.profile;
  } catch (error) {
    Toast.error('Failed to upgrade subscription');
    throw error;
  }
}
```

---

## 🚛 Transporter Integration

### Step 1: Fetch Transporter Profile

```javascript
async function loadTransporterProfile() {
  try {
    const response = await apiClient.get('/users/transporters/profile');
    
    const profile = response.data.profile;
    
    store.dispatch(setTransporterProfile({
      tier: profile.tier,
      stats: profile.stats,
      verification: profile.verification,
      transportVehicle: profile.transportVehicle,
      bankDetails: profile.bankDetails,
      preferences: profile.preferences,
      isAvailable: profile.isAvailable,
      isOnline: profile.isOnline,
      walletBalance: profile.walletBalance,
      certifications: profile.certifications,
      emergencyContact: profile.emergencyContact,
    }));
    
    return profile;
  } catch (error) {
    console.error('Failed to load transporter profile:', error);
    throw error;
  }
}
```

### Step 2: Update Bank Details

```javascript
async function updateBankDetails(bankData) {
  try {
    const response = await apiClient.patch(
      '/users/transporters/profile',
      {
        bankDetails: {
          bankName: bankData.bankName,
          accountHolderName: bankData.accountHolderName,
          accountNumber: bankData.accountNumber,
          ifscCode: bankData.ifscCode,
          isDefault: true,
        },
      }
    );
    
    Toast.success('Bank details updated');
    store.dispatch(updateTransporterBankDetails(response.data.profile.bankDetails));
    
    return response.data.profile;
  } catch (error) {
    Toast.error('Failed to update bank details');
    throw error;
  }
}
```

### Step 3: Toggle Availability

```javascript
async function toggleAvailability(isAvailable, isOnline) {
  try {
    const response = await apiClient.patch(
      '/users/transporters/availability',
      {
        isAvailable,
        isOnline,
      }
    );
    
    // Show instant feedback
    Toast.success(
      isAvailable 
        ? 'You are now available for tasks' 
        : 'You are now offline'
    );
    
    store.dispatch(setTransporterAvailability({
      isAvailable,
      isOnline,
    }));
    
    return response.data;
  } catch (error) {
    Toast.error('Failed to update availability');
    throw error;
  }
}
```

### Step 4: Add Certification

```javascript
async function addCertification(certData) {
  try {
    const response = await apiClient.post(
      '/users/transporters/certifications',
      {
        name: certData.name,
        issuedAt: certData.issuedAt,
        expiresAt: certData.expiresAt,
      }
    );
    
    Toast.success('Certification added');
    await loadTransporterProfile();
    
    return response.data.certification;
  } catch (error) {
    Toast.error('Failed to add certification');
    throw error;
  }
}
```

### Step 5: Check Verification Status

```javascript
async function checkVerificationStatus() {
  try {
    const response = await apiClient.get(
      '/users/transporters/verification'
    );
    
    const { idVerification, vehicleVerification, backgroundCheck } = 
      response.data.verification;
    
    // Show verification status in UI
    return {
      idVerification,     // approved|pending|rejected
      vehicleVerification, // approved|pending|rejected
      backgroundCheck,    // approved|pending|rejected
    };
  } catch (error) {
    console.error('Failed to check verification:', error);
    throw error;
  }
}
```

---

## ❌ Error Handling

### Generic Error Handler

```javascript
async function handleApiError(error) {
  if (error instanceof Error) {
    // Network error
    if (!navigator.onLine) {
      Toast.error('No internet connection');
      return;
    }
    
    // API error
    const data = error.response?.data;
    if (data?.message) {
      Toast.error(data.message);
    } else {
      Toast.error('Something went wrong. Please try again.');
    }
  }
}
```

### Specific Error Cases

```javascript
async function updateProfileWithErrorHandling(updates) {
  try {
    const response = await apiClient.patch(
      '/users/customers/profile',
      updates
    );
    return response.data.profile;
  } catch (error) {
    // Handle specific errors
    if (error.status === 401) {
      // Token expired - redirect to login
      window.location.href = '/login';
    } else if (error.status === 400) {
      // Validation error - show specific field errors
      Array.isArray(error.errors)
        ? error.errors.forEach(err => Toast.error(err))
        : Toast.error(error.message);
    } else if (error.status === 404) {
      // User not found
      Toast.error('User profile not found');
    } else {
      // Generic error
      Toast.error('Failed to update profile');
    }
    throw error;
  }
}
```

---

## 📘 TypeScript Definitions

```typescript
// Customer Profile Types
interface Vehicle {
  id: string;
  userId: string;
  type: 'ev' | 'car' | 'bike' | 'truck' | 'other';
  make: string;
  model: string;
  registrationNumber: string;
  color: string;
  manufacturingYear: number;
  batteryCapacity?: number;
  batteryType?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Address {
  id: string;
  userId: string;
  label: 'Home' | 'Work' | 'Other';
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CustomerPreferences {
  enableNotifications: boolean;
  enableLocationServices: boolean;
  enableAIRecommendations: boolean;
  notificationChannels: string[];
  autoJoinQueue: boolean;
  maxWaitTimeMinutes: number;
  maxDistanceKm: number;
  preferredStations: string[];
  languageCode: string;
  theme: 'light' | 'dark' | 'auto';
  showNearbyStationsOnMap: boolean;
  saveSwapHistory: boolean;
}

interface CustomerStats {
  totalSwaps: number;
  totalSpent: number;
  favoriteStationCount: number;
  averageWaitTime: number;
  reliabilityScore: number;
  streakDays: number;
}

interface CustomerProfile {
  vehicles: Vehicle[];
  addresses: Address[];
  preferences: CustomerPreferences;
  stats: CustomerStats;
  subscriptionPlan: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionExpiresAt?: string;
  paymentMethods: PaymentMethod[];
}

// Transporter Profile Types
interface TransporterStats {
  totalEarnings: number;
  totalDeliveries: number;
  efficiencyScore: number;
  onTimePercentage: number;
  todayDeliveries: number;
  todayEarnings: number;
  averageRating: number;
  totalRatings: number;
  cancelledTasks: number;
  rejectedTasks: number;
}

interface TransporterVerification {
  idVerification: 'pending' | 'approved' | 'rejected' | 'expired';
  vehicleVerification: 'pending' | 'approved' | 'rejected' | 'expired';
  backgroundCheck: 'pending' | 'approved' | 'rejected' | 'expired';
}

interface BankDetails {
  id: string;
  userId: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  isDefault: boolean;
  createdAt: string;
}

interface TransporterProfile {
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  stats: TransporterStats;
  verification: TransporterVerification;
  transportVehicle?: Vehicle;
  bankDetails?: BankDetails;
  preferences: TransporterPreferences;
  isAvailable: boolean;
  isOnline: boolean;
  walletBalance: number;
  certifications: Certification[];
  emergencyContact?: EmergencyContact;
}

// API Response Types
interface ApiResponse<T> {
  status_code: number;
  message: string;
  data: T;
  success: boolean;
  errors?: string[];
}

interface ProfileResponse {
  profile: CustomerProfile | TransporterProfile;
}
```

---

## 🧪 Testing Integration

```javascript
// Test customer profile update
async function testCustomerProfileIntegration() {
  try {
    // 1. Get profile
    let profile = await loadCustomerProfile();
    console.log('✓ Profile loaded:', profile);
    
    // 2. Add vehicle
    const vehicle = await addVehicle({
      type: 'ev',
      make: 'Tesla',
      model: 'Model 3',
      registrationNumber: 'MH02AB1234',
      color: 'White',
      year: 2023,
      batteryCapacity: 75,
    });
    console.log('✓ Vehicle added:', vehicle);
    
    // 3. Update preferences
    const prefs = await updatePreferences({
      notifications: true,
      channels: ['push', 'email'],
      theme: 'dark',
      maxWaitTime: 45,
    });
    console.log('✓ Preferences updated:', prefs);
    
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests
testCustomerProfileIntegration();
```

---

## 🔍 Debugging Tips

### 1. Log API Requests

```javascript
const apiClient = {
  async request(endpoint, options = {}) {
    console.log(`📤 ${options.method || 'GET'} ${endpoint}`, options.body);
    const response = await fetch(...);
    console.log(`📥 Response:`, response.json());
    return data;
  },
};
```

### 2. Check Token Expiry

```javascript
function checkTokenExpiry() {
  const token = localStorage.getItem('access_token');
  if (token) {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiryTime = payload.exp * 1000;
    const now = Date.now();
    console.log(`Token expires in ${Math.round((expiryTime - now) / 1000)}s`);
  }
}
```

### 3. Monitor Network Tab

Open DevTools > Network tab to see:
- Request headers (Authorization)
- Request body (payload)
- Response status and data
- Response headers

---

## 📞 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| `401 Unauthorized` | Token missing/expired. Refresh token or re-login |
| `400 Bad Request` | Check request payload format |
| `404 Not Found` | Check endpoint URL and user ID |
| `CORS Error` | Ensure backend CORS is configured |
| `Network Timeout` | Check backend server is running |

---

**Last Updated:** March 14, 2026  
**Version:** 1.0.0

