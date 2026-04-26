import mongoose from "mongoose";
import stationAdressSchema from "./schemas/stationSchema.js";
import node_geocoder from "node-geocoder";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
import { appConsole as console } from "../utils/logger.js";

const geoCoder = node_geocoder({
    provider: 'openstreetmap'
});

const station = new mongoose.Schema({
    id: {
      type: String,
      unique: true,
      default: function () {
        return 'ST_' + this._id.toString();
      },
    },
    regional_admin_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "RegionalAdmin",
            required: true
        },
    company_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Company",
        required: true
    },
    station_name: {
        type: String,
        required: true,
        trim: true
    },
    station_address: stationAdressSchema,

    location: {
        type: {
            type: String,
            enum: ["Point"],
            default: "Point"
        },
        coordinates: {
            type: [Number]// [longitude, latitude]
        }
    }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Forward relations for bidirectional access via populate.
station.virtual("regionalAdmin", {
    ref: "RegionalAdmin",
    localField: "regional_admin_id",
    foreignField: "_id",
    justOne: true
});

station.virtual("company", {
    ref: "Company",
    localField: "company_id",
    foreignField: "_id",
    justOne: true
});

station.virtual("staffMembers", {
    ref: "Staff",
    localField: "_id",
    foreignField: "station_id"
});

// add indexes for geospatial queries
station.index({ location: "2dsphere" });

// adding lat,long based on station address
station.pre("save", async function (next) {
    try {
        // Only run if address is modified or new
        if (!this.isModified("station_address")) {
            return next();
        }

        const address = this.station_address;

        // Build full address string
        const fullAddress = `${address.address_line1}, ${address.address_line2}, ${address.city}, ${address.state}, ${address.pin_code}, India`;

        // Geocode
        const res = await geoCoder.geocode(fullAddress);

        if (!res || res.length === 0) {
            console.log("Geocoding failed for:", fullAddress);
            return next(new Error("Unable to geocode address"));
        }

        const { latitude, longitude } = res[0];

        // Save in GeoJSON format
        this.location = {
            type: "Point",
            coordinates: [longitude, latitude]
        };

        next();
    } catch (err) {
        next(err);
    }
});

station.plugin(mongooseAggregatePaginate) // enabling aggregation pipeline
export const Station = mongoose.model("Station", station);