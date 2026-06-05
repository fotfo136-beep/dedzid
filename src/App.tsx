import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  Calculator,
  FileText,
  Receipt,
  Settings,
  Menu,
  X,
  ChevronRight,
  Download,
  Trash2,
  LogOut,
  Cloud,
} from "lucide-react";
import { useAuth } from "./AuthContext";
import {
  subscribeToReceipts,
  subscribeToQuotes,
  subscribeToSettings,
  updateReceipt,
  deleteReceipt,
  addReceipt,
  saveSettings,
} from "./firebaseData";
import { jsPDF } from "jspdf";

// Helper functions
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-GH", { style: "currency", currency: "GHS" }).format(amount);

const formatDate = (date: Date) =>
  date.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

const generateId = () => Math.random().toString(36).substring(2, 9);
const generateReceiptNumber = () => `RC-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000) + 1000}`;

const numberToWords = (num: number): string => {
  const units = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  if (num === 0) return "Zero Ghana Cedis";
  const convertHundreds = (n: number): string => {
    if (n < 20) return units[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + units[n % 10] : "");
    return units[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convertHundreds(n % 100) : "");
  };
  const ghanaCedis = convertHundreds(Math.floor(num));
  const pesewas = convertHundreds(Math.round((num - Math.floor(num)) * 100));
  return `${ghanaCedis} Ghana Cedis${pesewas ? ` and ${pesewas} Pesewas` : " Only"}`;
};

const getWhatsAppLink = (phone: string, message: string) => {
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
};

type Tab = "calculator" | "quotes" | "receipts" | "settings";

const defaultSettings = {
  name: "My Company",
  tagline: "Quality Services",
  phone: "+233 XX XXX XXXX",
  email: "",
  address: "Ghana",
};

