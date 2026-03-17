import mongoose from "mongoose";

const stationAdressSchema = new mongoose.Schema({
    address_line1: {
        type: String,
        required: true,
        trim: true
    },
    address_line2: {
        type: String,
        trim: true,
        required: true
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        required: true,
        trim: true
    },
    pin_code: {
        type: String,
        required: true,
        minlength: 6,
        maxlength: 6
    },
    nearby_landmark: {
        type: String,
        trim: true
    },
}, { _id: false });

export default stationAdressSchema;