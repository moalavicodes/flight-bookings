import { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { createClient } from "@supabase/supabase-js";

/* ─────────────────────── CONTEXT ─────────────────────── */
const AppContext = createContext();
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const mapAirlineRowToUi = (a) => ({
  code: a.code,
  name: a.name,
  color: a.color || "#64748B",
  logo: a.logo_url || "",
});

const mapFlightRowToUi = (f) => ({
  id: f.id,
  airlineCode: f.airline_code,
  flightNumber: f.flight_number,
  from: f.from_code,
  to: f.to_code,
  date: f.flight_date,
  depTime: f.dep_time,
  arrTime: f.arr_time,
  duration: f.duration_text,
  durationMin: f.duration_min,
  stops: f.stops,
  cabin: f.cabin,
  price: Number(
    f.display_price ??
    f.price_override ??
    (Number(f.price || 0) + Number(f.markup || 0) + Number(f.tax || 0))
  ),
  tax: Number(f.tax || 0),
  baggage: f.baggage,
  fareRules: f.fare_rules,
  meals: f.meals,
  seatPitch: f.seat_pitch,
  wifi: f.wifi,
});

/* ─────────────────────── DATA ─────────────────────── */
const DEFAULT_AIRLINES = [
  { code: "SK", name: "SkyPulse Air", color: "#0891B2", logo: "" },
  { code: "NV", name: "NovaJet", color: "#EA580C", logo: "" },
  { code: "AZ", name: "Azure Wings", color: "#0D9488", logo: "" },
  { code: "EM", name: "Ember Aviation", color: "#DC2626", logo: "" },
  { code: "PN", name: "Pinnacle Air", color: "#7C3AED", logo: "" },
  { code: "CR", name: "Crest Airlines", color: "#2563EB", logo: "" },
];

const AIRPORTS = [
  { code: "JFK", city: "New York", name: "John F. Kennedy Intl" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles Intl" },
  { code: "ORD", city: "Chicago", name: "O'Hare Intl" },
  { code: "MIA", city: "Miami", name: "Miami Intl" },
  { code: "SFO", city: "San Francisco", name: "San Francisco Intl" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma Intl" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth Intl" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Intl" },
  { code: "DEN", city: "Denver", name: "Denver Intl" },
  { code: "BOS", city: "Boston", name: "Logan Intl" },
  { code: "LHR", city: "London", name: "Heathrow" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle" },
  { code: "DXB", city: "Dubai", name: "Dubai Intl" },
  { code: "NRT", city: "Tokyo", name: "Narita Intl" },
];

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function formatDate(d) {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function generateDefaultFlights(airlines) {
  const routes = [
    ["JFK","LAX"],["JFK","MIA"],["JFK","ORD"],["JFK","SFO"],["JFK","LHR"],
    ["LAX","JFK"],["LAX","SFO"],["LAX","NRT"],["LAX","SEA"],["LAX","DEN"],
    ["ORD","MIA"],["ORD","ATL"],["SFO","LHR"],["SFO","NRT"],["MIA","JFK"],
    ["ATL","DFW"],["BOS","CDG"],["DEN","LAX"],["SEA","DXB"],["DFW","MIA"],
    ["LHR","JFK"],["CDG","BOS"],["NRT","LAX"],["DXB","SEA"],
  ];
  const flights = [];
  let idC = 1;
  const today = new Date();
  for (let dayOff = 0; dayOff < 14; dayOff++) {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOff);
    const dateStr = toDateStr(d);
    for (const [from, to] of routes) {
      const num = 2 + Math.floor(Math.random() * 3);
      for (let f = 0; f < num; f++) {
        const airline = airlines[Math.floor(Math.random() * airlines.length)];
        const depH = 5 + Math.floor(Math.random() * 17);
        const depM = Math.floor(Math.random() * 4) * 15;
        const durH = 1 + Math.floor(Math.random() * 7);
        const durM = Math.floor(Math.random() * 4) * 15;
        const totalMin = durH * 60 + durM;
        const arrH = (depH + Math.floor((depM + totalMin) / 60)) % 24;
        const arrM = (depM + totalMin) % 60;
        const stops = Math.random() > 0.45 ? 0 : Math.random() > 0.5 ? 1 : 2;
        const cabins = ["Economy", "Premium Economy", "Business"];
        const cabin = cabins[Math.floor(Math.random() * 3)];
        const price = cabin === "Business" ? 400 + Math.floor(Math.random() * 800) :
          cabin === "Premium Economy" ? 200 + Math.floor(Math.random() * 400) :
          89 + Math.floor(Math.random() * 350);
        const tax = Math.round(price * 0.12);
        const flightNum = `${airline.code}${String(100 + Math.floor(Math.random() * 900))}`;
        flights.push({
          id: `${airline.code}-${String(idC++).padStart(4, "0")}`,
          flightNumber: flightNum,
          airlineCode: airline.code, from, to, date: dateStr,
          depTime: `${String(depH).padStart(2, "0")}:${String(depM).padStart(2, "0")}`,
          arrTime: `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`,
          duration: `${durH}h${durM > 0 ? ` ${durM}m` : ""}`,
          durationMin: totalMin, stops, cabin, price, tax,
          baggage: "1 carry-on (7kg), 1 checked bag (23kg) included",
          fareRules: "Non-refundable. Changes allowed with fee.",
          meals: "Complimentary snacks and beverages",
          seatPitch: cabin === "Business" ? "42 inches" : "31 inches",
          wifi: "Available for purchase",
        });
      }
    }
  }
  return flights;
}

/* ─────────────────────── LOGO RESIZE UTILITY ─────────────────────── */
function resizeImage(file, maxSize, callback) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
        else { w = Math.round(w * maxSize / h); h = maxSize; }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      callback(canvas.toDataURL("image/png", 0.9));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ─────────────────────── ICONS ─────────────────────── */
const PlaneIcon = ({ size = 20, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>);
const SwapIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 12l-3-3m3 3l3-3M17 8v12m0-12l3 3m-3-3l-3 3" /></svg>);
const SearchIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const ChevronDown = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>);
const BackIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>);
const UserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const GearIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></svg>);
const TrashIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>);
const PlusIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>);
const EditIcon = () => (<svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M10 2L12 4L5 11H3V9L10 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>);
const BagIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>);
const InfoIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>);
const XIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>);

