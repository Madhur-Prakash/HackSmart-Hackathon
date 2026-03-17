import mongoose from "mongoose";
import stationAdressSchema from "./schemas/stationSchema.js";
import node_geocoder from "node-geocoder";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

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
    name: {
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
    }
);

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
export default mongoose.model("Station", station);