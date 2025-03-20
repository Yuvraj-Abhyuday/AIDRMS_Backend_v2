import { Request, Response } from "express";
import { createSOS } from "../models/sos.model";

interface SOSRequest extends Request {
    body: {
        user_id: string;
        sos_location: string;
        sos_event: string;
        sos_description?: string;
    };
}

export const postSOS = async (req: SOSRequest, res: Response): Promise<void> => {
    const { user_id, sos_location, sos_event, sos_description } = req.body;

    if (!user_id || !sos_location || !sos_event) {
        res.status(400).json({ message: "User ID, location, and event are required" });
        return;
    }

    try {
        const result = await createSOS(user_id, sos_location, sos_event, sos_description);
        console.log("SOS recorded successfully");
        res.status(201).json({
            message: "SOS recorded successfully",
            data: result.rows[0], // Returns the inserted record
        });
        
    } catch (err: any) {
        console.error("Database error:", err.message);

        res.status(500).json({
            message: "Something went wrong",
            error: err.message
        });
    }
};
