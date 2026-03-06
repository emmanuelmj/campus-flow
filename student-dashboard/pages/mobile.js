import React, { useState, useEffect } from 'react';
import {
    Wallet,
    Send,
    Store,
    History,
    ChevronLeft,
    LogOut,
    ArrowUpRight,
    ArrowDownLeft,
    AlertCircle,
    CheckCircle2,
    Receipt,
    CalendarDays,
    User,
    ShoppingBag,
    Sparkles,
    X,
    Copy,
    Plus,
    Check,
    Zap,
    ArrowRight,
    CreditCard,
    Building
} from 'lucide-react';

// --- MOCK DATA FALLBACKS ---
const INITIAL_BALANCE = 1250.50;
const INITIAL_TRANSACTIONS = [
    { id: '1', type: 'VENDOR_PAYMENT', entity: 'Campus Canteen', amount: -150.00, date: 'Mar 05', status: 'COMPLETED' },
    { id: '2', type: 'P2P', entity: 'John Doe', amount: 500.00, date: 'Mar 04', status: 'COMPLETED' },
    { id: '3', type: 'FINE', entity: 'Library Overdue', amount: -50.00, date: 'Mar 01', status: 'COMPLETED' },
];

const INITIAL_FINES = [
    { id: 'f1', entity: 'Library Overdue', amount: 50.00, date: 'Mar 10, 2026', status: 'UNPAID' },
    { id: 'f2', entity: 'Hostel Late Entry', amount: 100.00, date: 'Feb 25, 2026', status: 'PAID' }
];

const INITIAL_SUBS = [
    { id: 's1', entity: 'Campus Gym', amount: 300.00, cycle: 'Monthly', nextBill: 'Apr 01, 2026', status: 'ACTIVE' },
    { id: 's2', entity: 'Tech Club', amount: 500.00, cycle: 'Yearly', nextBill: 'Aug 15, 2026', status: 'ACTIVE' }
];

const AVAILABLE_SUBS = [
    { id: 'gym-monthly', name: 'Premium Meal Plan', amount: 800.00, cycle: 'Monthly', desc: 'Access to premium dining hall menu.' },
    { id: 'laundry-monthly', name: 'Laundry Service', amount: 200.00, cycle: 'Monthly', desc: '4 bags of wash & fold laundry.' },
    { id: 'shuttle-sem', name: 'Campus Shuttle+', amount: 150.00, cycle: 'Semester', desc: 'Unlimited air-conditioned shuttle rides.' }
];

const INITIAL_SAVED_PEERS = [
    { id: 'CS-2024-055', name: 'John Doe', color: 'bg-blue-100 text-blue-700' },
    { id: 'CS-2024-015', name: 'Alice Smith', color: 'bg-fuchsia-100 text-fuchsia-700' },
    { id: 'CS-2024-089', name: 'Bob Wilson', color: 'bg-emerald-100 text-emerald-700' }
];

const VENDOR_LIST = [
    { id: 'canteen-01', name: 'Campus Canteen', color: 'bg-orange-100 text-orange-700' },
    { id: 'cafe-02', name: 'Library Cafe', color: 'bg-cyan-100 text-cyan-700' },
    { id: 'store-01', name: 'Campus Store', color: 'bg-rose-100 text-rose-700' }
];

