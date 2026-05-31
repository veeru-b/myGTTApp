import React, { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// CONFIG & INITIAL SEED DATA
// ─────────────────────────────────────────────
const JSONBIN_BIN_ID  = "6a1c03a021f9ee59d2a091e4"; 
const JSONBIN_API_KEY = "$2a$10$Z8Fo5H2LqszqZqv0e.g3Gu1gGlshI4g6aKfOk5Hp3VL/gVXpqqMwG"; 
const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

const SEED = {
  settings: {
    groupName: "Grow Together Team",
    startMonth: "2026-02",
    monthlyAmounts: { "2026-02": 100, "2026-03": 100, "2026-04": 100, "2026-05": 1000 },
    interestRate: 1,
    deadline: 10,
  },
  members: [
    { id: 1, name: "Veeranna", role: "admin",  pin: "1234", joined: "2026-02", phone: "", email: "" },
    { id: 2, name: "Anusha",   role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 3, name: "Krishna",  role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 4, name: "Santosh",  role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 5, name: "Channa",   role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 6, name: "Chandru",  role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
    { id: 7, name: "Ashok",    role: "member", pin: "0000", joined: "2026-02", phone: "", email: "" },
  ],
  payments: {
    "1_2026-02": 100, "2_2026-02": 100, "3_2026-02": 100, "4_2026-02": 100, "5_2026-02": 100, "6_2026-02": 100, "7_2026-02": 100,
    "1_2026-03": 100, "2_2026-03": 100, "3_2026-03": 100, "4_2026-03": 100, "5_2026-03": 100, "6_2026-03": 100, "7_2026-03": 100,
    "1_2026-04": 100, "2_2026-04": 100, "3_2026-04": 100, "4_2026-04": 100, "5_2026-04": 100, "6_2026-04": 100, "7_2026-04": 100,
  },
  loans: [],
  adjustments: [],
};

// ─────────────────────────────────────────────
// DESIGN SYSTEM & THEME TOKENS
// ─────────────────────────────────────────────
const THEMES = {
  light: {
    bg:          "#F5F7FA",
    surface:     "#FFFFFF",
    surfaceAlt:  "#EEF2F8",
    border:      "#DDE3EE",
    borderAlt:   "#C8D3E8",
    text:        "#0D1B3E",
    textSec:     "#4A5C82",
    textMuted:   "#8A9ABC",
    accent:      "#2563EB",
    accentLight: "#EFF4FF",
    accentText:  "#1D4ED8",
    success:     "#059669",
    successLight:"#ECFDF5",
    warn:        "#D97706",
    warnLight:   "#FFFBEB",
    danger:      "#DC2626",
    dangerLight: "#FEF2F2",
    navBg:       "#FFFFFF",
    headerBg:    "#FFFFFF",
    pill:        "#EEF2F8",
    pillText:    "#2563EB",
    shadow:      "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
    shadowMd:    "0 4px 12px rgba(0,0,0,0.08)",
  },
  dark: {
    bg:          "#0A0E1A",
    surface:     "#111827",
    surfaceAlt:  "#1C2333",
    border:      "#252F45",
    borderAlt:   "#2D3A55",
    text:        "#F0F4FF",
    textSec:     "#8DA0C8",
    textMuted:   "#4A5C82",
    accent:      "#3B82F6",
    accentLight: "#1E2D4A",
    accentText:  "#93C5FD",
    success:     "#10B981",
    successLight:"#052E1D",
    warn:        "#F59E0B",
    warnLight:   "#2D1F00",
    danger:      "#EF4444",
    dangerLight: "#2D0A0A",
    navBg:       "#111827",
    headerBg:    "#111827",
    pill:        "#1C2333",
    pillText:    "#93C5FD",
    shadow:      "0 1px 3px rgba(0,0,0,0.4)",
    shadowMd:    "0 4px 12px rgba(0,0,0,0.4)",
  }
};

// ─────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────
const nowYM = () => { const d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0"); };
const fmt = n => "₹" + Number(n || 0).toLocaleString("en-IN");
const monthLabel = ym => { if (!ym) return ""; const [y, m] = ym.split("-"); return new Date(y, m - 1, 1).toLocaleString("default", { month: "long", year: "numeric" }); };
const initials = name => name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
const nextId = arr => arr.length ? Math.max(...arr.map(x => x.id)) + 1 : 1;
const USER_KEY = "gtt-current-user-v4";
const THEME_KEY = "gtt-theme-v4";
const LOCAL_FALLBACK_KEY = "gtt-fallback-v4";

function getMonthsBetween(start, end) {
  const months = [];
  let [sy, sm] = start.split("-").map(Number);
  const [ey, em] = end.split("-").map(Number);
  while (sy < ey || (sy === ey && sm <= em)) {
    months.push(sy + "-" + String(sm).padStart(2, "0"));
    sm++; if (sm > 12) { sm = 1; sy++; }
  }
  return months;
}

// ─────────────────────────────────────────────
// MAIN APP COMPONENT
// ─────────────────────────────────────────────
export default function App() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const [user, setUser] = useState(() => {
    try { const s = localStorage.getItem(USER_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY) || "light"; } catch { return "light"; }
  });
  const [tab, setTab] = useState("home");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const T = THEMES[theme];

  const loadData = useCallback(async () => {
    if (JSONBIN_BIN_ID === "YOUR_BIN_ID_HERE") {
      try {
        const local = localStorage.getItem(LOCAL_FALLBACK_KEY);
        setDb(local ? JSON.parse(local) : SEED);
        if (!local) localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(SEED));
      } catch { setDb(SEED); }
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(JSONBIN_URL + "/latest", {
        headers: { "X-Master-Key": JSONBIN_API_KEY }
      });
      if (!res.ok) throw new Error("fetch failed");
      const json = await res.json();
      setDb(json.record);
      setSyncErr(false);
    } catch {
      setSyncErr(true);
      try {
        const local = localStorage.getItem(LOCAL_FALLBACK_KEY);
        setDb(local ? JSON.parse(local) : SEED);
      } catch { setDb(SEED); }
    }
    setLoading(false);
  }, []);

  const saveData = useCallback(async (newDb) => {
    setSaving(true);
    setDb(newDb);
    try { localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(newDb)); } catch {}
    if (JSONBIN_BIN_ID !== "YOUR_BIN_ID_HERE") {
      try {
        const res = await fetch(JSONBIN_URL, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-Master-Key": JSONBIN_API_KEY,
            "X-Bin-Versioning": "false",
          },
          body: JSON.stringify(newDb),
        });
        if (!res.ok) throw new Error("save failed");
        setSyncErr(false);
      } catch {
        setSyncErr(true);
      }
    }
    setSaving(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
  };

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", gap: 16, background: THEMES.light.bg, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ fontSize: 48 }}>🤝</div>
      <div style={{ color: THEMES.light.accent, fontWeight: 700, fontSize: 17, letterSpacing: -0.3 }}>Loading GTT…</div>
      <div style={{ width: 40, height: 3, background: THEMES.light.accent, borderRadius: 2 }} />
    </div>
  );

  if (!user) return <LoginScreen db={db} onLogin={setUser} T={T} theme={theme} toggleTheme={toggleTheme} />;

  const isAdmin = user.role === "admin";

  return (
    /* FIXED VIEWPORT SYSTEM: Changed height configuration to fixed 100vh layout to lock header and footer elements */
    <div style={{ maxWidth: 480, width: "100%", margin: "0 auto", height: "100vh", background: T.bg, display: "flex", flexDirection: "column", fontFamily: "system-ui,-apple-system,sans-serif", position: "relative", boxShadow: "0 0 40px rgba(0,0,0,0.1)", boxSizing: "border-box", overflow: "hidden" }}>
      <style>{`
        *, *:before, *:after { box-sizing: border-box; }
        html, body { max-width: 100vw; height: 100vh; overflow: hidden; margin: 0; padding: 0; }
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        .tab-btn:active{transform:scale(0.97);}
        .btn-press:active{transform:scale(0.98);}
        input,select,textarea{color-scheme:${theme}; background: ${T.surfaceAlt}; color: ${T.text}; border: 1px solid ${T.border}; padding: 10px; border-radius: 8px; width: 100%; box-sizing: border-box;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${T.borderAlt};border-radius:3px;}
        table { width: 100%; max-width: 100%; table-layout: fixed; word-wrap: break-word; }
      `}</style>

      {/* FIXED HEADER NAVBAR */}
      <div style={{ background: T.headerBg, borderBottom: `1px solid ${T.border}`, boxShadow: T.shadow, width: "100%", flexShrink: 0 }}>
        <div style={{ padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🤝</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: T.text, letterSpacing: -0.5, lineHeight: 1.2 }}>GTT</div>
              <div style={{ fontSize: 10, color: T.textMuted, letterSpacing: 0.3 }}>
                {saving ? "⟳ Syncing…" : syncErr ? "⚠ Offline" : "● Live"}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={toggleTheme} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "5px 8px", cursor: "pointer", fontSize: 14, color: T.textSec }}>
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: T.surfaceAlt, borderRadius: 10, padding: "5px 10px", border: `1px solid ${T.border}` }}>
              <div style={{ width: 24, height: 24, borderRadius: 12, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white" }}>
                {initials(user.name)}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{user.name.split(" ")[0]}</span>
              {isAdmin && <span style={{ fontSize: 9, fontWeight: 800, background: T.warn, color: "white", padding: "1px 5px", borderRadius: 4 }}>ADMIN</span>}
              <span onClick={() => { localStorage.removeItem(USER_KEY); setUser(null); }} style={{ fontSize: 11, color: T.textMuted, cursor: "pointer", marginLeft: 2 }}>✕</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div style={{ position: "fixed", top: 68, left: "50%", transform: "translateX(-50%)", background: toast.type === "success" ? T.success : toast.type === "warn" ? T.warn : T.danger, color: "white", padding: "9px 18px", borderRadius: 10, zIndex: 999, fontWeight: 700, fontSize: 13, boxShadow: T.shadowMd, animation: "fadeIn 0.2s ease", whiteSpace: "nowrap" }}>
          {toast.msg}
        </div>
      )}

      {/* INDEPENDENT CENTRE SCROLLING PANEL */}
      {/* Set padding-bottom to 16px now that the bottom nav doesn't layer inside it anymore */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "14px 16px 16px 16px", width: "100%" }}>
        {tab === "home" && <HomeScreen db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} openModal={(t, d) => setModal({ type: t, data: d })} T={T} />}
        {tab === "members" && <MembersScreen db={db} user={user} isAdmin={isAdmin} openModal={(t, d) => setModal({ type: t, data: d })} T={T} />}
        {tab === "loans" && <LoansScreen db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} openModal={(t, d) => setModal({ type: t, data: d })} T={T} />}
        {tab === "reports" && <ReportsScreen db={db} T={T} />}
        {tab === "admin" && isAdmin && <AdminScreen db={db} saveData={saveData} showToast={showToast} T={T} />}
      </div>

      {/* FIXED FOOTER TAB CONTROLLER */}
      <BottomNav tab={tab} setTab={setTab} isAdmin={isAdmin} T={T} />

      {/* DIALOG LAYEROVER SYSTEM */}
      {modal && (
        <ModalLayer modal={modal} db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} onClose={() => setModal(null)} T={T} />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// REUSABLE PRESENTATIONAL GRAPHICS
// ─────────────────────────────────────────────
const Card = ({ children, T, style, onClick }) => (
  <div onClick={onClick} style={{ background: T.surface, borderRadius: 14, padding: 14, border: `1px solid ${T.border}`, boxShadow: T.shadow, width: "100%", boxSizing: "border-box", ...style }}>
    {children}
  </div>
);

const CardTitle = ({ children, T }) => (
  <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 12, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
    {children}
  </div>
);

const SectionTitle = ({ children, T }) => (
  <div style={{ fontSize: 12, fontWeight: 800, color: T.textMuted, letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 10, marginTop: 4 }}>
    {children}
  </div>
);

const Avatar = ({ name, size = 36, T }) => (
  <div style={{ width: size, height: size, borderRadius: size / 2, background: T.surfaceAlt, border: `1px solid ${T.borderAlt}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: T.textSec, flexShrink: 0 }}>
    {initials(name)}
  </div>
);

const Btn = ({ children, T, color = "accent", onClick, style, disabled }) => {
  const bg = disabled ? T.surfaceAlt : color === "accent" ? T.accent : color === "warn" ? T.warn : color === "danger" ? T.danger : T.surfaceAlt;
  const tc = disabled ? T.textMuted : color === "secondary" ? T.textSec : "#FFFFFF";
  return (
    <button disabled={disabled} className="btn-press" onClick={onClick} style={{ background: bg, color: tc, border: color === "secondary" ? `1px solid ${T.border}` : "none", borderRadius: 10, padding: "10px 16px", fontSize: 13, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "all 0.1s", width: "100%", ...style }}>
      {children}
    </button>
  );
};

const RRow = ({ label, value, color, T }) => (
  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: `1px solid ${T.border}`, fontSize: 13, alignItems: "flex-start", width: "100%" }}>
    <span style={{ color: T.textSec, fontWeight: 600 }}>{label}</span>
    <span style={{ color: color || T.text, fontWeight: 700, textAlign: "right", fontVariantNumeric: "tabular-nums", wordBreak: "break-all" }}>{value}</span>
  </div>
);

// ─────────────────────────────────────────────
// TAB DESIGN: LOGIN SUBVIEW SCREEN
// ─────────────────────────────────────────────
function LoginScreen({ db, onLogin, T, theme, toggleTheme }) {
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [step, setStep] = useState(1);

  const pickMember = (m) => {
    setSel(m); setPin(""); setErr(""); setStep(2);
  };

  const inputDigit = (digit) => {
    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);
      setErr("");
      if (next.length === 4) {
        setTimeout(() => {
          if (!sel || sel.pin !== next) { setErr("Wrong PIN. Try again."); setPin(""); }
          else {
            try { localStorage.setItem(USER_KEY, JSON.stringify(sel)); } catch {}
            onLogin(sel);
          }
        }, 150);
      }
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", justifyContent: "center", padding: 16, boxSizing: "border-box", width: "100%" }}>
      <div style={{ position: "absolute", top: 14, right: 14 }}>
        <button onClick={toggleTheme} style={{ background: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, padding: "6px 10px", cursor: "pointer", color: T.textSec }}>
          {theme === "light" ? "🌙" : "☀️"}
        </button>
      </div>

      <div style={{ maxWidth: 360, width: "100%", margin: "0 auto", animation: "fadeIn 0.3s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, margin: "0 auto 12px" }}>🤝</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: -0.6 }}>Grow Together</div>
          <div style={{ fontSize: 13, color: T.textMuted, marginTop: 4 }}>GTT Mutual Financial Security Portal</div>
        </div>

        {step === 1 ? (
          <Card T={T}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textSec, marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5, textAlign: "center" }}>Select Profile</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto", paddingRight: 2 }}>
              {db?.members.map(m => (
                <div key={m.id} onClick={() => pickMember(m)} className="btn-press" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", background: T.surfaceAlt, borderRadius: 10, cursor: "pointer", border: `1px solid ${T.border}`, width: "100%" }}>
                  <Avatar name={m.name} size={32} T={T} />
                  <div style={{ flex: 1, fontWeight: 700, fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                  {m.role === "admin" && <span style={{ fontSize: 9, fontWeight: 800, background: T.warn, color: "white", padding: "2px 5px", borderRadius: 4, flexShrink: 0 }}>ADMIN</span>}
                </div>
              ))}
            </div>
          </Card>
        ) : (
          <Card T={T} style={{ textAlign: "center" }}>
            <div style={{ width: 48, height: 48, borderRadius: 24, background: T.accent, color: "white", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontWeight: 700 }}>{initials(sel.name)}</div>
            <div style={{ fontWeight: 800, color: T.text, fontSize: 16 }}>{sel.name}</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2, marginBottom: 20 }}>Security PIN Required</div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 20 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 7, background: i < pin.length ? T.accent : T.surfaceAlt, border: `2px solid ${i < pin.length ? T.accent : T.borderAlt}` }} />
              ))}
            </div>

            {err && <div style={{ color: T.danger, fontSize: 12, fontWeight: 700, marginBottom: 12 }}>{err}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, maxWidth: 240, margin: "0 auto" }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, "⌫"].map((d, idx) => (
                <div key={idx} onClick={() => {
                  if (d === "") return;
                  if (d === "⌫") setPin(p => p.slice(0, -1));
                  else inputDigit(String(d));
                }} className="btn-press" style={{ background: d === "" ? "transparent" : T.surfaceAlt, borderRadius: 10, padding: "12px 0", fontSize: 18, fontWeight: 700, color: T.text, cursor: d === "" ? "default" : "pointer", userSelect: "none", border: d === "" ? "none" : `1px solid ${T.border}` }}>
                  {d}
                </div>
              ))}
            </div>

            <div onClick={() => { setStep(1); setSel(null); }} style={{ color: T.accent, fontSize: 12, fontWeight: 700, cursor: "pointer", marginTop: 16 }}>
              &larr; Return to selection
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB VIEW MODULES: DASHBOARD (HOME)
// ─────────────────────────────────────────────
function HomeScreen({ db, user, isAdmin, saveData, showToast, openModal, T }) {
  const ym = nowYM();
  const months = getMonthsBetween(db.settings.startMonth, ym);
  const eligible = db.members.filter(m => m.joined <= ym);
  const paidThis = eligible.filter(m => db.payments[`${m.id}_${ym}`]);
  const thisAmt = db.settings.monthlyAmounts[ym] || 0;
  
  const totalCollected = Object.entries(db.payments).reduce((sum, [, v]) => sum + v, 0);
  const totalRepaid = db.loans.reduce((sum, l) => sum + (l.repaid || 0), 0);
  const totalLoaned = db.loans.reduce((sum, l) => sum + l.amount, 0);
  const onLoan = totalLoaned - totalRepaid;
  const available = totalCollected - onLoan;

  const myPaid = !!db.payments[`${user.id}_${ym}`];
  const pct = eligible.length ? (paidThis.length / eligible.length * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
        {[
          { label: "Total Asset Pool", value: fmt(totalCollected), icon: "🏦", c: T.accent },
          { label: "Liquid Cash", value: fmt(available), icon: "✅", c: T.success },
          { label: "Month Collection", value: fmt(paidThis.length * thisAmt), icon: "📅", c: T.warn },
          { label: "Active Capital Loaned", value: fmt(onLoan), icon: "💸", c: T.danger },
        ].map(s => (
          <Card key={s.label} T={T}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: s.c, fontVariantNumeric: "tabular-nums" }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.textMuted, fontWeight: 600, marginTop: 2, lineHeight: 1.2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <div style={{ background: myPaid ? T.successLight : T.warnLight, borderRadius: 12, padding: 12, border: `1px solid ${myPaid ? T.success : T.warn}22`, display: "flex", alignItems: "center", gap: 12, width: "100%", boxSizing: "border-box" }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{myPaid ? "🎉" : "⚠️"}</span>
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: myPaid ? T.success : T.warn }}>{myPaid ? "Contribution Complete" : "Payment Awaiting Action"}</div>
          <div style={{ fontSize: 12, color: T.textSec, marginTop: 2 }}>{myPaid ? `Your dynamic tier share for ${monthLabel(ym)} is processed securely.` : `Please pass payment of ${fmt(thisAmt)} to the supervisor by day ${db.settings.deadline}.`}</div>
        </div>
      </div>

      <Card T={T}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, width: "100%" }}>
          <CardTitle T={T}>🚀 Month Tracker ({monthLabel(ym)})</CardTitle>
          <span style={{ fontSize: 12, fontWeight: 700, color: T.textSec, flexShrink: 0 }}>{paidThis.length}/{eligible.length} Paid</span>
        </div>
        <div style={{ height: 6, background: T.surfaceAlt, borderRadius: 3, overflow: "hidden", marginBottom: 12, width: "100%" }}>
          <div style={{ height: "100%", background: T.accent, width: `${pct}%`, transition: "width 0.4s ease-out" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: 200, overflowY: "auto", width: "100%" }}>
          {eligible.map(m => {
            const p = !!db.payments[`${m.id}_${ym}`];
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.border}`, width: "100%" }}>
                <Avatar name={m.name} size={28} T={T} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, background: p ? T.successLight : T.dangerLight, color: p ? T.success : T.danger, flexShrink: 0 }}>
                  {p ? "✓ Paid" : "Pending"}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {isAdmin && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, width: "100%" }}>
          <Btn T={T} color="accent" onClick={() => openModal("bulkPayment", null)}>⚡ Batch Collect</Btn>
          <Btn T={T} color="warn" onClick={() => openModal("loan", null)}>➕ Issue Loan</Btn>
        </div>
      )}

      <Card T={T}>
        <CardTitle T={T}>📜 Historic Ledgers</CardTitle>
        <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
          {months.slice().reverse().map(mo => {
            const mAmt = db.settings.monthlyAmounts[mo] || 0;
            const mEl = db.members.filter(m => m.joined <= mo);
            const mPaid = mEl.filter(m => db.payments[`${m.id}_${mo}`]).length;
            return (
              <div key={mo} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: `1px solid ${T.border}`, width: "100%" }}>
                <div style={{ flex: 1, paddingRight: 8, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{monthLabel(mo)}</div>
                  <div style={{ fontSize: 11, color: T.textMuted }}>{mPaid}/{mEl.length} Members • {fmt(mAmt)}/ea</div>
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.textSec, flexShrink: 0 }}>{fmt(mPaid * mAmt)}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB VIEW MODULES: MEMBERS LIST DIRECTORY
// ─────────────────────────────────────────────
function MembersScreen({ db, isAdmin, openModal, T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>
        <SectionTitle T={T}>Fund Shareholding Accounts ({db.members.length})</SectionTitle>
        {isAdmin && <span onClick={() => openModal("addMember", null)} style={{ fontSize: 12, color: T.accent, fontWeight: 700, cursor: "pointer", flexShrink: 0 }}>➕ New Member</span>}
      </div>
      {db.members.map(m => {
        const totalPaid = Object.entries(db.payments).filter(([k]) => k.startsWith(`${m.id}_`)).reduce((sum, [, v]) => sum + v, 0);
        const activeLoans = db.loans.filter(l => l.memberId === m.id && l.status === "active").length;
        return (
          <Card key={m.id} T={T} onClick={() => openModal("memberDetail", m)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 12, width: "100%" }}>
            <Avatar name={m.name} size={40} T={T} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.name}</span>
                {m.role === "admin" && <span style={{ fontSize: 8, fontWeight: 800, background: T.warn, color: "white", padding: "1px 4px", borderRadius: 4, flexShrink: 0 }}>ADMIN</span>}
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 1 }}>Joined Lifecycle: {m.joined}</div>
              <div style={{ fontSize: 12, color: T.textSec, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Equity Investment: <b style={{ color: T.accent }}>{fmt(totalPaid)}</b> {activeLoans > 0 && `• 💸 Debts (${activeLoans})`}
              </div>
            </div>
            <span style={{ color: T.textMuted, fontSize: 16, flexShrink: 0 }}>&rsaquo;</span>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB VIEW MODULES: DEBT / LIABILITIES (LOANS)
// ─────────────────────────────────────────────
function LoansScreen({ db, isAdmin, openModal, T }) {
  const [lt, setLt] = useState("active");
  const filtered = db.loans.filter(l => l.status === lt);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div style={{ display: "flex", background: T.surfaceAlt, borderRadius: 10, padding: 3, gap: 4, width: "100%" }}>
        {["active", "pending", "closed"].map(type => (
          <div key={type} onClick={() => setLt(type)} style={{ flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 12, background: lt === type ? T.surface : "transparent", color: lt === type ? T.accent : T.textMuted, boxShadow: lt === type ? T.shadow : "none", textTransform: "capitalize", transition: "all 0.15s" }}>
            {type}
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: "center", color: T.textMuted, padding: "40px 20px", fontSize: 13, fontWeight: 600, width: "100%" }}>No loan records classified under "{lt}".</div>
      ) : (
        filtered.map(l => {
          const m = db.members.find(x => x.id === l.memberId);
          const balance = l.amount - (l.repaid || 0);
          return (
            <Card key={l.id} T={T} onClick={() => openModal("loanDetail", l)} style={{ borderLeft: `4px solid ${lt === "active" ? T.accent : lt === "pending" ? T.warn : T.textMuted}`, cursor: "pointer", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%" }}>
                <div style={{ flex: 1, paddingRight: 8, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: T.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m?.name || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    Type: {l.type === "emergency" ? "🏥 Urgent" : "💼 Premium"} • Rate: {l.rate}%
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: T.textSec, marginTop: 4 }}>
                    Remaining Liability: {fmt(balance)}
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: T.accent }}>{fmt(l.amount)}</div>
                  <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>Issued: {l.issueMonth}</div>
                </div>
              </div>
            </Card>
          );
        })
      )}

      {isAdmin && <Btn T={T} color="warn" onClick={() => openModal("loan", null)}>➕ Setup Custom Outbound Loan</Btn>}
    </div>
  );
}

// ─────────────────────────────────────────────
// TAB VIEW MODULES: AUDITING & WHATSAPP EXPORT
// ─────────────────────────────────────────────
function ReportsScreen({ db, T }) {
  const [rt, setRt] = useState("monthly");
  const ym = nowYM();
  
  const totalCollected = Object.entries(db.payments).reduce((sum, [, v]) => sum + v, 0);
  const totalRepaid = db.loans.reduce((sum, l) => sum + (l.repaid || 0), 0);
  const totalLoaned = db.loans.reduce((sum, l) => sum + l.amount, 0);
  const onLoan = totalLoaned - totalRepaid;
  const available = totalCollected - onLoan;

  const eligible = db.members.filter(m => m.joined <= ym);
  const paidThis = eligible.filter(m => db.payments[`${m.id}_${ym}`]);
  const unpaidThis = eligible.filter(m => !db.payments[`${m.id}_${ym}`]);
  const thisAmt = db.settings.monthlyAmounts[ym] || 0;

  const generateWhatsAppMessage = () => {
    const text = `🤝 *GROW TOGETHER TEAM (GTT)*\n${"─".repeat(20)}\n📅 *Statement: ${monthLabel(ym)}*\n\n💰 This Month Share Pool: ${fmt(paidThis.length * thisAmt)}\n🏦 Aggregated Reserve: ${fmt(totalCollected)}\n📤 Outbound Credit Line: ${fmt(onLoan)}\n✅ Unallocated Vault Cash: ${fmt(available)}\n\n👥 *Settled (${paidThis.length}):* ${paidThis.map(m => m.name).join(", ") || "None"}\n⚠️ *Awaiting (${unpaidThis.length}):* ${unpaidThis.map(m => m.name).join(", ") || "All Clear! 🎉"}\n\n_System generated transparent financial audit updates._`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, width: "100%" }}>
      <Card T={T}>
        <CardTitle T={T}>📈 System Audits</CardTitle>
        <RRow label="Total Pools Generated" value={fmt(totalCollected)} T={T} />
        <RRow label="Active Outstanding Loans" value={fmt(onLoan)} T={T} />
        <RRow label="Available Vault Liquid Balance" value={fmt(available)} T={T} />
        <div style={{ marginTop: 14 }}>
          <Btn T={T} color="accent" onClick={generateWhatsAppMessage}>📢 Export To WhatsApp</Btn>
        </div>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// STUB/PLACEHOLDER SUB-COMPONENTS
// ─────────────────────────────────────────────
function AdminScreen({ db, saveData, showToast, T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <Card T={T}>
        <CardTitle T={T}>⚙️ Group Settings</CardTitle>
        <RRow label="Group Identity Name" value={db.settings.groupName} T={T} />
        <RRow label="Base Interest Rate" value={`${db.settings.interestRate}%`} T={T} />
        <RRow label="Collection Deadline Day" value={`Day ${db.settings.deadline}`} T={T} />
      </Card>
    </div>
  );
}

/* FIXED BOTTOM NAV LAYER: Removed absolute position inside scroll scope, and locked to the bottom container line seamlessly */
function BottomNav({ tab, setTab, isAdmin, T }) {
  const tabs = [
    { id: "home", label: "Home", icon: "🏠" },
    { id: "members", label: "Members", icon: "👥" },
    { id: "loans", label: "Loans", icon: "💸" },
    { id: "reports", label: "Audit", icon: "📊" },
  ];
  if (isAdmin) tabs.push({ id: "admin", label: "Admin", icon: "⚙️" });

  return (
    <div style={{ height: 60, background: T.navBg, borderTop: `1px solid ${T.border}`, display: "flex", zIndex: 200, width: "100%", flexShrink: 0 }}>
      {tabs.map(t => {
        const act = tab === t.id;
        return (
          <button key={t.id} onClick={() => setTab(t.id)} className="tab-btn" style={{ flex: 1, background: "transparent", border: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", color: act ? T.accent : T.textMuted, transition: "color 0.15s" }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: act ? 800 : 500 }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function ModalLayer({ modal, db, user, isAdmin, saveData, showToast, onClose, T }) {
  return (
    <div style={{ position: "fixed", top: 0, bottom: 0, left: 0, right: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}>
      <div style={{ background: T.surface, borderRadius: 16, padding: 20, maxWidth: 400, width: "100%", border: `1px solid ${T.border}`, boxShadow: T.shadowMd, animation: "slideUp 0.25s ease-out" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: T.text }}>
            {modal.type === "memberDetail" ? "Profile Details" : "System Activity"}
          </h3>
          <span onClick={onClose} style={{ fontSize: 20, color: T.textMuted, cursor: "pointer" }}>&times;</span>
        </div>
        <div>
          {modal.type === "memberDetail" && modal.data && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <RRow label="Full Profile Name" value={modal.data.name} T={T} />
              <RRow label="Authorized Role" value={modal.data.role.toUpperCase()} T={T} />
              <RRow label="Portal Check-In Cycle" value={modal.data.joined} T={T} />
            </div>
          )}
          {modal.type !== "memberDetail" && (
            <p style={{ fontSize: 13, color: T.textSec, margin: "10px 0" }}>Configuration Workspace Action Handler.</p>
          )}
        </div>
        <div style={{ marginTop: 18 }}>
          <Btn T={T} color="secondary" onClick={onClose}>Dismiss Screen</Btn>
        </div>
      </div>
    </div>
  );
}