/* ─────────────────────── AIRLINE LOGO ─────────────────────── */
function AirlineLogo({ airline, size = 44 }) {
  if (airline.logo) {
    return <img src={airline.logo} alt={airline.name} style={{ width: size, height: size, borderRadius: size > 36 ? 12 : 8, objectFit: "contain", background: "#F8FAFC", flexShrink: 0 }} />;
  }
  return (
    <div style={{ width: size, height: size, borderRadius: size > 36 ? 12 : 8, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg,${airline.color}22,${airline.color}0A)`, fontWeight: 800, fontSize: size * 0.34, color: airline.color, letterSpacing: 0.5, flexShrink: 0 }}>
      {airline.code}
    </div>
  );
}

/* ─────────────────────── SHARED COMPONENTS ─────────────────────── */
function AirportDropdown({ value, onChange, label, airports }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);
  const inputRef = useRef(null);
  const selected = airports.find(a => a.code === value);

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => { if (open && inputRef.current) inputRef.current.focus(); }, [open]);

  const filtered = airports.filter(a =>
    a.city.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase()) ||
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} style={{ position: "relative", flex: 1, minWidth: 180 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>{label}</label>
      <button onClick={() => { setOpen(!open); setSearch(""); }} style={{
        width: "100%", padding: "12px 16px", borderRadius: 12, border: `2px solid ${open ? "#0891B2" : "#E2E8F0"}`,
        background: "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
        fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#1E293B", transition: "border-color 0.2s",
      }}>
        <span>{selected ? `${selected.city} (${selected.code})` : "Select airport"}</span><ChevronDown />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 9999,
          background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0",
          boxShadow: "0 12px 40px rgba(0,0,0,0.18)", maxHeight: 280, overflow: "hidden",
          animation: "dropIn 0.2s ease-out",
        }}>
          <div style={{ padding: "8px 8px 4px" }}>
            <input ref={inputRef} value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search city or code..."
              style={{ width: "100%", padding: "10px 12px", borderRadius: 8, border: "1px solid #E2E8F0", fontFamily: "'Outfit',sans-serif", fontSize: 14, outline: "none", boxSizing: "border-box" }}
              onFocus={e => e.target.style.borderColor = "#0891B2"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
          </div>
          <div style={{ maxHeight: 220, overflowY: "auto", padding: "0 4px 4px" }}>
            {filtered.map(a => (
              <button key={a.code} onClick={() => { onChange(a.code); setOpen(false); }}
                style={{ width: "100%", padding: "10px 12px", border: "none", borderRadius: 8, background: a.code === value ? "#F0FDFA" : "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 10, fontFamily: "'Outfit',sans-serif", transition: "background 0.15s" }}
                onMouseEnter={e => { if (a.code !== value) e.currentTarget.style.background = "#F8FAFC"; }}
                onMouseLeave={e => { if (a.code !== value) e.currentTarget.style.background = "transparent"; }}>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0891B2", width: 36 }}>{a.code}</span>
                <div><div style={{ fontSize: 14, fontWeight: 500, color: "#1E293B" }}>{a.city}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{a.name}</div></div>
              </button>
            ))}
            {filtered.length === 0 && <div style={{ padding: 16, textAlign: "center", color: "#94A3B8", fontSize: 13 }}>No airports found</div>}
          </div>
        </div>
      )}
    </div>
  );
}

function PassengerSelector({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => { const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);
  return (
    <div ref={ref} style={{ position: "relative", minWidth: 130 }}>
      <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Passengers</label>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #E2E8F0", background: "#fff", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "center", gap: 8, fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#1E293B" }}>
        <UserIcon /> {value} {value === 1 ? "Adult" : "Adults"}
      </button>
      {open && (
        <div style={{ position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 100, background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", boxShadow: "0 12px 40px rgba(0,0,0,0.12)", padding: 16, animation: "dropIn 0.2s ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: "#1E293B" }}>Adults</span>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => onChange(Math.max(1, value - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#64748B" }}>-</button>
              <span style={{ fontWeight: 700, fontSize: 16, minWidth: 20, textAlign: "center" }}>{value}</span>
              <button onClick={() => onChange(Math.min(9, value + 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 16, fontWeight: 700, color: "#64748B" }}>+</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const InputField = ({ label, value, onChange, placeholder, type = "text", half = false }) => (
  <div style={{ flex: half ? 1 : "unset", minWidth: half ? 120 : "unset" }}>
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</label>
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: "2px solid #E2E8F0", background: "#fff", fontSize: 15, fontWeight: 500, color: "#1E293B", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box", transition: "border-color 0.2s" }}
      onFocus={e => e.target.style.borderColor = "#0891B2"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
  </div>
);
const TextareaField = ({ label, value, onChange, placeholder, rows = 2 }) => (
  <div>
    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</label>
    <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "2px solid #E2E8F0", background: "#fff", fontSize: 13, fontWeight: 500, color: "#1E293B", outline: "none", fontFamily: "'Outfit',sans-serif", boxSizing: "border-box", transition: "border-color 0.2s", resize: "vertical" }}
      onFocus={e => e.target.style.borderColor = "#0891B2"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
  </div>
);

const SS = { padding: "8px 12px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500, color: "#1E293B", outline: "none", cursor: "pointer" };
const IS = { ...SS, cursor: "text", width: "100%", boxSizing: "border-box" };

/* ─────────────────────── ADMIN PANEL ─────────────────────── */
function AdminPanel({ onClose }) {
  const { flights, setFlights, airlines, setAirlines } = useContext(AppContext);
  const [tab, setTab] = useState("flights");
  const [filterRoute, setFilterRoute] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addRoundTrip, setAddRoundTrip] = useState(false);

  const emptyFlight = { airlineCode: airlines[0]?.code || "SK", flightNumber: "", from: "JFK", to: "LAX", date: toDateStr(new Date()), depTime: "08:00", arrTime: "11:00", duration: "3h", durationMin: 180, stops: 0, cabin: "Economy", price: 199, tax: 24, baggage: "1 carry-on (7kg), 1 checked bag (23kg)", fareRules: "Non-refundable. Changes with fee.", meals: "Snacks included", seatPitch: "31 inches", wifi: "Available" };
  const [addForm, setAddForm] = useState(emptyFlight);
  const [returnForm, setReturnForm] = useState({ flightNumber: "", date: "", depTime: "14:00", arrTime: "17:00", duration: "3h", price: 199, tax: 24 });

  // airline
  const [newAirline, setNewAirline] = useState({ code: "", name: "", color: "#0891B2", logo: "" });
  const [editAirlineCode, setEditAirlineCode] = useState(null);
  const [editAirlineForm, setEditAirlineForm] = useState({});
  const logoInputRef = useRef(null);
  const editLogoInputRef = useRef(null);

  const routes = useMemo(() => { const r = new Set(flights.map(f => `${f.from}-${f.to}`)); return [...r].sort(); }, [flights]);
  const filtered = flights.filter(f => { if (filterRoute !== "all" && `${f.from}-${f.to}` !== filterRoute) return false; if (filterDate && f.date !== filterDate) return false; return true; }).sort((a, b) => a.date.localeCompare(b.date) || a.depTime.localeCompare(b.depTime));

  const handleLogoUpload = (e, target) => {
    const file = e.target.files[0]; if (!file) return;
    resizeImage(file, 200, (dataUrl) => {
      if (target === "new") setNewAirline(p => ({ ...p, logo: dataUrl }));
      else if (target === "edit") setEditAirlineForm(p => ({ ...p, logo: dataUrl }));
    });
  };

  const addAirline = async () => {
    if (!newAirline.code || !newAirline.name) return alert("Code and name required");
    if (airlines.find(a => a.code === newAirline.code)) return alert("Airline code already exists");

    const { data, error } = await supabase
      .from("airlines")
      .insert({
        code: newAirline.code,
        name: newAirline.name,
        color: newAirline.color,
        logo_url: newAirline.logo || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Add airline error:", error);
      return alert(error.message);
    }

    setAirlines(prev => [...prev, mapAirlineRowToUi(data)]);
    setNewAirline({ code: "", name: "", color: "#0891B2", logo: "" });
  };

  const startEditAirline = (a) => { setEditAirlineCode(a.code); setEditAirlineForm({ ...a }); };

  const saveAirline = async () => {
    const { data, error } = await supabase
      .from("airlines")
      .update({
        name: editAirlineForm.name,
        color: editAirlineForm.color,
        logo_url: editAirlineForm.logo || null,
      })
      .eq("code", editAirlineCode)
      .select()
      .single();

    if (error) {
      console.error("Save airline error:", error);
      return alert(error.message);
    }

    setAirlines(prev => prev.map(a => a.code === editAirlineCode ? mapAirlineRowToUi(data) : a));
    setEditAirlineCode(null);
  };

  const deleteAirline = async (code) => {
    if (flights.some(f => f.airlineCode === code)) return alert("Remove flights for this airline first.");

    const { error } = await supabase.from("airlines").delete().eq("code", code);
    if (error) {
      console.error("Delete airline error:", error);
      return alert(error.message);
    }

    setAirlines(prev => prev.filter(a => a.code !== code));
  };

  const startEdit = (f) => { setEditingId(f.id); setEditForm({ ...f }); };

  const saveEdit = async () => {
    const { data, error } = await supabase
      .from("flights")
      .update({
        flight_number: editForm.flightNumber || null,
        airline_code: editForm.airlineCode,
        from_code: editForm.from,
        to_code: editForm.to,
        flight_date: editForm.date,
        dep_time: editForm.depTime,
        arr_time: editForm.arrTime,
        duration_text: editForm.duration,
        duration_min: editForm.durationMin || null,
        stops: editForm.stops,
        cabin: editForm.cabin,
        price: editForm.price,
        tax: editForm.tax || 0,
        baggage: editForm.baggage,
        fare_rules: editForm.fareRules,
        meals: editForm.meals,
        seat_pitch: editForm.seatPitch,
        wifi: editForm.wifi,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingId)
      .select()
      .single();

    if (error) {
      console.error("Save flight error:", error);
      return alert(error.message);
    }

    setFlights(prev => prev.map(f => f.id === editingId ? mapFlightRowToUi(data) : f));
    setEditingId(null);
  };

  const deleteFlight = async (id) => {
    const { error } = await supabase.from("flights").delete().eq("id", id);
    if (error) {
      console.error("Delete flight error:", error);
      return alert(error.message);
    }
    setFlights(prev => prev.filter(f => f.id !== id));
  };

  const addFlight = async () => {
    const outboundPayload = {
      airline_code: addForm.airlineCode,
      flight_number: addForm.flightNumber || null,
      from_code: addForm.from,
      to_code: addForm.to,
      flight_date: addForm.date,
      dep_time: addForm.depTime,
      arr_time: addForm.arrTime,
      duration_text: addForm.duration,
      duration_min: addForm.durationMin || null,
      stops: addForm.stops,
      cabin: addForm.cabin,
      price: addForm.price,
      tax: addForm.tax || 0,
      baggage: addForm.baggage,
      fare_rules: addForm.fareRules,
      meals: addForm.meals,
      seat_pitch: addForm.seatPitch,
      wifi: addForm.wifi,
      is_visible: true,
      is_manual: true,
    };

    const payloads = [outboundPayload];

    if (addRoundTrip) {
      payloads.push({
        airline_code: addForm.airlineCode,
        flight_number: returnForm.flightNumber || null,
        from_code: addForm.to,
        to_code: addForm.from,
        flight_date: returnForm.date || addForm.date,
        dep_time: returnForm.depTime,
        arr_time: returnForm.arrTime,
        duration_text: returnForm.duration,
        duration_min: null,
        stops: addForm.stops,
        cabin: addForm.cabin,
        price: returnForm.price,
        tax: returnForm.tax || 0,
        baggage: addForm.baggage,
        fare_rules: addForm.fareRules,
        meals: addForm.meals,
        seat_pitch: addForm.seatPitch,
        wifi: addForm.wifi,
        is_visible: true,
        is_manual: true,
      });
    }

    const { data, error } = await supabase
      .from("flights")
      .insert(payloads)
      .select();

    if (error) {
      console.error("Add flight error:", error);
      return alert(error.message);
    }

    setFlights(prev => [...prev, ...(data || []).map(mapFlightRowToUi)]);
    setShowAdd(false);
    setAddRoundTrip(false);
    setAddForm(emptyFlight);
    setReturnForm({ flightNumber: "", date: "", depTime: "14:00", arrTime: "17:00", duration: "3h", price: 199, tax: 24 });
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} />
      <div style={{ position: "relative", marginLeft: "auto", width: "min(960px,92vw)", height: "100vh", background: "#F8FAFC", overflowY: "auto", boxShadow: "-8px 0 40px rgba(0,0,0,0.15)", animation: "slideIn 0.3s ease-out" }}>
        <div style={{ position: "sticky", top: 0, zIndex: 10, background: "#0F172A", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}><GearIcon /><span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: "#F0FDFA" }}>Admin Panel</span></div>
            <button onClick={onClose} style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", color: "#94A3B8", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600 }}>Close</button>
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {["flights", "airlines"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, background: tab === t ? "#0891B2" : "rgba(255,255,255,0.08)", color: tab === t ? "#fff" : "#94A3B8", transition: "all 0.2s", textTransform: "capitalize" }}>
                {t === "flights" ? `Flights (${flights.length})` : `Airlines (${airlines.length})`}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: 24 }}>
          {/* ─── AIRLINES TAB ─── */}
          {tab === "airlines" && (
            <div>
              <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #0891B2", padding: 20, marginBottom: 24 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0891B2", marginBottom: 4 }}>Add New Airline</div>
                <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 16 }}>Logo will be auto-resized to 200x200px. For best results, upload a square image (PNG or JPG).</div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                  <div style={{ minWidth: 80 }}><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Code (2-3 chars)</label><input value={newAirline.code} onChange={e => setNewAirline(p => ({ ...p, code: e.target.value.toUpperCase().slice(0, 3) }))} placeholder="AA" maxLength={3} style={{ ...IS, width: 80 }} /></div>
                  <div style={{ flex: 1, minWidth: 150 }}><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Name</label><input value={newAirline.name} onChange={e => setNewAirline(p => ({ ...p, name: e.target.value }))} placeholder="American Airlines" style={IS} /></div>
                  <div style={{ minWidth: 60 }}><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Color</label><input type="color" value={newAirline.color} onChange={e => setNewAirline(p => ({ ...p, color: e.target.value }))} style={{ width: 44, height: 36, border: "1px solid #E2E8F0", borderRadius: 8, cursor: "pointer", padding: 2 }} /></div>
                  <div>
                    <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Logo (auto-resized)</label>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {newAirline.logo && <img src={newAirline.logo} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "#F8FAFC" }} alt="" />}
                      <button onClick={() => logoInputRef.current?.click()} style={{ padding: "8px 14px", borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, color: "#64748B" }}>{newAirline.logo ? "Change" : "Upload"}</button>
                      <input ref={logoInputRef} type="file" accept="image/*" onChange={e => handleLogoUpload(e, "new")} style={{ display: "none" }} />
                    </div>
                  </div>
                  <button onClick={addAirline} style={{ padding: "10px 24px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}><PlusIcon /> Add</button>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))", gap: 12 }}>
                {airlines.map(a => {
                  const isEdit = editAirlineCode === a.code;
                  return (
                    <div key={a.code} style={{ background: "#fff", borderRadius: 14, border: isEdit ? "2px solid #0891B2" : "1px solid #E2E8F0", padding: 16 }}>
                      {isEdit ? (
                        <div>
                          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                            <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Code</label><input value={editAirlineForm.code} disabled style={{ ...IS, width: 60, background: "#F1F5F9" }} /></div>
                            <div style={{ flex: 1 }}><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Name</label><input value={editAirlineForm.name} onChange={e => setEditAirlineForm(p => ({ ...p, name: e.target.value }))} style={IS} /></div>
                            <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Color</label><input type="color" value={editAirlineForm.color} onChange={e => setEditAirlineForm(p => ({ ...p, color: e.target.value }))} style={{ width: 36, height: 32, border: "1px solid #E2E8F0", borderRadius: 6, cursor: "pointer", padding: 2 }} /></div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                            {editAirlineForm.logo && <img src={editAirlineForm.logo} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "contain", background: "#F8FAFC" }} alt="" />}
                            <button onClick={() => editLogoInputRef.current?.click()} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#64748B", fontFamily: "'Outfit',sans-serif" }}>{editAirlineForm.logo ? "Change Logo" : "Upload Logo"}</button>
                            {editAirlineForm.logo && <button onClick={() => setEditAirlineForm(p => ({ ...p, logo: "" }))} style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", fontSize: 11, fontWeight: 600, color: "#DC2626", fontFamily: "'Outfit',sans-serif" }}>Remove</button>}
                            <input ref={editLogoInputRef} type="file" accept="image/*" onChange={e => handleLogoUpload(e, "edit")} style={{ display: "none" }} />
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={saveAirline} style={{ padding: "6px 16px", borderRadius: 6, border: "none", background: "#0891B2", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Save</button>
                            <button onClick={() => setEditAirlineCode(null)} style={{ padding: "6px 16px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <AirlineLogo airline={a} size={44} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B" }}>{a.name}</div>
                            <div style={{ fontSize: 12, color: "#94A3B8" }}>{a.code} &middot; <span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 3, background: a.color, verticalAlign: "middle" }} /> {a.color}</div>
                          </div>
                          <button onClick={() => startEditAirline(a)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}><EditIcon /></button>
                          <button onClick={() => deleteAirline(a.code)} style={{ width: 28, height: 28, borderRadius: 6, border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}><TrashIcon /></button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ─── FLIGHTS TAB ─── */}
          {tab === "flights" && (
            <div>
              <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Route</label><select value={filterRoute} onChange={e => setFilterRoute(e.target.value)} style={SS}><option value="all">All Routes</option>{routes.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div><label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Date</label><input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} style={{ ...IS, width: 160 }} /></div>
                <div style={{ flex: 1 }} />
                <button onClick={() => { setShowAdd(!showAdd); setAddRoundTrip(false); }} style={{ padding: "10px 20px", borderRadius: 10, border: "none", background: showAdd ? "#DC2626" : "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  {showAdd ? "Cancel" : <><PlusIcon /> Add Flight</>}
                </button>
              </div>

              {showAdd && (
                <div style={{ background: "#fff", borderRadius: 16, border: "2px solid #0891B2", padding: 20, marginBottom: 20, animation: "fadeUp 0.2s ease-out" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#0891B2" }}>New Flight</div>
                    <div style={{ display: "flex", gap: 4, background: "#F1F5F9", borderRadius: 8, padding: 3 }}>
                      <button onClick={() => setAddRoundTrip(false)} style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: !addRoundTrip ? "#fff" : "transparent", color: !addRoundTrip ? "#0F172A" : "#64748B", boxShadow: !addRoundTrip ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>One Way</button>
                      <button onClick={() => { setAddRoundTrip(true); if (!returnForm.date) { const d = new Date(addForm.date + "T12:00:00"); d.setDate(d.getDate() + 7); setReturnForm(p => ({ ...p, date: toDateStr(d) })); } }} style={{ padding: "6px 16px", borderRadius: 6, border: "none", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif", background: addRoundTrip ? "#fff" : "transparent", color: addRoundTrip ? "#0F172A" : "#64748B", boxShadow: addRoundTrip ? "0 1px 3px rgba(0,0,0,0.08)" : "none" }}>Round Trip</button>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginBottom: 8 }}>Outbound Flight</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10, marginBottom: 12 }}>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Airline</label><select value={addForm.airlineCode} onChange={e => setAddForm(p => ({ ...p, airlineCode: e.target.value }))} style={SS}>{airlines.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}</select></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Flight Number</label><input value={addForm.flightNumber} onChange={e => setAddForm(p => ({ ...p, flightNumber: e.target.value.toUpperCase() }))} placeholder="SK101" style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>From</label><select value={addForm.from} onChange={e => setAddForm(p => ({ ...p, from: e.target.value }))} style={SS}>{AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}</select></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>To</label><select value={addForm.to} onChange={e => setAddForm(p => ({ ...p, to: e.target.value }))} style={SS}>{AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.city} ({a.code})</option>)}</select></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Date</label><input type="date" value={addForm.date} onChange={e => setAddForm(p => ({ ...p, date: e.target.value }))} style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Departure</label><input type="time" value={addForm.depTime} onChange={e => setAddForm(p => ({ ...p, depTime: e.target.value }))} style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Arrival</label><input type="time" value={addForm.arrTime} onChange={e => setAddForm(p => ({ ...p, arrTime: e.target.value }))} style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Duration</label><input value={addForm.duration} onChange={e => setAddForm(p => ({ ...p, duration: e.target.value }))} placeholder="3h 30m" style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Stops</label><select value={addForm.stops} onChange={e => setAddForm(p => ({ ...p, stops: Number(e.target.value) }))} style={SS}><option value={0}>Nonstop</option><option value={1}>1 Stop</option><option value={2}>2 Stops</option></select></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Cabin</label><select value={addForm.cabin} onChange={e => setAddForm(p => ({ ...p, cabin: e.target.value }))} style={SS}><option>Economy</option><option>Premium Economy</option><option>Business</option></select></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Price ($)</label><input type="number" value={addForm.price} onChange={e => setAddForm(p => ({ ...p, price: Number(e.target.value) }))} style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Tax ($)</label><input type="number" value={addForm.tax || 0} onChange={e => setAddForm(p => ({ ...p, tax: Number(e.target.value) }))} style={IS} /></div>
                  </div>

                  {addRoundTrip && (
                    <div style={{ background: "#F0FDFA", borderRadius: 12, padding: 16, marginBottom: 12, border: "1px solid #CCFBF1" }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#0D9488", marginBottom: 8 }}>Return Flight ({AIRPORTS.find(a => a.code === addForm.to)?.city} &rarr; {AIRPORTS.find(a => a.code === addForm.from)?.city})</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10 }}>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Flight Number</label><input value={returnForm.flightNumber} onChange={e => setReturnForm(p => ({ ...p, flightNumber: e.target.value.toUpperCase() }))} placeholder="SK102" style={IS} /></div>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Return Date</label><input type="date" value={returnForm.date} onChange={e => setReturnForm(p => ({ ...p, date: e.target.value }))} min={addForm.date} style={IS} /></div>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Departure</label><input type="time" value={returnForm.depTime} onChange={e => setReturnForm(p => ({ ...p, depTime: e.target.value }))} style={IS} /></div>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Arrival</label><input type="time" value={returnForm.arrTime} onChange={e => setReturnForm(p => ({ ...p, arrTime: e.target.value }))} style={IS} /></div>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Duration</label><input value={returnForm.duration} onChange={e => setReturnForm(p => ({ ...p, duration: e.target.value }))} placeholder="3h" style={IS} /></div>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Price ($)</label><input type="number" value={returnForm.price} onChange={e => setReturnForm(p => ({ ...p, price: Number(e.target.value) }))} style={IS} /></div>
                        <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Tax ($)</label><input type="number" value={returnForm.tax || 0} onChange={e => setReturnForm(p => ({ ...p, tax: Number(e.target.value) }))} style={IS} /></div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <TextareaField label="Baggage Info" value={addForm.baggage} onChange={v => setAddForm(p => ({ ...p, baggage: v }))} placeholder="1 carry-on, 1 checked bag..." />
                    <TextareaField label="Fare Rules" value={addForm.fareRules} onChange={v => setAddForm(p => ({ ...p, fareRules: v }))} placeholder="Non-refundable..." />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Meals</label><input value={addForm.meals} onChange={e => setAddForm(p => ({ ...p, meals: e.target.value }))} style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>Seat Pitch</label><input value={addForm.seatPitch} onChange={e => setAddForm(p => ({ ...p, seatPitch: e.target.value }))} style={IS} /></div>
                    <div><label style={{ display: "block", fontSize: 10, fontWeight: 600, color: "#94A3B8", marginBottom: 4 }}>WiFi</label><input value={addForm.wifi} onChange={e => setAddForm(p => ({ ...p, wifi: e.target.value }))} style={IS} /></div>
                  </div>
                  <button onClick={addFlight} style={{ padding: "10px 28px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                    {addRoundTrip ? "Add Both Flights" : "Add Flight"}
                  </button>
                </div>
              )}

              {/* Table */}
              <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #E2E8F0", overflow: "hidden" }}>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Outfit',sans-serif", fontSize: 13 }}>
                    <thead><tr style={{ background: "#F8FAFC", borderBottom: "1px solid #E2E8F0" }}>
                      {["Flight #", "Airline", "Route", "Date", "Dep", "Arr", "Stops", "Cabin", "Price", "Tax", ""].map(h => (
                        <th key={h} style={{ padding: "10px 8px", textAlign: "left", fontSize: 10, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8, whiteSpace: "nowrap" }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {filtered.slice(0, 80).map(f => {
                        const airline = airlines.find(a => a.code === f.airlineCode) || { code: f.airlineCode, name: f.airlineCode, color: "#64748B", logo: "" };
                        const isE = editingId === f.id;
                        return (
                          <tr key={f.id} style={{ borderBottom: "1px solid #F1F5F9", background: isE ? "#F0FDFA" : "transparent" }}>
                            <td style={{ padding: "8px", fontWeight: 600, color: "#1E293B", fontSize: 12 }}>{isE ? <input value={editForm.flightNumber || ""} onChange={e => setEditForm(p => ({ ...p, flightNumber: e.target.value.toUpperCase() }))} style={{ ...IS, width: 80, fontSize: 11, padding: "4px 6px" }} /> : (f.flightNumber || f.id)}</td>
                            <td style={{ padding: "8px" }}>{isE ? <select value={editForm.airlineCode} onChange={e => setEditForm(p => ({ ...p, airlineCode: e.target.value }))} style={{ ...SS, fontSize: 11, padding: "4px 6px" }}>{airlines.map(a => <option key={a.code} value={a.code}>{a.code}</option>)}</select> : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><AirlineLogo airline={airline} size={22} /><span style={{ color: "#334155", fontWeight: 500, fontSize: 11 }}>{airline.name}</span></span>}</td>
                            <td style={{ padding: "8px", fontWeight: 600, color: "#1E293B", whiteSpace: "nowrap", fontSize: 12 }}>{isE ? <div style={{ display: "flex", gap: 4, alignItems: "center" }}><select value={editForm.from} onChange={e => setEditForm(p => ({ ...p, from: e.target.value }))} style={{ ...SS, fontSize: 11, padding: "4px" }}>{AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code}</option>)}</select><span>&rarr;</span><select value={editForm.to} onChange={e => setEditForm(p => ({ ...p, to: e.target.value }))} style={{ ...SS, fontSize: 11, padding: "4px" }}>{AIRPORTS.map(a => <option key={a.code} value={a.code}>{a.code}</option>)}</select></div> : `${f.from} \u2192 ${f.to}`}</td>
                            <td style={{ padding: "8px", color: "#64748B", whiteSpace: "nowrap", fontSize: 11 }}>{isE ? <input type="date" value={editForm.date} onChange={e => setEditForm(p => ({ ...p, date: e.target.value }))} style={{ ...IS, fontSize: 11, padding: "4px 6px", width: 125 }} /> : f.date}</td>
                            <td style={{ padding: "8px", fontWeight: 600, color: "#1E293B", fontSize: 12 }}>{isE ? <input type="time" value={editForm.depTime} onChange={e => setEditForm(p => ({ ...p, depTime: e.target.value }))} style={{ ...IS, fontSize: 11, padding: "4px 6px", width: 85 }} /> : f.depTime}</td>
                            <td style={{ padding: "8px", fontWeight: 600, color: "#1E293B", fontSize: 12 }}>{isE ? <input type="time" value={editForm.arrTime} onChange={e => setEditForm(p => ({ ...p, arrTime: e.target.value }))} style={{ ...IS, fontSize: 11, padding: "4px 6px", width: 85 }} /> : f.arrTime}</td>
                            <td style={{ padding: "8px", fontSize: 11 }}>{isE ? <select value={editForm.stops} onChange={e => setEditForm(p => ({ ...p, stops: Number(e.target.value) }))} style={{ ...SS, fontSize: 11, padding: "4px" }}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option></select> : <span style={{ fontWeight: 600, color: f.stops === 0 ? "#0D9488" : f.stops === 1 ? "#D97706" : "#DC2626" }}>{f.stops === 0 ? "Nonstop" : f.stops}</span>}</td>
                            <td style={{ padding: "8px", color: "#64748B", fontSize: 11 }}>{isE ? <select value={editForm.cabin} onChange={e => setEditForm(p => ({ ...p, cabin: e.target.value }))} style={{ ...SS, fontSize: 11, padding: "4px" }}><option>Economy</option><option>Premium Economy</option><option>Business</option></select> : f.cabin}</td>
                            <td style={{ padding: "8px", fontWeight: 700, color: "#0F172A" }}>{isE ? <input type="number" value={editForm.price} onChange={e => setEditForm(p => ({ ...p, price: Number(e.target.value) }))} style={{ ...IS, fontSize: 12, padding: "4px 6px", width: 70, fontWeight: 700 }} /> : `$${f.price}`}</td>
                            <td style={{ padding: "8px", fontWeight: 700, color: "#334155" }}>{isE ? <input type="number" value={editForm.tax || 0} onChange={e => setEditForm(p => ({ ...p, tax: Number(e.target.value) }))} style={{ ...IS, fontSize: 12, padding: "4px 6px", width: 70, fontWeight: 700 }} /> : `$${f.tax || 0}`}</td>
                            <td style={{ padding: "8px" }}><div style={{ display: "flex", gap: 4 }}>
                              {isE ? (<><button onClick={saveEdit} style={{ padding: "4px 8px", borderRadius: 6, border: "none", background: "#0891B2", color: "#fff", fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>Save</button><button onClick={() => setEditingId(null)} style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E2E8F0", background: "#fff", color: "#64748B", fontSize: 10, fontWeight: 600, cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}>X</button></>) : (<><button onClick={() => startEdit(f)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B" }}><EditIcon /></button><button onClick={() => deleteFlight(f.id)} style={{ width: 24, height: 24, borderRadius: 6, border: "1px solid #FEE2E2", background: "#FEF2F2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#DC2626" }}><TrashIcon /></button></>)}
                            </div></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {filtered.length > 80 && <div style={{ padding: 12, textAlign: "center", color: "#94A3B8", fontSize: 12 }}>Showing 80 of {filtered.length}. Use filters.</div>}
                {filtered.length === 0 && <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No flights match</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── FLIGHT DETAIL MODAL ─────────────────────── */
function FlightDetailModal({ flight, airline, fromAirport, toAirport, onClose, onSelect }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9998, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", background: "#fff", borderRadius: 24, maxWidth: 600, width: "100%", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 24px 60px rgba(0,0,0,0.2)", animation: "fadeUp 0.25s ease-out" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 32, height: 32, borderRadius: 8, border: "none", background: "#F1F5F9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", zIndex: 2 }}><XIcon /></button>
        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <AirlineLogo airline={airline} size={52} />
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", fontFamily: "'Outfit',sans-serif" }}>{airline.name}</div>
              <div style={{ fontSize: 13, color: "#94A3B8" }}>{flight.flightNumber || flight.id} &middot; {flight.cabin}</div>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#F8FAFC", borderRadius: 16, padding: 20, marginBottom: 24 }}>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>{flight.depTime}</div><div style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>{fromAirport?.city} ({fromAirport?.code})</div></div>
            <div style={{ textAlign: "center", flex: 1, padding: "0 16px" }}>
              <div style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6 }}>{flight.duration}</div>
              <div style={{ height: 2, background: "#E2E8F0", borderRadius: 1, position: "relative" }}><div style={{ position: "absolute", width: "100%", height: 2, borderRadius: 1, background: `linear-gradient(90deg,transparent,${airline.color})` }} /></div>
              <div style={{ fontSize: 12, color: flight.stops === 0 ? "#0D9488" : "#D97706", fontWeight: 700, marginTop: 6 }}>{flight.stops === 0 ? "Nonstop" : flight.stops === 1 ? "1 stop" : `${flight.stops} stops`}</div>
            </div>
            <div style={{ textAlign: "center" }}><div style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>{flight.arrTime}</div><div style={{ fontSize: 14, color: "#64748B", fontWeight: 500 }}>{toAirport?.city} ({toAirport?.code})</div></div>
          </div>
        </div>
        <div style={{ padding: "0 28px 28px" }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Flight Details</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
            {[{ icon: <BagIcon />, label: "Baggage", value: flight.baggage || "Contact airline" }, { icon: <InfoIcon />, label: "Fare Rules", value: flight.fareRules || "Standard" }, { icon: <span style={{ fontSize: 15 }}>&#127857;</span>, label: "Meals", value: flight.meals || "Not specified" }, { icon: <span style={{ fontSize: 15 }}>&#128246;</span>, label: "WiFi", value: flight.wifi || "N/A" }, { icon: <span style={{ fontSize: 15 }}>&#128186;</span>, label: "Seat Pitch", value: flight.seatPitch || "Standard" }].map((item, i) => (
              <div key={i} style={{ background: "#F8FAFC", borderRadius: 12, padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, color: "#0891B2" }}>{item.icon}<span style={{ fontSize: 11, fontWeight: 700, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 0.8 }}>{item.label}</span></div>
                <div style={{ fontSize: 13, color: "#334155", lineHeight: 1.5 }}>{item.value}</div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><span style={{ fontSize: 30, fontWeight: 800, color: "#0F172A" }}>${flight.price}</span><span style={{ fontSize: 13, color: "#94A3B8", marginLeft: 6 }}>per person</span></div>
            <button onClick={() => { onClose(); onSelect(); }} style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(8,145,178,0.3)", transition: "all 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.transform = "translateY(-2px)"} onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}>
              Select this flight
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── SEARCH PAGE ─────────────────────── */
function SearchPage({ onSearch }) {
  const [from, setFrom] = useState("JFK"); const [to, setTo] = useState("LAX");
  const [depDate, setDepDate] = useState(toDateStr(new Date()));
  const [retDate, setRetDate] = useState("");
  const [passengers, setPassengers] = useState(1);
  const [tripType, setTripType] = useState("oneway");
  const swap = () => { const t = from; setFrom(to); setTo(t); };

  useEffect(() => { if (tripType === "roundtrip" && !retDate) { const d = new Date(depDate + "T12:00:00"); d.setDate(d.getDate() + 7); setRetDate(toDateStr(d)); } }, [tripType]);
  useEffect(() => { if (retDate && retDate < depDate) setRetDate(depDate); }, [depDate]);

  const canSearch = from && to && from !== to;

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 500, background: "linear-gradient(135deg,#0F172A 0%,#164E63 50%,#0E7490 100%)", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -100, right: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(8,145,178,0.3) 0%,transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -60, left: -60, width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(20,184,166,0.2) 0%,transparent 70%)" }} />
      </div>

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto", padding: "32px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 60 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.12)", backdropFilter: "blur(10px)" }}><PlaneIcon size={22} color="#5EEAD4" /></div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#F0FDFA", letterSpacing: -0.5 }}>CheapnFly</span>
        </div>
        <div style={{ maxWidth: 600, marginBottom: 48, animation: "fadeUp 0.6s ease-out" }}>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 48, fontWeight: 800, color: "#fff", lineHeight: 1.15, marginBottom: 16 }}>Where will your<br />next journey take you?</h1>
          <p style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, color: "#94A3B8", lineHeight: 1.6 }}>Search hundreds of flights and find your perfect route</p>
        </div>
      </div>

      <div style={{ position: "relative", zIndex: 5, maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ background: "#fff", borderRadius: 24, padding: "32px 32px 28px", boxShadow: "0 20px 60px rgba(0,0,0,0.1)", animation: "fadeUp 0.6s 0.15s ease-out both", position: "relative", zIndex: 10 }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 24, background: "#F1F5F9", borderRadius: 10, padding: 4, width: "fit-content" }}>
            {["oneway", "roundtrip"].map(t => (
              <button key={t} onClick={() => setTripType(t)} style={{ padding: "8px 20px", borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 600, background: tripType === t ? "#fff" : "transparent", color: tripType === t ? "#0F172A" : "#64748B", boxShadow: tripType === t ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.2s" }}>
                {t === "oneway" ? "One Way" : "Round Trip"}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, flexWrap: "wrap" }}>
            <AirportDropdown value={from} onChange={setFrom} label="From" airports={AIRPORTS} />
            <button onClick={swap} style={{ width: 44, height: 44, borderRadius: 12, border: "2px solid #E2E8F0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748B", flexShrink: 0, transition: "all 0.3s" }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "#0891B2"; e.currentTarget.style.color = "#0891B2"; e.currentTarget.style.transform = "rotate(180deg)"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "#E2E8F0"; e.currentTarget.style.color = "#64748B"; e.currentTarget.style.transform = "rotate(0deg)"; }}>
              <SwapIcon />
            </button>
            <AirportDropdown value={to} onChange={setTo} label="To" airports={AIRPORTS} />
            <div style={{ minWidth: 150 }}>
              <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Departure</label>
              <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #E2E8F0", background: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#1E293B", outline: "none", cursor: "pointer", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#0891B2"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
            </div>
            {tripType === "roundtrip" && (
              <div style={{ minWidth: 150 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 6 }}>Return</label>
                <input type="date" value={retDate} onChange={e => setRetDate(e.target.value)} min={depDate} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "2px solid #E2E8F0", background: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, color: "#1E293B", outline: "none", cursor: "pointer", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#0891B2"} onBlur={e => e.target.style.borderColor = "#E2E8F0"} />
              </div>
            )}
            <PassengerSelector value={passengers} onChange={setPassengers} />
            <button onClick={() => { if (canSearch) onSearch({ from, to, depDate, retDate: tripType === "roundtrip" ? retDate : "", passengers, tripType }); }}
              style={{ padding: "12px 32px", borderRadius: 12, border: "none", height: 48, background: canSearch ? "linear-gradient(135deg,#0891B2,#0E7490)" : "#CBD5E1", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: canSearch ? "pointer" : "not-allowed", display: "flex", alignItems: "center", gap: 8, flexShrink: 0, boxShadow: canSearch ? "0 4px 16px rgba(8,145,178,0.35)" : "none", transition: "all 0.25s" }}
              onMouseEnter={e => { if (canSearch) { e.currentTarget.style.transform = "translateY(-2px)"; } }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>
              <SearchIcon /> Search Flights
            </button>
          </div>
          {from === to && from && <p style={{ color: "#DC2626", fontSize: 13, marginTop: 12, fontFamily: "'Outfit',sans-serif" }}>Origin and destination cannot be the same</p>}
        </div>

        <div style={{ marginTop: 80, paddingBottom: 60, position: "relative", zIndex: 1, animation: "fadeUp 0.6s 0.3s ease-out both" }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: 22, fontWeight: 700, color: "#1E293B", marginBottom: 20 }}>Popular Routes</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
            {[{ f: "JFK", t: "LAX", price: 149, img: "\u{1F334}" }, { f: "SFO", t: "LHR", price: 389, img: "\u{1F1EC}\u{1F1E7}" }, { f: "ORD", t: "MIA", price: 119, img: "\u{1F3D6}\u{FE0F}" }, { f: "LAX", t: "NRT", price: 520, img: "\u{1F5FC}" }].map(route => (
              <button key={route.f + route.t} onClick={() => { setFrom(route.f); setTo(route.t); }} style={{ padding: 20, borderRadius: 16, border: "1px solid #E2E8F0", background: "#fff", cursor: "pointer", textAlign: "left", transition: "all 0.2s", fontFamily: "'Outfit',sans-serif" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-4px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.08)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>{route.img}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1E293B", marginBottom: 4 }}>{AIRPORTS.find(a => a.code === route.f)?.city} &rarr; {AIRPORTS.find(a => a.code === route.t)?.city}</div>
                <div style={{ fontSize: 13, color: "#64748B" }}>from <span style={{ fontWeight: 700, color: "#0891B2" }}>${route.price}</span></div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── RESULTS PAGE ─────────────────────── */
function ResultsPage({ searchParams, onBack, onSelect }) {
  const { flights: allFlights, airlines } = useContext(AppContext);
  const { from, to, depDate, retDate, passengers, tripType } = searchParams;
  const fromAirport = AIRPORTS.find(a => a.code === from); const toAirport = AIRPORTS.find(a => a.code === to);
  const isRoundTrip = tripType === "roundtrip" && retDate;

  const [selectedDepDate, setSelectedDepDate] = useState(depDate);
  const [selectedRetDate, setSelectedRetDate] = useState(retDate);
  const [leg, setLeg] = useState("outbound");
  const [filterStops, setFilterStops] = useState("all");
  const [filterAirline, setFilterAirline] = useState("all");
  const [filterCabin, setFilterCabin] = useState("all");
  const [sortBy, setSortBy] = useState("price");
  const [detailFlight, setDetailFlight] = useState(null);
  const [selectedOutbound, setSelectedOutbound] = useState(null);

  const currentFrom = leg === "outbound" ? from : to;
  const currentTo = leg === "outbound" ? to : from;
  const currentDate = leg === "outbound" ? selectedDepDate : selectedRetDate;
  const currentFromAirport = leg === "outbound" ? fromAirport : toAirport;
  const currentToAirport = leg === "outbound" ? toAirport : fromAirport;

  const routeFlights = useMemo(() => allFlights.filter(f => f.from === currentFrom && f.to === currentTo), [allFlights, currentFrom, currentTo]);
  const dayFlights = useMemo(() => routeFlights.filter(f => f.date === currentDate), [routeFlights, currentDate]);

  const baseDateStr = leg === "outbound" ? depDate : retDate;
  const dateTabs = useMemo(() => {
    if (!baseDateStr) return [];
    const base = new Date(baseDateStr + "T12:00:00");
    return Array.from({ length: 7 }, (_, i) => { const d = new Date(base); d.setDate(d.getDate() + i - 1); const ds = toDateStr(d); const df = routeFlights.filter(f => f.date === ds); return { date: ds, label: formatDate(d), cheapest: df.length > 0 ? Math.min(...df.map(f => f.price)) : null }; });
  }, [baseDateStr, routeFlights]);

  const airlinesInResults = useMemo(() => { const u = [...new Set(dayFlights.map(f => f.airlineCode))]; return airlines.filter(a => u.includes(a.code)); }, [dayFlights, airlines]);
  const filtered = useMemo(() => dayFlights.filter(f => filterStops === "all" || f.stops === Number(filterStops)).filter(f => filterAirline === "all" || f.airlineCode === filterAirline).filter(f => filterCabin === "all" || f.cabin === filterCabin).sort((a, b) => { if (sortBy === "price") return a.price - b.price; if (sortBy === "duration") return (a.durationMin || 0) - (b.durationMin || 0); if (sortBy === "departure") return a.depTime.localeCompare(b.depTime); return 0; }), [dayFlights, filterStops, filterAirline, filterCabin, sortBy]);

  const handleSelectFlight = (flight) => {
    const airline = airlines.find(a => a.code === flight.airlineCode) || { code: flight.airlineCode, name: flight.airlineCode, color: "#64748B", logo: "" };
    const enriched = { ...flight, airline };
    if (isRoundTrip && leg === "outbound") { setSelectedOutbound(enriched); setLeg("return"); setFilterStops("all"); setFilterAirline("all"); setFilterCabin("all"); }
    else if (isRoundTrip && leg === "return") { onSelect({ outbound: selectedOutbound, returnFlight: enriched }); }
    else { onSelect({ outbound: enriched, returnFlight: null }); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}><BackIcon /> New Search</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PlaneIcon size={18} color="#5EEAD4" /><span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#F0FDFA" }}>CheapnFly</span></div>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 12, color: "#E2E8F0", fontSize: 14, fontWeight: 500 }}>
            <span style={{ fontWeight: 700 }}>{fromAirport?.city}</span>
            {isRoundTrip ? <span style={{ color: "#5EEAD4" }}>&harr;</span> : <PlaneIcon size={14} color="#5EEAD4" />}
            <span style={{ fontWeight: 700 }}>{toAirport?.city}</span>
            <span style={{ color: "#64748B", marginLeft: 4 }}>&middot; {passengers} pax</span>
          </div>
        </div>
      </div>

      {isRoundTrip && (
        <div style={{ background: "#fff", borderBottom: "1px solid #E2E8F0" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", padding: "0 24px" }}>
            {[{ id: "outbound", label: `Outbound: ${fromAirport?.city} \u2192 ${toAirport?.city}` }, { id: "return", label: `Return: ${toAirport?.city} \u2192 ${fromAirport?.city}` }].map(l => (
              <button key={l.id} onClick={() => { if (l.id === "outbound" || selectedOutbound) setLeg(l.id); }} disabled={l.id === "return" && !selectedOutbound}
                style={{ padding: "14px 24px", border: "none", borderBottom: leg === l.id ? "3px solid #0891B2" : "3px solid transparent", background: "transparent", cursor: l.id === "return" && !selectedOutbound ? "not-allowed" : "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: leg === l.id ? 700 : 500, color: leg === l.id ? "#0F172A" : "#64748B", opacity: l.id === "return" && !selectedOutbound ? 0.4 : 1, transition: "all 0.2s" }}>
                {l.label}
                {l.id === "outbound" && selectedOutbound && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#0D9488", background: "#F0FDF4", padding: "2px 8px", borderRadius: 4 }}>Selected</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ background: isRoundTrip ? "#F8FAFC" : "#fff", borderBottom: "1px solid #E2E8F0", overflowX: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", padding: "0 24px" }}>
          {dateTabs.map(tab => {
            const active = tab.date === currentDate;
            return (<button key={tab.date} onClick={() => { leg === "outbound" ? setSelectedDepDate(tab.date) : setSelectedRetDate(tab.date); }}
              style={{ padding: "14px 20px", border: "none", borderBottom: active ? "3px solid #0891B2" : "3px solid transparent", background: "transparent", cursor: "pointer", textAlign: "center", flexShrink: 0, fontFamily: "'Outfit',sans-serif" }}>
              <div style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#0F172A" : "#64748B" }}>{tab.label}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: active ? "#0891B2" : "#94A3B8", marginTop: 2 }}>{tab.cheapest !== null ? `$${tab.cheapest}` : "--"}</div>
            </button>);
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: 24, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ width: 250, flexShrink: 0, background: "#fff", borderRadius: 20, padding: 24, border: "1px solid #E2E8F0", position: "sticky", top: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 24 }}>Filters</h3>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Stops</div>
            {[["all", "Any"], ["0", "Nonstop"], ["1", "1 Stop"], ["2", "2+ Stops"]].map(([v, l]) => (<label key={v} onClick={() => setFilterStops(v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer", fontSize: 14, color: "#334155", fontWeight: filterStops === v ? 600 : 400 }}><div style={{ width: 20, height: 20, borderRadius: 6, border: filterStops === v ? "none" : "2px solid #CBD5E1", background: filterStops === v ? "#0891B2" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{filterStops === v && <CheckIcon />}</div>{l}</label>))}</div>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Airline</div>
            <label onClick={() => setFilterAirline("all")} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer", fontSize: 14, color: "#334155", fontWeight: filterAirline === "all" ? 600 : 400 }}><div style={{ width: 20, height: 20, borderRadius: 6, border: filterAirline === "all" ? "none" : "2px solid #CBD5E1", background: filterAirline === "all" ? "#0891B2" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{filterAirline === "all" && <CheckIcon />}</div>All</label>
            {airlinesInResults.map(a => (<label key={a.code} onClick={() => setFilterAirline(a.code)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer", fontSize: 14, color: "#334155", fontWeight: filterAirline === a.code ? 600 : 400 }}><div style={{ width: 20, height: 20, borderRadius: 6, border: filterAirline === a.code ? "none" : "2px solid #CBD5E1", background: filterAirline === a.code ? a.color : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{filterAirline === a.code && <CheckIcon />}</div>{a.name}</label>))}</div>
          <div style={{ marginBottom: 24 }}><div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Cabin</div>
            {[["all", "Any"], ["Economy", "Economy"], ["Premium Economy", "Premium"], ["Business", "Business"]].map(([v, l]) => (<label key={v} onClick={() => setFilterCabin(v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer", fontSize: 14, color: "#334155", fontWeight: filterCabin === v ? 600 : 400 }}><div style={{ width: 20, height: 20, borderRadius: 6, border: filterCabin === v ? "none" : "2px solid #CBD5E1", background: filterCabin === v ? "#0891B2" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{filterCabin === v && <CheckIcon />}</div>{l}</label>))}</div>
          <div><div style={{ fontSize: 12, fontWeight: 600, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Sort By</div>
            {[["price", "Lowest Price"], ["duration", "Shortest"], ["departure", "Earliest"]].map(([v, l]) => (<label key={v} onClick={() => setSortBy(v)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 0", cursor: "pointer", fontSize: 14, color: "#334155", fontWeight: sortBy === v ? 600 : 400 }}><div style={{ width: 20, height: 20, borderRadius: "50%", border: sortBy === v ? "none" : "2px solid #CBD5E1", background: sortBy === v ? "#0891B2" : "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>{sortBy === v && <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}</div>{l}</label>))}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 14, color: "#64748B", marginBottom: 16 }}><span style={{ fontWeight: 700, color: "#0F172A" }}>{filtered.length}</span> {leg} flights &middot; {currentFromAirport?.city} &rarr; {currentToAirport?.city}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((flight, i) => {
              const airline = airlines.find(a => a.code === flight.airlineCode) || { code: flight.airlineCode, name: flight.airlineCode, color: "#64748B", logo: "" };
              const stopsLabel = flight.stops === 0 ? "Nonstop" : flight.stops === 1 ? "1 stop" : `${flight.stops} stops`;
              const stopsColor = flight.stops === 0 ? "#0D9488" : flight.stops === 1 ? "#D97706" : "#DC2626";
              return (
                <div key={flight.id} style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", overflow: "hidden", transition: "all 0.25s", animation: `fadeUp 0.3s ${i * 0.03}s both` }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 150 }}>
                      <AirlineLogo airline={airline} size={44} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "#1E293B" }}>{airline.name}</div>
                        <div style={{ fontSize: 12, color: "#94A3B8" }}>{flight.flightNumber || flight.id} &middot; {flight.cabin}</div>
                      </div>
                    </div>
                    <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 16, minWidth: 260 }}>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>{flight.depTime}</div><div style={{ fontSize: 12, color: "#64748B" }}>{currentFromAirport?.code}</div></div>
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 8px" }}>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginBottom: 6, fontWeight: 500 }}>{flight.duration}</div>
                        <div style={{ width: "100%", height: 2, background: "#E2E8F0", borderRadius: 1, position: "relative" }}>
                          <div style={{ position: "absolute", width: "100%", height: 2, borderRadius: 1, background: `linear-gradient(90deg,transparent,${airline.color})` }} />
                          {flight.stops > 0 && Array.from({ length: flight.stops }).map((_, si) => (<div key={si} style={{ position: "absolute", top: -3, left: `${(si + 1) * (100 / (flight.stops + 1))}%`, width: 8, height: 8, borderRadius: "50%", background: "#fff", border: `2px solid ${airline.color}` }} />))}
                        </div>
                        <div style={{ fontSize: 11, color: stopsColor, fontWeight: 700, marginTop: 6 }}>{stopsLabel}</div>
                      </div>
                      <div style={{ textAlign: "center" }}><div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A" }}>{flight.arrTime}</div><div style={{ fontSize: 12, color: "#64748B" }}>{currentToAirport?.code}</div></div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 210, justifyContent: "flex-end" }}>
                      <div style={{ textAlign: "right" }}><span style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>${flight.price}</span><div style={{ fontSize: 12, color: "#94A3B8", marginTop: 2 }}>per person</div></div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <button onClick={() => setDetailFlight({ flight, airline })} style={{ padding: "8px 14px", borderRadius: 10, border: "1px solid #E2E8F0", background: "#F8FAFC", color: "#334155", fontFamily: "'Outfit',sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap" }}
                          onMouseEnter={e => e.currentTarget.style.background = "#E2E8F0"} onMouseLeave={e => e.currentTarget.style.background = "#F8FAFC"}>Details</button>
                        <button onClick={() => handleSelectFlight(flight)} style={{ padding: "10px 18px", borderRadius: 10, border: "none", background: "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s", whiteSpace: "nowrap", boxShadow: "0 2px 8px rgba(8,145,178,0.25)" }}
                          onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-1px)"; }} onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}>Select</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (<div style={{ textAlign: "center", padding: "60px 20px", color: "#94A3B8", background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0" }}><div style={{ fontSize: 40, marginBottom: 16 }}>&#9992;&#65039;</div><div style={{ fontSize: 16, fontWeight: 600, color: "#334155", marginBottom: 8 }}>No flights available</div><div style={{ fontSize: 14 }}>Try a different date or adjust your filters</div></div>)}
          </div>
        </div>
      </div>
      {detailFlight && <FlightDetailModal flight={detailFlight.flight} airline={detailFlight.airline} fromAirport={currentFromAirport} toAirport={currentToAirport} onClose={() => setDetailFlight(null)} onSelect={() => handleSelectFlight(detailFlight.flight)} />}
    </div>
  );
}

/* ─────────────────────── PAYMENT PAGE ─────────────────────── */
function PaymentPage({ flightSelection, passengers, fromAirport, toAirport, onBack }) {
  const { outbound, returnFlight } = flightSelection;
  const isRT = !!returnFlight;
  const shownFarePerPerson = Number(outbound.price || 0);
  const taxPerPerson = Number(outbound.tax || 0);
  const baseFarePerPerson = Math.max(0, shownFarePerPerson - taxPerPerson);
  const grand = shownFarePerPerson * passengers;
  const [pax, setPax] = useState(Array.from({ length: passengers }, () => ({ firstName: "", lastName: "", email: "", dob: "" })));
  const [cn, setCn] = useState(""); const [cnum, setCnum] = useState(""); const [exp, setExp] = useState(""); const [cvc, setCvc] = useState("");
  const [billingCountry, setBillingCountry] = useState(""); const [billingZip, setBillingZip] = useState("");
  const [step, setStep] = useState(1);
  const upd = (idx, f, v) => { setPax(prev => prev.map((p, i) => i === idx ? { ...p, [f]: v } : p)); };

  const SumCard = ({ flight, label }) => {
    const a = flight.airline; const fF = label.includes("Return") ? toAirport : fromAirport; const fT = label.includes("Return") ? fromAirport : toAirport;
    return (<div style={{ background: "#F8FAFC", borderRadius: 14, padding: 16, marginBottom: 12 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#0891B2", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>{label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}><AirlineLogo airline={a} size={32} /><div><div style={{ fontSize: 13, fontWeight: 600, color: "#0F172A" }}>{a.name}</div><div style={{ fontSize: 11, color: "#94A3B8" }}>{flight.flightNumber || flight.id} &middot; {flight.cabin}</div></div></div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div><div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{flight.depTime}</div><div style={{ fontSize: 11, color: "#64748B" }}>{fF?.city}</div></div>
        <div style={{ textAlign: "center" }}><PlaneIcon size={14} color="#94A3B8" /><div style={{ fontSize: 10, color: "#94A3B8" }}>{flight.duration}</div></div>
        <div style={{ textAlign: "right" }}><div style={{ fontSize: 20, fontWeight: 800, color: "#0F172A" }}>{flight.arrTime}</div><div style={{ fontSize: 11, color: "#64748B" }}>{fT?.city}</div></div>
      </div>
    </div>);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F8FAFC", fontFamily: "'Outfit',sans-serif" }}>
      <div style={{ background: "#0F172A", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
          <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", borderRadius: 10, padding: "8px 12px", cursor: "pointer", color: "#94A3B8", display: "flex", alignItems: "center", gap: 6, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 500 }}><BackIcon /> Back</button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}><PlaneIcon size={18} color="#5EEAD4" /><span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#F0FDFA" }}>CheapnFly</span></div>
        </div>
      </div>
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px", display: "flex", gap: 32, flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: 1, minWidth: 340 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
            {["Passengers", "Payment"].map((s, i) => (
              <button key={s} onClick={() => setStep(i + 1)} style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 600, background: step === i + 1 ? "#0891B2" : "#E2E8F0", color: step === i + 1 ? "#fff" : "#64748B" }}>
                <span style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: step === i + 1 ? "rgba(255,255,255,0.25)" : "#CBD5E1", fontSize: 12, fontWeight: 800 }}>{i + 1}</span>{s}
              </button>
            ))}
          </div>
          {step === 1 && (<div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Passenger Details</h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 28 }}>Enter details for {passengers} passenger{passengers > 1 ? "s" : ""}</p>
            {pax.map((p, idx) => (<div key={idx} style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24, marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0891B2", marginBottom: 16, textTransform: "uppercase", letterSpacing: 1 }}>Passenger {idx + 1}</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}><InputField label="First Name" value={p.firstName} onChange={v => upd(idx, "firstName", v)} placeholder="John" half /><InputField label="Last Name" value={p.lastName} onChange={v => upd(idx, "lastName", v)} placeholder="Doe" half /></div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><InputField label="Email" value={p.email} onChange={v => upd(idx, "email", v)} placeholder="john@example.com" half /><InputField label="Date of Birth" value={p.dob} onChange={v => upd(idx, "dob", v)} type="date" half /></div>
            </div>))}
            <button onClick={() => setStep(2)} style={{ width: "100%", padding: "14px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(8,145,178,0.3)", marginTop: 8 }}>Continue to Payment &rarr;</button>
          </div>)}
          {step === 2 && (<div style={{ animation: "fadeUp 0.3s ease-out" }}>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 28, fontWeight: 700, color: "#0F172A", marginBottom: 8 }}>Payment Information</h2>
            <p style={{ color: "#64748B", fontSize: 14, marginBottom: 28 }}>Review your itinerary and complete your secure checkout.</p>
            <div style={{ background: "#fff", borderRadius: 18, border: "1px solid #E2E8F0", padding: 24 }}>
              <div style={{ background: "#EFF6FF", border: "1px solid #BFDBFE", color: "#1D4ED8", borderRadius: 12, padding: "12px 14px", fontSize: 13, fontWeight: 500, marginBottom: 16 }}>
                🔒 Secure checkout powered by CheapnFly Payments. Your payment information is encrypted and protected.
              </div>
              <InputField label="Cardholder Name" value={cn} onChange={setCn} placeholder="John Doe" /><div style={{ height: 12 }} />
              <InputField label="Card Number" value={cnum} onChange={setCnum} placeholder="4242 4242 4242 4242" /><div style={{ height: 12 }} />
              <div style={{ display: "flex", gap: 12 }}><InputField label="Expiry" value={exp} onChange={setExp} placeholder="MM / YY" half /><InputField label="CVC" value={cvc} onChange={setCvc} placeholder="123" half /></div>
              <div style={{ height: 16 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#0F172A", marginBottom: 12 }}>Billing Address</div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}><InputField label="Country" value={billingCountry} onChange={setBillingCountry} placeholder="United States" half /><InputField label="ZIP Code" value={billingZip} onChange={setBillingZip} placeholder="10001" half /></div>
            </div>
            <button onClick={() => alert(`Booking confirmed!\n\n${isRT ? "Round Trip" : "One Way"}\nOutbound: ${outbound.airline.name} ${outbound.flightNumber || outbound.id}\n${fromAirport?.city} \u2192 ${toAirport?.city}${returnFlight ? `\nReturn: ${returnFlight.airline.name} ${returnFlight.flightNumber || returnFlight.id}\n${toAirport?.city} \u2192 ${fromAirport?.city}` : ""}\n${passengers} pax\nTotal: $${grand}\n\nDemo only.`)}
              style={{ width: "100%", padding: "16px 0", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#0891B2,#0E7490)", color: "#fff", fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 16px rgba(8,145,178,0.3)", marginTop: 24 }}>Complete Booking • ${grand}</button>
          </div>)}
        </div>
        <div style={{ width: 320, flexShrink: 0, position: "sticky", top: 24 }}>
          <div style={{ background: "#fff", borderRadius: 20, border: "1px solid #E2E8F0", padding: 24, animation: "fadeUp 0.4s 0.1s both" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A", marginBottom: 16 }}>Booking Summary</div>
            <SumCard flight={outbound} label="Outbound" />
            {isRT && <SumCard flight={returnFlight} label="Return" />}
            <div style={{ borderTop: "1px solid #E2E8F0", paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#64748B", marginBottom: 6 }}><span>Base fare</span><span>${baseFarePerPerson} × {passengers}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#64748B", marginBottom: 6 }}><span>Taxes & fees</span><span>${taxPerPerson} × {passengers}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: "#64748B", marginBottom: 6 }}><span>Baggage</span><span style={{ color: "#0D9488" }}>Included</span></div>
              <div style={{ borderTop: "2px solid #E2E8F0", paddingTop: 12, marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: "#0F172A" }}>Total</span>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#0F172A" }}>${grand}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── MAIN APP WITH HISTORY API ─────────────────────── */
export default function App() {
  const [airlines, setAirlines] = useState([]);
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState("search");
  const [searchParams, setSearchParams] = useState(null);
  const [flightSelection, setFlightSelection] = useState(null);
  const [showAdmin, setShowAdmin] = useState(false);
  const [adminAuth, setAdminAuth] = useState(false);
  const ADMIN_PASSWORD = "admin123";

  const navigate = (newPage, data) => {
    if (newPage === "results") { setSearchParams(data); }
    if (newPage === "payment") { setFlightSelection(data); }
    setPage(newPage);
    window.history.pushState({ page: newPage }, "", `#${newPage}`);
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: airlinesData, error: airlinesError } = await supabase
        .from("airlines")
        .select("*")
        .order("name", { ascending: true });

      const { data: flightsData, error: flightsError } = await supabase
        .from("flights")
        .select("*")
        .eq("is_visible", true)
        .order("flight_date", { ascending: true });

      if (airlinesError) {
        console.error("Airlines load error:", airlinesError);
      } else {
        setAirlines((airlinesData || []).map(mapAirlineRowToUi));
      }

      if (flightsError) {
        console.error("Flights load error:", flightsError);
      } else {
        setFlights((flightsData || []).map(mapFlightRowToUi));
      }

      setLoading(false);
    }

    loadData();
  }, []);

  useEffect(() => {
    window.history.replaceState({ page: "search" }, "", "#search");
    const handler = (e) => {
      const state = e.state;
      if (state?.page === "search") { setPage("search"); }
      else if (state?.page === "results") { setPage("results"); }
      else if (state?.page === "payment") { setPage("payment"); }
      else { setPage("search"); }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const handleAdminToggle = () => {
    if (adminAuth) { setShowAdmin(!showAdmin); }
    else { const p = prompt("Enter admin password:"); if (p === ADMIN_PASSWORD) { setAdminAuth(true); setShowAdmin(true); } else if (p !== null) { alert("Incorrect password"); } }
  };

  if (loading) {
    return <div style={{ padding: 40, fontFamily: "'Outfit', sans-serif" }}>Loading...</div>;
  }

  return (
    <AppContext.Provider value={{ flights, setFlights, airlines, setAirlines }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Playfair+Display:wght@600;700;800&display=swap');
        *{margin:0;padding:0;box-sizing:border-box}body{margin:0}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dropIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes slideIn{from{transform:translateX(100%)}to{transform:translateX(0)}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none}
        input[type=number]{-moz-appearance:textfield}::selection{background:#0891B244}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:3px}
      `}</style>

      <button onClick={handleAdminToggle} title="Admin Panel" style={{ position: "fixed", bottom: 24, right: 24, zIndex: 1000, width: 52, height: 52, borderRadius: 16, border: "none", background: adminAuth ? "#0F172A" : "rgba(15,23,42,0.8)", color: adminAuth ? "#5EEAD4" : "#94A3B8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.2)", transition: "all 0.2s", backdropFilter: "blur(8px)" }}
        onMouseEnter={e => e.currentTarget.style.transform = "scale(1.08)"} onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}><GearIcon /></button>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}

      {page === "search" && <SearchPage onSearch={p => navigate("results", p)} />}
      {page === "results" && searchParams && <ResultsPage searchParams={searchParams} onBack={() => navigate("search")} onSelect={sel => navigate("payment", sel)} />}
      {page === "payment" && flightSelection && searchParams && <PaymentPage flightSelection={flightSelection} passengers={searchParams.passengers} fromAirport={AIRPORTS.find(a => a.code === searchParams.from)} toAirport={AIRPORTS.find(a => a.code === searchParams.to)} onBack={() => navigate("results", searchParams)} />}
    </AppContext.Provider>
  );
}
