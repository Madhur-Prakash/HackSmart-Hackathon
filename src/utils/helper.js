import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { ApiError } from "./ApiError.js";
import logger from "./logger.js";

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



import QRCode from "qrcode";
import Redis from "ioredis";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { getRedisClient } from "../config/redis.js";

const QR_DIR = path.join(process.cwd(), "generated_qr");
const REDIS_DB_INDEX = Number(process.env.REDIS_DB || 0);
const EXPIRY_EVENT_PATTERN = `__keyevent@${REDIS_DB_INDEX}__:expired`;

let expirySubscriber;

const ensureQrDirectory = () => {
  if (!fs.existsSync(QR_DIR)) {
    fs.mkdirSync(QR_DIR, { recursive: true });
  }
};

const getQrImagePath = (token) => path.join(QR_DIR, `${token}.png`);

const initializeQrExpirySubscriber = async () => {
  if (expirySubscriber) {
    return expirySubscriber;
  }

  const host = process.env.REDIS_HOST || "localhost";
  const port = Number(process.env.REDIS_PORT || 6379);

  expirySubscriber = new Redis({ host, port, db: REDIS_DB_INDEX });

  expirySubscriber.on("error", (error) => {
    logger.error({ error }, "QR expiry subscriber Redis error");
  });

  try {
    await expirySubscriber.config("SET", "notify-keyspace-events", "Ex");
  } catch (error) {
    logger.warn({ error }, "Could not set Redis keyspace notifications automatically");
  }

  await expirySubscriber.psubscribe(EXPIRY_EVENT_PATTERN);

  expirySubscriber.on("pmessage", (_pattern, _channel, expiredKey) => {
    const filePath = getQrImagePath(expiredKey);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      logger.info({ expiredKey }, "Deleted expired QR image");
    }
  });

  return expirySubscriber;
};

const generateQrPayload = async (data, ttlSeconds) => {
  const redis = getRedisClient();
  ensureQrDirectory();

  const token = uuidv4();
  const serializedData = JSON.stringify(data);

  await redis.set(token, serializedData, "EX", ttlSeconds);

  const filePath = getQrImagePath(token);
  await QRCode.toFile(filePath, token);

  return { token, filePath };
};

const verifyQrToken = async (token) => {
  const redis = getRedisClient();
  const data = await redis.get(token);

  if (!data) {
    return { isValid: false };
  }

  await redis.del(token);

  // delete the QR image file as well
  const filePath = getQrImagePath(token);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  let parsedData;
  try {
    parsedData = JSON.parse(data);
  } catch {
    parsedData = data;
  }

  return {
    isValid: true,
    data: parsedData,
  };
};


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

    logger.info({ messageId: info.messageId }, "Email sent");
  } catch (error) {
    logger.error({ error }, "Error sending email");
  }
};

export { create_access_token, create_refresh_token, isPasswordCorrect, generateUsername, sendEmail, ensureQrDirectory, generateQrPayload, verifyQrToken, initializeQrExpirySubscriber, getQrImagePath };