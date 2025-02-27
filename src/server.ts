import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import router from "./routes/index";
import authRoute from "./routes/auth.routes";
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

app.use("/api", router); // Use API routes
app.use("/", authRoute);

app.listen(PORT, () => {
  console.log(`Server running on http:  //localhost:${PORT}`);
});
