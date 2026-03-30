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
      cursor: "pointer",
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

  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({ date: "", time: "", title: "" });

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

  const today = new Date();

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

  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const calendarDays = [];
  for (let i = 0; i < start.getDay(); i++) calendarDays.push(null);

  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const key = `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
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
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
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

            <button
              onClick={logout}
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                border: "none",
                background: "#ef4444",
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
              onMouseOver={(e) => e.currentTarget.style.background = "#dc2626"}
              onMouseOut={(e) => e.currentTarget.style.background = "#ef4444"}
            >
              Logout
            </button>
          </div>
        )}
      </div>

      {/* MONTH */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 20, marginBottom: 20 }}>
        <button style={navBtn} onClick={() => changeMonth(-1)}>◀</button>
        <h2>{monthName}</h2>
        <button style={navBtn} onClick={() => changeMonth(1)}>▶</button>
      </div>

      {/* CALENDAR */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns},1fr)`, gap: 10 }}>
        {calendarDays.map((day, i) => {
          const isToday = day && day.dateObj.toDateString() === today.toDateString();

          return (
            <Card
              key={i}
              onClick={() => {
                if (!day || !currentUser) return;
                setForm({ date: day.key, time: "", title: "" });
                setEditingId(null);
                setShowModal(true);
              }}
              style={{
                border: isToday ? "2px solid #22c55e" : undefined,
                boxShadow: isToday ? "0 0 12px rgba(34,197,94,0.6)" : undefined
              }}
            >
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
                        padding: 6,
                        marginBottom: 6,
                        borderRadius: 6,
                        background: "rgba(255,255,255,0.03)"
                      }}
                    >
                      <div>{event.title}</div>
                      <div style={{ fontSize: 11 }}>{formatTime(event.time)}</div>
                      <div style={{ fontSize: 10, color: colors[event.user] }}>
                        {event.user}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={{
          position:"fixed",top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.8)",
          display:"flex",alignItems:"center",justifyContent:"center"
        }}>
          <div style={{ background:"#0f172a",padding:20,borderRadius:12 }}>
            <input
              type="password"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={e=>setPinInput(e.target.value)}
            />
            <Button onClick={login}>Login</Button>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showModal && (
        <div style={{
          position:"fixed",top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.6)",
          display:"flex",alignItems:"center",justifyContent:"center"
        }}>
          <div style={{ background:"#0f172a",padding:20,borderRadius:12 }}>
            <h3>{editingId ? "Edit Event" : "Add Event"}</h3>

            <div>Date: {form.date}</div>

            <select value={form.time} onChange={e=>setForm({...form,time:e.target.value})}>
              <option value="">Select time</option>
              {timeOptions.map(t=>(
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>

            <input
              placeholder="Note"
              value={form.title}
              onChange={e=>setForm({...form,title:e.target.value})}
            />

            <Button onClick={submitEvent}>
              {editingId ? "Update" : "Save"}
            </Button>

            {editingId && (
              <Button variant="danger" onClick={handleDelete}>
                Delete
              </Button>
            )}

            <Button variant="danger" onClick={()=>setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}