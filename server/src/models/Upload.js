import mongoose from "mongoose";

const uploadSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    driveFileId: { type: String, required: true, index: true },
    driveWebViewLink: { type: String, required: true },
    uploaderIp: { type: String }
  },
  { timestamps: true }
);

export const Upload = mongoose.model("Upload", uploadSchema);
