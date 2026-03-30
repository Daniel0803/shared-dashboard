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
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      times.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

const formatTime = (time) => {
  if (!time) return "";
  const [h, m] = time.split(":");
  let hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  hour = hour % 12 || 12;
  return `${hour}:${m} ${ampm}`;
};

// ===== UI COMPONENTS =====
const Card = ({ children, style, ...props }) => (
  <div
    {...props}
    style={{
      background: "#0f172a",
      borderRadius: 12,
      padding: 10,
      minHeight: 110,
      fontSize: "clamp(11px, 1.2vw, 14px)",
      border: "1px solid rgba(255,255,255,0.05)",
      cursor: "pointer",
      display: "flex",
      flexDirection: "column",
      gap: 4,
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
        padding: "10px 14px",
        borderRadius: 8,
        border: "none",
        background: colors[variant],
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
        marginTop: 6,
      }}
    >
      {children}
    </button>
  );
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

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

  // LOAD NOTES
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
      setShowLoginModal(false);
      setPinInput("");
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

    const updated = [form.title, ...recentNotes.filter(n => n !== form.title)].slice(0, 10);
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
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(d);
  };

  // CALENDAR
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const calendarDays = [];
  for (let i = 0; i < start.getDay(); i++) calendarDays.push(null);

  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const key = `${String(i).padStart(2, "0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
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
    <div style={{
      padding: 15,
      background: "#020617",
      minHeight: "100vh",
      color: "white",
      maxWidth: 1200,
      margin: "0 auto",
    }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <h1>🗓️ Balentina Schedule</h1>
        {currentUser && (
          <>
            <div style={{ color: colors[currentUser] }}>{currentUser}</div>
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

      {/* GRID */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
        gap: 10
      }}>
        {calendarDays.map((day, i) => (
          <Card key={i} onClick={() => openModal(day)}>
            {day && (
              <>
                <div style={{ fontWeight: 700 }}>
                  {day.dateObj.toLocaleDateString("en-US", { weekday: "short" })} - {day.dateObj.getDate()}
                </div>

                {grouped[day.key]?.map(event => (
                  <div
                    key={event.id}
                    onClick={(e) => handleEventClick(e, event)}
                    style={{
                      borderLeft: `4px solid ${colors[event.user]}`,
                      padding: 4
                    }}
                  >
                    <div>{event.title}</div>
                    <div>{formatTime(event.time)}</div>
                  </div>
                ))}
              </>
            )}
          </Card>
        ))}
      </div>

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>Login</h3>
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              style={{ width: "100%", marginBottom: 10 }}
            />
            <Button onClick={login}>Login</Button>
          </div>
        </div>
      )}

      {/* EVENT MODAL */}
      {showModal && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3>{editingId ? "Edit" : "Add"} Event</h3>

            <select value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})}>
              <option value="">Select time</option>
              {timeOptions.map(t=>(
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>

            <input
              value={form.title}
              onChange={(e)=>setForm({...form,title:e.target.value})}
              placeholder="Note"
              style={{ width:"100%", marginTop:10 }}
            />

            {recentNotes?.map((n,i)=>(
              <div key={i} onClick={()=>setForm({...form,title:n})} style={{ cursor:"pointer" }}>
                {n}
              </div>
            ))}

            <Button onClick={submitEvent}>{editingId ? "Update" : "Save"}</Button>
            {editingId && <Button variant="danger" onClick={handleDelete}>Delete</Button>}
            <Button variant="danger" onClick={()=>setShowModal(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
};

const modalStyle = {
  background: "#0f172a",
  width: "100%",
  maxWidth: 500,
  borderTopLeftRadius: 16,
  borderTopRightRadius: 16,
  padding: 20,
};