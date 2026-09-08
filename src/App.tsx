/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  LogOut, 
  Search, 
  Filter, 
  RefreshCw, 
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  User,
  Lock,
  CheckCircle,
  Copy,
  Check,
  Settings,
  AlertTriangle,
  HelpCircle,
  FileCode,
  X,
  Upload,
  Sparkles,
  Link2,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import axios from 'axios';

// --- Types ---

interface SheetData {
  [key: string]: string;
}

// --- Sample Data ---

const SAMPLE_INFLUENCER_DATA: SheetData[] = [
  {
    "Name": "Aarav Sharma",
    "Instagram Handle": "aarav_lifestyle",
    "Instagram URL": "https://www.instagram.com/aarav_lifestyle/",
    "Followers": "142K",
    "Posts": "420",
    "Category": "Lifestyle & Fashion",
    "City": "Hyderabad"
  },
  {
    "Name": "Priya Reddy",
    "Instagram Handle": "priya_foodie_tales",
    "Instagram URL": "https://www.instagram.com/priya_foodie_tales/",
    "Followers": "48.5K",
    "Posts": "310",
    "Category": "Food & Travel",
    "City": "Hyderabad"
  },
  {
    "Name": "Karan Varma",
    "Instagram Handle": "karan_fitness_hyderabad",
    "Instagram URL": "https://www.instagram.com/karan_fitness_hyderabad/",
    "Followers": "890K",
    "Posts": "680",
    "Category": "Fitness & Health",
    "City": "Hyderabad"
  },
  {
    "Name": "Sneha Rao",
    "Instagram Handle": "sneha.glam",
    "Instagram URL": "https://www.instagram.com/sneha.glam/",
    "Followers": "1.2M",
    "Posts": "1250",
    "Category": "Beauty & Fashion",
    "City": "Hyderabad"
  },
  {
    "Name": "Vikram Teja",
    "Instagram Handle": "vikram_tech_reviews",
    "Instagram URL": "https://www.instagram.com/vikram_tech_reviews/",
    "Followers": "320K",
    "Posts": "540",
    "Category": "Tech & Gadgets",
    "City": "Hyderabad"
  },
  {
    "Name": "Ananya Joshi",
    "Instagram Handle": "ananya_explore",
    "Instagram URL": "https://www.instagram.com/ananya_explore/",
    "Followers": "18.2K",
    "Posts": "190",
    "Category": "Travel & Culture",
    "City": "Hyderabad"
  },
  {
    "Name": "Rohan Patel",
    "Instagram Handle": "rohan_clicks_hyd",
    "Instagram URL": "https://www.instagram.com/rohan_clicks_hyd/",
    "Followers": "6.4K",
    "Posts": "145",
    "Category": "Photography",
    "City": "Hyderabad"
  }
];

// --- Constants ---

const GOOGLE_SHEET_URL = "/api/proxy/sheet";
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "Nagendra@0244",
  authorizedEmail: "promotions.taraconnect@gmail.com"
};

// --- Helpers ---

const normalizeFollowers = (countStr: string): string => {
  if (!countStr || countStr === 'N/A' || countStr === '—') return "N/A";
  
  const num = followersToNumber(countStr);
  if (num === 0 && countStr !== '0') return countStr;

  // Strictly K format: e.g., 2,000,000 -> 2000K, 1,500 -> 1.5K
  return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
};

const followersToNumber = (countStr: string): number => {
  if (!countStr || countStr === 'N/A' || countStr === '—' || countStr === 'Error') return 0;
  // Remove commas, spaces, and other non-numeric characters except . K M
  const cleanStr = countStr.toUpperCase().replace(/[^0-9.KM]/g, '');
  let num = parseFloat(cleanStr);
  if (cleanStr.includes('K')) num *= 1000;
  else if (cleanStr.includes('M')) num *= 1000000;
  return isNaN(num) ? 0 : num;
};

// --- Components ---

