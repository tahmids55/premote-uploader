import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    accessTokenEnc: { type: String, required: true },
    refreshTokenEnc: { type: String, required: true },
    tokenExpiryDate: { type: Number }
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
