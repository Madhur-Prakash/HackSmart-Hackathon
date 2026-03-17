import mongoose from "mongoose";

const TimeRangeSchema = new mongoose.Schema(
  {
    hour: {
      type: Number,
      min: 0,
      max: 23,
      required: true
    },
    minute: {
      type: Number,
      min: 0,
      max: 59,
      required: true
    }
  },
  { _id: false }
);

export default TimeRangeSchema;