const LoginPage = ({ onLogin }: { onLogin: (email: string) => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
      onLogin(email);
    } else {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-tara-light p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8 border border-tara-navy/5"
      >
        <div className="flex flex-col items-center mb-8">
          <img 
            src="https://www.taraconnect.in/finallogo.png" 
            alt="Tara Connect Logo" 
            className="h-16 w-auto mb-4"
            referrerPolicy="no-referrer"
          />
          <p className="text-gray-500 text-sm font-medium">Admin Portal Access</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-tara-navy/60 uppercase tracking-widest mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tara-teal/50" />
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-tara-light/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tara-teal focus:border-transparent outline-none transition-all"
                placeholder="admin"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tara-navy/60 uppercase tracking-widest mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tara-teal/50" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-tara-light/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tara-teal focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-tara-navy/60 uppercase tracking-widest mb-2">Admin Email</label>
            <div className="relative">
              <RefreshCw className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-tara-teal/50" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-tara-light/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-tara-teal focus:border-transparent outline-none transition-all"
                placeholder="your@email.com"
                required
              />
            </div>
            <p className="mt-2 text-[10px] text-gray-400 italic">Access restricted to authorized promotional accounts.</p>
          </div>

          {error && (
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-red-500 text-sm text-center font-semibold"
            >
              {error}
            </motion.p>
          )}

          <button 
            type="submit"
            className="w-full bg-tara-navy text-white py-3.5 rounded-xl font-bold hover:bg-tara-navy/90 transition-all shadow-lg shadow-tara-navy/20 active:scale-[0.98]"
          >
            Sign In
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const APPS_SCRIPT_SNIPPET = `function doGet(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var data = sheet.getDataRange().getValues();
    
    if (!data || data.length === 0) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    var headers = data[0];
    var rows = [];
    
    for (var i = 1; i < data.length; i++) {
      var row = {};
      var hasValue = false;
      for (var j = 0; j < headers.length; j++) {
        var header = headers[j];
        if (header) {
          row[header] = data[i][j] !== undefined && data[i][j] !== null ? String(data[i][j]) : "";
          if (row[header]) hasValue = true;
        }
      }
      if (hasValue) {
        rows.push(row);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(rows))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}`;

const Dashboard = ({ onLogout, userEmail }: { onLogout: () => void, userEmail: string }) => {
  const [data, setData] = useState<SheetData[]>(() => {
    const saved = localStorage.getItem('cached_influencer_data');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error("Failed to parse cached influencer data", e);
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [followerRange, setFollowerRange] = useState<string>('all');
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [error, setError] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copied, setCopied] = useState(false);
  
  // Sheet URL Configuration and Modal
  const [customSheetUrl, setCustomSheetUrl] = useState<string>(() => {
    return localStorage.getItem('custom_sheet_url') || '';
  });
  const [tempSheetUrl, setTempSheetUrl] = useState<string>('');
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [modalTab, setModalTab] = useState<'link' | 'csv' | 'sample' | 'script'>('link');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleLoadSampleData = () => {
    setData(SAMPLE_INFLUENCER_DATA);
    localStorage.setItem('cached_influencer_data', JSON.stringify(SAMPLE_INFLUENCER_DATA));
    setError('');
    setShowConfigModal(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const cleanData = (results.data as SheetData[]).filter(row =>
            Object.values(row).some(v => v !== null && v !== undefined && String(v).trim().length > 0)
          );
          if (cleanData.length > 0) {
            setData(cleanData);
            localStorage.setItem('cached_influencer_data', JSON.stringify(cleanData));
            setError('');
            setShowConfigModal(false);
          } else {
            setError('The selected CSV file has no valid data rows.');
          }
        } else {
          setError('Failed to parse rows from the CSV file.');
        }
      },
      error: (err) => {
        setError(`CSV Parse Error: ${err.message}`);
      }
    });

    if (e.target) e.target.value = '';
  };

  const handleCopyInstagramUrls = () => {
    if (filteredData.length === 0) {
      alert("Please import data first.");
      return;
    }

    const urlKey = Object.keys(filteredData[0]).find(k => {
      const key = k.toLowerCase();
      return key.includes('instagram') || key.includes('url') || key.includes('link') || key.includes('handle');
    });

    if (!urlKey) {
      alert("Instagram URL column not found in the data.");
      return;
    }

    const urls = filteredData.map(row => String(row[urlKey])).join('\n');
    navigator.clipboard.writeText(urls).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy: ', err);
      alert("Failed to copy URLs to clipboard.");
    });
  };

  const handleRealtimeVerification = () => {
    if (filteredData.length === 0) {
      alert("Please import data first.");
      return;
    }
    
    const followersKey = Object.keys(filteredData[0]).find(k => {
      const key = k.toLowerCase();
      return key.includes('follower') || (key.includes('count') && !key.includes('post'));
    });

    if (!followersKey) {
      alert("Followers column not found in the data.");
      return;
    }

    const followersList = filteredData.map(row => row[followersKey]);
    const encodedData = encodeURIComponent(JSON.stringify(followersList));
    window.location.href = `https://taracnct-ig.netlify.app/?followers=${encodedData}`;
  };

  const handleSaveSheetUrl = (url: string) => {
    const trimmed = url.trim();
    setCustomSheetUrl(trimmed);
    if (trimmed) {
      localStorage.setItem('custom_sheet_url', trimmed);
    } else {
      localStorage.removeItem('custom_sheet_url');
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_SNIPPET);
    setScriptCopied(true);
    setTimeout(() => setScriptCopied(false), 2500);
  };

  const fetchData = async (overrideUrl?: string) => {
    if (userEmail !== ADMIN_CREDENTIALS.authorizedEmail) {
      setError(`Access Denied: Only ${ADMIN_CREDENTIALS.authorizedEmail} can import data.`);
      return;
    }

    const urlToUse = (overrideUrl !== undefined ? overrideUrl : customSheetUrl).trim();

    // If user hasn't configured a Google Sheet link, open modal with instructions
    if (!urlToUse) {
      setTempSheetUrl('');
      setShowConfigModal(true);
      setError("Please connect your Google Sheet by pasting your spreadsheet link, or upload a CSV file.");
      return;
    }

    setError('');
    setLoading(true);
    try {
      const queryParam = `?url=${encodeURIComponent(urlToUse)}`;
      const response = await axios.get(`${GOOGLE_SHEET_URL}${queryParam}`);
      
      // Handle proxy or backend errors
      if (response.data && response.data.error) {
        throw new Error(response.data.error);
      }

      let parsedRows: SheetData[] = [];

      // If the response is already an array (from Apps Script JSON)
      if (Array.isArray(response.data)) {
        parsedRows = response.data as SheetData[];
      } 
      // If it's an object with a data property (common Apps Script pattern)
      else if (response.data && Array.isArray(response.data.data)) {
        parsedRows = response.data.data as SheetData[];
      }
      // If it's a string (CSV or HTML error)
      else if (typeof response.data === 'string') {
        const raw = response.data.trim();
        
        // Strictly detect HTML error pages from Google
        if (raw.startsWith('<!DOCTYPE') || raw.startsWith('<html') || raw.includes('<body') || raw.includes('errorMessage') || raw.includes('ServiceLogin')) {
          if (raw.includes('ServiceLogin') || raw.includes('accounts.google.com')) {
            throw new Error("This Google Sheet is private. In Google Sheets, click 'Share' and set General access to 'Anyone with the link can view'.");
          }
          if (raw.includes('Script function not found: doGet')) {
            throw new Error("Google Apps Script 'doGet' not found. Instead of using Apps Script, you can simply paste your direct Google Sheet link (from your browser address bar)!");
          }
          throw new Error("Google returned an HTML page instead of spreadsheet data. Make sure your sheet is shared as 'Anyone with the link can view'.");
        }

        const parsed = Papa.parse(raw, { header: true, skipEmptyLines: true });
        
        // Guard against HTML or script tags leaking into CSV parsed headers
        if (parsed.data.length > 0 && Object.keys(parsed.data[0]).some(k => k.includes('<!DOCTYPE') || k.includes('<html') || k.includes('function('))) {
          throw new Error("Received HTML error content from Google instead of spreadsheet data.");
        }

        parsedRows = (parsed.data as SheetData[]).filter(row =>
          Object.values(row).some(v => v !== null && v !== undefined && String(v).trim().length > 0)
        );
      }
      else {
        throw new Error("Unexpected data format received from Google Sheets.");
      }

      if (parsedRows.length === 0) {
        setError("The spreadsheet appears to have no data rows.");
        return;
      }

      setData(parsedRows);
      localStorage.setItem('cached_influencer_data', JSON.stringify(parsedRows));
      setError('');
      setShowConfigModal(false);
    } catch (error: any) {
      console.error("Error fetching sheet data:", error);
      const msg = error.response?.data?.error || error.message || "Failed to fetch data from Google Sheets.";
      setError(msg);
      setShowConfigModal(true);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = useMemo(() => {
    let result = data.filter(row => 
      Object.values(row).some(val => 
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );

    // Follower Range Filtering
    if (followerRange !== 'all') {
      result = result.filter(row => {
        // Look for a column that contains "follower" or "count" in its name
        const followersKey = Object.keys(row).find(k => {
          const key = k.toLowerCase();
          return key.includes('follower') || (key.includes('count') && !key.includes('post'));
        });
        const countStr = followersKey ? String(row[followersKey]) : '0';
        const count = followersToNumber(countStr);
        
        switch (followerRange) {
          case 'below1k': return count < 1000;
          case 'nano': return count >= 1000 && count < 10000;
          case 'micro': return count >= 10000 && count < 100000;
          case 'macro': return count >= 100000 && count < 1000000;
          case 'celebrity': return count >= 1000000;
          case 'custom': {
            const min = customMin ? followersToNumber(customMin) : 0;
            const max = customMax ? followersToNumber(customMax) : Infinity;
            return count >= min && count <= max;
          }
          default: return true;
        }
      });
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const key = sortConfig.key;
        const isFollowersCol = key.toLowerCase().includes('follower') || (key.toLowerCase().includes('count') && !key.toLowerCase().includes('post'));
        
        let valA = a[key];
        let valB = b[key];

        if (isFollowersCol) {
          valA = followersToNumber(String(valA));
          valB = followersToNumber(String(valB));
        } else {
          // Standard string/number comparison
          valA = isNaN(Number(valA)) ? String(valA).toLowerCase() : Number(valA);
          valB = isNaN(Number(valB)) ? String(valB).toLowerCase() : Number(valB);
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, sortConfig, followerRange, customMin, customMax]);

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleEditCell = (rowIdx: number, colKey: string, currentVal: string) => {
    setEditingCell({ rowIdx, colKey });
    setEditValue(currentVal);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;
    const newData = [...data];
    newData[editingCell.rowIdx][editingCell.colKey] = editValue;
    setData(newData);
    localStorage.setItem('cached_influencer_data', JSON.stringify(newData));
    setEditingCell(null);
  };

  const columns = useMemo(() => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).filter(k => k.toLowerCase() !== 'followers_cleaned');
  }, [data]);

  return (
    <div className="min-h-screen bg-tara-light">
      {/* Sidebar/Nav */}
      <nav className="bg-white border-b border-tara-navy/10 px-4 sm:px-6 py-4 sticky top-0 z-20 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-4">
              <img 
                src="https://www.taraconnect.in/finallogo.png" 
                alt="Tara Connect Logo" 
                className="h-8 sm:h-10 w-auto"
                referrerPolicy="no-referrer"
              />
              <div className="h-6 w-[1px] bg-tara-navy/10 mx-2 hidden sm:block" />
              <p className="text-[10px] font-bold text-tara-teal/70 uppercase tracking-widest hidden sm:block">Admin Dashboard</p>
            </div>
            
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tara-teal" />
              <select 
                value={followerRange}
                onChange={(e) => setFollowerRange(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-tara-light border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-tara-teal outline-none transition-all appearance-none cursor-pointer font-medium text-tara-navy"
              >
                <option value="all">All Followers</option>
                <option value="below1k">Below 1K</option>
                <option value="nano">Nano (1K-10K)</option>
                <option value="micro">Micro (10K-100K)</option>
                <option value="macro">Macro (100K-1M)</option>
                <option value="celebrity">Celebrity (1M+)</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <AnimatePresence>
              {followerRange === 'custom' && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex items-center gap-2"
                >
                  <input 
                    type="text" 
                    placeholder="Min (e.g. 5K)"
                    value={customMin}
                    onChange={(e) => setCustomMin(e.target.value)}
                    className="w-24 sm:w-32 px-3 py-2 bg-tara-light border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-tara-teal outline-none transition-all font-medium text-tara-navy"
                  />
                  <span className="text-tara-navy/40 text-xs font-bold">-</span>
                  <input 
                    type="text" 
                    placeholder="Max (e.g. 50K)"
                    value={customMax}
                    onChange={(e) => setCustomMax(e.target.value)}
                    className="w-24 sm:w-32 px-3 py-2 bg-tara-light border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-tara-teal outline-none transition-all font-medium text-tara-navy"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex-1 min-w-[140px]">
              <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tara-teal" />
              <select 
                value={sortConfig ? `${sortConfig.key}:${sortConfig.direction}` : 'raw'}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'raw') {
                    setSortConfig(null);
                  } else {
                    const [key, direction] = val.split(':');
                    setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                  }
                }}
                className="w-full pl-10 pr-4 py-2 bg-tara-light border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-tara-teal outline-none transition-all appearance-none cursor-pointer font-medium text-tara-navy"
              >
                <option value="raw">Raw Order</option>
                {columns.map(col => (
                  <React.Fragment key={col}>
                    <option value={`${col}:asc`}>{col} (Asc)</option>
                    <option value={`${col}:desc`}>{col} (Desc)</option>
                  </React.Fragment>
                ))}
              </select>
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-tara-teal" />
              <input 
                type="text" 
                placeholder="Search influencers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-tara-light border border-gray-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-tara-teal outline-none transition-all font-medium text-tara-navy"
              />
            </div>
          </div>
        </div>
      </nav>

      <main className="p-6 max-w-[1600px] mx-auto">
        {/* Hidden CSV File Input */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept=".csv" 
          onChange={handleFileUpload} 
          className="hidden" 
        />

        {/* Stats/Header */}
        <div className="mb-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-tara-navy tracking-tight">Data Overview</h2>
            <p className="text-tara-teal font-medium text-sm sm:text-base">
              {data.length > 0 ? `Managing ${filteredData.length} influencer profiles` : 'No data loaded yet'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button 
              onClick={handleCopyInstagramUrls}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white text-tara-navy border border-tara-navy/20 rounded-xl font-bold hover:bg-tara-light transition-all shadow-sm active:scale-95 text-xs sm:text-sm"
              title="Copy all Instagram URLs in table order"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-tara-teal" />}
              {copied ? 'Copied!' : 'Copy Instagram URLs'}
            </button>
            <button 
              onClick={handleRealtimeVerification}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-tara-teal text-white rounded-xl font-bold hover:bg-tara-teal/90 transition-all shadow-md shadow-tara-teal/20 active:scale-95 text-xs sm:text-sm"
            >
              <CheckCircle className="w-4 h-4" />
              Realtime Verification
            </button>
            <button 
              onClick={() => fetchData()}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-tara-navy text-white rounded-xl font-bold hover:bg-tara-navy/90 transition-all shadow-md shadow-tara-navy/20 disabled:opacity-50 active:scale-95 text-xs sm:text-sm"
            >
              <TableIcon className="w-4 h-4 text-tara-teal" />
              {loading ? 'Importing...' : 'Import from Sheets'}
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-white text-tara-navy border border-tara-navy/15 rounded-xl font-bold hover:bg-tara-light transition-all shadow-sm active:scale-95 text-xs sm:text-sm"
              title="Upload CSV export from Google Sheets"
            >
              <Upload className="w-4 h-4 text-tara-teal" />
              <span>Upload CSV</span>
            </button>
            <button 
              onClick={() => {
                setTempSheetUrl(customSheetUrl);
                setModalTab('link');
                setShowConfigModal(true);
              }}
              title="Google Sheet & Apps Script Settings"
              className="flex items-center justify-center gap-2 p-2.5 sm:px-3 bg-white text-tara-navy border border-tara-navy/15 rounded-xl font-bold hover:bg-tara-light transition-all shadow-sm active:scale-95 text-xs sm:text-sm"
            >
              <Settings className="w-4 h-4 text-tara-teal" />
              <span className="hidden md:inline">Sheet Settings</span>
            </button>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="mb-6 p-4 sm:p-5 bg-red-50 border border-red-200/80 text-red-700 rounded-2xl text-sm font-medium shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 mb-1">Sheet Data Import Issue</p>
                <p className="text-red-700 leading-relaxed text-xs sm:text-sm">{error}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white text-red-800 border border-red-200 rounded-xl font-bold text-xs hover:bg-red-100/50 shadow-sm transition-all active:scale-95"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload CSV
              </button>
              <button
                onClick={() => {
                  setTempSheetUrl(customSheetUrl);
                  setModalTab('link');
                  setShowConfigModal(true);
                }}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-95"
              >
                <Settings className="w-3.5 h-3.5" />
                Fix / Change URL
              </button>
            </div>
          </motion.div>
        )}

        {/* Table Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-tara-navy/5 border border-tara-navy/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-tara-light/50 border-b border-tara-navy/5">
                  {columns.map((col) => (
                    <th 
                      key={col} 
                      onClick={() => handleSort(col)}
                      className="px-6 py-5 text-[11px] font-bold text-tara-navy/60 uppercase tracking-[0.2em] cursor-pointer hover:bg-tara-light transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {col}
                        {sortConfig?.key === col ? (
                          sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-tara-teal" /> : <ChevronDown className="w-3 h-3 text-tara-teal" />
                        ) : null}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-tara-navy/5">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {(columns.length > 0 ? columns : ['1', '2', '3', '4', '5']).map((_, j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-4 bg-tara-light rounded-full w-full"></div>
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredData.length > 0 ? (
                  filteredData.map((row, idx) => {
                    return (
                      <tr key={idx} className="hover:bg-tara-light/30 transition-colors group">
                        {columns.map((col) => {
                          const isFollowersCol = col.toLowerCase().includes('follower') || (col.toLowerCase().includes('count') && !col.toLowerCase().includes('post'));
                          const cellValue = isFollowersCol ? normalizeFollowers(String(row[col])) : row[col];
                          
                          return (
                            <td 
                              key={col} 
                              className="px-4 sm:px-6 py-4 sm:py-5 text-xs sm:text-sm font-medium text-tara-navy/80 relative group/cell min-w-[120px]"
                              onDoubleClick={() => handleEditCell(idx, col, String(row[col]))}
                            >
                              {editingCell?.rowIdx === idx && editingCell?.colKey === col ? (
                                <input 
                                  autoFocus
                                  value={editValue}
                                  onChange={(e) => setEditValue(e.target.value)}
                                  onBlur={handleSaveEdit}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit()}
                                  className="w-full p-2 border-2 border-tara-teal rounded-xl outline-none bg-white shadow-inner"
                                />
                              ) : (
                                <div className="flex items-center justify-between">
                                  <span className="truncate max-w-[250px]">
                                    {String(cellValue).toLowerCase().includes('http') ? (
                                      <a 
                                        href={String(cellValue).startsWith('http') ? String(cellValue) : `https://${cellValue}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-tara-teal hover:text-tara-navy font-bold flex items-center gap-1.5 transition-colors"
                                      >
                                        Visit Link <ExternalLink className="w-3 h-3" />
                                      </a>
                                    ) : (
                                      cellValue
                                    )}
                                  </span>
                                  <button 
                                    onClick={() => handleEditCell(idx, col, String(row[col]))}
                                    className="opacity-0 group-hover/cell:opacity-100 p-1.5 hover:bg-white rounded-lg transition-all shadow-sm"
                                  >
                                    <User className="w-3 h-3 text-tara-teal" />
                                  </button>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={Math.max(columns.length, 1)} className="px-6 py-16 text-center">
                      <div className="max-w-md mx-auto flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-tara-light rounded-full flex items-center justify-center text-tara-teal shadow-inner">
                          <FileSpreadsheet className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-lg font-serif font-bold text-tara-navy mb-1">No Data Loaded</h3>
                          <p className="text-tara-navy/60 text-xs sm:text-sm">
                            Connect your Google Sheet, upload a CSV export, or load sample data to get started.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                          <button
                            onClick={() => {
                              setTempSheetUrl(customSheetUrl);
                              setModalTab('link');
                              setShowConfigModal(true);
                            }}
                            className="px-4 py-2.5 bg-tara-teal text-white rounded-xl font-bold text-xs hover:bg-tara-teal/90 transition-all shadow-md shadow-tara-teal/20 active:scale-95 flex items-center gap-2"
                          >
                            <Link2 className="w-4 h-4" />
                            Connect Google Sheet
                          </button>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2.5 bg-white border border-tara-navy/15 text-tara-navy rounded-xl font-bold text-xs hover:bg-tara-light transition-all shadow-sm active:scale-95 flex items-center gap-2"
                          >
                            <Upload className="w-4 h-4 text-tara-teal" />
                            Upload CSV
                          </button>
                          <button
                            onClick={handleLoadSampleData}
                            className="px-4 py-2.5 bg-tara-light border border-tara-teal/20 text-tara-teal rounded-xl font-bold text-xs hover:bg-tara-teal/10 transition-all active:scale-95 flex items-center gap-2"
                          >
                            <Sparkles className="w-4 h-4" />
                            Load Demo Data
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Google Sheet & Apps Script Settings Modal */}
      <AnimatePresence>
        {showConfigModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-tara-navy/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl shadow-2xl border border-tara-navy/10 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-tara-navy/10 flex items-center justify-between bg-tara-light/40">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-tara-navy/5 rounded-xl text-tara-teal">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-serif font-bold text-tara-navy">Google Sheet & Data Connection</h3>
                    <p className="text-xs text-tara-navy/60 font-medium">Connect your spreadsheet, upload CSV, or copy Apps Script</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowConfigModal(false)}
                  className="p-2 text-tara-navy/40 hover:text-tara-navy hover:bg-tara-navy/5 rounded-xl transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-tara-navy/10 bg-white px-6 gap-2">
                <button
                  onClick={() => setModalTab('link')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'link' 
                      ? 'border-tara-teal text-tara-navy' 
                      : 'border-transparent text-tara-navy/60 hover:text-tara-navy'
                  }`}
                >
                  <Link2 className="w-4 h-4 text-tara-teal" />
                  Sheet / Script Link
                </button>
                <button
                  onClick={() => setModalTab('csv')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'csv' 
                      ? 'border-tara-teal text-tara-navy' 
                      : 'border-transparent text-tara-navy/60 hover:text-tara-navy'
                  }`}
                >
                  <Upload className="w-4 h-4 text-tara-teal" />
                  Upload CSV
                </button>
                <button
                  onClick={() => setModalTab('script')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'script' 
                      ? 'border-tara-teal text-tara-navy' 
                      : 'border-transparent text-tara-navy/60 hover:text-tara-navy'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-tara-teal" />
                  Apps Script Code
                </button>
                <button
                  onClick={() => setModalTab('sample')}
                  className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
                    modalTab === 'sample' 
                      ? 'border-tara-teal text-tara-navy' 
                      : 'border-transparent text-tara-navy/60 hover:text-tara-navy'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-tara-teal" />
                  Demo Data
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-5 text-sm">
                {modalTab === 'link' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-teal-50/70 border border-tara-teal/20 rounded-2xl text-xs sm:text-sm text-tara-navy">
                      <p className="font-bold text-tara-teal mb-1">Direct Google Sheet Link (Simplest Method):</p>
                      <p className="leading-relaxed text-tara-navy/80">
                        You can paste your normal Google Sheet URL (from your browser address bar) or your Apps Script Web App URL.
                      </p>
                      <div className="mt-2.5 pt-2.5 border-t border-tara-teal/15 space-y-1 text-xs text-tara-navy/70">
                        <p>1. In Google Sheets, click the green <strong>Share</strong> button (top-right).</p>
                        <p>2. Under <em>General access</em>, change from <strong>Restricted</strong> to <strong>Anyone with the link</strong>.</p>
                        <p>3. Copy the URL from your browser address bar and paste it below:</p>
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-tara-navy text-xs uppercase tracking-wider block mb-2">
                        Google Sheet or Apps Script Web App URL
                      </label>
                      <input 
                        type="text"
                        placeholder="https://docs.google.com/spreadsheets/d/.../edit or https://script.google.com/macros/s/.../exec"
                        value={tempSheetUrl}
                        onChange={(e) => setTempSheetUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-tara-light border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-tara-teal outline-none text-tara-navy"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      {customSheetUrl ? (
                        <button
                          onClick={() => {
                            setTempSheetUrl('');
                            handleSaveSheetUrl('');
                          }}
                          className="text-xs font-bold text-gray-500 hover:text-red-600 transition-colors"
                        >
                          Clear Saved URL
                        </button>
                      ) : <span />}
                      
                      <button
                        onClick={() => {
                          handleSaveSheetUrl(tempSheetUrl);
                          fetchData(tempSheetUrl);
                        }}
                        disabled={loading || !tempSheetUrl.trim()}
                        className="px-5 py-2.5 bg-tara-teal text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-tara-teal/90 transition-all shadow-md shadow-tara-teal/20 disabled:opacity-50 active:scale-95 flex items-center gap-2"
                      >
                        <TableIcon className="w-4 h-4" />
                        {loading ? 'Connecting...' : 'Save & Import Data'}
                      </button>
                    </div>
                  </div>
                )}

                {modalTab === 'csv' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-tara-light border border-tara-navy/10 rounded-2xl text-xs sm:text-sm text-tara-navy">
                      <p className="font-bold text-tara-navy mb-1">100% Guaranteed Offline / Direct CSV Import:</p>
                      <p className="text-tara-navy/70 leading-relaxed mb-2">
                        If Google Sheet permissions or Apps Script are blocked by network policies, simply export your Google Sheet as a CSV:
                      </p>
                      <ol className="list-decimal pl-4 space-y-1 text-xs text-tara-navy/80">
                        <li>In Google Sheets, go to <strong>File</strong> → <strong>Download</strong> → <strong>Comma Separated Values (.csv)</strong>.</li>
                        <li>Upload that file below. All influencer columns and Instagram links will load immediately.</li>
                      </ol>
                    </div>

                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-tara-teal/40 hover:border-tara-teal bg-tara-light/40 hover:bg-tara-light p-8 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all gap-3 text-center"
                    >
                      <div className="w-12 h-12 rounded-full bg-tara-teal/10 flex items-center justify-center text-tara-teal">
                        <Upload className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-tara-navy text-sm">Click to choose CSV file</p>
                        <p className="text-xs text-tara-navy/50">Supports any Google Sheet or Excel CSV export</p>
                      </div>
                    </div>
                  </div>
                )}

                {modalTab === 'script' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-amber-900 flex items-start gap-2.5 text-xs">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="leading-relaxed">
                        If your Apps Script returns <code>Script function not found: doGet</code> or HTML error pages, replace your script with this tested version and deploy as a Web App with access set to <strong>Anyone</strong>.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="font-bold text-tara-navy text-xs uppercase tracking-wider">
                        Tested Apps Script (Code.gs)
                      </label>
                      <button
                        onClick={handleCopyScript}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-tara-teal text-white rounded-lg hover:bg-tara-teal/90 transition-all shadow-sm active:scale-95"
                      >
                        {scriptCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {scriptCopied ? "Copied!" : "Copy Code"}
                      </button>
                    </div>

                    <pre className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-[11px] sm:text-xs overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                      {APPS_SCRIPT_SNIPPET}
                    </pre>

                    <div className="text-xs text-tara-navy/80 space-y-1.5 bg-tara-light p-3.5 rounded-xl border border-tara-navy/10">
                      <p className="font-bold text-tara-navy">How to deploy in Google Sheets:</p>
                      <p>1. Open sheet → <strong>Extensions</strong> → <strong>Apps Script</strong>.</p>
                      <p>2. Paste the code above into <strong>Code.gs</strong> and Save.</p>
                      <p>3. Click <strong>Deploy</strong> → <strong>New deployment</strong> → Type: <strong>Web app</strong> → Access: <strong>Anyone</strong>.</p>
                      <p>4. Copy the Web App URL and paste it in the "Sheet / Script Link" tab.</p>
                    </div>
                  </div>
                )}

                {modalTab === 'sample' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-tara-light border border-tara-navy/10 rounded-2xl text-xs sm:text-sm text-tara-navy">
                      <p className="font-bold text-tara-navy mb-1">Instant Demo & Verification Testing:</p>
                      <p className="text-tara-navy/70 leading-relaxed mb-3">
                        Load pre-configured sample influencer data containing handles, follower ranges (12.4K, 85.2K, 1.2M, etc.), categories, and URLs to test:
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-xs text-tara-navy/80 mb-4">
                        <li>Follower filtering & custom range (e.g. 50k to 500k)</li>
                        <li>Followers column sorting (Ascending / Descending)</li>
                        <li>Copy Instagram URLs in user-sorted order</li>
                        <li>Redirect to Realtime Verification (taracnct-ig.netlify.app)</li>
                      </ul>
                      <button
                        onClick={handleLoadSampleData}
                        className="w-full py-3 bg-tara-teal text-white rounded-xl font-bold text-xs sm:text-sm hover:bg-tara-teal/90 transition-all shadow-md shadow-tara-teal/20 active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        Load 8 Influencer Demo Records
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-tara-light/40 border-t border-tara-navy/10 flex justify-end gap-3">
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="px-5 py-2.5 bg-white border border-tara-navy/15 text-tara-navy rounded-xl font-bold text-xs sm:text-sm hover:bg-tara-light transition-all active:scale-95"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // Simple session persistence
  useEffect(() => {
    const auth = localStorage.getItem('admin_auth');
    const email = localStorage.getItem('admin_email');
    if (auth === 'true' && email) {
      setIsAuthenticated(true);
      setUserEmail(email);
    }
  }, []);

  const handleLogin = (email: string) => {
    setIsAuthenticated(true);
    setUserEmail(email);
    localStorage.setItem('admin_auth', 'true');
    localStorage.setItem('admin_email', email);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserEmail('');
    localStorage.removeItem('admin_auth');
    localStorage.removeItem('admin_email');
  };

  return (
    <div className="font-sans antialiased text-gray-900">
      <AnimatePresence mode="wait">
        {isAuthenticated ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Dashboard 
              onLogout={handleLogout} 
              userEmail={userEmail} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoginPage onLogin={handleLogin} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
