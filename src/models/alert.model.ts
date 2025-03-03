// src/models/ndmaAlert.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface NDMAAlert extends Document {
  title: string;
  link: string;
  description: string;
  pubDate: string;
}

const NDMAAlertSchema: Schema = new Schema({
  title: { type: String, required: true },
  link: { type: String, required: true },
  description: { type: String, default: "" },
  pubDate: { type: String, default: "" },
});

export default mongoose.model<NDMAAlert>("NDMAAlert", NDMAAlertSchema);