export default function App() {
  const { user, loading, logout, login, signup, loginWithGoogle, error, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("calculator");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Login states
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dedzid</h1>
              <p className="text-xs text-gray-500">Estimates & Receipts</p>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-center text-gray-900 mb-6">{isLogin ? "Welcome Back" : "Create Account"}</h2>
          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </motion.div>
          )}
          <form onSubmit={(e) => { e.preventDefault(); isLogin ? login(email, password) : signup(email, password); }} className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="w-full px-4 py-3 border rounded-lg" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="Password" className="w-full px-4 py-3 border rounded-lg" />
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700">
              {isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
          <button onClick={loginWithGoogle} className="w-full mt-4 flex items-center justify-center gap-2 bg-white border py-3 rounded-lg hover:bg-gray-50">
            <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continue with Google
          </button>
          <p className="text-center text-sm text-gray-600 mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setIsLogin(!isLogin); clearError(); }} className="text-blue-600 font-semibold">
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </motion.div>
      </div>
    );
  }

  const tabs = [
    { id: "calculator" as Tab, label: "Calculator", icon: Calculator },
    { id: "quotes" as Tab, label: "Quotes", icon: FileText },
    { id: "receipts" as Tab, label: "Receipts", icon: Receipt },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Dedzid</h1>
                <p className="text-xs text-gray-500">Estimates & Receipts</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <Cloud className="w-4 h-4 text-green-600" />
              </div>
              <button onClick={logout} className="hidden lg:flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium">
                <LogOut className="w-5 h-5" />
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="lg:hidden p-2">
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
          <nav className="hidden lg:flex gap-2 mt-4">
            {tabs.map((tab) => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${activeTab === tab.id ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
                <tab.icon className="w-5 h-5" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.nav initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="lg:hidden border-t bg-white px-4 py-2">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg ${activeTab === tab.id ? "bg-blue-50 text-blue-600" : "text-gray-600"}`}>
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </button>
              ))}
              <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600">
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "calculator" && <CalculatorView />}
        {activeTab === "quotes" && <QuotesView userId={user.uid} />}
        {activeTab === "receipts" && <ReceiptsView userId={user.uid} />}
        {activeTab === "settings" && <SettingsView userId={user.uid} />}
      </main>
    </div>
  );
}

function CalculatorView() {
  const [selectedService, setSelectedService] = useState("");
  const [dimensions, setDimensions] = useState({ length: 0, width: 0, height: 0 });
  const [customRatio, setCustomRatio] = useState(1.0);
  const [rate, setRate] = useState(0);

  const services = [
    { id: "pop", label: "POP Ceiling", icon: "🏗️", ratio: 1.0 },
    { id: "tiling", label: "Floor Tiling", icon: "🧱", ratio: 1.0 },
    { id: "painting", label: "Painting", icon: "🎨", ratio: 1.5 },
    { id: "plastering", label: "Plastering", icon: "🧹", ratio: 1.2 },
    { id: "partitions", label: "Partitions", icon: "📐", ratio: 1.0 },
  ];

  const area = selectedService === "partitions" ? dimensions.length * dimensions.height : dimensions.length * dimensions.width;
  const adjustedArea = area * customRatio;
  const total = adjustedArea * rate;

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Service Type</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {services.map((service) => (
            <button key={service.id} onClick={() => { setSelectedService(service.id); setCustomRatio(service.ratio); }} className={`p-4 rounded-xl border-2 ${selectedService === service.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
              <span className="text-2xl">{service.icon}</span>
              <p className="mt-2 font-medium text-sm">{service.label}</p>
            </button>
          ))}
        </div>
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Length (m)</label>
            <input type="number" value={dimensions.length || ""} onChange={(e) => setDimensions({ ...dimensions, length: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Width (m)</label>
            <input type="number" value={dimensions.width || ""} onChange={(e) => setDimensions({ ...dimensions, width: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
          </div>
          {selectedService === "partitions" && (
            <div>
              <label className="block text-sm font-medium mb-1">Height (m)</label>
              <input type="number" value={dimensions.height || ""} onChange={(e) => setDimensions({ ...dimensions, height: parseFloat(e.target.value) || 0 })} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-1">Rate (GHS/m²)</label>
            <input type="number" value={rate || ""} onChange={(e) => setRate(parseFloat(e.target.value) || 0)} className="w-full px-4 py-2 border rounded-lg" placeholder="0.00" />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Custom Ratio Factor</label>
          <input type="number" step="0.1" min="0.1" value={customRatio} onChange={(e) => setCustomRatio(parseFloat(e.target.value) || 1)} className="w-full px-4 py-2 border rounded-lg" />
        </div>
      </div>
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl shadow-lg p-6 text-white">
        <h2 className="text-lg font-semibold mb-6">Estimation Summary</h2>
        <div className="space-y-4">
          <div className="flex justify-between"><span className="text-blue-200">Base Area</span><span className="font-medium">{area.toFixed(2)} m²</span></div>
          <div className="flex justify-between"><span className="text-blue-200">Ratio Factor</span><span className="font-medium">× {customRatio.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-blue-200">Adjusted Area</span><span className="font-medium">{adjustedArea.toFixed(2)} m²</span></div>
          <div className="flex justify-between"><span className="text-blue-200">Rate</span><span className="font-medium">GHS {rate.toFixed(2)}/m²</span></div>
          <div className="border-t border-blue-400 pt-4">
            <div className="flex justify-between text-xl font-bold">
              <span>Total Estimate</span>
              <span>GHS {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <button className="w-full mt-6 bg-white text-blue-600 font-semibold py-3 rounded-lg hover:bg-blue-50">Generate Quote</button>
      </div>
    </div>
  );
}

function QuotesView({ userId }: { userId: string }) {
  const [quotes, setQuotes] = useState<any[]>([]);
  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToQuotes(userId, setQuotes);
    return () => unsubscribe();
  }, [userId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Quotes & Quotations</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 flex items-center gap-2">
          <FileText className="w-5 h-5" /> New Quote
        </button>
      </div>
      {quotes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No quotes yet</h3>
          <p className="text-gray-500">Create your first quote to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes.map((quote) => (
            <div key={quote.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500">Quote #{quote.quoteNumber || quote.id}</p>
                  <h3 className="text-lg font-semibold">{quote.client?.name || "Unknown"}</h3>
                  <p className="text-gray-600">{quote.client?.phone || ""}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatCurrency(quote.total || 0)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ReceiptsView({ userId }: { userId: string }) {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ clientName: "", clientPhone: "", clientBusiness: "", amount: "", paymentMethod: "cash", description: "" });

  useEffect(() => {
    if (!userId) return;
    const unsubReceipts = subscribeToReceipts(userId, setReceipts);
    const unsubSettings = subscribeToSettings(userId, (s) => { if (s) setSettings({ ...defaultSettings, ...s }); });
    return () => { unsubReceipts(); unsubSettings(); };
  }, [userId]);

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "mobile_money", label: "Mobile Money" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const receipt = {
      receiptNumber: generateReceiptNumber(),
      client: { name: formData.clientName, phone: formData.clientPhone, businessName: formData.clientBusiness },
      date: new Date().toISOString(),
      amount: parseFloat(formData.amount),
      amountWords: numberToWords(parseFloat(formData.amount)),
      paymentMethod: formData.paymentMethod,
      receivedFrom: formData.clientName,
      description: formData.description,
      status: "issued",
    };
    await addReceipt(userId, receipt);
    setFormData({ clientName: "", clientPhone: "", clientBusiness: "", amount: "", paymentMethod: "cash", description: "" });
    setShowForm(false);
  };

  const generatePDF = (receipt: any) => {
    const doc = new jsPDF();
    doc.setFontSize(24); doc.setFont("helvetica", "bold");
    doc.text(settings.name || "My Company", 105, 30, { align: "center" });
    doc.setFontSize(18); doc.text("RECEIPT", 105, 70, { align: "center" });
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    doc.text("Receipt No: " + receipt.receiptNumber, 20, 85);
    doc.text("Date: " + formatDate(new Date(receipt.date)), 140, 85);
    doc.rect(20, 100, 170, 25);
    doc.setFontSize(10); doc.text("Received From:", 25, 108);
    doc.setFont("helvetica", "bold"); doc.text(receipt.client.name, 25, 115);
    doc.setFont("helvetica", "normal"); doc.text(receipt.client.phone, 120, 115);
    doc.setFontSize(12); doc.setFont("helvetica", "bold");
    doc.text("AMOUNT: " + formatCurrency(receipt.amount), 20, 140);
    doc.setFontSize(10); doc.text(receipt.amountWords, 20, 148);
    doc.text("Payment Method: " + paymentMethods.find(p => p.value === receipt.paymentMethod)?.label, 20, 160);
    doc.text("Description: " + receipt.description, 20, 175);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text("This receipt serves as official proof of payment.", 105, 250, { align: "center" });
    doc.text("Thank you for your business!", 105, 256, { align: "center" });
    doc.save("Receipt_" + receipt.receiptNumber + ".pdf");
  };

  const shareOnWhatsApp = (receipt: any) => {
    const message = `🧾 RECEIPT\n\nReceipt No: ${receipt.receiptNumber}\nDate: ${formatDate(new Date(receipt.date))}\n\nReceived From: ${receipt.client.name}\nAmount: ${formatCurrency(receipt.amount)}\n(${receipt.amountWords})\n\nPayment: ${paymentMethods.find(p => p.value === receipt.paymentMethod)?.label}\n\n${settings.name}\n${settings.phone}`;
    window.open(getWhatsAppLink(receipt.client.phone, message), "_blank");
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this receipt?")) await deleteReceipt(userId, id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Receipts</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          {showForm ? "Cancel" : "New Receipt"}
        </button>
      </div>
      {showForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Create New Receipt</h3>
          <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-4">
            <input type="text" value={formData.clientName} onChange={(e) => setFormData({ ...formData, clientName: e.target.value })} required placeholder="Client Name *" className="px-4 py-2 border rounded-lg" />
            <input type="tel" value={formData.clientPhone} onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })} required placeholder="Phone *" className="px-4 py-2 border rounded-lg" />
            <input type="text" value={formData.clientBusiness} onChange={(e) => setFormData({ ...formData, clientBusiness: e.target.value })} placeholder="Business Name" className="px-4 py-2 border rounded-lg" />
            <input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} required placeholder="Amount (GHS) *" className="px-4 py-2 border rounded-lg" />
            <select value={formData.paymentMethod} onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })} className="px-4 py-2 border rounded-lg">
              {paymentMethods.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Description *" className="px-4 py-2 border rounded-lg" />
            <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">Create Receipt</button>
          </form>
        </motion.div>
      )}
      {receipts.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium">No receipts yet</h3>
          <p className="text-gray-500">Create your first receipt</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {receipts.map((receipt) => (
            <motion.div key={receipt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div className="flex-1">
                  <span className="text-sm font-mono text-gray-500">#{receipt.receiptNumber}</span>
                  <h3 className="text-lg font-semibold">{receipt.client.name}</h3>
                  <p className="text-gray-600">{receipt.client.phone}</p>
                  <p className="text-sm text-gray-500 mt-1">{receipt.description}</p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(receipt.amount)}</p>
                  <p className="text-xs text-gray-500">{formatDate(new Date(receipt.date))}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                <button onClick={() => generatePDF(receipt)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                  <FileText className="w-4 h-4" /> PDF
                </button>
                <button onClick={() => shareOnWhatsApp(receipt)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200">
                  WhatsApp
                </button>
                <button onClick={() => handleDelete(receipt.id)} className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function SettingsView({ userId }: { userId: string }) {
  const [settings, setSettings] = useState<any>(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = subscribeToSettings(userId, (s) => { if (s) setSettings({ ...defaultSettings, ...s }); });
    return () => unsubscribe();
  }, [userId]);

  const handleSave = async () => {
    await saveSettings(userId, settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h2 className="text-2xl font-bold">Settings</h2>
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Company Information</h3>
        <div className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Company Name</label><input type="text" value={settings.name || ""} onChange={(e) => setSettings({ ...settings, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Tagline</label><input type="text" value={settings.tagline || ""} onChange={(e) => setSettings({ ...settings, tagline: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Phone</label><input type="tel" value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Address</label><input type="text" value={settings.address || ""} onChange={(e) => setSettings({ ...settings, address: e.target.value })} className="w-full px-4 py-2 border rounded-lg" /></div>
          <button onClick={handleSave} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">{saved ? "✓ Saved!" : "Save Changes"}</button>
        </div>
      </div>
    </div>
  );
}
