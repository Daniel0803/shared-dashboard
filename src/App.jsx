import React, { useEffect, useMemo, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAfDf9HXxty8UrVQNvlVKxx_ERT9VLClQU",
  authDomain: "shared-dashboard-f428d.firebaseapp.com",
  databaseURL: "https://shared-dashboard-f428d-default-rtdb.firebaseio.com",
  projectId: "shared-dashboard-f428d",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== TIME OPTIONS =====
const timeOptions = [];
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    timeOptions.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  let hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
};

const getColumns = () => {
  if (window.innerWidth < 600) return 2;
  if (window.innerWidth < 900) return 4;
  return 7;
};

// ===== UI =====
const Card = React.forwardRef(({ children, style, ...props }, ref) => (
  <div
    ref={ref}
    {...props}
    style={{
      background: "linear-gradient(145deg, #0f172a, #020617)",
      borderRadius: 16,
      padding: 10,
      minHeight: 100,
      fontSize: 13,
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      cursor: "pointer",
      transition: "0.2s",
      ...style,
    }}
  >
    {children}
  </div>
));

const Button = ({ children, variant = "primary", ...props }) => {
  const colors = {
    primary: "#22c55e",
    danger: "#ef4444",
  };

  return (
    <button
      {...props}
      style={{
        padding: "6px 10px",
        borderRadius: 8,
        border: "none",
        background: colors[variant],
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
        marginTop: 8
      }}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [columns, setColumns] = useState(getColumns());
  const [viewMode, setViewMode] = useState("month");

  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ date: "", time: "", title: "" });

  const todayRef = useRef(null);
  const today = new Date();

  const users = {
    Daniel: "0803",
    Dillon: "2712",
    Marlon: "1004",
    Dellary: "2608",
    Marelly: "2811",
  };

  const colors = {
    Daniel: "#3b82f6",
    Dillon: "#22c55e",
    Marlon: "#eab308",
    Dellary: "#ec4899",
    Marelly: "#a855f7",
  };

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};
      setEvents(Object.entries(data).map(([id, val]) => ({ id, ...val })));
    });
  }, []);

  const login = () => {
    const user = Object.keys(users).find(u => users[u] === pinInput);
    if (user) {
      setCurrentUser(user);
      setPinInput("");
      setShowLoginModal(false);
    } else alert("Wrong PIN");
  };

  const logout = () => {
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  const submitEvent = () => {
    if (!form.time || !form.title) return;

    if (editingId) {
      update(ref(db, `events/${editingId}`), { ...form, user: currentUser });
    } else {
      push(ref(db, "events"), { ...form, user: currentUser, createdAt: Date.now() });
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ date: "", time: "", title: "" });
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    if (event.user !== currentUser) return;
    setForm(event);
    setEditingId(event.id);
    setShowModal(true);
  };

  const handleDelete = () => {
    remove(ref(db, `events/${editingId}`));
    setShowModal(false);
  };

  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(d);
  };

  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  // ===== MONTH DAYS =====
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const calendarDays = [];
  for (let i = 0; i < start.getDay(); i++) calendarDays.push(null);

  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const key = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    calendarDays.push({ key, dateObj: d });
  }

  // ===== WEEK DAYS =====
  const startOfWeek = new Date(currentDate);
  startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

  const weekDays = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);

    const key = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    weekDays.push({ key, dateObj: d });
  }

  const grouped = useMemo(() => {
    const g = {};
    events.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [events]);

  const monthName = currentDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  const navBtn = {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: "none",
    background: "#22c55e",
    color: "white",
    fontSize: 16,
    cursor: "pointer"
  };

  return (
    <div style={{ padding: 12, background: "#000", minHeight: "100vh", color: "white" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>🗓️ Balentina</div>
          <div style={{ opacity: 0.6 }}>Schedule</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => setViewMode(viewMode === "month" ? "week" : "month")}
            style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer"
            }}
          >
            {viewMode === "month" ? "📊 Week View" : "📅 Month View"}
          </button>

          {currentUser && (
            <>
              <div style={{ color: colors[currentUser] }}>{currentUser}</div>
              <button onClick={logout} style={{ background:"#ef4444", color:"white", border:"none", borderRadius:20, padding:"6px 12px" }}>
                Logout
              </button>
            </>
          )}
        </div>
      </div>

      {/* TODAY BUTTON */}
      <div style={{ textAlign: "center", marginBottom: 10 }}>
        <button onClick={scrollToToday} style={{ padding:"6px 12px", borderRadius:20, background:"#22c55e", border:"none", color:"white" }}>
          Go to Today
        </button>
      </div>

      {/* MONTH NAV */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <button style={navBtn} onClick={() => changeMonth(-1)}>◀</button>
        <h2>{monthName}</h2>
        <button style={navBtn} onClick={() => changeMonth(1)}>▶</button>
      </div>

      {/* CALENDAR */}
      <div style={{
        display: "grid",
        gridTemplateColumns: viewMode === "week" ? "repeat(7,1fr)" : `repeat(${columns},1fr)`,
        gap: 10
      }}>
        {(viewMode === "week" ? weekDays : calendarDays).map((day, i) => {
          const isToday = day && day.dateObj.toDateString() === today.toDateString();

          return (
            <Card key={i} ref={isToday ? todayRef : null}>
              {day && (
                <>
                  <div style={{ fontWeight: 600 }}>
                    {day.dateObj.toLocaleDateString("en-US", { weekday: "short" })} - {day.dateObj.getDate()}
                  </div>

                  {grouped[day.key]
                    ?.slice()
                    .sort((a,b)=>a.time.localeCompare(b.time))
                    .map(event => (
                      <div key={event.id}>
                        {formatTime(event.time)} — {event.title}
                      </div>
                    ))}
                </>
              )}
            </Card>
          );
        })}
      </div>

    </div>
  );
}