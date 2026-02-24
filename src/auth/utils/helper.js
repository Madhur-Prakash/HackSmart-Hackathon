import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";

dotenv.config({path: "./.env"})

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const isPasswordCorrect = async function(password, hashed_password){
    try {
        return (await bcrypt.compare(password, hashed_password))
    } catch (error) {
        throw new ApiError(500, "Error while comparing password", error);
    }
}

const create_access_token = function(id, data){
    const acces_token = jwt.sign(
        {
            _id: id,
            extra_data: data
        },
        process.env.ACESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACESS_TOKEN_EXPIRY
        }
    )
    return acces_token;
}

const create_refresh_token = function(id){
    const refresh_token = jwt.sign(
        {
            _id: id
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
    return refresh_token;
}


function generateUsername(name = "user") {
  return `${name}_${nanoid(6)}`;
}

const sendEmail = async (to, subject, htmlContent) => {
  try {
    const info = await transporter.sendMail({
      from: `"Madhur" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });

    console.log("Email sent:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export { create_access_token, create_refresh_token, isPasswordCorrect, generateUsername, sendEmail };