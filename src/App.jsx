import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push } from "firebase/database";

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

const getColumns = () => {
  if (window.innerWidth < 600) return 2;
  if (window.innerWidth < 900) return 4;
  return 7;
};

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
        padding: "8px 12px",
        borderRadius: 6,
        border: "none",
        background: colors[variant],
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
        marginRight: 5,
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

  const [showModal, setShowModal] = useState(false);
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

  useEffect(() => {
    const handleResize = () => setColumns(getColumns());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // LOGIN
  const login = () => {
    const user = Object.keys(users).find((u) => users[u] === pinInput);
    if (user) {
      setCurrentUser(user);
      setPinInput("");
    } else alert("Wrong PIN");
  };

  const logout = () => setCurrentUser(null);

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
    if (!form.time || !form.title) return;

    push(ref(db, "events"), {
      ...form,
      user: currentUser,
      createdAt: Date.now(),
    });

    setShowModal(false);
    setForm({ date: "", time: "", title: "" });
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

  const openModal = (day) => {
    if (!day || !currentUser) {
      alert("Login first");
      return;
    }

    const d = day.dateObj;
    const formatted = `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;

    setForm({ date: formatted, time: "", title: "" });
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

        {!currentUser ? (
          <>
            <input
              type="password"
              placeholder="PIN"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
            />
            <Button onClick={login}>Login</Button>
          </>
        ) : (
          <>
            <div style={{ color: colors[currentUser], fontWeight: 700 }}>
              {currentUser}
            </div>
            <Button variant="danger" onClick={logout}>
              Logout
            </Button>
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

                  {grouped[day.key]?.map((e) => (
                    <div key={e.id} style={{ borderLeft: `4px solid ${colors[e.user]}`, padding: 4 }}>
                      <div>{e.title}</div>
                      <div>{formatTime(e.time)}</div>
                      <div style={{ color: colors[e.user] }}>{e.user}</div>
                    </div>
                  ))}
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <div style={{ background: "#0f172a", padding: 20, borderRadius: 12, width: 300 }}>
            <h3>Add Event</h3>
            <div style={{ marginBottom: 10 }}>User: {currentUser}</div>
            <div style={{ marginBottom: 10 }}>Date: {form.date}</div>

            <select
              value={form.time}
              onChange={(e) => setForm({ ...form, time: e.target.value })}
              style={{ width: "100%", marginBottom: 10 }}
            >
              <option value="">Select time</option>
              {timeOptions.map((t) => (
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>

            <input
              placeholder="Note"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              style={{ width: "100%", marginBottom: 10 }}
            />

            <Button onClick={submitEvent}>Save</Button>
            <Button variant="danger" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}