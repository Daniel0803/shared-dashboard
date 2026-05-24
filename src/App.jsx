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
      background: "#0f172a",
      borderRadius: 12,
      padding: 8,
      minHeight: window.innerWidth < 600 ? 90 : 120,
      fontSize: window.innerWidth < 600 ? 11 : 14,
      border: "1px solid rgba(255,255,255,0.05)",
      cursor: "pointer",
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
        borderRadius: 6,
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
    Daniel: "030803",
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

  // LOGIN
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

  // FIREBASE
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

  return (
    <div style={{ padding: 15, background: "#020617", minHeight: "100vh", color: "white" }}>
      
      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>🗓️ Balentina Schedule</h1>
        {currentUser && (
          <>
            <div style={{ color: colors[currentUser], fontWeight: 700 }}>
              {currentUser}
            </div>
            <Button variant="danger" onClick={logout}>Logout</Button>
          </>
        )}
      </div>

      {/* MONTH */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <Button onClick={() => changeMonth(-1)}>◀</Button>
        <h2>{monthName}</h2>
        <Button onClick={() => changeMonth(1)}>▶</Button>
      </div>

      {/* CALENDAR */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
        {calendarDays.map((day, i) => {
          const isToday = day && day.dateObj.toDateString() === today.toDateString();

          return (
            <Card key={i} onClick={() => openModal(day)} style={{ border: isToday ? "2px solid #22c55e" : undefined }}>
              {day && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>
                    {day.dateObj.toLocaleDateString("en-US", { weekday: "short" })} - {day.dateObj.getDate()}
                  </div>

                  {grouped[day.key]?.map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(e, event)}
                      style={{
                        borderLeft: `4px solid ${colors[event.user]}`,
                        padding: 4,
                        marginBottom: 4,
                        cursor: "pointer"
                      }}
                    >
                      <div>{event.title}</div>
                      <div>{formatTime(event.time)}</div>
                      <div style={{ color: colors[event.user] }}>{event.user}</div>
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
          position: "fixed",
          top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.8)",
          display:"flex",alignItems:"center",justifyContent:"center"
        }}>
          <div style={{ background:"#0f172a",padding:20,borderRadius:12,width:280 }}>
            <h3>Login</h3>

            <input
              type="password"
              placeholder="Enter PIN"
              value={pinInput}
              onChange={(e)=>setPinInput(e.target.value)}
              style={{ width:"100%", marginBottom:10 }}
            />

            <Button onClick={login}>Login</Button>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showModal && (
        <div style={{
          position: "fixed", top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center"
        }}>
          <div style={{ background:"#0f172a",padding:20,borderRadius:12,width:300 }}>
            <h3>{editingId ? "Edit Event" : "Add Event"}</h3>
            <div>User: {currentUser}</div>
            <div>Date: {form.date}</div>

            <select value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})}>
              <option value="">Select time</option>
              {timeOptions.map(t=>(
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>

            <input
              placeholder="Note"
              value={form.title}
              onChange={(e)=>setForm({...form,title:e.target.value})}
              style={{ width:"100%", marginTop:10 }}
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