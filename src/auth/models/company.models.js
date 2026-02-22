import mongoose from "mongoose";
import bcrypt from "bcrypt";

const super_admin = new mongoose.Schema({
    full_name:{
        type: String,
        required: true,
        minlength: 5,
        lowercase: true,
        trim: true,
        unique: true,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        unique: true
    },
    phone_number: {
        type: String,
        length: 10,
        required: true,
        unique: true
    },
    country_code: {
        type: String,
        required: true
    },
    avatar: {
        type: String,
        required: false
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    refresh_token: {
        type: String
    },
    role: {
        type: String,
        required: true,
        enum: ["super_admin", "regional_admin", "transporter", "customer"],
        default: "customer"
    }

}, {
    timestamps: true
})

//  encrypting the password before saving
super_admin.pre("save", async function(next){  // normal func is used instead of callback func as callback func does not have access to `this` keyword
    if (!this.isModified("password")) return next() // if the password is not modified, then we don't need to hash it again

    const salt = await bcrypt.genSalt(10); // generate a salt
    this.password = await bcrypt.hash(this.password, salt) 
    next()
})

export const Company = mongoose.model("Company", super_admin)
// Company can directly contact mongoDB as it is made with the help of mongoose