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
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import axios from 'axios';

// --- Types ---

interface SheetData {
  [key: string]: string;
}

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

const Dashboard = ({ onLogout, userEmail }: { onLogout: () => void, userEmail: string }) => {
  const [data, setData] = useState<SheetData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [followerRange, setFollowerRange] = useState<string>('all');
  const [customMin, setCustomMin] = useState<string>('');
  const [customMax, setCustomMax] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [error, setError] = useState('');
  const [editingCell, setEditingCell] = useState<{ rowIdx: number; colKey: string } | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleRealtimeVerification = () => {
    if (data.length === 0) {
      alert("Please import data first.");
      return;
    }
    
    const followersKey = Object.keys(data[0]).find(k => {
      const key = k.toLowerCase();
      return key.includes('follower') || (key.includes('count') && !key.includes('post'));
    });

    if (!followersKey) {
      alert("Followers column not found in the data.");
      return;
    }

    const followersList = data.map(row => row[followersKey]);
    const encodedData = encodeURIComponent(JSON.stringify(followersList));
    window.location.href = `https://taracnct-ig.netlify.app/?followers=${encodedData}`;
  };

  const fetchData = async () => {
    if (userEmail !== ADMIN_CREDENTIALS.authorizedEmail) {
      setError(`Access Denied: Only ${ADMIN_CREDENTIALS.authorizedEmail} can import data.`);
      return;
    }

    setError('');
    setLoading(true);
    try {
      const response = await axios.get(GOOGLE_SHEET_URL);
      
      // If the response is already an array (from Apps Script JSON)
      if (Array.isArray(response.data)) {
        setData(response.data as SheetData[]);
      } 
      // If it's a string (CSV)
      else if (typeof response.data === 'string') {
        const parsed = Papa.parse(response.data, { header: true, skipEmptyLines: true });
        setData(parsed.data as SheetData[]);
      }
      // If it's an object with a data property (common Apps Script pattern)
      else if (response.data && Array.isArray(response.data.data)) {
        setData(response.data.data as SheetData[]);
      }
      else {
        throw new Error("Unexpected data format from Google Sheets");
      }
    } catch (error: any) {
      console.error("Error fetching sheet data:", error);
      setError("Failed to fetch data from Google Sheets. Ensure the Apps Script is deployed as a web app with access set to 'Anyone'.");
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
        {/* Stats/Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-tara-navy tracking-tight">Data Overview</h2>
            <p className="text-tara-teal font-medium text-sm sm:text-base">Managing {filteredData.length} influencer profiles</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <button 
              onClick={handleRealtimeVerification}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-tara-teal text-white rounded-xl font-bold hover:bg-tara-teal/90 transition-all shadow-xl shadow-tara-teal/20 active:scale-95 text-sm sm:text-base"
            >
              <CheckCircle className="w-4 h-4" />
              Realtime Verification
            </button>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 bg-tara-navy text-white rounded-xl font-bold hover:bg-tara-navy/90 transition-all shadow-xl shadow-tara-navy/20 disabled:opacity-50 active:scale-95 text-sm sm:text-base"
            >
              <TableIcon className="w-4 h-4 text-tara-teal" />
              {loading ? 'Importing...' : 'Import from Sheets'}
            </button>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-bold flex items-center gap-3 shadow-sm"
          >
            <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
            {error}
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
                      {columns.map((_, j) => (
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
                    <td colSpan={columns.length} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-tara-light rounded-full flex items-center justify-center">
                          <TableIcon className="w-8 h-8 text-tara-teal/40" />
                        </div>
                        <p className="text-tara-navy/40 font-serif text-lg italic">No influencer data found. Start by importing from Google Sheets.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
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
