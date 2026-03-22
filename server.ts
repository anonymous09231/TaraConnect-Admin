import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy route for Google Apps Script to bypass CORS
  app.get("/api/proxy/sheet", async (req, res) => {
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
