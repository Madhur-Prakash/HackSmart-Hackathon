import mongoose from "mongoose";
import {
  SubscriptionPlan,
  VerificationStatus,
  TransporterTier,
} from "../../../../src/constants.js";
import TimeRangeSchema from "./timeRange.Schema.js";
import { VerificationDocumentSchema } from "./verificationDocument.Schema.js";

// Payment Method Schema
const PaymentMethodSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["card", "upi", "wallet", "cash", "netBanking"],
      default: "cash"
    },

    cardLast4: {
      type: String,
      default: null
    },

    cardBrand: {
      type: String,
      default: null
    },

    upiId: {
      type: String,
      default: null
    },

    walletProvider: {
      type: String,
      default: null
    },

    isDefault: {
      type: Boolean,
      default: false
    },

    expiryDate: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Address Schema
const AddressSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    label: {
      type: String,
      enum: ["Home", "Work", "Other"],
      required: true
    },

    addressLine1: {
      type: String,
      required: true
    },

    addressLine2: {
      type: String,
      default: null
    },

    city: {
      type: String,
      required: true
    },

    state: {
      type: String,
      required: true
    },

    postalCode: {
      type: String,
      required: true
    },

    country: {
      type: String,
      default: "India"
    },

    latitude: {
      type: Number,
      default: null
    },

    longitude: {
      type: Number,
      default: null
    },

    isDefault: {
      type: Boolean,
      default: false
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Vehicle Schema
const VehicleSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    type: {
      type: String,
      enum: ["ev", "car", "bike", "truck", "other"], // adjust to your VehicleType enum
      default: "other"
    },

    make: {
      type: String,
      required: true
    },

    model: {
      type: String,
      required: true
    },

    registrationNumber: {
      type: String,
      default: null
    },

    color: {
      type: String,
      default: null
    },

    manufacturingYear: {
      type: Number,
      default: null
    },

    batteryCapacity: {
      type: Number, // kWh
      default: null
    },

    batteryType: {
      type: String,
      default: null
    },

    vinNumber: {
      type: String,
      default: null
    },

    isPrimary: {
      type: Boolean,
      default: false
    },

    registrationDate: {
      type: Date,
      default: null
    },

    insuranceExpiryDate: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    _id: false
  }
);

// Customer Preferences Schema
const CustomerPreferencesSchema = new mongoose.Schema(
  {
    enableNotifications: {
      type: Boolean,
      default: true
    },

    enableLocationServices: {
      type: Boolean,
      default: true
    },

    enableAIRecommendations: {
      type: Boolean,
      default: true
    },

    notificationChannels: {
      type: [String],
      enum: ["push", "email", "sms"],
      default: ["push"]
    },

    autoJoinQueue: {
      type: Boolean,
      default: false
    },

    maxWaitTimeMinutes: {
      type: Number,
      default: 30
    },

    maxDistanceKm: {
      type: Number,
      default: 10.0
    },

    preferredStations: {
      type: [String],
      default: []
    },

    languageCode: {
      type: String,
      default: "en"
    },

    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto"
    },

    showNearbyStationsOnMap: {
      type: Boolean,
      default: true
    },

    saveSwapHistory: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

// Transporter Preferences Schema
const TransporterPreferencesSchema = new mongoose.Schema(
  {
    enableNotifications: {
      type: Boolean,
      default: true
    },

    enableLocationTracking: {
      type: Boolean,
      default: true
    },

    notificationChannels: {
      type: [String],
      enum: ["push", "email", "sms"],
      default: ["push"]
    },

    autoAcceptTasks: {
      type: Boolean,
      default: false
    },

    minTaskReward: {
      type: Number,
      default: 0.0
    },

    maxTaskDistanceKm: {
      type: Number,
      default: 50.0
    },

    preferredAreas: {
      type: [String],
      default: []
    },

    languageCode: {
      type: String,
      default: "en"
    },

    theme: {
      type: String,
      enum: ["light", "dark", "auto"],
      default: "auto"
    },

    shareLocationWithCustomers: {
      type: Boolean,
      default: true
    },

    offlineDuringBreaks: {
      type: Boolean,
      default: true
    },

    workingHoursStart: {
      type: TimeRangeSchema,
      default: null
    },

    workingHoursEnd: {
      type: TimeRangeSchema,
      default: null
    }
  },
  { _id: false }
);

// Customer Stats Schema
const CustomerStatsSchema = new mongoose.Schema(
  {
    totalSwaps: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0.0 },
    favoriteStationCount: { type: Number, default: 0 },
    averageWaitTime: { type: Number, default: 0.0 },
    reliabilityScore: { type: Number, default: 0.0 },
    streakDays: { type: Number, default: 0 },
    lastSwapAt: Date,
  },
  { _id: false }
);

