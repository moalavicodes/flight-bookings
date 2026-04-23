import { useState, useEffect, useMemo, useRef, createContext, useContext } from "react";
import { supabase } from "./lib/supabase";
/* ─────────────────────── CONTEXT ─────────────────────── */
const AppContext = createContext();
const mapAirlineRowToUi = (a) => ({
  code: a.code,
  name: a.name,
  color: a.color || "#64748B",
  logo: a.logo_url || "",
});

function getDisplayedPrice(flight) {
  return Number(
    flight.display_price ??
    flight.price_override ??
    (Number(flight.price || 0) + Number(flight.markup || 0) + Number(flight.tax || 0))
  );
}

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
  price: getDisplayedPrice(f),
  tax: Number(f.tax || 0),
  baggage: f.baggage,
  fareRules: f.fare_rules,
  meals: f.meals,
  seatPitch: f.seat_pitch,
  wifi: f.wifi,
});
const AIRPORTS = [
  { code: "JFK", city: "New York", name: "John F. Kennedy International Airport" },
  { code: "EWR", city: "Newark", name: "Newark Liberty International Airport" },
  { code: "LGA", city: "New York", name: "LaGuardia Airport" },
  { code: "LAX", city: "Los Angeles", name: "Los Angeles International Airport" },
  { code: "ORD", city: "Chicago", name: "O'Hare International Airport" },
  { code: "ATL", city: "Atlanta", name: "Hartsfield-Jackson Atlanta International Airport" },
  { code: "MIA", city: "Miami", name: "Miami International Airport" },
  { code: "FLL", city: "Fort Lauderdale", name: "Fort Lauderdale-Hollywood International Airport" },
  { code: "SFO", city: "San Francisco", name: "San Francisco International Airport" },
  { code: "SEA", city: "Seattle", name: "Seattle-Tacoma International Airport" },
  { code: "DFW", city: "Dallas", name: "Dallas/Fort Worth International Airport" },
  { code: "DEN", city: "Denver", name: "Denver International Airport" },
  { code: "BOS", city: "Boston", name: "Logan International Airport" },
  { code: "PHL", city: "Philadelphia", name: "Philadelphia International Airport" },
  { code: "IAD", city: "Washington", name: "Washington Dulles International Airport" },
  { code: "DCA", city: "Washington", name: "Ronald Reagan Washington National Airport" },
  { code: "CLT", city: "Charlotte", name: "Charlotte Douglas International Airport" },
  { code: "IAH", city: "Houston", name: "George Bush Intercontinental Airport" },
  { code: "PHX", city: "Phoenix", name: "Phoenix Sky Harbor International Airport" },
  { code: "LAS", city: "Las Vegas", name: "Harry Reid International Airport" },
  { code: "MSP", city: "Minneapolis", name: "Minneapolis-Saint Paul International Airport" },
  { code: "DTW", city: "Detroit", name: "Detroit Metropolitan Wayne County Airport" },

  { code: "YYZ", city: "Toronto", name: "Toronto Pearson International Airport" },
  { code: "YVR", city: "Vancouver", name: "Vancouver International Airport" },

  { code: "LHR", city: "London", name: "Heathrow Airport" },
  { code: "LGW", city: "London", name: "Gatwick Airport" },
  { code: "CDG", city: "Paris", name: "Charles de Gaulle Airport" },
  { code: "AMS", city: "Amsterdam", name: "Amsterdam Airport Schiphol" },
  { code: "FRA", city: "Frankfurt", name: "Frankfurt Airport" },
  { code: "MUC", city: "Munich", name: "Munich Airport" },
  { code: "MAD", city: "Madrid", name: "Adolfo Suarez Madrid-Barajas Airport" },
  { code: "BCN", city: "Barcelona", name: "Barcelona-El Prat Airport" },
  { code: "FCO", city: "Rome", name: "Leonardo da Vinci International Airport" },
  { code: "ZRH", city: "Zurich", name: "Zurich Airport" },
  { code: "IST", city: "Istanbul", name: "Istanbul Airport" },

  { code: "DXB", city: "Dubai", name: "Dubai International Airport" },
  { code: "DWC", city: "Dubai", name: "Al Maktoum International Airport" },
  { code: "AUH", city: "Abu Dhabi", name: "Zayed International Airport" },
  { code: "DOH", city: "Doha", name: "Hamad International Airport" },
  { code: "SHJ", city: "Sharjah", name: "Sharjah International Airport" },
  { code: "JED", city: "Jeddah", name: "King Abdulaziz International Airport" },
  { code: "RUH", city: "Riyadh", name: "King Khalid International Airport" },
  { code: "MCT", city: "Muscat", name: "Muscat International Airport" },
  { code: "KWI", city: "Kuwait City", name: "Kuwait International Airport" },
  { code: "BAH", city: "Manama", name: "Bahrain International Airport" },

  { code: "DEL", city: "Delhi", name: "Indira Gandhi International Airport" },
  { code: "BOM", city: "Mumbai", name: "Chhatrapati Shivaji Maharaj International Airport" },
  { code: "BLR", city: "Bengaluru", name: "Kempegowda International Airport" },
  { code: "HYD", city: "Hyderabad", name: "Rajiv Gandhi International Airport" },
  { code: "MAA", city: "Chennai", name: "Chennai International Airport" },
  { code: "CCU", city: "Kolkata", name: "Netaji Subhas Chandra Bose International Airport" },
  { code: "AMD", city: "Ahmedabad", name: "Sardar Vallabhbhai Patel International Airport" },
  { code: "PNQ", city: "Pune", name: "Pune Airport" },
  { code: "GOI", city: "Goa", name: "Dabolim Airport" },
  { code: "IDR", city: "Indore", name: "Devi Ahilya Bai Holkar Airport" },
  { code: "COK", city: "Kochi", name: "Cochin International Airport" },
  { code: "LKO", city: "Lucknow", name: "Chaudhary Charan Singh International Airport" },
  { code: "JAI", city: "Jaipur", name: "Jaipur International Airport" },

  { code: "NRT", city: "Tokyo", name: "Narita International Airport" },
  { code: "HND", city: "Tokyo", name: "Haneda Airport" },
  { code: "KIX", city: "Osaka", name: "Kansai International Airport" },
  { code: "ICN", city: "Seoul", name: "Incheon International Airport" },
  { code: "SIN", city: "Singapore", name: "Singapore Changi Airport" },
  { code: "BKK", city: "Bangkok", name: "Suvarnabhumi Airport" },
  { code: "HKG", city: "Hong Kong", name: "Hong Kong International Airport" },
  { code: "KUL", city: "Kuala Lumpur", name: "Kuala Lumpur International Airport" },
  { code: "SYD", city: "Sydney", name: "Sydney Airport" },
  { code: "MEL", city: "Melbourne", name: "Melbourne Airport" },
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

/* ─────────────────────── ICONS ─────────────────────── */
const PlaneIcon = ({ size = 20, color = "currentColor" }) => (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" /></svg>);
const SwapIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 16V4m0 12l-3-3m3 3l3-3M17 8v12m0-12l3 3m-3-3l-3 3" /></svg>);
const SearchIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>);
const ChevronDown = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>);
const CheckIcon = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5L20 7" /></svg>);
const BackIcon = () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>);
const UserIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 00-4-4H9a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>);
const BagIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>);
const InfoIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4M12 8h.01" /></svg>);
const XIcon = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>);

