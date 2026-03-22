import express, { Router } from "express";
import serverless from "serverless-http";
import axios from "axios";

const app = express();
const router = Router();

app.use(express.json());

// Proxy route for Google Apps Script to bypass CORS
router.get("/proxy/sheet", async (req, res) => {
  const GOOGLE_SHEET_URL = "https://script.google.com/macros/s/AKfycbzhVUDIo0QKfxKJeuwjrv42Lg1inVvZuTLG6ZMHNL-UBfPCRIuyDFAZayBXs4Y9mUCK0Q/exec";
  try {
    const response = await axios.get(GOOGLE_SHEET_URL, {
      maxRedirects: 5,
      timeout: 10000
    });
    res.json(response.data);
  } catch (error: any) {
    console.error("Error proxying Google Sheet request:", error.message);
    res.status(500).json({ error: "Failed to fetch data from Google Sheets via proxy" });
  }
});

app.use("/api", router);

export const handler = serverless(app);
