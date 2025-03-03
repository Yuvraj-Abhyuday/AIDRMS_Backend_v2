// src/models/capAlert.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface CAPAlert extends Document {
  identifier: string;
  sender: string;
  sent: string;
  status: string;
  msgType: string;
  scope: string;
  event: string;
  urgency: string;
  severity: string;
  certainty: string;
  effective: string;
  expires: string;
  headline: string;
  instruction: string;
}

const CAPAlertSchema: Schema = new Schema(
  {
    identifier: { type: String, required: true },
    sender: { type: String, required: true },
    sent: { type: String, required: true },
    status: { type: String, required: true },
    msgType: { type: String, required: true },
    scope: { type: String, required: true },
    event: { type: String, required: true },
    urgency: { type: String, required: true },
    severity: { type: String, required: true },
    certainty: { type: String, required: true },
    effective: { type: String, required: true },
    expires: { type: String, required: true },
    headline: { type: String, required: true },
    instruction: { type: String, required: true },
  },
  {
    collection: "ndmaalerts",
  }
);

export default mongoose.model<CAPAlert>("CAPAlert", CAPAlertSchema);
