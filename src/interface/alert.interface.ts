export interface AlertData {
  identifier: string;
  sender: string;
  scope: string;
  urgency: string;
  severity: string;
  certainty: string;
  expires: string;
  affected_area: string;
  instruction: string;
  event: string;
  headline: string;
  sent?: string;         // e.g., "2025-03-11T16:17:14+05:30"
  effective?: string;    // e.g., "2025-03-11T17:30:00+05:30"
  onset?: string;        // e.g., "2025-03-11T16:30:03+05:30"
  altitude?: number;     // e.g., 2300
}

export interface ParsedAlert {
  "cap:identifier"?: string;
  "cap:sender"?: string;
  "cap:sent"?: string;
  "cap:status"?: string;
  "cap:msgType"?: string;
  "cap:scope"?: string;
  "cap:info"?: Array<{
    "cap:category"?: string;
    "cap:event"?: string;
    "cap:urgency"?: string;
    "cap:severity"?: string;
    "cap:certainty"?: string;
    "cap:effective"?: string;
    "cap:onset"?: string;
    "cap:expires"?: string;
    "cap:headline"?: string;
    "cap:description"?: string;
    "cap:instruction"?: string;
    "cap:area"?: {
      "cap:areaDesc"?: string;
      "cap:polygon"?: string[]; // Array for multiple polygons
      "cap:altitude"?: string;
    }[];
  }>;
}