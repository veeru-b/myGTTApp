import { useState, useEffect, useCallback, useRef } from "react";

// ─────────────────────────────────────────────
// JSONBIN CONFIG  (replace with your own IDs)
// ─────────────────────────────────────────────
const JSONBIN_BIN_ID  = "6a1c03a021f9ee59d2a091e4";          // from jsonbin.io dashboard
const JSONBIN_API_KEY = "$2a$10$Z8Fo5H2LqszqZqv0e.g3Gu1gGlshI4g6aKfOk5Hp3VL/gVXpqqMwG";          // Master Key from Account > API Keys
const JSONBIN_URL     = `https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`;

// ─────────────────────────────────────────────
// EMPTY JSON STRUCTURE FOR JSONBIN INITIAL SETUP
// {
//   "settings": {
//     "groupName": "Grow Together Team",
//     "startMonth": "2026-02",
//     "monthlyAmounts": {},
//     "interestRate": 1,
//     "deadline": 10
//   },
//   "members": [],
//   "payments": {},
//   "loans": [],
//   "adjustments": []
// }
// ─────────────────────────────────────────────

const SEED = {
  settings: {
    groupName: "Grow Together Team",
    startMonth: "2026-02",
    monthlyAmounts: { "2026-02":100,"2026-03":100,"2026-04":100,"2026-05":1000 },
    interestRate: 1,
    deadline: 10,
  },
  members: [
    { id:1, name:"Veeranna", role:"admin",  pin:"1234", joined:"2026-02", phone:"", email:"" },
    { id:2, name:"Anusha",   role:"member", pin:"0000", joined:"2026-02", phone:"", email:"" },
    { id:3, name:"Krishna",  role:"member", pin:"0000", joined:"2026-02", phone:"", email:"" },
    { id:4, name:"Santosh",  role:"member", pin:"0000", joined:"2026-02", phone:"", email:"" },
    { id:5, name:"Channa",   role:"member", pin:"0000", joined:"2026-02", phone:"", email:"" },
    { id:6, name:"Chandru",  role:"member", pin:"0000", joined:"2026-02", phone:"", email:"" },
    { id:7, name:"Ashok",    role:"member", pin:"0000", joined:"2026-02", phone:"", email:"" },
  ],
  payments: {
    "1_2026-02":100,"2_2026-02":100,"3_2026-02":100,"4_2026-02":100,
    "5_2026-02":100,"6_2026-02":100,"7_2026-02":100,
    "1_2026-03":100,"2_2026-03":100,"3_2026-03":100,"4_2026-03":100,
    "5_2026-03":100,"6_2026-03":100,"7_2026-03":100,
    "1_2026-04":100,"2_2026-04":100,"3_2026-04":100,"4_2026-04":100,
    "5_2026-04":100,"6_2026-04":100,"7_2026-04":100,
  },
  loans: [],
  adjustments: [],
};

