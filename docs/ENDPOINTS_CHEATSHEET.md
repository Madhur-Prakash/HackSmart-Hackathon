# 📋 NavSwap API — Endpoint Cheat Sheet

> Quick-reference for all backend endpoints. For full details see [API Reference](./API_REFERENCE.md).

**Base URL:** `http://localhost:8000/api/v1`

---

## 🏢 Company (Super Admin) — `/api/v1/companies`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/companies/register` | — | `{ full_name, email, phone_number, country_code, role: "super_admin", password }` | Register new company |
| `POST` | `/companies/login` | — | `{ email OR user_name, password }` | Login |
| `POST` | `/companies/logout` | `access_token` | — | Logout (clears cookies) |
| `POST` | `/companies/refresh_access_token` | `refresh_token` | — | Get new tokens |
| `POST` | `/companies/change_password` | — | `{ email OR user_name, new_password, confirm_password }` | Change password |
| `GET` | `/companies/current_user` | `access_token` | — | Get logged-in user profile |
| `PATCH` | `/companies/update_account_details` | `access_token` | `{ full_name, email }` | Update profile |
| `PATCH` | `/companies/update_avatar` | `access_token` | `form-data: avatar (file)` | Upload profile pic |

---

## 👤 Customer — `/api/v1/customers`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/customers/register` | — | `{ full_name, email, phone_number, country_code, role: "customer", driving_license_number, password }` | Register |
| `POST` | `/customers/login` | — | `{ email OR user_name, password }` | Login |
| `POST` | `/customers/logout` | `access_token` | — | Logout |
| `POST` | `/customers/refresh_access_token` | `refresh_token` | — | Refresh tokens |
| `POST` | `/customers/change_password` | — | `{ email OR user_name, new_password, confirm_password }` | Change password |
| `GET` | `/customers/current_user` | `access_token` | — | Get profile |
| `PATCH` | `/customers/update_account_details` | `access_token` | `{ full_name, email }` | Update profile |
| `PATCH` | `/customers/update_avatar` | `access_token` | `form-data: avatar (file)` | Upload avatar |

---

## 🚛 Transporter — `/api/v1/transporters`

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/transporters/register` | — | `{ full_name, email, phone_number, country_code, role: "transporter", driving_license_number, password }` | Register |
| `POST` | `/transporters/login` | — | `{ email OR user_name, password }` | Login |
| `POST` | `/transporters/logout` | `access_token` | — | Logout |
| `POST` | `/transporters/refresh_access_token` | `refresh_token` | — | Refresh tokens |
| `POST` | `/transporters/change_password` | — | `{ email OR user_name, new_password, confirm_password }` | Change password |
| `GET` | `/transporters/current_user` | `access_token` | — | Get profile |
| `PATCH` | `/transporters/update_account_details` | `access_token` | `{ full_name, email }` | Update profile |
| `PATCH` | `/transporters/update_avatar` | `access_token` | `form-data: avatar (file)` | Upload avatar |

---

## 👷 Staff — `/api/v1/staff`

> Password is auto-generated and emailed. No `password` field in register body.

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/staff/register` | — | `{ full_name, email, phone_number, country_code, role: "staff", addhar_card_number }` | Register (pwd emailed) |
| `POST` | `/staff/login` | — | `{ email OR user_name, password }` | Login |
| `POST` | `/staff/logout` | `access_token` | — | Logout |
| `POST` | `/staff/refresh_access_token` | `refresh_token` | — | Refresh tokens |
| `POST` | `/staff/change_password` | — | `{ email OR user_name, new_password, confirm_password }` | Change password |
| `GET` | `/staff/current_user` | `access_token` | — | Get profile |
| `PATCH` | `/staff/update_account_details` | `access_token` | `{ full_name, email }` | Update profile |
| `PATCH` | `/staff/update_avatar` | `access_token` | `form-data: avatar (file)` | Upload avatar |

---

## 🌍 Regional Admin — `/api/v1/regional_admins`

> Password is auto-generated and emailed. No `password` field in register body.

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| `POST` | `/regional_admins/register` | — | `{ full_name, email, phone_number, country_code, role: "regional_admin", addhar_card_number }` | Register (pwd emailed) |
| `POST` | `/regional_admins/login` | — | `{ email OR user_name, password }` | Login |
| `POST` | `/regional_admins/logout` | `access_token` | — | Logout |
| `POST` | `/regional_admins/refresh_access_token` | `refresh_token` | — | Refresh tokens |
| `POST` | `/regional_admins/change_password` | — | `{ email OR user_name, new_password, confirm_password }` | Change password |
| `GET` | `/regional_admins/current_user` | `access_token` | — | Get profile |
| `PATCH` | `/regional_admins/update_account_details` | `access_token` | `{ full_name, email }` | Update profile |
| `PATCH` | `/regional_admins/update_avatar` | `access_token` | `form-data: avatar (file)` | Upload avatar |

---

## 💚 Healthcheck — `/api/v1/healthcheck`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/healthcheck/health` | — | Server health status |

---

## 🔐 Auth Header Format

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## 📦 Standard Response Shape

```json
{
  "status_code": 200,
  "message": "Success message",
  "data": { ... },
  "success": true
}
```

## ❌ Error Response Shape

```json
{
  "status_code": 400,
  "message": "Error description",
  "data": null,
  "success": false,
  "errors": []
}
```

---

## 🔗 Related Docs

- [Full API Reference](./API_REFERENCE.md)
- [Integration Guide](./INTEGRATION_GUIDE.md)
- [Main README](../README.md)

---

_Last updated: March 2, 2026_
