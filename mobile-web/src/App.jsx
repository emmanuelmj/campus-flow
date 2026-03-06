import React, { useState, useEffect, useCallback } from 'react';
import {
    Wallet, Send, Store, ChevronLeft, ArrowUpRight, ArrowDownLeft,
    AlertCircle, CheckCircle2, Receipt, CalendarDays, User, Sparkles,
    X, Copy, Check, Zap, ArrowRight, CreditCard, Building, RefreshCw,
} from 'lucide-react';
import { apiRequest, setToken, clearToken } from './api.js';

export default function App() {
    const [currentScreen, setCurrentScreen] = useState('Login');
    const [balance, setBalance] = useState(0);
    const [transactions, setTransactions] = useState([]);
    const [fines, setFines] = useState([]);
    const [paymentRequests, setPaymentRequests] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [userEmail, setUserEmail] = useState('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [dataLoading, setDataLoading] = useState(false);

    const [aiModalTitle, setAiModalTitle] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const [aiResult, setAiResult] = useState('');

    const navigate = (screen) => setCurrentScreen(screen);

    // ── Data fetching ──────────────────────────────────────────────────────────
    const refreshWallet = useCallback(async () => {
        const data = await apiRequest('/wallet');
        setBalance(data.balance);
    }, []);

    const refreshTransactions = useCallback(async () => {
        const data = await apiRequest('/transactions');
        setTransactions(data.map(tx => ({
            id: tx.transaction_id,
            type: tx.type,
            entity: tx.entity_name || (
                tx.type === 'VENDOR_PAYMENT' ? 'Vendor Payment' :
                    tx.type === 'P2P' ? 'Student Transfer' :
                        tx.type === 'FINE' ? 'Fine Payment' :
                            tx.type === 'TOP_UP' ? 'Top Up' : tx.type
            ),
            amount: tx.amount,
            date: new Date(tx.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
            status: tx.status,
        })));
    }, []);

    const refreshFines = useCallback(async () => {
        const data = await apiRequest('/student/fines');
        setFines(data.map(f => ({
            id: f.fine_id,
            entity: f.reason,
            amount: f.amount,
            date: new Date(f.issued_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            status: f.status,
        })));
    }, []);

    const refreshPaymentRequests = useCallback(async () => {
        try {
            const data = await apiRequest('/student/payment-requests');
            setPaymentRequests(data || []);
        } catch (e) {
            console.error('Failed to fetch payment requests', e);
        }
    }, []);

    const loadAllData = useCallback(async () => {
        setDataLoading(true);
        try {
            await Promise.all([refreshWallet(), refreshTransactions(), refreshFines(), refreshPaymentRequests()]);
        } catch (e) {
            console.error('Data fetch error:', e.message);
        } finally {
            setDataLoading(false);
        }
    }, [refreshWallet, refreshTransactions, refreshFines, refreshPaymentRequests]);

    useEffect(() => {
        if (isLoggedIn) loadAllData();
    }, [isLoggedIn, loadAllData]);

    // ── Payment — always re-fetches from API after success ─────────────────────
    const handlePayment = async (entityId, amount, type, extraData = {}) => {
        let num;
        if (type !== 'PAYMENT_REQUEST') {
            num = parseFloat(amount);
            if (isNaN(num) || num <= 0) return { success: false, msg: 'Invalid amount' };
        }

        try {
            if (type === 'P2P') {
                await apiRequest('/transfer', 'POST', { recipient_identifier: entityId, amount: num, note: 'App transfer' });
            } else if (type === 'VENDOR') {
                await apiRequest('/pay-vendor', 'POST', { vendor_id: entityId, amount: num });
            } else if (type === 'FINE') {
                const cleanId = String(entityId).replace('fine-', '');
                await apiRequest(`/student/pay-fine/${cleanId}`, 'POST');
            } else if (type === 'SUBSCRIPTION') {
                await apiRequest('/subscribe', 'POST', { service_id: extraData.serviceId || entityId, auto_renew: true });
            } else if (type === 'PAYMENT_REQUEST') {
                const cleanId = String(entityId).replace('req-', '');
                await apiRequest(`/student/approve-payment/${cleanId}`, 'POST');
            }
            // Add refreshPaymentRequests when doing payments
            await Promise.all([refreshWallet(), refreshTransactions(), refreshPaymentRequests()]);
            return { success: true, msg: 'Payment successful' };
        } catch (e) {
            return { success: false, msg: e.message };
        }
    };

    // ── OpenRouter AI ────────────────────────────────────────────────────────────
    const callGemini = async (prompt) => {
        const apiKey = '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';   // Add OpenRouter API key here
        if (!apiKey) return 'AI service not configured (no API key set).';
        try {
            const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'http://localhost:3005',
                    'X-Title': 'CampusFlow',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'google/gemini-2.0-pro-exp-02-05:free', // Using a valid free tier model
                    messages: [
                        { role: 'system', content: 'You are a concise financial assistant. Keep responses under 2 sentences. Professional tone.' },
                        { role: 'user', content: prompt }
                    ]
                })
            });
            const data = await res.json();
            if (data.error) {
                console.error("OpenRouter Error:", data.error);
                return `API Error: ${data.error.message}`;
            }
            return data.choices?.[0]?.message?.content || 'No response.';
        } catch (e) {
            console.error("Fetch Error:", e);
            return 'AI service offline.';
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard?.writeText(text).catch(() => {
            const ta = document.createElement('textarea');
            ta.value = text; document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); document.body.removeChild(ta);
        });
    };

    // ── Shared wrapper ─────────────────────────────────────────────────────────
    const MobileWrapper = ({ children, title, showBack = false, showMenu = false }) => (
        <div className="flex items-center justify-center min-h-screen bg-slate-200 font-sans p-4">
            <div className="w-full max-w-[390px] h-[820px] max-h-[95vh] bg-[#F7F7F9] flex flex-col shadow-2xl rounded-[3rem] overflow-hidden relative border-[8px] border-white">
                {(title || showBack) && (
                    <div className="px-6 pt-10 pb-4 flex items-center justify-between z-40 bg-[#F7F7F9] sticky top-0">
                        <div className="flex items-center space-x-3">
                            {showBack && (
                                <button onClick={() => navigate('Dashboard')} className="p-2 -ml-2 text-slate-500 hover:bg-white hover:shadow-sm rounded-xl transition-all">
                                    <ChevronLeft size={20} strokeWidth={2.5} />
                                </button>
                            )}
                            <h1 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h1>
                        </div>
                        {showMenu && (
                            <button
                                onClick={() => { clearToken(); setIsLoggedIn(false); setBalance(0); setTransactions([]); setFines([]); navigate('Login'); }}
                                className="w-10 h-10 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center hover:bg-red-50 group transition-colors"
                                title="Logout"
                            >
                                <User size={18} className="text-slate-600 group-hover:text-red-500 transition-colors" />
                            </button>
                        )}
                    </div>
                )}
                <div className="flex-1 overflow-y-auto hide-scrollbar relative pb-8">
                    {children}
                    {aiModalTitle && (
                        <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                            <div className="bg-white rounded-3xl p-6 w-full shadow-xl border border-slate-100 relative">
                                <button onClick={() => setAiModalTitle('')} className="absolute top-5 right-5 p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg">
                                    <X size={18} strokeWidth={2.5} />
                                </button>
                                <h3 className="font-bold text-base mb-4 flex items-center gap-2 text-slate-800">
                                    <Sparkles size={18} className="text-blue-600" /> {aiModalTitle}
                                </h3>
                                {isAiLoading ? (
                                    <div className="py-8 flex flex-col items-center gap-3">
                                        <div className="w-8 h-8 border-2 border-slate-100 border-t-blue-600 rounded-full animate-spin"></div>
                                        <p className="text-xs font-semibold text-slate-400">Processing...</p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">{aiResult}</div>
                                        {aiModalTitle.includes('Appeal') && (
                                            <button onClick={() => copyToClipboard(aiResult)} className="mt-4 w-full bg-slate-800 text-white font-medium py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-slate-700 text-sm">
                                                <Copy size={16} /> Copy to Clipboard
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

    // ── LOGIN ──────────────────────────────────────────────────────────────────
    const LoginScreen = () => {
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [loading, setLoading] = useState(false);
        const [error, setError] = useState('');

        const handleAuth = async (e) => {
            e.preventDefault();
            setError('');
            setLoading(true);
            try {
                const data = await apiRequest('/auth/login', 'POST', { email, password });
                if (data.role && data.role !== 'STUDENT') {
                    setError('This app is for students only.');
                    setLoading(false);
                    return;
                }
                setToken(data.access_token);
                setUserEmail(email);
                setIsLoggedIn(true);
                navigate('Dashboard');
            } catch (e) {
                setError(e.message || 'Invalid credentials. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        return (
            <MobileWrapper>
                <div className="h-full flex flex-col justify-center px-8">
                    <div className="space-y-8 max-w-sm w-full mx-auto">
                        <div>
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-violet-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/30">
                                <Wallet size={32} strokeWidth={2} />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-slate-800 mb-2">CampusFlow</h1>
                            <p className="text-slate-500 text-sm">Sign in to your university wallet.</p>
                        </div>

                        {error && (
                            <div className="p-3 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-sm text-rose-700">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <form onSubmit={handleAuth} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 ml-1">University Email</label>
                                <input type="email" value={email}
                                    onChange={e => { setEmail(e.target.value); setError(''); }}
                                    placeholder="you@university.edu" required
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-500 ml-1">Password</label>
                                <input type="password" value={password}
                                    onChange={e => { setPassword(e.target.value); setError(''); }}
                                    placeholder="••••••••" required
                                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 focus:outline-none transition-all shadow-sm" />
                            </div>
                            <button type="submit" disabled={loading}
                                className="w-full bg-gradient-to-r from-blue-600 to-violet-600 text-white font-semibold py-4 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all mt-6 text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 disabled:opacity-60">
                                {loading ? 'Authenticating...' : <><span>Continue</span><ArrowRight size={18} /></>}
                            </button>
                        </form>
                    </div>
                </div>
            </MobileWrapper>
        );
    };

    // ── DASHBOARD ──────────────────────────────────────────────────────────────
    const DashboardScreen = () => {
        const handleGetInsights = async () => {
            if (transactions.length === 0) return 'No transactions to analyse yet.';
            const txList = transactions.slice(0, 5).map(t => `${t.date}: ${t.entity} (₹${Math.abs(t.amount)})`).join('\n');
            return callGemini(`Analyse these recent transactions:\n${txList}\n\nGive a 1-2 sentence professional spending analysis.`);
        };

        const ACTIONS = [
            { screen: 'Transfer', icon: <Send size={20} />, label: 'Send Money', iconBg: 'bg-blue-50', iconFg: 'text-blue-600', hover: 'hover:border-blue-100' },
            { screen: 'VendorPayment', icon: <Store size={20} />, label: 'Pay Vendor', iconBg: 'bg-emerald-50', iconFg: 'text-emerald-600', hover: 'hover:border-emerald-100' },
            { screen: 'Fines', icon: <Receipt size={20} />, label: 'Fines', iconBg: 'bg-rose-50', iconFg: 'text-rose-600', hover: 'hover:border-rose-100' },
            { screen: 'Subscriptions', icon: <CalendarDays size={20} />, label: 'Subscriptions', iconBg: 'bg-amber-50', iconFg: 'text-amber-600', hover: 'hover:border-amber-100' },
        ];

        const unpaidFines = fines.filter(f => f.status === 'UNPAID').length;

        return (
            <MobileWrapper title="Dashboard" showMenu>
                <div className="px-6 space-y-4">

                    {/* Balance */}
                    <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 shadow-lg shadow-blue-500/30 p-6 rounded-[24px] relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/4"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-2xl translate-y-1/4 -translate-x-1/4"></div>
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div className="space-y-1">
                                <p className="text-blue-100 font-medium text-xs">Total Balance</p>
                                {dataLoading
                                    ? <div className="h-10 w-40 bg-white/20 rounded-xl animate-pulse mt-1"></div>
                                    : <h2 className="text-4xl font-bold tracking-tight text-white">₹{balance.toFixed(2)}</h2>
                                }
                            </div>
                            <div className="flex gap-2 relative z-10">
                                <button onClick={loadAllData} disabled={dataLoading} title="Refresh"
                                    className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 hover:bg-white/30 disabled:opacity-50">
                                    <RefreshCw size={16} className={`text-white ${dataLoading ? 'animate-spin' : ''}`} />
                                </button>
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20">
                                    <CreditCard size={18} className="text-white" />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-white/20 flex justify-between items-center relative z-10">
                            <p className="text-xs font-medium text-blue-100 truncate max-w-[200px]">{userEmail}</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 px-2.5 py-1 rounded-lg">
                                <Zap size={12} className="fill-white" /> Active
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    {paymentRequests.length > 0 && (
                        <div onClick={() => navigate('PaymentRequests')} className="bg-amber-50 border border-amber-200 p-4 rounded-[20px] flex items-center justify-between shadow-sm cursor-pointer mb-2 active:scale-[0.98] transition-all">
                            <div className="flex items-center gap-3">
                                <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                                    <AlertCircle size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm text-slate-800">Pending Requests</h3>
                                    <p className="text-xs text-amber-700/80 font-medium">You have {paymentRequests.length} payment request{paymentRequests.length > 1 ? 's' : ''}</p>
                                </div>
                            </div>
                            <div className="bg-amber-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg">Review</div>
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        {ACTIONS.map(a => (
                            <button key={a.screen} onClick={() => navigate(a.screen)}
                                className={`bg-white border border-slate-100 shadow-sm p-5 rounded-[24px] flex flex-col items-start gap-4 ${a.hover} transition-all active:scale-[0.98] group`}>
                                <div className={`w-12 h-12 ${a.iconBg} rounded-[16px] flex items-center justify-center ${a.iconFg} group-hover:scale-110 transition-transform`}>
                                    {a.icon}
                                </div>
                                <div className="flex justify-between w-full items-center">
                                    <span className="font-semibold text-sm text-slate-800">{a.label}</span>
                                    {a.screen === 'Fines' && unpaidFines > 0 && (
                                        <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">{unpaidFines}</span>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* AI */}
                    <button onClick={() => {
                        setIsAiLoading(true); setAiModalTitle('Spending Analysis'); setAiResult('');
                        handleGetInsights().then(res => { setAiResult(res); setIsAiLoading(false); });
                    }} className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white p-4 rounded-[20px] flex items-center justify-between shadow-md shadow-violet-500/20 active:scale-[0.98] transition-transform">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-1.5 rounded-lg"><Sparkles size={18} className="text-white" /></div>
                            <p className="font-semibold text-sm">Ask AI for Insights</p>
                        </div>
                        <ArrowRight size={18} className="text-white/90" />
                    </button>

                    {/* Recent */}
                    <div className="bg-white border border-slate-100 shadow-sm rounded-[24px] p-2">
                        <div className="flex justify-between items-center px-4 py-3">
                            <h3 className="font-semibold text-sm text-slate-800">Recent Activity</h3>
                            <button onClick={() => navigate('Transactions')} className="text-xs font-medium text-slate-400 hover:text-slate-800 transition-colors">View All</button>
                        </div>
                        {dataLoading
                            ? <div className="px-4 pb-3 space-y-2">{[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse"></div>)}</div>
                            : transactions.length === 0
                                ? <p className="text-center text-slate-400 text-xs py-6">No transactions yet.</p>
                                : transactions.slice(0, 3).map(tx => (
                                    <div key={tx.id} className="p-3 flex items-center justify-between rounded-xl hover:bg-slate-50 transition-colors">
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
                                ))
                        }
                    </div>
                </div>
            </MobileWrapper>
        );
    };

    // ── SEND / PAY VENDOR ──────────────────────────────────────────────────────
    const SendScreen = ({ isVendor }) => {
        const [amount, setAmount] = useState('');
        const [target, setTarget] = useState('');
        const [status, setStatus] = useState(null);
        const [loading, setLoading] = useState(false);
        const [vendorsList, setVendorsList] = useState([]);
        const [recentContacts, setRecentContacts] = useState([]);

        useEffect(() => {
            if (isVendor) {
                apiRequest('/vendors').then(setVendorsList).catch(console.error);
            } else {
                // Extract unique P2P contacts from recent transactions
                const contacts = new Map();
                transactions.forEach(tx => {
                    if (tx.type === 'P2P' && tx.entity) {
                        // Assuming tx.entity holds the name/identifier of the other party
                        if (!contacts.has(tx.entity)) {
                            contacts.set(tx.entity, tx.entity);
                        }
                    }
                });
                setRecentContacts(Array.from(contacts.values()).slice(0, 5));
            }
        }, [isVendor, transactions]);

        const handleSend = async () => {
            const entityId = target.trim();
            const num = parseFloat(amount);
            if (!entityId) return setStatus({ type: 'error', msg: isVendor ? 'Enter a vendor code.' : 'Enter a recipient student ID, email, or name.' });
            if (isNaN(num) || num <= 0) return setStatus({ type: 'error', msg: 'Enter a valid amount.' });

            setLoading(true);
            setStatus({ type: 'info', msg: 'Processing...' });
            const res = await handlePayment(entityId, num, isVendor ? 'VENDOR' : 'P2P');
            setLoading(false);
            setStatus({ type: res.success ? 'success' : 'error', msg: res.msg });
            if (res.success) setTimeout(() => navigate('Dashboard'), 1500);
        };

        return (
            <MobileWrapper title={isVendor ? 'Pay Vendor' : 'Send Money'} showBack>
                <div className="px-6 flex flex-col space-y-4 mt-2">
                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                        <label className="text-xs font-medium text-slate-400 mb-2 block">Amount</label>
                        <div className="flex items-center">
                            <span className="text-3xl text-slate-300 font-medium mr-2">₹</span>
                            <input type="number" value={amount} onChange={e => { setAmount(e.target.value); setStatus(null); }}
                                placeholder="0.00" autoFocus
                                className="w-full bg-transparent text-4xl font-bold text-slate-800 focus:outline-none placeholder-slate-200" />
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between text-xs">
                            <span className="text-slate-400">Live Balance</span>
                            <span className="font-semibold text-slate-700">₹{balance.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm">
                        <label className="text-xs font-medium text-slate-400 mb-2 block">
                            {isVendor ? 'Vendor Code' : 'Recipient — Student ID / Email / Name'}
                        </label>
                        <input type="text" value={target} onChange={e => { setTarget(e.target.value); setStatus(null); }}
                            placeholder={isVendor ? 'e.g. canteen-01' : 'e.g. CS-2024-001'}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-medium text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition-all placeholder-slate-400" />
                        {isVendor && (
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <Building size={11} /> Ask the vendor for their vendor code
                            </p>
                        )}

                        {/* Auto-loaded Lists */}
                        {isVendor && vendorsList.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Available Vendors</label>
                                <div className="flex flex-col gap-2 max-h-[240px] overflow-y-auto hide-scrollbar scroll-smooth pr-1">
                                    {vendorsList.map(v => (
                                        <button key={v.vendor_id} onClick={() => setTarget(v.vendor_id)}
                                            className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-100 transition-colors text-left shrink-0">
                                            <span className="text-sm font-semibold text-slate-800">{v.business_name}</span>
                                            <span className="text-xs font-medium text-slate-500 bg-white px-2 py-1 rounded-md border border-slate-200">{v.vendor_id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!isVendor && recentContacts.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                <label className="text-xs font-semibold text-slate-500 mb-2 block">Recent Contacts</label>
                                <div className="flex flex-wrap gap-2">
                                    {recentContacts.map(c => (
                                        <button key={c} onClick={() => setTarget(c)}
                                            className="flex items-center gap-2 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                                                {c.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-xs font-medium text-slate-700">{c}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {status && (
                        <div className={`p-4 rounded-[16px] flex items-center gap-3 border text-sm font-medium
                            ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                status.type === 'error' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                    'bg-blue-50 text-blue-700 border-blue-100'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            <span>{status.msg}</span>
                        </div>
                    )}

                    <button onClick={handleSend} disabled={loading}
                        className={`w-full py-4 rounded-2xl font-medium text-white text-sm flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-60
                            ${status?.type === 'success' ? 'bg-emerald-600' : isVendor ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                        {status?.type === 'success' ? <Check size={18} /> : loading ? 'Processing...' : <><span>Confirm Payment</span><ArrowRight size={16} /></>}
                    </button>
                </div>
            </MobileWrapper>
        );
    };

    // ── TRANSACTIONS ───────────────────────────────────────────────────────────
    const HistoryScreen = () => (
        <MobileWrapper title="Transactions" showBack>
            <div className="px-6 space-y-3 pt-2">
                {dataLoading
                    ? [1, 2, 3, 4].map(i => <div key={i} className="h-16 bg-white rounded-[20px] animate-pulse"></div>)
                    : transactions.length === 0
                        ? <p className="text-center text-slate-400 text-sm mt-20">No transactions yet.</p>
                        : transactions.map(tx => (
                            <div key={tx.id} className="bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-slate-50 border border-slate-100 ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {tx.amount > 0 ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-slate-800">{tx.entity}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">{tx.date} · {tx.type}</p>
                                    </div>
                                </div>
                                <p className={`font-bold text-base ${tx.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                                    {tx.amount > 0 ? '+' : ''}₹{Math.abs(tx.amount).toFixed(2)}
                                </p>
                            </div>
                        ))
                }
            </div>
        </MobileWrapper>
    );

    // ── PAYMENT REQUESTS ────────────────────────────────────────────────────────
    const PaymentRequestsScreen = () => {
        const [processingId, setProcessingId] = useState(null);
        const [error, setError] = useState('');

        const handleApprove = async (req) => {
            setError('');
            setProcessingId(req.request_id);
            const res = await handlePayment(req.request_id, req.amount, 'PAYMENT_REQUEST');
            setProcessingId(null);

            if (res.success) {
                // The handlePayment already re-fetches requests, so it will disappear from the list
            } else {
                setError(res.msg || 'Failed to approve request');
            }
        };

        return (
            <MobileWrapper title="Payment Requests" showBack>
                <div className="px-6 space-y-4 pt-2">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-sm text-rose-700">
                            <AlertCircle size={16} className="shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}

                    {paymentRequests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-10 text-center mt-10">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle2 size={32} className="text-emerald-500" />
                            </div>
                            <h3 className="font-semibold text-slate-800">All caught up!</h3>
                            <p className="text-sm text-slate-500 mt-2">You have no pending payment requests.</p>
                        </div>
                    ) : (
                        paymentRequests.map(req => (
                            <div key={req.request_id} className="bg-white border border-slate-100 p-5 rounded-[20px] shadow-sm space-y-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                            <Store size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 tracking-tight">{req.vendor_id || "Vendor"}</p>
                                            <p className="text-xs font-medium text-slate-400 mt-0.5">Request ID: {String(req.request_id).slice(0, 8)}</p>
                                        </div>
                                    </div>
                                    <p className="font-bold text-lg text-slate-800">₹{req.amount.toFixed(2)}</p>
                                </div>
                                {req.description && (
                                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <p className="text-sm text-slate-600">"{req.description}"</p>
                                    </div>
                                )}
                                <div className="pt-2">
                                    <button
                                        onClick={() => handleApprove(req)}
                                        disabled={processingId === req.request_id || balance < req.amount}
                                        className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all ${balance < req.amount
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 active:scale-[0.98]'
                                            }`}
                                    >
                                        {processingId === req.request_id ? (
                                            <>Processing...</>
                                        ) : balance < req.amount ? (
                                            <>Insufficient Balance</>
                                        ) : (
                                            <>Approve & Pay</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </MobileWrapper>
        );
    };

    // ── FINES ──────────────────────────────────────────────────────────────────
    const FinesScreen = () => {
        const [paying, setPaying] = useState(null);

        const handlePayFine = async (f) => {
            if (!window.confirm(`Pay ₹${f.amount.toFixed(2)} fine for "${f.entity}"?`)) return;
            setPaying(f.id);
            const res = await handlePayment(f.id, f.amount, 'FINE');
            if (res.success) {
                await refreshFines();
            } else {
                alert('Payment failed: ' + res.msg);
            }
            setPaying(null);
        };

        return (
            <MobileWrapper title="Fines & Dues" showBack>
                <div className="px-6 space-y-4 pt-2">
                    {dataLoading
                        ? [1, 2].map(i => <div key={i} className="h-32 bg-white rounded-[24px] animate-pulse"></div>)
                        : fines.length === 0
                            ? <div className="flex flex-col items-center mt-20 gap-3">
                                <CheckCircle2 size={48} className="text-emerald-400" />
                                <p className="text-slate-500 font-medium">No fines — you're all clear!</p>
                            </div>
                            : fines.map(f => (
                                <div key={f.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex gap-3 items-center">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 text-slate-500">
                                                <Receipt size={18} />
                                            </div>
                                            <div>
                                                <h4 className="font-semibold text-slate-800 text-sm">{f.entity}</h4>
                                                <p className="text-xs text-slate-400 mt-0.5">Issued: {f.date}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${f.status === 'PAID' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                            {f.status}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                        <p className="text-xl font-bold text-slate-800">₹{f.amount.toFixed(2)}</p>
                                        {f.status === 'UNPAID' && (
                                            <div className="flex gap-2">
                                                <button onClick={async () => {
                                                    setIsAiLoading(true); setAiModalTitle('Draft Appeal'); setAiResult('');
                                                    const res = await callGemini(`I received a fine for "${f.entity}". Write a 1-sentence polite email appeal to the admin.`);
                                                    setAiResult(res); setIsAiLoading(false);
                                                }} className="p-2.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-100 transition-colors">
                                                    <Sparkles size={16} />
                                                </button>
                                                <button onClick={() => handlePayFine(f)} disabled={paying === f.id}
                                                    className="px-6 py-2.5 bg-slate-800 text-white rounded-xl text-sm font-medium hover:bg-slate-700 disabled:opacity-50 transition-all">
                                                    {paying === f.id ? 'Paying...' : 'Pay Now'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                    }
                </div>
            </MobileWrapper>
        );
    };

    // ── SUBSCRIPTIONS ──────────────────────────────────────────────────────────
    const SubscriptionsScreen = () => {
        const [tab, setTab] = useState('MY');
        const [subscribing, setSub] = useState(null);

        const AVAILABLE_SUBS = [
            { id: 'premium-meal-plan', name: 'Premium Meal Plan', amount: 800, cycle: 'Monthly', desc: 'Access to premium dining hall menu.' },
            { id: 'laundry-service', name: 'Laundry Service', amount: 200, cycle: 'Monthly', desc: '4 bags of wash & fold per month.' },
            { id: 'campus-shuttle', name: 'Campus Shuttle+', amount: 150, cycle: 'Semester', desc: 'Unlimited air-conditioned shuttle rides.' },
            { id: 'campus-gym', name: 'Campus Gym', amount: 300, cycle: 'Monthly', desc: 'Full gym and fitness centre access.' },
        ];

        const handleSubscribe = async (plan) => {
            if (!window.confirm(`Subscribe to "${plan.name}" for ₹${plan.amount}/${plan.cycle}?`)) return;
            setSub(plan.id);
            try {
                await apiRequest('/subscribe', 'POST', { service_id: plan.id, auto_renew: true });
                setSubscriptions(prev => [...prev, {
                    id: Date.now().toString(), entity: plan.name,
                    amount: plan.amount, cycle: plan.cycle, nextBill: 'Next Cycle', status: 'ACTIVE',
                }]);
                setTab('MY');
            } catch (e) {
                alert('Subscription failed: ' + e.message);
            } finally {
                setSub(null);
            }
        };

        return (
            <MobileWrapper title="Subscriptions" showBack>
                <div className="px-6 pt-2">
                    <div className="flex p-1 bg-white border border-slate-200 rounded-xl mb-6 shadow-sm">
                        {['MY', 'ALL'].map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${tab === t ? 'bg-slate-100 text-slate-800' : 'text-slate-400 hover:text-slate-600'}`}>
                                {t === 'MY' ? 'My Active Plans' : 'Discover More'}
                            </button>
                        ))}
                    </div>
                    <div className="space-y-4 pb-6">
                        {tab === 'MY' && subscriptions.length === 0 && (
                            <p className="text-center text-slate-400 text-sm mt-10">No active subscriptions yet.</p>
                        )}
                        {(tab === 'MY' ? subscriptions : AVAILABLE_SUBS).map(s => (
                            <div key={s.id} className="bg-white p-5 rounded-[24px] border border-slate-100 shadow-sm">
                                <div className="flex gap-3 items-start mb-4">
                                    <div className="w-10 h-10 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-center text-blue-600 mt-1">
                                        <CalendarDays size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-slate-800 text-sm">{tab === 'MY' ? s.entity : s.name}</h4>
                                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{tab === 'MY' ? `Renews: ${s.nextBill}` : s.desc}</p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                                    <p className="text-lg font-bold text-slate-800">
                                        ₹{s.amount.toFixed(2)}<span className="text-xs font-medium text-slate-400 ml-1">/{s.cycle}</span>
                                    </p>
                                    {tab === 'ALL' && (
                                        <button onClick={() => handleSubscribe(s)} disabled={subscribing === s.id}
                                            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition-all">
                                            {subscribing === s.id ? 'Subscribing...' : 'Subscribe'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </MobileWrapper>
        );
    };

    // ── Router ─────────────────────────────────────────────────────────────────
    switch (currentScreen) {
        case 'Login': return <LoginScreen />;
        case 'Dashboard': return <DashboardScreen />;
        case 'Transfer': return <SendScreen isVendor={false} />;
        case 'VendorPayment': return <SendScreen isVendor={true} />;
        case 'PaymentRequests': return <PaymentRequestsScreen />;
        case 'Transactions': return <HistoryScreen />;
        case 'Fines': return <FinesScreen />;
        case 'Subscriptions': return <SubscriptionsScreen />;
        default: return <LoginScreen />;
    }
}
