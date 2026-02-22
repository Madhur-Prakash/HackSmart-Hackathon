import mongoose from "mongoose";
import bcrypt from "bcrypt";

const user_schema = new mongoose.Schema({
    user_name:{
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
    full_name: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    avatar: {
        type: String,
        required: true
    },
    cover_image: {
        type: String
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    refresh_token: {
        type: String
    },
    watch_history: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Video"
        }
    ]

}, {
    timestamps: true
})

//  encrypting the password before saving
user_schema.pre("save", async function(next){  // normal func is used instead of callback func as callback func does not have access to `this` keyword
    if (!this.isModified("password")) return next() // if the password is not modified, then we don't need to hash it again

    const salt = await bcrypt.genSalt(10); // generate a salt
    this.password = await bcrypt.hash(this.password, salt) 
    next()
})

export const User = mongoose.model("User", user_schema)
// User can directly contact mongoDB as it is made with the help of mongoose