# 🔐 NavSwap — Auth API Documentation

> Complete documentation for the NavSwap authentication & user management backend.

---

## 📂 Documents in this folder

| Document | Description |
|----------|-------------|
| [API_REFERENCE.md](./API_REFERENCE.md) | Full API reference — every endpoint, request/response samples, error codes, data models |
| [ENDPOINTS_CHEATSHEET.md](./ENDPOINTS_CHEATSHEET.md) | One-page quick-reference table of all 40 endpoints |
| [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) | Step-by-step frontend & mobile integration with React, React Native, and Flutter examples |

---

## ⚡ Quick Overview

- **Base URL:** `http://localhost:8000/api/v1`
- **Auth method:** JWT (access + refresh tokens via cookies or `Authorization` header)
- **5 user roles:** Company (Super Admin), Customer, Transporter, Staff, Regional Admin
- **8 endpoints per role:** register, login, logout, refresh, change password, get profile, update profile, upload avatar
- **Database:** MongoDB (Mongoose ODM)
- **File uploads:** Cloudinary
- **Email:** Nodemailer (Gmail SMTP) — used for staff & regional admin credential delivery

---

## 🔗 Navigation

- [← Back to Main README](../../README.md)
