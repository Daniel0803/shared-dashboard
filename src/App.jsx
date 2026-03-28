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

// ===== TIME =====
const generateTimeOptions = () => {
  const times = [];
  for (let h = 0; h < 24; h++) {
    for (let m of [0, 30]) {
      const hh = String(h).padStart(2, "0");
      const mm = String(m).padStart(2, "0");
      times.push(`${hh}:${mm}`);
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

// ===== RESPONSIVE =====
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
      border: "1px solid rgba(255,255,255,0.05)",
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
    secondary: "#334155",
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

const Input = (props) => (
  <input
    {...props}
    style={{
      padding: 8,
      borderRadius: 8,
      border: "1px solid #334155",
      background: "#020617",
      color: "white",
    }}
  />
);

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [form, setForm] = useState({ date: "", time: "", title: "" });
  const [editingId, setEditingId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [columns, setColumns] = useState(getColumns());
  const [recentNotes, setRecentNotes] = useState([]);

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  // LOGIN + LOAD RECENT NOTES
  const login = () => {
    const user = Object.keys(users).find((u) => users[u] === pinInput);
    if (user) {
      setCurrentUser(user);
      setPinInput("");

      const stored = JSON.parse(localStorage.getItem(`notes_${user}`)) || [];
      setRecentNotes(stored);
    } else alert("Wrong PIN");
  };

  const saveRecentNote = (note) => {
    if (!currentUser || !note) return;

    let updated = [note, ...recentNotes.filter((n) => n !== note)];
    updated = updated.slice(0, 10);

    setRecentNotes(updated);
    localStorage.setItem(`notes_${currentUser}`, JSON.stringify(updated));
  };

  const formatDate = (d) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  // 🔥 SELECT DATE
  const handleSelectDate = (day) => {
    if (!day) return;

    const d = day.dateObj;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");

    setForm((prev) => ({
      ...prev,
      date: `${yyyy}-${mm}-${dd}`,
    }));
  };

  // FIREBASE
  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({
        id,
        ...val,
      }));
      setEvents(list);
    });
  }, []);

  const submitEvent = () => {
    if (!form.date || !form.time || !form.title) return;

    saveRecentNote(form.title);

    const payload = {
      ...form,
      date: formatDate(form.date),
      user: currentUser,
      createdAt: Date.now(),
    };

    if (editingId) {
      update(ref(db, `events/${editingId}`), payload);
      setEditingId(null);
    } else {
      push(ref(db, "events"), payload);
    }

    setForm({ date: "", time: "", title: "" });
  };

  const handleEdit = (event) => {
    if (event.user !== currentUser) return;

    const [d, m, y] = event.date.split("/");
    setForm({
      date: `${y}-${m}-${d}`,
      time: event.time,
      title: event.title,
    });

    setEditingId(event.id);
  };

  const handleDelete = (event) => {
    if (event.user !== currentUser) return;
    remove(ref(db, `events/${event.id}`));
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

    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();

    calendarDays.push({
      key: `${dd}/${mm}/${yyyy}`,
      dateObj: d,
    });
  }

  const grouped = useMemo(() => {
    const g = {};
    events.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [events]);

  const monthName = currentDate.toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ padding: 15, background: "#020617", minHeight: "100vh", color: "white" }}>

      {/* HEADER */}
      <div style={{ marginBottom: 20 }}>
        <h1>🗓️ Balentina Schedule</h1>

        <Input type="password" placeholder="PIN" value={pinInput} onChange={(e)=>setPinInput(e.target.value)} />
        <Button onClick={login}>Login</Button>

        {currentUser && <div>Logged in: {currentUser}</div>}
      </div>

      {/* INPUT */}
      {currentUser && (
        <div style={{ marginBottom: 20 }}>
          <Input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} />

          <select value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})}>
            <option value="">Time</option>
            {timeOptions.map(t => (
              <option key={t} value={t}>{formatTime(t)}</option>
            ))}
          </select>

          <Input
            placeholder="Note"
            value={form.title}
            onChange={(e)=>setForm({...form,title:e.target.value})}
          />

          {/* RECENT NOTES */}
          {recentNotes.length > 0 && (
            <div style={{ background: "#111", marginTop: 5 }}>
              {recentNotes.map((n, i) => (
                <div key={i} onClick={()=>setForm({...form,title:n})}>
                  {n}
                </div>
              ))}
            </div>
          )}

          <Button onClick={submitEvent}>Add</Button>
        </div>
      )}

      {/* WEEKDAY HEADER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day => (
          <div key={day} style={{ textAlign: "center", fontWeight: 700 }}>
            {day}
          </div>
        ))}
      </div>

      {/* CALENDAR */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 10 }}>
        {calendarDays.map((day, i) => (
          <Card key={i} onClick={()=>handleSelectDate(day)}>
            {day && (
              <>
                <div>{day.dateObj.getDate()}</div>

                {grouped[day.key]?.map(e => (
                  <div key={e.id} style={{ borderLeft: `4px solid ${colors[e.user]}` }}>
                    <div>{e.title}</div>
                    <div>{formatTime(e.time)}</div>
                    <div>{e.user}</div>
                  </div>
                ))}
              </>
            )}
          </Card>
        ))}
      </div>

    </div>
  );
}