export default function MobileApp() {
    const [currentScreen, setCurrentScreen] = useState('Login');
    const [balance, setBalance] = useState(INITIAL_BALANCE);
    const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS);
    const [fines, setFines] = useState(INITIAL_FINES);
    const [subscriptions, setSubscriptions] = useState(INITIAL_SUBS);
    const [savedPeers, setSavedPeers] = useState(INITIAL_SAVED_PEERS);
    const [user, setUser] = useState(null);

    // AI State
    const [aiModalTitle, setAiModalTitle] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState('');

    const navigate = (screen) => setCurrentScreen(screen);

    // --- API INTEGRATION LOGIC ---
    const API_BASE_URL = 'http://localhost:8000';

    const apiRequest = async (endpoint, method = 'GET', body = null) => {
        const headers = { 'Content-Type': 'application/json' };
        if (user?.token && user.token !== 'mock') {
            headers['Authorization'] = `Bearer ${user.token}`;
        }

        const res = await fetch(`${API_BASE_URL}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });

        if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.message || errData.detail || 'API request failed');
        }
        return await res.json();
    };

    // Fetch data on login
    useEffect(() => {
        if (user && user.token !== 'mock') {
            const fetchUserData = async () => {
                try {
                    const walletData = await apiRequest('/wallet');
                    setBalance(walletData.balance);

                    const txData = await apiRequest('/transactions');
                    const formattedTxs = txData.map(tx => ({
                        id: tx.transaction_id,
                        type: tx.type,
                        entity: tx.type === 'VENDOR_PAYMENT' ? 'Vendor Payment' : (tx.type === 'P2P' ? 'Student Transfer' : tx.type),
                        amount: tx.amount,
                        date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
                        status: tx.status
                    }));
                    setTransactions(formattedTxs);

                    const finesData = await apiRequest('/student/fines');
                    const formattedFines = finesData.map(f => ({
                        id: f.fine_id,
                        entity: f.reason,
                        amount: f.amount,
                        date: new Date(f.issued_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                        status: f.status
                    }));
                    setFines(formattedFines);

                } catch (error) {
                    console.warn("Could not fetch live data, using fallbacks.", error);
                }
            };
            fetchUserData();
        }
    }, [user]);

    const handlePayment = async (entityId, amount, type, extraData = {}) => {
        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) return { success: false, msg: 'Invalid amount' };
        if (numAmount > balance) return { success: false, msg: 'Insufficient funds' };

        try {
            if (type === 'P2P') {
                await apiRequest('/transfer', 'POST', { recipient_identifier: entityId, amount: numAmount, note: "App transfer" });
            } else if (type === 'VENDOR') {
                await apiRequest('/pay-vendor', 'POST', { vendor_id: entityId, amount: numAmount });
            } else if (type === 'FINE') {
                await apiRequest(`/student/pay-fine/${entityId}`, 'POST');
            } else if (type === 'SUBSCRIPTION') {
                await apiRequest('/subscribe', 'POST', { service_id: extraData.serviceId || entityId, auto_renew: true });
            }
        } catch (error) {
            console.warn(`Backend unavailable (${error.message}), simulating locally.`);
        }

        const newTransaction = {
            id: Date.now().toString(),
            type: type === 'VENDOR' ? 'VENDOR_PAYMENT' : type,
            entity: extraData.entityName || entityId,
            amount: -numAmount,
            date: 'Just now',
            status: 'COMPLETED'
        };

        setBalance(prev => prev - numAmount);
        setTransactions(prev => [newTransaction, ...prev]);
        return { success: true, msg: `Payment successful` };
    };

    const callGemini = async (prompt) => {
        const apiKey = "";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    systemInstruction: { parts: [{ text: "You are a concise financial assistant. Keep responses under 2 sentences. Professional tone." }] }
                })
            });
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || "Service unavailable.";
        } catch (e) { return "AI service offline."; }
    };

    const copyToClipboard = (text) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try { document.execCommand('copy'); } catch (err) { }
        document.body.removeChild(textArea);
    };

    const MobileWrapper = ({ children, title, showBack = false, showMenu = false }) => (
        <div className="flex items-center justify-center min-h-screen bg-slate-200 font-sans p-4 selection:bg-blue-100 selection:text-blue-900">
            <div className="w-full max-w-[390px] h-[820px] max-h-[95vh] bg-[#F7F7F9] flex flex-col shadow-2xl rounded-[3rem] overflow-hidden relative border-[8px] border-white">

                {(title || showBack) && (
                    <div className="px-6 pt-10 pb-4 flex items-center justify-between z-40 bg-[#F7F7F9] sticky top-0">
                        <div className="flex items-center space-x-3">
                            {showBack && (
                                <button onClick={() => navigate('Dashboard')} className="p-2 -ml-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-xl transition-all active:scale-95">
                                    <ChevronLeft size={20} strokeWidth={2.5} />
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
                        </div>
                        {showMenu && (
                            <button onClick={() => navigate('Login')} className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-slate-50 transition-colors">
                                <User size={18} className="text-slate-600" />
                            </button>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto hide-scrollbar relative pb-8" style={{ scrollbarWidth: 'none' }}>
                    {children}

                    {aiModalTitle && (
                        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
                            <div className="bg-white rounded-3xl p-6 w-full shadow-xl border border-slate-100 animate-in zoom-in-95 duration-300 relative">
                                <button onClick={() => setAiModalTitle('')} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors">
                                    <X size={18} strokeWidth={2.5} />
                                </button>

                                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800">
                                    <Sparkles size={18} className="text-blue-600" />
                                    {aiModalTitle}
                                </h3>

                                {isAiLoading ? (
                                    <div className="py-8 flex flex-col items-center justify-center gap-3">
                                        <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="text-xs font-semibold text-slate-400">Processing...</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in duration-300">
                                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                            {aiResult}
                                        </div>
                                        {aiModalTitle.includes('Appeal') && (
                                            <button onClick={() => copyToClipboard(aiResult)} className="mt-4 w-full bg-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 active:scale-[0.98] transition-all text-sm">
                                                <Copy size={16} /> <span>Copy to Clipboard</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const LoginScreen = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loading, setLoading] = useState(false);

        const handleAuth = async (e) => {
            e.preventDefault();
            setLoading(true);
            try {
                const data = await apiRequest('/auth/login', 'POST', { email, password });
                setUser({ email, token: data.access_token });
            } catch (e) {
                setUser({ email: email || 'student@uni.edu', token: 'mock' });
            }
            setLoading(false);
            navigate('Dashboard');
        };

        return (
            <MobileWrapper>
                <div className="h-full flex flex-col justify-center px-8">
                    <div className="space-y-8 max-w-sm w-full mx-auto">
                        <div>
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30 transform -rotate-3 transition-transform hover:rotate-0">
                                <Wallet size={32} strokeWidth={2} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">CampusFlow</h1>
                            <p className="text-slate-500 text-sm">Sign in to your university wallet.</p>
                        </div>

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 ml-1">University Email</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Password</label>
                                <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm" />
                            </div>

                            <button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all mt-6 text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20">
                                {loading ? "Authenticating..." : <><span>Continue</span> <ArrowRight size={18} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </MobileWrapper>
        );
    };

    const DashboardScreen = () => {
        const handleGetInsights = async () => {
            const txList = transactions.slice(0, 5).map(t => `${t.date}: ${t.entity} (₹${Math.abs(t.amount)})`).join('\n');
            const prompt = `Analyze these recent transactions:\n${txList}\n\nGive me a 1-2 sentence clinical analysis of my spending. Keep it professional.`;
            return await callGemini(prompt);
        };

        return (
            <MobileWrapper title="Dashboard" showMenu>
                <div className="px-6 space-y-4">

                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-blue-500/30 p-6 rounded-[24px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="space-y-1">
                                <p className="text-blue-100 font-medium text-xs">Total Balance</p>
                                <h2 className="text-4xl font-bold tracking-tight text-white">₹{balance.toFixed(2)}</h2>
                            </div>
                            <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                                <CreditCard size={18} className="text-white" />
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/20 flex justify-between items-center relative z-10">
                            <p className="text-xs font-medium text-blue-100">CampusFlow Wallet</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-md">
                                <Zap size={12} className="fill-white" /> Active
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => navigate('Transfer')} className="bg-white border border-slate-100 shadow-sm p-5 rounded-[24px] flex flex-col items-start gap-4 hover:shadow-md hover:border-blue-100 transition-all active:scale-[0.98] group">
                            <div className="w-12 h-12 bg-blue-50 rounded-[16px] flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                                <Send size={20} />
                            </div>
                            <span className="font-semibold text-sm text-slate-800">Send Money</span>
                        </button>

                        <button onClick={() => navigate('VendorPayment')} className="bg-white border border-slate-100 shadow-sm p-5 rounded-[24px] flex flex-col items-start gap-4 hover:shadow-md hover:border-emerald-100 transition-all active:scale-[0.98] group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-[16px] flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
                                <Store size={20} />
                            </div>
                            <span className="font-semibold text-sm text-slate-800">Pay Vendor</span>
                        </button>

                        <button onClick={() => navigate('Fines')} className="bg-white border border-slate-100 shadow-sm p-5 rounded-[24px] flex flex-col items-start gap-4 hover:shadow-md hover:border-rose-100 transition-all active:scale-[0.98] group">
                            <div className="w-12 h-12 bg-rose-50 rounded-[16px] flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform">
                                <Receipt size={20} />
                            </div>
                            <div className="flex justify-between w-full items-center">
                                <span className="font-semibold text-sm text-slate-800">Fines</span>
                                {fines.filter(f => f.status === 'UNPAID').length > 0 && (
                                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm"></span>
                                )}
                            </div>
                        </button>

                        <button onClick={() => navigate('Subscriptions')} className="bg-white border border-slate-100 shadow-sm p-5 rounded-[24px] flex flex-col items-start gap-4 hover:shadow-md hover:border-amber-100 transition-all active:scale-[0.98] group">
                            <div className="w-12 h-12 bg-amber-50 rounded-[16px] flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                <CalendarDays size={20} />
                            </div>
                            <span className="font-semibold text-sm text-slate-800">Subs</span>
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            setIsAiLoading(true); setAiModalTitle('Spending Analysis'); setAiResult('');
                            handleGetInsights().then(res => { setAiResult(res || "Try again."); setIsAiLoading(false); });
                        }}
                        className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white p-4 rounded-[20px] flex items-center justify-between shadow-md shadow-violet-500/20 active:scale-[0.98] transition-transform"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                                <Sparkles size={18} className="text-white" />
                            </div>
                            <p className="font-semibold text-sm tracking-wide">Ask AI for Insights</p>
                        </div>
                        <ArrowRight size={18} className="text-white/90" />
                    </button>

                    <div className="bg-white border border-slate-100 shadow-sm rounded-[24px] p-2">
                        <div className="flex justify-between items-center px-4 py-3">
                            <h3 className="font-semibold text-sm text-slate-800">Recent Activity</h3>
                            <button onClick={() => navigate('Transactions')} className="text-xs font-medium text-slate-400 hover:text-slate-800 transition-colors">View All</button>
                        </div>
                        <div className="space-y-1">
                            {transactions.slice(0, 3).map((tx) => (
                                <div key={tx.id} className="p-3 flex items-center justify-between rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                            {tx.amount > 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-slate-800">{tx.entity}</p>
                                            <p className="text-xs text-slate-400 mt-0.5">{tx.date}</p>
                                        </div>
                                    </div>
                                    <p className={`font-semibold text-sm ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                        {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </MobileWrapper>
        );
    };

    const SendScreen = ({ isVendor }) => {
        const [amount, setAmount] = useState('');
        const [target, setTarget] = useState('');
        const [selectedEntity, setSelectedEntity] = useState(null);
        const [status, setStatus] = useState(null);
        const [addingPeer, setAddingPeer] = useState(false);
        const [newPeerName, setNewPeerName] = useState('');
        const [newPeerId, setNewPeerId] = useState('');

        const list = isVendor ? VENDOR_LIST : savedPeers;

        const handleSend = async () => {
            const entityId = selectedEntity?.id || target;
            if (!entityId || !amount) return setStatus({ type: 'error', msg: 'Missing details' });
            setStatus({ type: 'success', msg: 'Processing...' });

            const res = await handlePayment(entityId, amount, isVendor ? 'VENDOR' : 'P2P', { entityName: selectedEntity?.name });
            setStatus({ type: res.success ? 'success' : 'error', msg: res.msg });
            if (res.success) setTimeout(() => navigate('Dashboard'), 1500);
        };

        return (
            <MobileWrapper title={isVendor ? "Pay Vendor" : "Send Money"} showBack>
                <div className="px-6 flex flex-col h-full space-y-4">

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm mt-2">
                        <label className="text-xs font-medium text-slate-400 mb-2 block">Amount to send</label>
                        <div className="flex items-center">
                            <span className="text-3xl text-slate-300 font-medium mr-2">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-transparent text-4xl font-bold text-slate-800 focus:outline-none placeholder-slate-200"
                                autoFocus
                            />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center text-xs">
                            <span className="text-slate-400">Available Balance</span>
                            <span className="font-semibold text-slate-700">₹{balance.toFixed(2)}</span>
                        </div>
                    </div>

                    {status && (
                        <div className={`p-4 rounded-[16px] flex items-center gap-3 border text-sm font-medium ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span>{status.msg}</span>
                        </div>
                    )}

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex-1">
                        <div className="flex justify-between items-center mb-4">
                            <label className="text-xs font-medium text-slate-400">{isVendor ? "Select Vendor" : "Select Recipient"}</label>
                            {!isVendor && (
                                <button onClick={() => setAddingPeer(!addingPeer)} className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                                    {addingPeer ? 'Cancel' : '+ Add New'}
                                </button>
                            )}
                        </div>

                        {addingPeer && !isVendor && (
                            <div className="p-4 bg-slate-50 rounded-[16px] border border-slate-100 space-y-3 mb-4">
                                <input type="text" placeholder="Full Name" value={newPeerName} onChange={e => setNewPeerName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all" />
                                <input type="text" placeholder="Student ID" value={newPeerId} onChange={e => setNewPeerId(e.target.value.toUpperCase())} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition-all" />
                                <button onClick={() => {
                                    if (!newPeerName || !newPeerId) return;
                                    setSavedPeers([{ id: newPeerId, name: newPeerName }, ...savedPeers]);
                                    setTarget(newPeerId); setAddingPeer(false); setNewPeerName(''); setNewPeerId('');
                                }} className="w-full bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors hover:bg-slate-700">Save Contact</button>
                            </div>
                        )}

                        <div className="space-y-2 mb-6">
                            {list.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => { setSelectedEntity(item); setTarget(item.id); }}
                                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all ${selectedEntity?.id === item.id ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl border border-white shadow-sm flex items-center justify-center font-bold text-sm ${item.color || 'bg-slate-100 text-slate-600'}`}>
                                            {isVendor ? <Building size={16} /> : item.name.charAt(0)}
                                        </div>
                                        <div className="text-left flex flex-col">
                                            <span className="text-sm font-semibold">{item.name}</span>
                                            <span className={`text-xs ${selectedEntity?.id === item.id ? 'text-blue-600/70' : 'text-slate-400'}`}>{item.id}</span>
                                        </div>
                                    </div>
                                    {selectedEntity?.id === item.id && <CheckCircle2 size={18} className="text-blue-600" />}
                                </button>
                            ))}
                        </div>

                        <label className="text-xs font-medium text-slate-400 mb-2 block">Manual Entry</label>
                        <input
                            type="text"
                            placeholder={isVendor ? "Enter Vendor Code" : "Enter Student ID / Email"}
                            value={target}
                            onChange={e => { setTarget(e.target.value); setSelectedEntity(null); }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder-slate-400"
                        />
                    </div>

                    <div className="pt-2">
                        <button onClick={handleSend} disabled={status?.msg === 'Processing...'} className={`w-full py-4 rounded-2xl font-medium text-white text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${status?.type === 'success' && status?.msg !== 'Processing...' ? 'bg-emerald-600' : 'bg-blue-600 hover:bg-blue-700 active:scale-[0.98]'}`}>
                            {status?.type === 'success' && status?.msg !== 'Processing...' ? <Check size={18} /> : <><span>Review & Confirm</span> <ArrowRight size={16} /></>}
                        </button>
                    </div>
                </div>
            </MobileWrapper>
        );
    };

    const HistoryScreen = () => (
        <MobileWrapper title="Transactions" showBack>
            <div className="px-6 space-y-3 pt-2">
                {transactions.map((tx) => (
                    <div key={tx.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                            </div>
                            <div>
                                <p className="font-semibold text-sm text-slate-800">{tx.entity}</p>
                                <p className="text-xs text-slate-400 mt-0.5">{tx.date} • {tx.type}</p>
                            </div>
                        </div>
                        <p className={`font-bold text-base ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>{tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}</p>
                    </div>
                ))}
            </div>
        </MobileWrapper>
    );

    const FinesScreen = () => (
        <MobileWrapper title="Fines & Dues" showBack>
            <div className="px-6 space-y-4 pt-2">
                {fines.map(f => (
                    <div key={f.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex gap-3 items-center">
                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-500">
                                    <Receipt size={18} />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">{f.entity}</h4>
                                    <p className="text-xs text-slate-400 mt-0.5">Due: {f.date}</p>
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${f.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{f.status}</span>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                            <p className="text-xl font-bold text-slate-800">₹{f.amount.toFixed(2)}</p>
                            {f.status === 'UNPAID' && (
                                <div className="flex gap-2">
                                    <button onClick={async () => {
                                        setIsAiLoading(true); setAiModalTitle('Draft Appeal'); setAiResult('');
                                        const res = await callGemini(`I received a fine for ${f.entity}. Write a 1-sentence polite appeal.`);
                                        setAiResult(res); setIsAiLoading(false);
                                    }} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"><Sparkles size={16} /></button>
                                    <button onClick={() => {
                                        handlePayment(f.id, f.amount, 'FINE', { entityName: f.entity }).then(res => { if (res.success) setFines(fines.map(fi => fi.id === f.id ? { ...fi, status: 'PAID' } : fi)); });
                                    }} className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 active:scale-[0.98] transition-all">Pay Now</button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </MobileWrapper>
    );

    const SubscriptionsScreen = () => {
        const [tab, setTab] = useState('MY');
        return (
            <MobileWrapper title="Subscriptions" showBack>
                <div className="px-6 pt-2">
                    <div className="flex p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-sm">
                        <button onClick={() => setTab('MY')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'MY' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>My Active Plans</button>
                        <button onClick={() => setTab('ALL')} className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === 'ALL' ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>Discover More</button>
                    </div>

                    <div className="space-y-4 pb-6">
                        {(tab === 'MY' ? subscriptions : AVAILABLE_SUBS).map(s => (
                            <div key={s.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                                <div className="flex gap-3 items-start mb-4">
                                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 mt-1">
                                        <CalendarDays size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 text-sm">{tab === 'MY' ? s.entity : s.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed pr-2">{tab === 'MY' ? `Renews on ${s.nextBill}` : s.desc}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                    <p className="text-lg font-bold text-slate-800">
                                        ₹{s.amount.toFixed(2)}
                                        <span className="text-xs font-medium text-slate-400 ml-1">/{s.cycle}</span>
                                    </p>
                                    {tab === 'ALL' && (
                                        <button onClick={() => {
                                            handlePayment(s.name, s.amount, 'SUBSCRIPTION', { serviceId: s.id }).then(res => {
                                                if (res.success) {
                                                    setSubscriptions([...subscriptions, { id: Date.now().toString(), entity: s.name, amount: s.amount, cycle: s.cycle, nextBill: 'Next Cycle', status: 'ACTIVE' }]);
                                                    setTab('MY');
                                                }
                                            });
                                        }} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-medium hover:bg-blue-700 active:scale-[0.98] transition-all shadow-sm">Subscribe</button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </MobileWrapper>
        );
    };

    switch (currentScreen) {
        case 'Login': return <LoginScreen />;
        case 'Dashboard': return <DashboardScreen />;
        case 'Transfer': return <SendScreen isVendor={false} />;
        case 'VendorPayment': return <SendScreen isVendor={true} />;
        case 'Transactions': return <HistoryScreen />;
        case 'Fines': return <FinesScreen />;
        case 'Subscriptions': return <SubscriptionsScreen />;
        default: return <LoginScreen />;
    }
}
