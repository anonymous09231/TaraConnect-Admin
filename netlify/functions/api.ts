import express, { Router } from "express";
import serverless from "serverless-http";
import axios from "axios";
import * as cheerio from "cheerio";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

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

// API route to fetch Instagram followers and posts
router.get("/instagram/followers/:username", async (req, res) => {
  const { username } = req.params;
  const APIFY_TOKEN = process.env.APIFY_TOKEN || "apify_api_0cGiCnRNq2d34Kdg54IBc8Gxf2TYlr35N1fb";
  
  // Method 0: Apify
  try {
    const runResponse = await axios.post(
      `https://api.apify.com/v2/acts/apify~instagram-followers-count-scraper/runs?token=${APIFY_TOKEN}&wait=60`,
      {
        "usernames": [username]
      }
    );

    if (runResponse.data?.data?.status === 'SUCCEEDED') {
      const datasetId = runResponse.data.data.defaultDatasetId;
      const datasetResponse = await axios.get(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_TOKEN}`
      );
      
      const items = datasetResponse.data;
      if (items && items.length > 0) {
        const user = items[0];
        const followers = user.followersCount || user.followers || '0';
        const posts = user.postsCount || user.posts || '0';
        return res.json({
          followers: followers.toString(),
          posts: posts.toString()
        });
      }
    }
  } catch (apifyError: any) {
    console.warn(`Apify failed for ${username}:`, apifyError.message);
  }

  // Method 1: Try Instagram's internal Web Profile Info API
  try {
    const response = await axios.get(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'x-ig-app-id': '936619743392459',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (response.data?.data?.user) {
      const user = response.data.data.user;
      return res.json({
        followers: user.edge_followed_by?.count?.toString() || '0',
        posts: user.edge_owner_to_timeline_media?.count?.toString() || '0'
      });
    }
  } catch (apiError: any) {
    console.warn(`Instagram Internal API failed for ${username}:`, apiError.message);
  }

  // Method 2: Try a third-party viewer (Picuki)
  try {
    const response = await axios.get(`https://www.picuki.com/profile/${username}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
      }
    });
    const $ = cheerio.load(response.data);
    const followers = $('.followed_by').text().replace(/[^0-9.kKmMbB]/g, '').trim();
    const posts = $('.posts_count').text().replace(/[^0-9.kKmMbB]/g, '').trim();
    
    if (followers || posts) {
      return res.json({ followers, posts });
    }
  } catch (picukiError: any) {
    console.warn(`Picuki fallback failed for ${username}:`, picukiError.message);
  }

  // Method 3: Python script (Instaloader) - Note: Might not work on Netlify Functions
  try {
    const { stdout } = await execAsync(`python3 get_followers.py ${username}`);
    if (stdout) {
      const data = JSON.parse(stdout);
      if (!data.error) {
        return res.json({ 
          followers: data.followers.toString(), 
          posts: data.posts.toString() 
        });
      }
    }
  } catch (pythonError: any) {
    console.warn(`Python script failed for ${username}:`, pythonError.message);
  }

  // Method 4: Direct HTML Scraping
  try {
    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      }
    });

    const $ = cheerio.load(response.data);
    let followers = '';
    let posts = '';
    
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content');
    if (description) {
      const followersMatch = description.match(/([0-9.,kKmMbB]+)\s*Followers/i);
      if (followersMatch) followers = followersMatch[1];
      const postsMatch = description.match(/([0-9.,kKmMbB]+)\s*Posts/i);
      if (postsMatch) posts = postsMatch[1];
    }

    if (followers || posts) {
      return res.json({ followers, posts });
    }
    res.status(404).json({ error: "Data not found across all methods" });
  } catch (fallbackError: any) {
    res.status(500).json({ error: "Failed to fetch Instagram data" });
  }
});

app.use("/api", router);

export const handler = serverless(app);