// ─────────────────────────────────────────────
// THEME TOKENS
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
// UTILS
// ─────────────────────────────────────────────
const nowYM = () => { const d = new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"); };
const fmt = n => "₹"+Number(n||0).toLocaleString("en-IN");
const monthLabel = ym => { if(!ym) return ""; const [y,m]=ym.split("-"); return new Date(y,m-1,1).toLocaleString("default",{month:"long",year:"numeric"}); };
const initials = name => name.split(" ").slice(0,2).map(w=>w[0]).join("").toUpperCase();
const nextId = arr => arr.length ? Math.max(...arr.map(x=>x.id))+1 : 1;
const USER_KEY = "gtt-current-user-v4";
const THEME_KEY = "gtt-theme-v4";
const LOCAL_FALLBACK_KEY = "gtt-fallback-v4";

function getMonthsBetween(start, end) {
  const months=[];
  let [sy,sm]=start.split("-").map(Number);
  const [ey,em]=end.split("-").map(Number);
  while(sy<ey||(sy===ey&&sm<=em)){
    months.push(sy+"-"+String(sm).padStart(2,"0"));
    sm++; if(sm>12){sm=1;sy++;}
  }
  return months;
}

// ─────────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────────
export default function App() {
  const [db, setDb]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [syncErr, setSyncErr] = useState(false);
  const [user, setUser]       = useState(() => {
    try { const s=localStorage.getItem(USER_KEY); return s?JSON.parse(s):null; } catch { return null; }
  });
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem(THEME_KEY)||"light"; } catch { return "light"; }
  });
  const [tab, setTab]   = useState("home");
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState(null);
  const T = THEMES[theme];

  // ── JSONBIN STORAGE ──
  const loadData = useCallback(async () => {
    // If no bin configured, use seed / localStorage fallback
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
      const res = await fetch(JSONBIN_URL+"/latest", {
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
    // Always save to localStorage as fallback
    try { localStorage.setItem(LOCAL_FALLBACK_KEY, JSON.stringify(newDb)); } catch {}
    // Save to JSONBin if configured
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

  const showToast = (msg, type="success") => {
    setToast({msg, type});
    setTimeout(()=>setToast(null), 2800);
  };

  const toggleTheme = () => {
    const next = theme==="light"?"dark":"light";
    setTheme(next);
    try { localStorage.setItem(THEME_KEY,next); } catch {}
  };

  if (loading) return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100vh",gap:16,background:THEMES.light.bg,fontFamily:"system-ui,sans-serif"}}>
      <div style={{fontSize:48}}>🤝</div>
      <div style={{color:THEMES.light.accent,fontWeight:700,fontSize:17,letterSpacing:-0.3}}>Loading GTT…</div>
      <div style={{width:40,height:3,background:THEMES.light.accent,borderRadius:2,animation:"pulse 1s infinite"}}/>
    </div>
  );

  if (!user) return <LoginScreen db={db} onLogin={setUser} T={T} theme={theme} toggleTheme={toggleTheme}/>;

  const isAdmin = user.role === "admin";

  return (
    <div style={{maxWidth:480,margin:"0 auto",minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,-apple-system,sans-serif",position:"relative"}}>
      <style>{`
        @keyframes fadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.5}}
        .tab-btn:active{transform:scale(0.97);}
        .btn-press:active{transform:scale(0.98);}
        input,select,textarea{color-scheme:${theme};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:${T.borderAlt};border-radius:3px;}
      `}</style>

      {/* FIXED HEADER */}
      <div style={{position:"sticky",top:0,zIndex:200,background:T.headerBg,borderBottom:`1px solid ${T.border}`,boxShadow:T.shadow}}>
        <div style={{padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:34,height:34,borderRadius:10,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🤝</div>
            <div>
              <div style={{fontSize:15,fontWeight:800,color:T.text,letterSpacing:-0.5,lineHeight:1.2}}>GTT</div>
              <div style={{fontSize:10,color:T.textMuted,letterSpacing:0.3}}>
                {saving ? "⟳ Syncing…" : syncErr ? "⚠ Offline" : "● Live"}
              </div>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <button onClick={toggleTheme} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"5px 8px",cursor:"pointer",fontSize:14,color:T.textSec}}>
              {theme==="light"?"🌙":"☀️"}
            </button>
            <div style={{display:"flex",alignItems:"center",gap:6,background:T.surfaceAlt,borderRadius:10,padding:"5px 10px",border:`1px solid ${T.border}`}}>
              <div style={{width:24,height:24,borderRadius:12,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"white"}}>
                {initials(user.name)}
              </div>
              <span style={{fontSize:12,fontWeight:700,color:T.text}}>{user.name.split(" ")[0]}</span>
              {isAdmin && <span style={{fontSize:9,fontWeight:800,background:T.warn,color:"white",padding:"1px 5px",borderRadius:4}}>ADMIN</span>}
              <span onClick={()=>{localStorage.removeItem(USER_KEY);setUser(null);}} style={{fontSize:11,color:T.textMuted,cursor:"pointer",marginLeft:2}}>✕</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",top:68,left:"50%",transform:"translateX(-50%)",background:toast.type==="success"?T.success:toast.type==="warn"?T.warn:T.danger,color:"white",padding:"9px 18px",borderRadius:10,zIndex:999,fontWeight:700,fontSize:13,boxShadow:T.shadowMd,animation:"fadeIn 0.2s ease",whiteSpace:"nowrap"}}>
          {toast.msg}
        </div>
      )}

      {/* CONTENT */}
      <div style={{flex:1,overflowY:"auto",paddingBottom:70}}>
        {tab==="home"    && <HomeScreen    db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} openModal={(t,d)=>setModal({type:t,data:d})} T={T}/>}
        {tab==="members" && <MembersScreen db={db} user={user} isAdmin={isAdmin} openModal={(t,d)=>setModal({type:t,data:d})} T={T}/>}
        {tab==="loans"   && <LoansScreen   db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} openModal={(t,d)=>setModal({type:t,data:d})} T={T}/>}
        {tab==="reports" && <ReportsScreen db={db} T={T}/>}
        {tab==="admin"   && isAdmin && <AdminScreen db={db} saveData={saveData} showToast={showToast} T={T}/>}
      </div>

      {/* BOTTOM NAV */}
      <BottomNav tab={tab} setTab={setTab} isAdmin={isAdmin} T={T}/>

      {/* MODAL */}
      {modal && (
        <ModalLayer modal={modal} db={db} user={user} isAdmin={isAdmin} saveData={saveData} showToast={showToast} onClose={()=>setModal(null)} T={T}/>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// LOGIN – Modern card picker
// ─────────────────────────────────────────────
function LoginScreen({db, onLogin, T, theme, toggleTheme}) {
  const [sel, setSel] = useState(null);
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [step, setStep] = useState(1); // 1=pick member, 2=enter pin
  const pinRef = useRef(null);

  const pickMember = (m) => {
    setSel(m); setPin(""); setErr(""); setStep(2);
    setTimeout(()=>pinRef.current?.focus(),200);
  };

  const login = () => {
    if (!sel || sel.pin !== pin) { setErr("Wrong PIN. Try again."); setPin(""); return; }
    setErr("");
    try { localStorage.setItem(USER_KEY, JSON.stringify(sel)); } catch {}
    onLogin(sel);
  };

  const inputPin = (digit) => {
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
    <div style={{minHeight:"100vh",background:T.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif"}}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{position:"absolute",top:14,right:14}}>
        <button onClick={toggleTheme} style={{background:T.surfaceAlt,border:`1px solid ${T.border}`,borderRadius:8,padding:"6px 10px",cursor:"pointer",fontSize:15,color:T.textSec}}>{theme==="light"?"🌙":"☀️"}</button>
      </div>

      <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"30px 20px",maxWidth:420,margin:"0 auto",width:"100%"}}>
        {/* Logo */}
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:64,height:64,borderRadius:20,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,margin:"0 auto 12px"}}>🤝</div>
          <div style={{fontSize:26,fontWeight:800,color:T.text,letterSpacing:-0.8}}>Grow Together</div>
          <div style={{fontSize:13,color:T.textMuted,marginTop:4}}>GTT · Financial Unity & Security</div>
        </div>

        {step === 1 && (
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{fontSize:14,fontWeight:700,color:T.textSec,marginBottom:14,textAlign:"center"}}>Who are you?</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {db.members.map(m => (
                <div key={m.id} onClick={()=>pickMember(m)} className="btn-press" style={{background:T.surface,border:`1.5px solid ${T.border}`,borderRadius:14,padding:"14px 10px",cursor:"pointer",textAlign:"center",transition:"all 0.15s",display:"flex",flexDirection:"column",alignItems:"center",gap:8,boxShadow:T.shadow}}>
                  <div style={{width:44,height:44,borderRadius:22,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"white"}}>
                    {initials(m.name)}
                  </div>
                  <div style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1.2}}>{m.name}</div>
                  {m.role==="admin" && <span style={{fontSize:9,fontWeight:800,background:T.warn,color:"white",padding:"2px 6px",borderRadius:4}}>ADMIN</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && sel && (
          <div style={{animation:"fadeIn 0.25s ease"}}>
            <div style={{textAlign:"center",marginBottom:20}}>
              <div style={{width:56,height:56,borderRadius:28,background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:800,color:"white",margin:"0 auto 10px"}}>
                {initials(sel.name)}
              </div>
              <div style={{fontSize:17,fontWeight:800,color:T.text}}>{sel.name}</div>
              <div style={{fontSize:13,color:T.textMuted,marginTop:4}}>Enter your 4-digit PIN</div>
            </div>

            {/* PIN dots */}
            <div style={{display:"flex",gap:14,justifyContent:"center",marginBottom:24}}>
              {[0,1,2,3].map(i=>(
                <div key={i} style={{width:18,height:18,borderRadius:9,background:i<pin.length?T.accent:T.surfaceAlt,border:`2px solid ${i<pin.length?T.accent:T.borderAlt}`,transition:"all 0.15s"}}/>
              ))}
            </div>

            {err && <div style={{color:T.danger,fontSize:13,fontWeight:600,textAlign:"center",marginBottom:14}}>{err}</div>}

            {/* Number pad */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,maxWidth:280,margin:"0 auto"}}>
              {[1,2,3,4,5,6,7,8,9,"",0,"⌫"].map((d,i)=>(
                <div key={i} onClick={()=>{
                  if(d==="") return;
                  if(d==="⌫") { setPin(p=>p.slice(0,-1)); setErr(""); }
                  else inputPin(String(d));
                }} className="btn-press" style={{
                  background:d===""?"transparent":T.surface,
                  border:d===""?"none":`1.5px solid ${T.border}`,
                  borderRadius:14,padding:"15px 0",textAlign:"center",
                  fontSize:d==="⌫"?18:20,fontWeight:600,color:T.text,
                  cursor:d===""?"default":"pointer",
                  userSelect:"none",
                  boxShadow:d===""?"none":T.shadow,
                }}>
                  {d}
                </div>
              ))}
            </div>

            <div onClick={()=>{setStep(1);setSel(null);setPin("");setErr("");}} style={{textAlign:"center",marginTop:18,color:T.accent,fontSize:13,fontWeight:600,cursor:"pointer"}}>
              ← Change member
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// HOME
// ─────────────────────────────────────────────
function HomeScreen({db, user, isAdmin, saveData, showToast, openModal, T}) {
  const ym = nowYM();
  const months = getMonthsBetween(db.settings.startMonth, ym);
  const eligible = db.members.filter(m=>m.joined<=ym);
  const paidThis = eligible.filter(m=>db.payments[`${m.id}_${ym}`]);
  const thisAmt = db.settings.monthlyAmounts[ym]||0;
  const thisCollected = paidThis.length * thisAmt;
  const totalCollected = Object.entries(db.payments).reduce((s,[,v])=>s+v,0);
  const onLoan = db.loans.filter(l=>l.status==="active").reduce((s,l)=>s+(l.amount-l.repaid),0);
  const available = totalCollected - onLoan;
  const myPaid = !!db.payments[`${user.id}_${ym}`];
  const pct = eligible.length ? (paidThis.length/eligible.length*100) : 0;

  return (
    <div style={{padding:"14px 14px"}}>
      {/* Stats grid */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:14}}>
        {[
          {label:"Total Fund",   value:fmt(totalCollected), icon:"🏦", c:T.accent},
          {label:"Available",    value:fmt(available),      icon:"✅", c:T.success},
          {label:"This Month",   value:fmt(thisCollected),  icon:"📅", c:T.warn},
          {label:"On Loan",      value:fmt(onLoan),         icon:"💸", c:T.danger},
        ].map(s=>(
          <div key={s.label} style={{background:T.surface,borderRadius:14,padding:"12px 14px",border:`1px solid ${T.border}`,boxShadow:T.shadow}}>
            <div style={{fontSize:20,marginBottom:6}}>{s.icon}</div>
            <div style={{fontSize:18,fontWeight:800,color:s.c,letterSpacing:-0.5,fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            <div style={{fontSize:11,color:T.textMuted,fontWeight:600,marginTop:2}}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* My status */}
      <div style={{background:myPaid?T.successLight:T.warnLight,borderRadius:14,padding:"12px 14px",border:`1px solid ${myPaid?T.success:T.warn}22`,marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
        <span style={{fontSize:28}}>{myPaid?"✅":"⚠️"}</span>
        <div>
          <div style={{fontSize:15,fontWeight:800,color:myPaid?T.success:T.warn}}>{myPaid?"Paid":"Pending"}</div>
          <div style={{fontSize:12,color:T.textSec,marginTop:2}}>{myPaid?`Contribution recorded for ${monthLabel(ym)}`:`Please pay ${fmt(thisAmt)} by 10th`}</div>
        </div>
      </div>

      {/* This month progress */}
      <Card T={T} style={{marginBottom:14}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <CardTitle T={T}>This Month</CardTitle>
          <span style={{fontSize:12,fontWeight:700,color:T.textSec}}>{paidThis.length}/{eligible.length}</span>
        </div>
        <div style={{fontSize:22,fontWeight:800,color:T.text,marginBottom:10,fontVariantNumeric:"tabular-nums"}}>{fmt(thisCollected)}</div>
        <div style={{height:6,background:T.surfaceAlt,borderRadius:3,overflow:"hidden",marginBottom:14}}>
          <div style={{height:"100%",background:T.accent,width:`${pct}%`,borderRadius:3,transition:"width 0.6s"}}/>
        </div>
        {eligible.map(m=>{
          const p=!!db.payments[`${m.id}_${ym}`];
          return (
            <div key={m.id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
              <Avatar name={m.name} size={32} T={T}/>
              <div style={{flex:1,fontSize:13,fontWeight:600,color:T.text}}>{m.name}</div>
              <span style={{fontSize:11,fontWeight:700,padding:"3px 10px",borderRadius:20,background:p?T.successLight:T.dangerLight,color:p?T.success:T.danger}}>{p?"✓ Paid":"Pending"}</span>
            </div>
          );
        })}
      </Card>

      {isAdmin && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
          <Btn T={T} color="accent" onClick={()=>openModal("bulkPayment",null)}>+ Bulk Payment</Btn>
          <Btn T={T} color="warn"   onClick={()=>openModal("loan",null)}>+ Add Loan</Btn>
        </div>
      )}

      {/* History */}
      <Card T={T}>
        <CardTitle T={T}>Month History</CardTitle>
        {months.slice().reverse().map(mo=>{
          const mAmt = db.settings.monthlyAmounts[mo]||0;
          const mEl  = db.members.filter(m=>m.joined<=mo);
          const mPaid = mEl.filter(m=>db.payments[`${m.id}_${mo}`]).length;
          return (
            <div key={mo} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:T.text}}>{monthLabel(mo)}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{mPaid}/{mEl.length} paid · {fmt(mAmt)}/member</div>
              </div>
              <div style={{fontSize:14,fontWeight:800,color:T.accent,fontVariantNumeric:"tabular-nums"}}>{fmt(mPaid*mAmt)}</div>
            </div>
          );
        })}
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────
// MEMBERS
// ─────────────────────────────────────────────
function MembersScreen({db, user, isAdmin, openModal, T}) {
  return (
    <div style={{padding:"14px 14px"}}>
      {isAdmin && <Btn T={T} color="accent" onClick={()=>openModal("addMember",null)} style={{marginBottom:14}}>+ Add Member</Btn>}
      <SectionTitle T={T}>All Members ({db.members.length})</SectionTitle>
      {db.members.map(m=>{
        const total = Object.entries(db.payments).filter(([k])=>k.startsWith(`${m.id}_`)).reduce((s,[,v])=>s+v,0);
        const loans = db.loans.filter(l=>l.memberId===m.id&&l.status==="active").length;
        return (
          <Card key={m.id} T={T} onClick={()=>openModal("memberDetail",m)} style={{cursor:"pointer",marginBottom:10}}>
            <div style={{display:"flex",gap:12,alignItems:"center"}}>
              <Avatar name={m.name} size={44} T={T}/>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                  <span style={{fontWeight:800,fontSize:15,color:T.text}}>{m.name}</span>
                  {m.role==="admin" && <span style={{fontSize:9,fontWeight:800,background:T.warn,color:"white",padding:"2px 6px",borderRadius:4}}>ADMIN</span>}
                </div>
                <div style={{fontSize:11,color:T.textMuted}}>Joined {monthLabel(m.joined)}</div>
                <div style={{fontSize:12,color:T.textSec,marginTop:3}}>Total: <b style={{color:T.accent}}>{fmt(total)}</b> · Active loans: {loans}</div>
              </div>
              <span style={{color:T.textMuted,fontSize:18}}>›</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────
// LOANS
// ─────────────────────────────────────────────
function LoansScreen({db, user, isAdmin, saveData, showToast, openModal, T}) {
  const [lt, setLt] = useState("active");
  const filtered = db.loans.filter(l=>l.status===lt);
  return (
    <div style={{padding:"14px 14px"}}>
      <div style={{display:"flex",background:T.surfaceAlt,borderRadius:10,padding:3,marginBottom:14,gap:3}}>
        {["active","pending","closed"].map(t=>(
          <div key={t} onClick={()=>setLt(t)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:12,background:lt===t?T.surface:"transparent",color:lt===t?T.accent:T.textMuted,transition:"all 0.15s",boxShadow:lt===t?T.shadow:"none"}}>
            {t.charAt(0).toUpperCase()+t.slice(1)}
          </div>
        ))}
      </div>
      {!filtered.length && <div style={{textAlign:"center",color:T.textMuted,padding:30,fontWeight:600}}>No {lt} loans.</div>}
      {filtered.map(l=>{
        const m = db.members.find(x=>x.id===l.memberId);
        const out = l.amount - l.repaid;
        return (
          <Card key={l.id} T={T} onClick={()=>openModal("loanDetail",l)} style={{cursor:"pointer",marginBottom:10,borderLeft:`3px solid ${lt==="pending"?T.warn:lt==="closed"?T.textMuted:T.accent}`}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div>
                <div style={{fontWeight:800,fontSize:15,color:T.text,marginBottom:3}}>{m?.name}</div>
                <div style={{fontSize:11,color:T.textMuted}}>{l.type==="emergency"?"🏥 Emergency (No Interest)":"💼 Personal (1%/mo)"}</div>
                <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>Due: {monthLabel(l.repayDate)} · Out: {fmt(out)}</div>
              </div>
              <div style={{fontSize:16,fontWeight:800,color:T.accent,fontVariantNumeric:"tabular-nums"}}>{fmt(l.amount)}</div>
            </div>
          </Card>
        );
      })}
      {isAdmin && <Btn T={T} color="warn" onClick={()=>openModal("loan",null)} style={{marginTop:8}}>+ Add Loan</Btn>}
    </div>
  );
}

// ─────────────────────────────────────────────
// REPORTS
// ─────────────────────────────────────────────
function ReportsScreen({db, T}) {
  const [rt, setRt] = useState("monthly");
  const ym = nowYM();
  const months = getMonthsBetween(db.settings.startMonth, ym);
  const totalCollected = Object.entries(db.payments).reduce((s,[,v])=>s+v,0);
  const onLoan = db.loans.filter(l=>l.status==="active").reduce((s,l)=>s+(l.amount-l.repaid),0);
  const available = totalCollected - onLoan;
  const eligible = db.members.filter(m=>m.joined<=ym);
  const paidThis = eligible.filter(m=>db.payments[`${m.id}_${ym}`]);
  const unpaidThis = eligible.filter(m=>!db.payments[`${m.id}_${ym}`]);
  const thisAmt = db.settings.monthlyAmounts[ym]||0;
  const last6 = months.slice(-6);
  const waMsg = `🤝 *GROW TOGETHER TEAM (GTT)*\n${"─".repeat(22)}\n📅 *${monthLabel(ym)} Report*\n\n💰 *This Month:* ${fmt(paidThis.length*thisAmt)}\n🏦 *Total:* ${fmt(totalCollected)}\n📤 *On Loan:* ${fmt(onLoan)}\n✅ *Available:* ${fmt(available)}\n\n👥 *Paid (${paidThis.length}):* ${paidThis.map(m=>m.name).join(", ")||"—"}\n⚠️ *Pending (${unpaidThis.length}):* ${unpaidThis.map(m=>m.name).join(", ")||"All Clear! 🎉"}\n\n_No member should struggle alone. We grow together_ 🌱`;

  return (
    <div style={{padding:"14px 14px"}}>
      <div style={{display:"flex",background:T.surfaceAlt,borderRadius:10,padding:3,marginBottom:14,gap:3}}>
        {["monthly","6month","share"].map(t=>(
          <div key={t} onClick={()=>setRt(t)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,background:rt===t?T.surface:"transparent",color:rt===t?T.accent:T.textMuted,transition:"all 0.15s",boxShadow:rt===t?T.shadow:"none"}}>
            {t==="monthly"?"Monthly":t==="6month"?"6-Month":"Share 📤"}
          </div>
        ))}
      </div>

      {rt==="monthly" && (
        <>
          <Card T={T} style={{marginBottom:12}}>
            <CardTitle T={T}>📅 {monthLabel(ym)}</CardTitle>
            <RRow T={T} label="This Month" value={fmt(paidThis.length*thisAmt)} color={T.accent}/>
            <RRow T={T} label="Rate" value={fmt(thisAmt)+"/member"}/>
            <RRow T={T} label="Total Fund" value={fmt(totalCollected)} color={T.accent}/>
            <RRow T={T} label="On Loan" value={fmt(onLoan)} color={T.warn}/>
            <RRow T={T} label="Available" value={fmt(available)} color={T.success}/>
            <RRow T={T} label={`Paid (${paidThis.length})`} value={paidThis.map(m=>m.name).join(", ")||"—"} color={T.success}/>
            <RRow T={T} label={`Pending (${unpaidThis.length})`} value={unpaidThis.map(m=>m.name).join(", ")||"All paid 🎉"} color={unpaidThis.length?T.danger:T.success}/>
          </Card>
          <Card T={T}>
            <CardTitle T={T}>All-Time Contributions</CardTitle>
            {db.members.map(m=>{
              const tot=Object.entries(db.payments).filter(([k])=>k.startsWith(`${m.id}_`)).reduce((s,[,v])=>s+v,0);
              return <RRow T={T} key={m.id} label={m.name} value={fmt(tot)} color={T.accent}/>;
            })}
          </Card>
        </>
      )}

      {rt==="6month" && (
        <>
          <Card T={T} style={{marginBottom:12}}>
            <CardTitle T={T}>📊 Last 6 Months</CardTitle>
            {last6.map(mo=>{
              const mAmt=db.settings.monthlyAmounts[mo]||0;
              const mEl=db.members.filter(m=>m.joined<=mo);
              const mPaid=mEl.filter(m=>db.payments[`${m.id}_${mo}`]).length;
              return (
                <div key={mo} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 0",borderBottom:`1px solid ${T.border}`}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:T.text}}>{monthLabel(mo)}</div>
                    <div style={{fontSize:11,color:T.textMuted}}>{mPaid}/{mEl.length} · {fmt(mAmt)}/member</div>
                  </div>
                  <div style={{fontWeight:700,color:T.accent,fontVariantNumeric:"tabular-nums"}}>{fmt(mPaid*mAmt)}</div>
                </div>
              );
            })}
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0 0",borderTop:`2px solid ${T.accent}`,marginTop:4}}>
              <span style={{fontWeight:800,color:T.text}}>6-Month Total</span>
              <span style={{fontWeight:800,color:T.accent}}>{fmt(last6.reduce((s,mo)=>{const mAmt=db.settings.monthlyAmounts[mo]||0;const mEl=db.members.filter(m=>m.joined<=mo);return s+mEl.filter(m=>db.payments[`${m.id}_${mo}`]).length*mAmt;},0))}</span>
            </div>
          </Card>
          <Card T={T}>
            <CardTitle T={T}>Member-wise (Last 6 Months)</CardTitle>
            {db.members.map(m=>{
              const tot=last6.reduce((s,mo)=>s+(db.payments[`${m.id}_${mo}`]||0),0);
              const cnt=last6.filter(mo=>db.payments[`${m.id}_${mo}`]).length;
              return <RRow T={T} key={m.id} label={m.name} value={`${fmt(tot)} (${cnt}/6)`} color={T.accent}/>;
            })}
          </Card>
        </>
      )}

      {rt==="share" && (
        <Card T={T}>
          <CardTitle T={T}>📲 Share Report</CardTitle>
          <div style={{background:T.surfaceAlt,borderRadius:10,padding:14,fontSize:12,lineHeight:1.7,color:T.textSec,whiteSpace:"pre-wrap",marginBottom:12,border:`1px solid ${T.border}`,fontFamily:"monospace"}}>
            {waMsg}
          </div>
          <Btn T={T} color="success" onClick={()=>window.open("https://wa.me/?text="+encodeURIComponent(waMsg),"_blank")} style={{marginBottom:8}}>📤 Share on WhatsApp</Btn>
          <Btn T={T} color="accent" onClick={()=>navigator.clipboard.writeText(waMsg).then(()=>alert("Copied!"))}>📋 Copy Text</Btn>
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────
function AdminScreen({db, saveData, showToast, T}) {
  const [adminTab, setAdminTab] = useState("payments");
  const ym = nowYM();
  const [selMonth, setSelMonth] = useState(ym);
  const [monthAmt, setMonthAmt] = useState(db.settings.monthlyAmounts[selMonth]||1000);

  useEffect(()=>{ setMonthAmt(db.settings.monthlyAmounts[selMonth]||1000); },[selMonth,db]);

  const eligible = db.members.filter(m=>m.joined<=selMonth);

  // ── BULK TOGGLE: mark ALL as paid for selected month ──
  const markAllPaid = () => {
    const amt = parseFloat(monthAmt)||0;
    if (!amt) { showToast("Set amount first","warn"); return; }
    const newPay = {...db.payments};
    eligible.forEach(m=>{ newPay[`${m.id}_${selMonth}`] = amt; });
    saveData({...db, payments:newPay});
    showToast(`All ${eligible.length} members marked paid ✅`);
  };

  const markAllUnpaid = () => {
    const newPay = {...db.payments};
    eligible.forEach(m=>{ delete newPay[`${m.id}_${selMonth}`]; });
    saveData({...db, payments:newPay});
    showToast("All cleared");
  };

  const togglePayment = (memberId) => {
    const key=`${memberId}_${selMonth}`;
    const newPay={...db.payments};
    if(newPay[key]) delete newPay[key];
    else newPay[key]=parseFloat(monthAmt)||0;
    saveData({...db,payments:newPay});
  };

  const saveMonthAmount = () => {
    const newDb={...db,settings:{...db.settings,monthlyAmounts:{...db.settings.monthlyAmounts,[selMonth]:parseFloat(monthAmt)||0}}};
    saveData(newDb);
    showToast(`Rate set to ${fmt(monthAmt)} for ${monthLabel(selMonth)}`);
  };

  const [adjType,setAdjType]=useState("credit");
  const [adjAmt,setAdjAmt]=useState("");
  const [adjReason,setAdjReason]=useState("");
  const addAdj = () => {
    if(!adjAmt||!adjReason){showToast("Fill all fields","warn");return;}
    saveData({...db,adjustments:[...db.adjustments,{id:Date.now(),type:adjType,amount:parseFloat(adjAmt),reason:adjReason,date:ym}]});
    setAdjAmt(""); setAdjReason(""); showToast("Adjustment saved!");
  };

  const paidCount = eligible.filter(m=>db.payments[`${m.id}_${selMonth}`]).length;

  return (
    <div style={{padding:"14px 14px"}}>
      <div style={{display:"flex",background:T.surfaceAlt,borderRadius:10,padding:3,marginBottom:14,gap:3}}>
        {["payments","settings","adjust"].map(t=>(
          <div key={t} onClick={()=>setAdminTab(t)} style={{flex:1,textAlign:"center",padding:"8px 4px",borderRadius:8,cursor:"pointer",fontWeight:700,fontSize:11,background:adminTab===t?T.surface:"transparent",color:adminTab===t?T.accent:T.textMuted,transition:"all 0.15s",boxShadow:adminTab===t?T.shadow:"none"}}>
            {t==="payments"?"Payments":t==="settings"?"Settings":"Adjustments"}
          </div>
        ))}
      </div>

      {adminTab==="payments" && (
        <Card T={T}>
          <CardTitle T={T}>Mark Payments</CardTitle>
          <Label T={T}>Month</Label>
          <input type="month" value={selMonth} onChange={e=>setSelMonth(e.target.value)} style={inpStyle(T)}/>
          <div style={{display:"flex",gap:8,alignItems:"flex-end",margin:"10px 0 14px"}}>
            <div style={{flex:1}}>
              <Label T={T}>Amount per Member (₹)</Label>
              <input type="number" value={monthAmt} onChange={e=>setMonthAmt(e.target.value)} style={inpStyle(T)}/>
            </div>
            <button onClick={saveMonthAmount} style={{...btnSt(T,"accent"),padding:"10px 14px",fontSize:12,whiteSpace:"nowrap",width:"auto"}}>Set</button>
          </div>

          {/* BULK ACTION BAR */}
          <div style={{background:T.accentLight,borderRadius:10,padding:"10px 12px",marginBottom:14,border:`1px solid ${T.accent}33`}}>
            <div style={{fontSize:12,fontWeight:700,color:T.accentText,marginBottom:8}}>⚡ Bulk Actions — {monthLabel(selMonth)}</div>
            <div style={{fontSize:12,color:T.textSec,marginBottom:10}}>
              {paidCount}/{eligible.length} paid · Total: {fmt(paidCount*(parseFloat(monthAmt)||0))}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button onClick={markAllPaid} style={{...btnSt(T,"success"),padding:"9px",fontSize:12}}>✅ Mark All Paid</button>
              <button onClick={markAllUnpaid} style={{...btnSt(T,"danger"),padding:"9px",fontSize:12}}>✕ Clear All</button>
            </div>
          </div>

          <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>Or toggle individually:</div>
          {eligible.map(m=>{
            const paid=!!db.payments[`${m.id}_${selMonth}`];
            return (
              <div key={m.id} onClick={()=>togglePayment(m.id)} style={{display:"flex",alignItems:"center",gap:12,padding:"12px 0",borderBottom:`1px solid ${T.border}`,cursor:"pointer"}}>
                <Avatar name={m.name} size={36} T={T}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:14,color:T.text}}>{m.name}</div>
                  <div style={{fontSize:11,color:paid?T.success:T.danger,marginTop:1}}>{paid?`Paid ${fmt(parseFloat(monthAmt)||0)}`:"Unpaid"}</div>
                </div>
                <div style={{width:26,height:26,borderRadius:13,border:`2px solid ${paid?T.success:T.border}`,background:paid?T.success:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,color:"white",transition:"all 0.15s"}}>{paid?"✓":""}</div>
              </div>
            );
          })}
        </Card>
      )}

      {adminTab==="settings" && (
        <Card T={T}>
          <CardTitle T={T}>Monthly Rate History</CardTitle>
          {Object.entries(db.settings.monthlyAmounts).sort().map(([mo,amt])=>(
            <RRow T={T} key={mo} label={monthLabel(mo)} value={fmt(amt)}/>
          ))}
          <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${T.border}`,fontSize:12,color:T.textMuted}}>
            To add new month rate: go to Payments tab → select month → set amount → tap Set.
          </div>
        </Card>
      )}

      {adminTab==="adjust" && (
        <Card T={T}>
          <CardTitle T={T}>Fund Adjustments</CardTitle>
          <Label T={T}>Type</Label>
          <select value={adjType} onChange={e=>setAdjType(e.target.value)} style={selStyle(T)}>
            <option value="credit">Credit (Add funds)</option>
            <option value="debit">Debit (Deduct)</option>
          </select>
          <Label T={T} style={{marginTop:10}}>Amount (₹)</Label>
          <input type="number" value={adjAmt} onChange={e=>setAdjAmt(e.target.value)} placeholder="0" style={inpStyle(T)}/>
          <Label T={T} style={{marginTop:10}}>Reason</Label>
          <input type="text" value={adjReason} onChange={e=>setAdjReason(e.target.value)} placeholder="Interest earned, expense…" style={inpStyle(T)}/>
          <Btn T={T} color="accent" onClick={addAdj} style={{marginTop:14}}>Save Adjustment</Btn>
          {db.adjustments.length>0 && (
            <div style={{marginTop:14}}>
              <CardTitle T={T}>History</CardTitle>
              {db.adjustments.map(a=>(
                <RRow T={T} key={a.id} label={a.reason+" ("+monthLabel(a.date)+")"} value={(a.type==="credit"?"+":"-")+fmt(a.amount)} color={a.type==="credit"?T.success:T.danger}/>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// MODAL LAYER
// ─────────────────────────────────────────────
function ModalLayer({modal, db, user, isAdmin, saveData, showToast, onClose, T}) {
  const {type, data} = modal;
  const ym = nowYM();
  const [form, setForm] = useState({
    memberId: db.members[0]?.id||"",
    month: ym,
    amount: db.settings.monthlyAmounts[ym]||1000,
    note:"",
    loanType:"emergency",
    loanAmount:"",
    reason:"",
    repayDate:"",
    loanStatus: isAdmin?"active":"pending",
    name:"", phone:"", role:"member", pin:"", joined:ym,
  });
  const set = (k,v) => setForm(p=>({...p,[k]:v}));
  const [repayAmt, setRepayAmt] = useState("");

  // ── BULK PAYMENT STATE ──
  const [bpMonth, setBpMonth] = useState(ym);
  const [bpAmt,   setBpAmt]   = useState(db.settings.monthlyAmounts[ym]||1000);
  const [bpSel,   setBpSel]   = useState({}); // { memberId: true/false }
  const bpEligible = db.members.filter(m=>m.joined<=bpMonth);

  useEffect(()=>{
    // default: select only unpaid members
    const init={};
    bpEligible.forEach(m=>{ if(!db.payments[`${m.id}_${bpMonth}`]) init[m.id]=true; });
    setBpSel(init);
  },[bpMonth]);

  const bpSelectedIds = Object.entries(bpSel).filter(([,v])=>v).map(([k])=>parseInt(k));
  const bpTotal = bpSelectedIds.length * (parseFloat(bpAmt)||0);

  const saveBulkPayment = () => {
    if(!bpSelectedIds.length){showToast("Select at least one member","warn");return;}
    const newPay={...db.payments};
    bpSelectedIds.forEach(id=>{ newPay[`${id}_${bpMonth}`]=parseFloat(bpAmt)||0; });
    saveData({...db,payments:newPay});
    showToast(`${bpSelectedIds.length} payments recorded ✅`);
    onClose();
  };

  const savePayment = () => {
    const key=`${form.memberId}_${form.month}`;
    if(db.payments[key]){showToast("Already recorded","warn");return;}
    saveData({...db,payments:{...db.payments,[key]:parseFloat(form.amount)||0}});
    showToast("Payment recorded ✅"); onClose();
  };

  const saveLoan = () => {
    if(!form.loanAmount||!form.reason||!form.repayDate){showToast("Fill all fields","warn");return;}
    const loan={id:Date.now(),memberId:parseInt(form.memberId),type:form.loanType,amount:parseFloat(form.loanAmount),reason:form.reason,repayDate:form.repayDate,status:form.loanStatus,date:ym,repaid:0};
    saveData({...db,loans:[...db.loans,loan]});
    showToast("Loan added!"); onClose();
  };

  const saveMember = () => {
    if(!form.name||!form.pin||form.pin.length!==4){showToast("Fill all fields & 4-digit PIN","warn");return;}
    saveData({...db,members:[...db.members,{id:nextId(db.members),name:form.name,phone:form.phone,role:form.role,pin:form.pin,joined:form.joined,email:""}]});
    showToast("Member added ✅"); onClose();
  };

  const doRepay = (loanId) => {
    const loans=db.loans.map(l=>{
      if(l.id!==loanId) return l;
      const repaid=l.repaid+parseFloat(repayAmt||0);
      return {...l,repaid,status:repaid>=l.amount?"closed":l.status};
    });
    saveData({...db,loans}); showToast("Repayment recorded!"); onClose();
  };

  const approveLoan = (id) => { saveData({...db,loans:db.loans.map(l=>l.id===id?{...l,status:"active"}:l)}); showToast("Loan approved!"); onClose(); };
  const closeLoan   = (id) => { saveData({...db,loans:db.loans.map(l=>l.id===id?{...l,status:"closed"}:l)}); showToast("Loan closed!"); onClose(); };
  const removeMember = (id) => {
    if(!window.confirm("Remove member?")) return;
    saveData({...db,members:db.members.filter(m=>m.id!==id)}); showToast("Member removed"); onClose();
  };

  return (
    <div onClick={e=>{if(e.target===e.currentTarget)onClose();}} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:T.surface,borderRadius:"20px 20px 0 0",width:"100%",maxWidth:480,padding:20,maxHeight:"90vh",overflowY:"auto",border:`1px solid ${T.border}`,animation:"slideUp 0.25s ease"}}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>

        {/* ── BULK PAYMENT ── */}
        {type==="bulkPayment" && (
          <>
            <ModalTitle T={T} onClose={onClose}>⚡ Bulk Record Payments</ModalTitle>
            <div style={{display:"flex",gap:8,marginBottom:14,alignItems:"flex-end"}}>
              <div style={{flex:1}}>
                <Label T={T}>Month</Label>
                <input type="month" value={bpMonth} onChange={e=>{setBpMonth(e.target.value);setBpAmt(db.settings.monthlyAmounts[e.target.value]||bpAmt);}} style={inpStyle(T)}/>
              </div>
              <div style={{flex:1}}>
                <Label T={T}>Amount/Member (₹)</Label>
                <input type="number" value={bpAmt} onChange={e=>setBpAmt(e.target.value)} style={inpStyle(T)}/>
              </div>
            </div>

            {/* Select all / deselect all */}
            <div style={{display:"flex",gap:8,marginBottom:10}}>
              <button onClick={()=>{const s={};bpEligible.forEach(m=>s[m.id]=true);setBpSel(s);}} style={{...btnSt(T,"accent"),padding:"7px",fontSize:11,width:"auto",flex:1}}>Select All</button>
              <button onClick={()=>setBpSel({})} style={{...btnSt(T,"surface"),padding:"7px",fontSize:11,width:"auto",flex:1,border:`1px solid ${T.border}`}}>Clear All</button>
            </div>

            {/* Member list with checkboxes */}
            {bpEligible.map(m=>{
              const alreadyPaid = !!db.payments[`${m.id}_${bpMonth}`];
              const checked = !!bpSel[m.id];
              return (
                <div key={m.id} onClick={()=>{ if(!alreadyPaid) setBpSel(p=>({...p,[m.id]:!p[m.id]})); }} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 0",borderBottom:`1px solid ${T.border}`,cursor:alreadyPaid?"default":"pointer",opacity:alreadyPaid?0.5:1}}>
                  <div style={{width:22,height:22,borderRadius:6,border:`2px solid ${checked?T.accent:T.border}`,background:checked?T.accent:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"white",transition:"all 0.15s",flexShrink:0}}>
                    {checked?"✓":""}
                  </div>
                  <Avatar name={m.name} size={32} T={T}/>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:14,color:T.text}}>{m.name}</div>
                    <div style={{fontSize:11,color:alreadyPaid?T.success:T.textMuted}}>{alreadyPaid?`Already paid ${fmt(db.payments[`${m.id}_${bpMonth}`])}`:"Unpaid"}</div>
                  </div>
                  {checked && !alreadyPaid && <span style={{fontSize:12,fontWeight:700,color:T.accent}}>{fmt(parseFloat(bpAmt)||0)}</span>}
                </div>
              );
            })}

            {/* Total summary */}
            {bpSelectedIds.length>0 && (
              <div style={{background:T.accentLight,borderRadius:10,padding:"10px 14px",margin:"14px 0",border:`1px solid ${T.accent}33`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:13,fontWeight:600,color:T.accentText}}>{bpSelectedIds.length} member{bpSelectedIds.length>1?"s":""} selected</span>
                  <span style={{fontSize:16,fontWeight:800,color:T.accent}}>{fmt(bpTotal)}</span>
                </div>
                <div style={{fontSize:11,color:T.textSec,marginTop:3}}>{fmt(parseFloat(bpAmt)||0)} × {bpSelectedIds.length} member{bpSelectedIds.length>1?"s":""}</div>
              </div>
            )}

            <Btn T={T} color="accent" onClick={saveBulkPayment} disabled={!bpSelectedIds.length}>
              Record {bpSelectedIds.length} Payment{bpSelectedIds.length!==1?"s":""}
            </Btn>
          </>
        )}

        {/* ── SINGLE PAYMENT ── */}
        {type==="payment" && (
          <>
            <ModalTitle T={T} onClose={onClose}>Record Payment</ModalTitle>
            <Label T={T}>Member</Label>
            <select value={form.memberId} onChange={e=>set("memberId",e.target.value)} style={selStyle(T)}>
              {db.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <Label T={T} style={{marginTop:12}}>Month</Label>
            <input type="month" value={form.month} onChange={e=>set("month",e.target.value)} style={inpStyle(T)}/>
            <Label T={T} style={{marginTop:12}}>Amount (₹)</Label>
            <input type="number" value={form.amount} onChange={e=>set("amount",e.target.value)} style={inpStyle(T)}/>
            <Label T={T} style={{marginTop:12}}>Note</Label>
            <input type="text" value={form.note} onChange={e=>set("note",e.target.value)} placeholder="Cash, UPI…" style={inpStyle(T)}/>
            <Btn T={T} color="accent" onClick={savePayment} style={{marginTop:14}}>Record Payment</Btn>
          </>
        )}

        {/* ── LOAN ── */}
        {type==="loan" && (
          <>
            <ModalTitle T={T} onClose={onClose}>Add Loan</ModalTitle>
            <Label T={T}>Member</Label>
            <select value={form.memberId} onChange={e=>set("memberId",e.target.value)} style={selStyle(T)}>
              {db.members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <Label T={T} style={{marginTop:12}}>Type</Label>
            <select value={form.loanType} onChange={e=>set("loanType",e.target.value)} style={selStyle(T)}>
              <option value="emergency">🏥 Health Emergency (No Interest)</option>
              <option value="personal">💼 Personal (1%/month)</option>
            </select>
            <Label T={T} style={{marginTop:12}}>Amount (₹)</Label>
            <input type="number" value={form.loanAmount} onChange={e=>set("loanAmount",e.target.value)} placeholder="0" style={inpStyle(T)}/>
            <Label T={T} style={{marginTop:12}}>Reason</Label>
            <textarea value={form.reason} onChange={e=>set("reason",e.target.value)} placeholder="Explain the need…" style={{...inpStyle(T),minHeight:70,resize:"vertical"}}/>
            <Label T={T} style={{marginTop:12}}>Repayment Month</Label>
            <input type="month" value={form.repayDate} onChange={e=>set("repayDate",e.target.value)} style={inpStyle(T)}/>
            {isAdmin && (<><Label T={T} style={{marginTop:12}}>Status</Label><select value={form.loanStatus} onChange={e=>set("loanStatus",e.target.value)} style={selStyle(T)}><option value="pending">Pending Approval</option><option value="active">Approved & Active</option></select></>)}
            <Btn T={T} color="warn" onClick={saveLoan} style={{marginTop:14}}>Submit Loan</Btn>
          </>
        )}

        {/* ── ADD MEMBER ── */}
        {type==="addMember" && (
          <>
            <ModalTitle T={T} onClose={onClose}>Add New Member</ModalTitle>
            <Label T={T}>Full Name *</Label>
            <input value={form.name} onChange={e=>set("name",e.target.value)} placeholder="Name" style={inpStyle(T)}/>
            <Label T={T} style={{marginTop:12}}>Phone</Label>
            <input value={form.phone} onChange={e=>set("phone",e.target.value)} placeholder="+91…" style={inpStyle(T)}/>
            <Label T={T} style={{marginTop:12}}>Role</Label>
            <select value={form.role} onChange={e=>set("role",e.target.value)} style={selStyle(T)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
            <Label T={T} style={{marginTop:12}}>PIN (4 digits) *</Label>
            <input type="password" value={form.pin} onChange={e=>set("pin",e.target.value)} maxLength={4} inputMode="numeric" placeholder="••••" style={inpStyle(T)}/>
            <Label T={T} style={{marginTop:12}}>Joined Month *</Label>
            <input type="month" value={form.joined} onChange={e=>set("joined",e.target.value)} style={inpStyle(T)}/>
            <Btn T={T} color="accent" onClick={saveMember} style={{marginTop:14}}>Add Member</Btn>
          </>
        )}

        {/* ── MEMBER DETAIL ── */}
        {type==="memberDetail" && data && (()=>{
          const m=data;
          const pmts=Object.entries(db.payments).filter(([k])=>k.startsWith(`${m.id}_`));
          const total=pmts.reduce((s,[,v])=>s+v,0);
          const loans=db.loans.filter(l=>l.memberId===m.id);
          return <>
            <ModalTitle T={T} onClose={onClose}>{m.name}</ModalTitle>
            <Card T={T} style={{marginBottom:12}}>
              <RRow T={T} label="Role" value={m.role.toUpperCase()}/>
              <RRow T={T} label="Joined" value={monthLabel(m.joined)}/>
              {m.phone && <RRow T={T} label="Phone" value={m.phone}/>}
              <RRow T={T} label="Total Contributed" value={fmt(total)} color={T.accent}/>
            </Card>
            <div style={{fontSize:14,fontWeight:700,marginBottom:8,color:T.text}}>Payment History</div>
            {pmts.length===0 && <div style={{color:T.textMuted,fontSize:13,marginBottom:12}}>No payments yet.</div>}
            {pmts.sort((a,b)=>b[0].localeCompare(a[0])).map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
                <span style={{fontSize:13,color:T.textSec}}>{monthLabel(k.split("_")[1])}</span>
                <span style={{fontWeight:700,color:T.accent,fontVariantNumeric:"tabular-nums"}}>{fmt(v)}</span>
              </div>
            ))}
            {loans.length>0 && (<>
              <div style={{fontSize:14,fontWeight:700,margin:"14px 0 8px",color:T.text}}>Loans</div>
              {loans.map(l=>(
                <div key={l.id} style={{background:T.surfaceAlt,borderRadius:10,padding:10,marginBottom:8,border:`1px solid ${T.border}`}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{fontWeight:700,color:T.text}}>{l.type==="emergency"?"🏥":"💼"} {fmt(l.amount)}</span>
                    <span style={{fontSize:11,background:T.surfaceAlt,padding:"2px 8px",borderRadius:4,color:T.textSec,border:`1px solid ${T.border}`}}>{l.status}</span>
                  </div>
                  <div style={{fontSize:11,color:T.textMuted,marginTop:4}}>{l.reason}</div>
                </div>
              ))}
            </>)}
            {isAdmin && <button onClick={()=>removeMember(m.id)} style={{...btnSt(T,"danger"),marginTop:12,fontSize:13}}>Remove Member</button>}
          </>;
        })()}

        {/* ── LOAN DETAIL ── */}
        {type==="loanDetail" && data && (()=>{
          const l=data;
          const m=db.members.find(x=>x.id===l.memberId);
          const out=l.amount-l.repaid;
          return <>
            <ModalTitle T={T} onClose={onClose}>Loan – {m?.name}</ModalTitle>
            <Card T={T} style={{marginBottom:12}}>
              <RRow T={T} label="Type" value={l.type==="emergency"?"🏥 Emergency":"💼 Personal (1%/mo)"}/>
              <RRow T={T} label="Amount" value={fmt(l.amount)}/>
              <RRow T={T} label="Repaid" value={fmt(l.repaid)} color={T.success}/>
              <RRow T={T} label="Outstanding" value={fmt(out)} color={out>0?T.danger:T.success}/>
              <RRow T={T} label="Due" value={monthLabel(l.repayDate)}/>
              <RRow T={T} label="Status" value={l.status.toUpperCase()}/>
              <RRow T={T} label="Reason" value={l.reason}/>
            </Card>
            {isAdmin && l.status!=="closed" && (
              <Card T={T}>
                <CardTitle T={T}>Record Repayment</CardTitle>
                <input type="number" value={repayAmt} onChange={e=>setRepayAmt(e.target.value)} placeholder={`Max ${fmt(out)}`} style={inpStyle(T)}/>
                <Btn T={T} color="success" onClick={()=>doRepay(l.id)} style={{marginTop:10}}>Mark Repaid</Btn>
                {l.status==="pending" && <Btn T={T} color="warn" onClick={()=>approveLoan(l.id)} style={{marginTop:8}}>✓ Approve Loan</Btn>}
                <Btn T={T} color="danger" onClick={()=>closeLoan(l.id)} style={{marginTop:8}}>Close Loan</Btn>
              </Card>
            )}
          </>;
        })()}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// BOTTOM NAV
// ─────────────────────────────────────────────
function BottomNav({tab, setTab, isAdmin, T}) {
  const items = [
    {id:"home",    icon:"🏠", label:"Home"},
    {id:"members", icon:"👥", label:"Members"},
    {id:"loans",   icon:"💸", label:"Loans"},
    {id:"reports", icon:"📊", label:"Reports"},
    ...(isAdmin?[{id:"admin",icon:"⚙️",label:"Admin"}]:[]),
  ];
  return (
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"100%",maxWidth:480,background:T.navBg,borderTop:`1px solid ${T.border}`,display:"flex",zIndex:100,boxShadow:`0 -2px 10px rgba(0,0,0,0.06)`}}>
      {items.map(it=>(
        <div key={it.id} onClick={()=>setTab(it.id)} className="tab-btn" style={{flex:1,padding:"8px 4px 6px",display:"flex",flexDirection:"column",alignItems:"center",gap:2,cursor:"pointer",borderTop:`2.5px solid ${tab===it.id?T.accent:"transparent"}`,transition:"all 0.15s"}}>
          <span style={{fontSize:17}}>{it.icon}</span>
          <span style={{fontSize:9,fontWeight:800,color:tab===it.id?T.accent:T.textMuted,letterSpacing:0.2}}>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────
const Avatar = ({name, size=40, T}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:T.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*0.36,fontWeight:800,color:"white",flexShrink:0}}>
    {initials(name)}
  </div>
);
const Card = ({children, style, onClick, T}) => (
  <div onClick={onClick} style={{background:T.surface,borderRadius:14,padding:14,border:`1px solid ${T.border}`,boxShadow:T.shadow,...style}}>{children}</div>
);
const CardTitle = ({children, T, style}) => (
  <div style={{fontSize:10,fontWeight:800,textTransform:"uppercase",letterSpacing:1,color:T.textMuted,marginBottom:10,...style}}>{children}</div>
);
const SectionTitle = ({children, T}) => (
  <div style={{fontSize:15,fontWeight:800,marginBottom:10,color:T.text}}>{children}</div>
);
const Label = ({children, T, style}) => (
  <div style={{fontSize:11,fontWeight:700,color:T.textSec,marginBottom:4,letterSpacing:0.3,...style}}>{children}</div>
);
const RRow = ({label, value, color, T}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",padding:"8px 0",borderBottom:`1px solid ${T.border}`}}>
    <span style={{fontSize:12,color:T.textSec,fontWeight:500,flex:1}}>{label}</span>
    <span style={{fontSize:13,fontWeight:700,color:color||T.text,textAlign:"right",marginLeft:10,fontVariantNumeric:"tabular-nums"}}>{value}</span>
  </div>
);
const ModalTitle = ({children, onClose, T}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
    <div style={{fontSize:17,fontWeight:800,color:T.text}}>{children}</div>
    <div onClick={onClose} style={{fontSize:20,cursor:"pointer",color:T.textMuted,lineHeight:1,padding:"2px 6px",borderRadius:6,background:T.surfaceAlt}}>✕</div>
  </div>
);

// ─────────────────────────────────────────────
// STYLE HELPERS
// ─────────────────────────────────────────────
const inpStyle = (T) => ({
  width:"100%", padding:"10px 12px", background:T.surfaceAlt, border:`1.5px solid ${T.border}`,
  borderRadius:10, color:T.text, fontSize:14, outline:"none", display:"block",
  marginBottom:0,
});
const selStyle = (T) => ({
  width:"100%", padding:"10px 12px", background:T.surfaceAlt, border:`1.5px solid ${T.border}`,
  borderRadius:10, color:T.text, fontSize:14, outline:"none", display:"block",
});
const btnSt = (T, color) => {
  const map = {
    accent:  {bg:T.accent,   fg:"white"},
    success: {bg:T.success,  fg:"white"},
    warn:    {bg:T.warn,     fg:"white"},
    danger:  {bg:T.dangerLight, fg:T.danger, border:`1px solid ${T.danger}33`},
    surface: {bg:T.surface,  fg:T.text},
  };
  const c = map[color]||map.accent;
  return {
    width:"100%", padding:"12px", border:c.border||"none", borderRadius:12,
    fontFamily:"system-ui,sans-serif", fontSize:14, fontWeight:700, cursor:"pointer",
    background:c.bg, color:c.fg, display:"block",
  };
};
const Btn = ({children, T, color="accent", onClick, style, disabled}) => (
  <button onClick={onClick} disabled={disabled} className="btn-press" style={{...btnSt(T,color),opacity:disabled?0.5:1,...style}}>
    {children}
  </button>
);