// Transporter Stats Schema
const TransporterStatsSchema = new mongoose.Schema(
  {
    totalEarnings: { type: Number, default: 0.0 },
    totalDeliveries: { type: Number, default: 0 },
    efficiencyScore: { type: Number, default: 0.0 },
    onTimePercentage: { type: Number, default: 0.0 },
    todayDeliveries: { type: Number, default: 0 },
    todayEarnings: { type: Number, default: 0.0 },
    averageRating: { type: Number, default: 0.0 },
    totalRatings: { type: Number, default: 0 },
    cancelledTasks: { type: Number, default: 0 },
    rejectedTasks: { type: Number, default: 0 },
  },
  { _id: false }
);

// Transporter Verification Schema
const TransporterVerificationSchema = new mongoose.Schema(
  {
    idVerification: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_SUBMITTED
    },

    vehicleVerification: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_SUBMITTED
    },

    backgroundCheck: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.NOT_SUBMITTED
    },

    documents: {
      type: [VerificationDocumentSchema],
      default: []
    },

    idVerifiedAt: {
      type: Date,
      default: null
    },

    vehicleVerifiedAt: {
      type: Date,
      default: null
    },

    backgroundCheckAt: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      default: null
    },

    lastUpdatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Bank Details Schema
const BankDetailsSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    accountHolderName: {
      type: String,
      required: true
    },

    accountNumber: {
      type: String,
      required: true
    },

    ifscCode: {
      type: String,
      required: true
    },

    bankName: {
      type: String,
      required: true
    },

    branchName: {
      type: String,
      default: null
    },

    accountType: {
      type: String,
      enum: ["savings", "current"],
      default: "savings"
    },

    isVerified: {
      type: Boolean,
      default: false
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    createdAt: {
      type: Date,
      default: Date.now
    },

    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

// Emergency Contact Schema
const EmergencyContactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },

    phone: {
      type: String,
      required: true
    },

    relationship: {
      type: String,
      required: true
    },

    alternatePhone: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

// Customer Profile Schema
const CustomerProfileSchema = new mongoose.Schema(
  {
    vehicles: [VehicleSchema],
    addresses: [AddressSchema],
    defaultAddress: AddressSchema,
    preferences: {
      type: CustomerPreferencesSchema,
      default: {},
    },
    stats: {
      type: CustomerStatsSchema,
      default: {},
    },
    subscriptionPlan: {
      type: String,
      enum: Object.values(SubscriptionPlan),
      default: SubscriptionPlan.FREE,
    },
    subscriptionExpiresAt: Date,
    paymentMethods: [PaymentMethodSchema],
    defaultPaymentMethod: PaymentMethodSchema,
  },
  { _id: false }
);

// Transporter Profile Schema
const TransporterProfileSchema = new mongoose.Schema(
  {
    tier: {
      type: String,
      enum: Object.values(TransporterTier),
      default: TransporterTier.BRONZE,
    },
    stats: {
      type: TransporterStatsSchema,
      default: {},
    },
    verification: {
      type: TransporterVerificationSchema,
      default: {},
    },
    transportVehicle: VehicleSchema,
    bankDetails: BankDetailsSchema,
    preferences: {
      type: TransporterPreferencesSchema,
      default: {},
    },
    isAvailable: { type: Boolean, default: false },
    isOnline: { type: Boolean, default: false },
    walletBalance: { type: Number, default: 0.0 },
    certifications: [String],
    emergencyContact: EmergencyContactSchema,
  },
  { _id: false }
);

export {
  VehicleSchema,
  AddressSchema,
  PaymentMethodSchema,
  CustomerPreferencesSchema,
  TransporterPreferencesSchema,
  CustomerStatsSchema,
  TransporterStatsSchema,
  TransporterVerificationSchema,
  BankDetailsSchema,
  EmergencyContactSchema,
  CustomerProfileSchema,
  TransporterProfileSchema,
};
