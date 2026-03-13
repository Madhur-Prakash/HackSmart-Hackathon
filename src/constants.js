export const DB_NAME = "navswap_db"

export const options= {
            httpOnly:true, // cookie is not accessible from client side javascript
            secure: false // secure should be true in production
        }

        /**
 * User Enums - Centralized enumeration definitions
 */

const UserRole = {
  CUSTOMER: "customer",
  TRANSPORTER: "transporter",
  STAFF: "staff",
  REGIONAL_ADMIN: "regional_admin",
  SUPER_ADMIN: "super_admin",
};

const UserStatus = {
  PENDING: "pending",
  ACTIVE: "active",
  SUSPENDED: "suspended",
  DEACTIVATED: "deactivated",
  REJECTED: "rejected",
};

const Gender = {
  MALE: "male",
  FEMALE: "female",
  OTHER: "other",
};

const TransporterTier = {
  BRONZE: "bronze",
  SILVER: "silver",
  GOLD: "gold",
  PLATINUM: "platinum",
};

const VerificationStatus = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
};

const SubscriptionPlan = {
  FREE: "free",
  BASIC: "basic",
  PREMIUM: "premium",
  ENTERPRISE: "enterprise",
};

export {
  UserRole,
  UserStatus,
  Gender,
  TransporterTier,
  VerificationStatus,
  SubscriptionPlan,
};
