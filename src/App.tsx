import { useState, useEffect, CSSProperties } from 'react';
import { Home, Calculator, Settings, Code, Sparkles, HardHat, Calendar, Sun, Moon, Palette, Receipt } from 'lucide-react';
import { Estimate, BaselinesType, BusinessProfile, TradeKey, EstimateStatus, Client } from './types';
import { INITIAL_BASELINES, INITIAL_BIZ_PROFILE } from './config';
import HomeView from './components/HomeView';
import EstimatorView from './components/EstimatorView';
import SettingsView from './components/SettingsView';
import FeaturesView from './components/FeaturesView';
import ReceiptsView from './components/ReceiptsView';

const THEME_PRESETS = [
  { id: 'blue', name: '🔵 Steel Blue' },
  { id: 'emerald', name: '🟢 Emerald Forest' },
  { id: 'amber', name: '🟡 Amber Gold' },
  { id: 'terracotta', name: '🟠 Terracotta Dust' },
  { id: 'charcoal', name: '⚫ Charcoal Tech' }
];

const THEME_COLOR_MAP: Record<string, {
  primary: string;
  primaryHover: string;
  primaryLight: string;
  primaryBorder: string;
  accentText: string;
  accentRing: string;
}> = {
  blue: {
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryLight: '#eff6ff',
    primaryBorder: '#bfdbfe',
    accentText: '#1e40af',
    accentRing: 'rgba(37, 99, 235, 0.15)'
  },
  emerald: {
    primary: '#059669',
    primaryHover: '#047857',
    primaryLight: '#ecfdf5',
    primaryBorder: '#a7f3d0',
    accentText: '#065f46',
    accentRing: 'rgba(5, 150, 105, 0.15)'
  },
  amber: {
    primary: '#d97706',
    primaryHover: '#b45309',
    primaryLight: '#fffbeb',
    primaryBorder: '#fde68a',
    accentText: '#92400e',
    accentRing: 'rgba(217, 119, 6, 0.15)'
  },
  terracotta: {
    primary: '#ea580c',
    primaryHover: '#c2410c',
    primaryLight: '#fff7ed',
    primaryBorder: '#fed7aa',
    accentText: '#9a3412',
    accentRing: 'rgba(234, 88, 12, 0.15)'
  },
  charcoal: {
    primary: '#4b5563',
    primaryHover: '#374151',
    primaryLight: '#f3f4f6',
    primaryBorder: '#e5e7eb',
    accentText: '#1f2937',
    accentRing: 'rgba(75, 85, 99, 0.15)'
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'estimate' | 'settings' | 'features' | 'receipts'>('home');
  const [recentEstimates, setRecentEstimates] = useState<Estimate[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(INITIAL_BIZ_PROFILE);
  const [baselines, setBaselines] = useState<BaselinesType>(INITIAL_BASELINES);
  const [activeEstimate, setActiveEstimate] = useState<Estimate | null>(null);
  const [clients, setClients] = useState<Client[]>([]);

  const [tradeJobs, setTradeJobs] = useState<Record<string, Record<string, string>>>(() => {
    try {
      const saved = localStorage.getItem('estim8_trade_jobs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      pop: { full: "Full POP Ceiling", cornice: "Cornice & Plastering", skim: "Skimming" },
      tiling: { floor: "Floor Tiling", wall: "Wall Tiling" },
      painting: { interior: "Interior Painting", exterior: "Exterior Painting", decorative: "Decorative/Textured" }
    };
  });

  // Sync tradeJobs to local storage when changed
  useEffect(() => {
    localStorage.setItem('estim8_trade_jobs', JSON.stringify(tradeJobs));
  }, [tradeJobs]);

  const [tradeLabels, setTradeLabels] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('estim8_trade_labels');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return {
      pop: "POP Ceiling",
      tiling: "Tiling Finish",
      painting: "Painting"
    };
  });

  // Sync tradeLabels to local storage when changed
  useEffect(() => {
    localStorage.setItem('estim8_trade_labels', JSON.stringify(tradeLabels));
  }, [tradeLabels]);

  // Synchronous theme & dark states
  const [theme, setTheme] = useState<string>(() => localStorage.getItem('estim8_theme') || 'blue');
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const d = localStorage.getItem('estim8_dark');
      return d ? JSON.parse(d) : false;
    } catch {
      return false;
    }
  });

  // Load state from local storage on mount
  useEffect(() => {
    try {
      const storedEstimates = localStorage.getItem('estim8_recent');
      if (storedEstimates) {
        const parsed = JSON.parse(storedEstimates) as any[];
        const mapped = parsed.map(e => ({
          ...e,
          status: e.status || 'Draft'
        }));
        setRecentEstimates(mapped);
      } else {
        // Initial clean sample estimates to make the interface professional
        const sampleEstimates: Estimate[] = [
          {
            id: "E8-20260603-0001",
            clientName: "Ama Mensah",
            projectName: "Living Room Renovation",
            jobLocation: "Airport Residential, Accra",
            trade: "tiling",
            jobType: "floor",
            unitType: "sqm",
            laborRate: 60,
            wastePercent: 5,
            transportFee: 150,
            linearMeters: 100,
            rooms: [
              { id: "r1", name: "Living Room", l: 600, w: 500 },
              { id: "r2", name: "Hallway", l: 400, w: 200 }
            ],
            createdAt: new Date("2026-06-03T10:30:00Z").toISOString(),
            materialTotal: 8400,
            laborTotal: 2280,
            grandTotal: 10830,
            status: "Accepted"
          },
          {
            id: "E8-20260603-0002",
            clientName: "Kwame Boateng",
            projectName: "Full Gypsum Ceilings",
            jobLocation: "Osu, Accra",
            trade: "pop",
            jobType: "full",
            unitType: "sqm",
            laborRate: 45,
            wastePercent: 5,
            transportFee: 300,
            linearMeters: 100,
            rooms: [
              { id: "r1", name: "Master Suite", l: 500, w: 450 },
              { id: "r2", name: "Dining Hall", l: 400, w: 400 }
            ],
            createdAt: new Date("2026-06-03T14:15:00Z").toISOString(),
            materialTotal: 9800,
            laborTotal: 1732.5,
            grandTotal: 11832.5,
            status: "Draft"
          }
        ];
        setRecentEstimates(sampleEstimates);
        localStorage.setItem('estim8_recent', JSON.stringify(sampleEstimates));
      }

      // Load client database
      const storedClients = localStorage.getItem('estim8_clients');
      if (storedClients) {
        setClients(JSON.parse(storedClients));
      } else {
        const sampleClients: Client[] = [
          {
            id: "C-1",
            name: "Ama Mensah",
            phone: "+233 24 456 7890",
            defaultLocation: "Airport Residential, Accra",
            projectHistory: [
              {
                estimateId: "E8-20260603-0001",
                projectName: "Living Room Renovation",
                date: new Date("2026-06-03T10:30:00Z").toISOString(),
                total: 10830
              }
            ]
          },
          {
            id: "C-2",
            name: "Kwame Boateng",
            phone: "+233 20 888 1234",
            defaultLocation: "Osu, Accra",
            projectHistory: [
              {
                estimateId: "E8-20260603-0002",
                projectName: "Full Gypsum Ceilings",
                date: new Date("2026-06-03T14:15:00Z").toISOString(),
                total: 11832.5
              }
            ]
          }
        ];
        setClients(sampleClients);
        localStorage.setItem('estim8_clients', JSON.stringify(sampleClients));
      }

      const storedProfile = localStorage.getItem('estim8_profile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setBusinessProfile({
          ...INITIAL_BIZ_PROFILE,
          ...parsed
        });
      }

      const storedBaselines = localStorage.getItem('estim8_baselines');
      if (storedBaselines) {
        setBaselines(JSON.parse(storedBaselines));
      }
    } catch (e) {
      console.error("Could not load data from local storage", e);
    }
  }, []);

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    localStorage.setItem('estim8_theme', newTheme);
  };

  const handleDarkToggle = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('estim8_dark', JSON.stringify(nextDark));
  };

  // Save changes helper functions
  const saveEstimatesToStorage = (updated: Estimate[]) => {
    setRecentEstimates(updated);
    localStorage.setItem('estim8_recent', JSON.stringify(updated));
  };

  const handleUpdateClients = (updatedList: Client[]) => {
    setClients(updatedList);
    localStorage.setItem('estim8_clients', JSON.stringify(updatedList));
  };

  const handleSaveEstimate = (estimate: Estimate, clientPhone?: string) => {
    const existsIdx = recentEstimates.findIndex(e => e.id === estimate.id);
    let updated: Estimate[];
    
    if (existsIdx > -1) {
      updated = [...recentEstimates];
      updated[existsIdx] = estimate;
    } else {
      updated = [estimate, ...recentEstimates];
    }
    
    saveEstimatesToStorage(updated);
    setActiveEstimate(estimate); // set edited file

    // Sync client database with latest estimate save details
    if (estimate.clientName && estimate.clientName.trim()) {
      const trimmedName = estimate.clientName.trim();
      const clientIndex = clients.findIndex(c => c.name.toLowerCase() === trimmedName.toLowerCase());
      
      const newHistoryItem = {
        estimateId: estimate.id,
        projectName: estimate.projectName || 'General Service Rendering',
        date: estimate.createdAt || new Date().toISOString(),
        total: estimate.grandTotal
      };

      let updatedClients = [...clients];

      if (clientIndex > -1) {
        const existing = updatedClients[clientIndex];
        const updatedPhone = clientPhone?.trim() || existing.phone;
        
        let existingHistory = [...existing.projectHistory];
        const histIdx = existingHistory.findIndex(h => h.estimateId === estimate.id);
        
        if (histIdx > -1) {
          existingHistory[histIdx] = newHistoryItem;
        } else {
          existingHistory = [newHistoryItem, ...existingHistory];
        }

        updatedClients[clientIndex] = {
          ...existing,
          phone: updatedPhone,
          defaultLocation: estimate.jobLocation || existing.defaultLocation,
          projectHistory: existingHistory
        };
      } else {
        const newClient: Client = {
          id: `C-${Date.now().toString().slice(-6)}`,
          name: trimmedName,
          phone: clientPhone?.trim() || '',
          defaultLocation: estimate.jobLocation || '',
          projectHistory: [newHistoryItem]
        };
        updatedClients = [newClient, ...updatedClients];
      }

      handleUpdateClients(updatedClients);
    }
  };

  const handleDeleteEstimate = (id: string) => {
    const filtered = recentEstimates.filter(e => e.id !== id);
    saveEstimatesToStorage(filtered);
    if (activeEstimate?.id === id) {
      setActiveEstimate(null);
    }
  };

  const handleUpdateEstimateStatus = (id: string, status: EstimateStatus) => {
    const updated = recentEstimates.map(e => e.id === id ? { ...e, status } : e);
    saveEstimatesToStorage(updated);
    if (activeEstimate?.id === id) {
      setActiveEstimate({ ...activeEstimate, status });
    }
  };

  const handleSelectEstimate = (estimate: Estimate) => {
    setActiveEstimate(estimate);
    setActiveTab('estimate');
  };

  const handleStartEstimate = (tradeKey?: TradeKey) => {
    if (tradeKey) {
      // Create skeleton estimate with specified trade key
      const skeleton: Estimate = {
        id: `E8-${Date.now().toString().slice(-6)}`,
        clientName: '',
        projectName: '',
        jobLocation: '',
        trade: tradeKey,
        jobType: tradeKey === 'pop' ? 'full' : tradeKey === 'tiling' ? 'floor' : 'interior',
        unitType: (tradeKey === 'pop') ? 'sqm' : 'sqm',
        laborRate: tradeKey === 'pop' ? 45 : tradeKey === 'tiling' ? 60 : 20,
        wastePercent: 5,
        transportFee: 0,
        linearMeters: 100,
        rooms: [{ id: 'r1', name: 'Living Room', l: 400, w: 400 }],
        createdAt: new Date().toISOString(),
        grandTotal: 0,
        materialTotal: 0,
        laborTotal: 0,
        status: 'Draft'
      };
      setActiveEstimate(skeleton);
    } else {
      setActiveEstimate(null); // start perfectly clean
    }
    setActiveTab('estimate');
  };

  const handleProfileChange = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    localStorage.setItem('estim8_profile', JSON.stringify(profile));
  };

  const handleBaselinesChange = (updatedBaselines: BaselinesType) => {
    setBaselines(updatedBaselines);
    localStorage.setItem('estim8_baselines', JSON.stringify(updatedBaselines));
  };

  // Compile active theme variables
  const preset = THEME_COLOR_MAP[theme] || THEME_COLOR_MAP.blue;
  const styleVars = {
    '--primary': preset.primary,
    '--primary-hover': preset.primaryHover,
    '--primary-light': isDark ? '#1a2235' : preset.primaryLight,
    '--primary-border': isDark ? '#2a354b' : preset.primaryBorder,
    '--accent-text': isDark ? '#f1f5f9' : preset.accentText,
    '--accent-ring': preset.accentRing,

    '--bg-canvas': isDark ? '#0b0f19' : '#f8fafc',
    '--bg-card': isDark ? '#151f32' : '#ffffff',
    '--bg-panel': isDark ? '#1e293e' : '#f1f5f9',
    '--bg-input': isDark ? '#0b0f19' : '#ffffff',
    '--border-card': isDark ? '#22314d' : '#e2e8f0',
    '--text-main': isDark ? '#f1f5f9' : '#0f172a',
    '--text-muted': isDark ? '#94a3b8' : '#64748b',
  } as CSSProperties;

  return (
    <div 
      className={`min-h-screen bg-bg-canvas text-text-main flex flex-col antialiased ${isDark ? 'dark' : ''}`} 
      style={styleVars}
      id="applet-root"
    >
      {/* Visual Navigation Header */}
      <header className="sticky top-0 z-40 bg-bg-card border-b border-border-card shadow-xs" id="app-nav-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <span className="h-10 w-10 rounded-xl bg-primary text-white font-extrabold flex items-center justify-center shadow-md shadow-primary/10">
              E8
            </span>
            <div>
              <span className="font-extrabold text-text-main text-base flex items-center gap-1 leading-none">
                Estim8
                <span className="text-[9px] font-bold bg-bg-panel text-text-muted px-1.5 py-0.5 rounded-sm uppercase tracking-wider">Trades</span>
              </span>
              <p className="text-[10px] text-text-muted font-semibold mt-0.5">{businessProfile.name}</p>
            </div>
          </div>

          {/* Desktop Links */}
          <nav className="hidden md:flex items-center gap-1" id="desktop-tabs-nav">
            {[
              { id: 'home' as const, label: 'Dashboard', icon: Home },
              { id: 'estimate' as const, label: 'Calculator', icon: Calculator },
              { id: 'receipts' as const, label: 'Payments & Receipts', icon: Receipt },
              { id: 'settings' as const, label: 'Formula Baselines', icon: Settings },
              { id: 'features' as const, label: 'Features Matrix', icon: Code },
            ].map((tab) => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-primary text-white shadow-xs font-extrabold scale-102' 
                      : 'text-text-muted hover:text-text-main hover:bg-bg-panel/70'
                  }`}
                  id={`nav-link-${tab.id}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Theme customizers in Header */}
          <div className="flex items-center gap-2" id="theme-selectors-header">
            {/* Palette selection dropmenu */}
            <div className="relative inline-flex items-center gap-1.5 bg-bg-panel text-text-main border border-border-card rounded-xl px-2.5 py-1.5">
              <Palette className="h-3.5 w-3.5 text-primary shrink-0" />
              <select
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
                className="bg-transparent text-xs font-black focus:outline-hidden cursor-pointer text-text-main pr-1"
                title="Select Theme Color Palette"
              >
                {THEME_PRESETS.map(p => (
                  <option key={p.id} value={p.id} className="text-neutral-800 bg-white">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Dark switch */}
            <button
              onClick={handleDarkToggle}
              className="p-2 cursor-pointer bg-bg-panel hover:bg-border-card text-text-main border border-border-card rounded-xl transition-all flex items-center justify-center shrink-0"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-amber-400" />
              ) : (
                <Moon className="h-4 w-4 text-indigo-500" />
              )}
            </button>

            {/* Existing Calendar box */}
            <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-text-muted bg-bg-panel border border-border-card rounded-xl px-3 py-2">
              <Calendar className="h-3.5 w-3.5 text-text-muted shrink-0" />
              <span>June 3, 2026</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="app-main-content">
        {activeTab === 'home' && (
          <HomeView
            recentEstimates={recentEstimates}
            onSelectEstimate={handleSelectEstimate}
            onDeleteEstimate={handleDeleteEstimate}
            onStartEstimate={handleStartEstimate}
            onNavigateToTab={(tab) => setActiveTab(tab)}
            tradeJobs={tradeJobs}
            onUpdateEstimateStatus={handleUpdateEstimateStatus}
            baselines={baselines}
            businessProfile={businessProfile}
            tradeLabels={tradeLabels}
            onUpdateTradeLabels={setTradeLabels}
            clients={clients}
            onUpdateClients={handleUpdateClients}
          />
        )}

        {activeTab === 'estimate' && (
          <EstimatorView
            baselines={baselines}
            businessProfile={businessProfile}
            onSaveEstimate={handleSaveEstimate}
            activeEstimate={activeEstimate}
            onClearActiveEstimate={() => setActiveEstimate(null)}
            tradeJobs={tradeJobs}
            tradeLabels={tradeLabels}
            clients={clients}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            businessProfile={businessProfile}
            onChangeProfile={handleProfileChange}
            baselines={baselines}
            onUpdateBaselines={handleBaselinesChange}
            tradeJobs={tradeJobs}
            onUpdateTradeJobs={setTradeJobs}
            tradeLabels={tradeLabels}
            onUpdateTradeLabels={setTradeLabels}
          />
        )}

        {activeTab === 'features' && (
          <FeaturesView />
        )}

        {activeTab === 'receipts' && (
          <ReceiptsView
            recentEstimates={recentEstimates}
            clients={clients}
            businessProfile={businessProfile}
            onNavigateToTab={(tab) => setActiveTab(tab)}
          />
        )}
      </main>

      {/* Mobile Sticky Tab Navigation */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-bg-card border-t border-border-card z-40 px-4 py-2 flex items-center justify-around shadow-lg" id="app-nav-footer-mobile">
        {[
          { id: 'home' as const, label: 'Dashboard', icon: Home },
          { id: 'estimate' as const, label: 'Calculator', icon: Calculator },
          { id: 'receipts' as const, label: 'Receipts', icon: Receipt },
          { id: 'settings' as const, label: 'Baselines', icon: Settings },
          { id: 'features' as const, label: 'Capability', icon: Code },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center gap-1 p-2 text-[10px] font-bold transition-all ${
                isSelected ? 'text-primary font-extrabold scale-102' : 'text-text-muted hover:text-text-main'
              }`}
              id={`mobile-nav-link-${tab.id}`}
            >
              <Icon className="h-4.5 w-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Footer Branding */}
      <footer className="bg-bg-card border-t border-border-card py-6 mb-12 md:mb-0" id="app-footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-text-muted font-medium">
          <p>© 2026 Estim8. All rights reserved.</p>
          <div className="flex gap-4">
            <span>POP Ceiling</span>
            <span>Tiling Crafts</span>
            <span>Professional Paint finishing</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
