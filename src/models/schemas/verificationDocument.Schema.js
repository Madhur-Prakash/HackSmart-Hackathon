import mongoose from "mongoose";
import { VerificationStatus } from "../../constants.js";

const VerificationDocumentSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },

    userId: {
      type: String,
      required: true
    },

    documentType: {
      type: String,
      enum: [
        "license",
        "aadhaar",
        "passport",
        "vehicle_registration",
        "insurance",
        "other"
      ],
      default: "other"
    },

    documentUrl: {
      type: String,
      required: true
    },

    documentNumber: {
      type: String,
      default: null
    },

    status: {
      type: String,
      enum: Object.values(VerificationStatus),
      default: VerificationStatus.PENDING
    },

    uploadedAt: {
      type: Date,
      default: Date.now
    },

    verifiedAt: {
      type: Date,
      default: null
    },

    expiryDate: {
      type: Date,
      default: null
    },

    rejectionReason: {
      type: String,
      default: null
    },

    notes: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

export { VerificationDocumentSchema };