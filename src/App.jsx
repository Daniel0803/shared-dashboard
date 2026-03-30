import React, { useEffect, useMemo, useState } from "react";
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
const Card = ({ children, style, ...props }) => (
  <div
    {...props}
    style={{
      background: "linear-gradient(145deg, #0f172a, #020617)",
      borderRadius: 16,
      padding: 10,
      minHeight: 100,
      fontSize: 13,
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow: "0 4px 12px rgba(0,0,0,0.4)",
      transition: "0.2s",
      ...style,
    }}
  >
    {children}
  </div>
);

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
        marginRight: 4,
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

  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ date: "", time: "", title: "" });
  const [recentNotes, setRecentNotes] = useState([]);

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
    if (!currentUser) return;
    const saved = JSON.parse(localStorage.getItem(`notes_${currentUser}`)) || [];
    setRecentNotes(saved);
  }, [currentUser]);

  const login = () => {
    const user = Object.keys(users).find((u) => users[u] === pinInput);
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

  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};
      setEvents(Object.entries(data).map(([id, val]) => ({ id, ...val })));
    });
  }, []);

  const submitEvent = () => {
    if (!form.time || !form.title) return;

    if (editingId) {
      update(ref(db, `events/${editingId}`), {
        ...form,
        user: currentUser,
      });
    } else {
      push(ref(db, "events"), {
        ...form,
        user: currentUser,
        createdAt: Date.now(),
      });
    }

    let updated = [form.title, ...recentNotes.filter(n => n !== form.title)].slice(0, 10);
    setRecentNotes(updated);
    localStorage.setItem(`notes_${currentUser}`, JSON.stringify(updated));

    setShowModal(false);
    setEditingId(null);
    setForm({ date: "", time: "", title: "" });
  };

  const handleEventClick = (e, event) => {
    e.stopPropagation();
    if (event.user !== currentUser) return;

    setForm({
      date: event.date,
      time: event.time,
      title: event.title,
    });

    setEditingId(event.id);
    setShowModal(true);
  };

  const handleDelete = () => {
    remove(ref(db, `events/${editingId}`));
    setShowModal(false);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = endOfMonth.getDate();
  const startDay = startOfMonth.getDay();
  const today = new Date();

  const calendarDays = [];

  for (let i = 0; i < startDay; i++) calendarDays.push(null);

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
    calendarDays.push({ key, dateObj: d });
  }

  const grouped = useMemo(() => {
    const g = {};
    events.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [events]);

  const openModal = (day) => {
    if (!day || !currentUser) return;
    setForm({ date: day.key, time: "", title: "" });
    setEditingId(null);
    setShowModal(true);
  };

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
    <div style={{
      padding: 12,
      background: "radial-gradient(circle at top, #020617, #000)",
      minHeight: "100vh",
      color: "white"
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700 }}>🗓️ Balentina</div>
          <div style={{ fontSize: 14, opacity: 0.6 }}>Schedule</div>
        </div>

        {currentUser && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ color: colors[currentUser], fontWeight: 600 }}>
              {currentUser}
            </div>
            <button onClick={logout} style={{
              padding: "6px 12px",
              borderRadius: 20,
              border: "none",
              background: "#ef4444",
              color: "white",
              fontSize: 12
            }}>
              Logout
            </button>
          </div>
        )}
      </div>

      {/* MONTH */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <button style={navBtn} onClick={() => changeMonth(-1)}>◀</button>
        <h2>{monthName}</h2>
        <button style={navBtn} onClick={() => changeMonth(1)}>▶</button>
      </div>

      {/* CALENDAR */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
        {calendarDays.map((day, i) => (
          <Card key={i} onClick={() => openModal(day)}>
            {day && (
              <>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>
                  {day.dateObj.toLocaleDateString("en-US", { weekday: "short" })} - {day.dateObj.getDate()}
                </div>

                {grouped[day.key]?.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(e, event)}
                    style={{
                      borderLeft: `3px solid ${colors[event.user]}`,
                      padding: "6px 8px",
                      marginBottom: 6,
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.03)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2
                    }}
                  >
                    <div>{event.title}</div>
                    <div style={{ fontSize: 11, opacity: 0.7 }}>
                      {formatTime(event.time)}
                    </div>

                    {/* USER BADGE */}
                    <div style={{
                      fontSize: 10,
                      marginTop: 4,
                      display: "inline-block",
                      padding: "2px 6px",
                      borderRadius: 6,
                      background: "rgba(255,255,255,0.05)",
                      color: colors[event.user],
                      fontWeight: 600,
                      width: "fit-content"
                    }}>
                      {event.user}
                    </div>
                  </div>
                ))}
              </>
            )}
          </Card>
        ))}
      </div>

      {/* LOGIN + MODAL SAME AS BEFORE */}
    </div>
  );
}