/* ─────────────────────── AIRLINE LOGO ─────────────────────── */
function AirlineLogo({ airline, size = 44 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size > 36 ? 12 : 8,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F8FAFC",
        border: "1px solid #E2E8F0",
        overflow: "hidden",
        flexShrink: 0
      }}
    >
      {airline.logo ? (
        <img
          src={airline.logo}
          alt={airline.name}
          onError={(e) => {
            e.currentTarget.style.display = "none";
            const fallback = e.currentTarget.parentElement?.querySelector(".airline-fallback");
            if (fallback) fallback.style.display = "flex";
          }}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            padding: 6,
            background: "#fff"
          }}
        />
      ) : null}

      <div
        className="airline-fallback"
        style={{
          display: airline.logo ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          fontWeight: 800,
          fontSize: size * 0.34,
          color: airline.color || "#334155",
          letterSpacing: 0.5,
          background: `linear-gradient(135deg,${(airline.color || "#64748B")}22,${(airline.color || "#64748B")}0A)`
        }}
      >
        {airline.code}
      </div>
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
                <div key={flight.id} style={{ background: "#fff", borderRadius: 22, border: "1px solid #E2E8F0", overflow: "hidden", transition: "all 0.25s", animation: `fadeUp 0.3s ${i * 0.03}s both`, boxShadow: "0 6px 18px rgba(15,23,42,0.04)" }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.07)"; e.currentTarget.style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = "none"; e.currentTarget.style.transform = "translateY(0)"; }}>
                  <div style={{ padding: "18px 24px", display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 190 }}>
                      <AirlineLogo airline={airline} size={48} />
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>{airline.name}</div>
                          {i === 0 && (
                            <span style={{ background: "#DCFCE7", color: "#166534", fontSize: 10, fontWeight: 800, padding: "3px 7px", borderRadius: 999 }}>
                              Best Value
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: "#64748B" }}>{flight.flightNumber || flight.id} &middot; {flight.cabin}</div>
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 230, justifyContent: "flex-end" }}>
                      <div style={{ textAlign: "right", minWidth: 110 }}>
                        <div style={{ fontSize: 11, color: "#64748B", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}>Round trip</div>
                        <span style={{ fontSize: 30, fontWeight: 800, color: "#0F172A", lineHeight: 1 }}>${flight.price}</span>
                        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>incl. taxes & fees</div>
                      </div>
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

      {page === "search" && <SearchPage onSearch={p => navigate("results", p)} />}
      {page === "results" && searchParams && <ResultsPage searchParams={searchParams} onBack={() => navigate("search")} onSelect={sel => navigate("payment", sel)} />}
      {page === "payment" && flightSelection && searchParams && <PaymentPage flightSelection={flightSelection} passengers={searchParams.passengers} fromAirport={AIRPORTS.find(a => a.code === searchParams.from)} toAirport={AIRPORTS.find(a => a.code === searchParams.to)} onBack={() => navigate("results", searchParams)} />}
    </AppContext.Provider>
  );
}
