import mongoose from "mongoose";
import {
  SubscriptionPlan,
  VerificationStatus,
  TransporterTier,
} from "../../../../src/constants.js";

// Payment Method Schema
const PaymentMethodSchema = new mongoose.Schema(
  {
    id: String,
    type: {
      type: String,
      enum: ["card", "bank_account", "wallet"],
    },
    cardDetails: {
      cardNumber: String,
      cardHolder: String,
      expiryDate: String,
      cvv: String,
    },
    bankDetails: {
      accountNumber: String,
      accountHolder: String,
      bankName: String,
      ifscCode: String,
    },
    isDefault: Boolean,
  },
  { _id: false }
);

// Address Schema
const AddressSchema = new mongoose.Schema(
  {
    id: String,
    type: {
      type: String,
      enum: ["home", "work", "other"],
    },
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    latitude: Number,
    longitude: Number,
    isDefault: Boolean,
  },
  { _id: false }
);

// Vehicle Schema
const VehicleSchema = new mongoose.Schema(
  {
    id: String,
    name: String,
    make: String,
    model: String,
    year: Number,
    registrationNumber: String,
    batteryCapacity: Number,
    batteryType: String,
    color: String,
    imageUrl: String,
    isActive: Boolean,
  },
  { _id: false }
);

// Customer Preferences Schema
const CustomerPreferencesSchema = new mongoose.Schema(
  {
    notificationsEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    preferredLanguage: { type: String, default: "en" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    privacyLevel: {
      type: String,
      enum: ["public", "private", "friends_only"],
      default: "private",
    },
  },
  { _id: false }
);

// Transporter Preferences Schema
const TransporterPreferencesSchema = new mongoose.Schema(
  {
    notificationsEnabled: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    preferredLanguage: { type: String, default: "en" },
    theme: { type: String, enum: ["light", "dark"], default: "light" },
    autoAcceptOrders: { type: Boolean, default: false },
    maxDistanceRadius: { type: Number, default: 50 },
    minimumRating: { type: Number, default: 4.0 },
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
      default: VerificationStatus.PENDING,
    },
    idDocument: String,
    idExpiryDate: Date,
    vehicleVerification: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    vehicleDocument: String,
    backgroundCheck: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING,
    },
    backgroundCheckDate: Date,
  },
  { _id: false }
);

// Bank Details Schema
const BankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    ifscCode: String,
    accountType: { type: String, enum: ["savings", "current"], default: "savings" },
    panNumber: String,
  },
  { _id: false }
);

// Emergency Contact Schema
const EmergencyContactSchema = new mongoose.Schema(
  {
    name: String,
    phone: String,
    email: String,
    relationship: String,
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
