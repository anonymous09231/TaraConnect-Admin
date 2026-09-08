import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

// Helper to convert standard Google Sheet URLs to CSV export format
function normalizeSheetUrl(inputUrl: string): string {
  const trimmed = inputUrl.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const id = match[1];
    const gidMatch = trimmed.match(/[#?&]gid=([0-9]+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
  }
  return trimmed;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy route for Google Sheets / Apps Script to bypass CORS
  app.get("/api/proxy/sheet", async (req, res) => {
    const DEFAULT_SHEET_URL = "https://script.google.com/macros/s/AKfycbzhVUDIo0QKfxKJeuwjrv42Lg1inVvZuTLG6ZMHNL-UBfPCRIuyDFAZayBXs4Y9mUCK0Q/exec";
    const requestedUrl = (req.query.url as string) || process.env.GOOGLE_SHEET_URL || DEFAULT_SHEET_URL;
    const targetUrl = normalizeSheetUrl(requestedUrl);

    try {
      const response = await axios.get(targetUrl, {
        maxRedirects: 5,
        timeout: 15000,
        headers: {
          'Accept': 'text/csv, application/json, text/plain, */*'
        }
      });

      // Check if Google returned an HTML login page or Apps Script error page instead of data
      if (typeof response.data === "string") {
        const raw = response.data.trim();
        if (raw.includes("<!DOCTYPE") || raw.includes("<html") || raw.includes("ServiceLogin") || raw.includes("accounts.google.com")) {
          if (raw.includes("ServiceLogin") || raw.includes("accounts.google.com")) {
            return res.status(403).json({ 
              error: "Google Sheet is private. In your Google Sheet, click 'Share' and set General Access to 'Anyone with the link can view'.",
              isPrivateSheet: true 
            });
          }
          if (raw.includes("Script function not found: doGet")) {
            return res.status(502).json({ 
              error: "Google Apps Script error: 'doGet' not found. Please paste your direct Google Sheet URL (from your browser address bar) or update the Apps Script code.",
              isAppsScriptError: true 
            });
          }
          return res.status(502).json({ 
            error: "Received an HTML page instead of spreadsheet data. If linking a Google Sheet, make sure it is shared as 'Anyone with the link can view'.",
            isHtmlResponse: true 
          });
        }
      }

      res.json(response.data);
    } catch (error: any) {
      console.error("Error proxying Google Sheet request:", error.message);
      const message = error.response?.data?.error || error.message || "Failed to fetch data from Google Sheets via proxy";
      res.status(500).json({ error: message });
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
