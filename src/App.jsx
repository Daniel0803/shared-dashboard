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
      minHeight: window.innerWidth < 600 ? 90 : 120,
      fontSize: window.innerWidth < 600 ? 11 : 14,
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

  const login = () => {
    const user = Object.keys(users).find((u) => users[u] === pinInput);
    if (user) {
      setCurrentUser(user);
      setPinInput("");
    } else alert("Wrong PIN");
  };

  const formatDate = (d) => {
    const [y, m, day] = d.split("-");
    return `${day}/${m}/${y}`;
  };

  const handleSelectDate = (day) => {
    if (!day) return;
    const d = day.dateObj;
    setForm((prev) => ({
      ...prev,
      date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(d.getDate()).padStart(2, "0")}`,
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

  const startOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const daysInMonth = endOfMonth.getDate();
  const startDay = startOfMonth.getDay();
  const today = new Date();

  const calendarDays = [];

  for (let i = 0; i < startDay; i++) calendarDays.push(null);

  for (let i = 1; i <= daysInMonth; i++) {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      i
    );

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
    <div
      style={{
        padding: 15,
        background: "#020617",
        minHeight: "100vh",
        color: "white",
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          flexDirection: columns === 2 ? "column" : "row",
          justifyContent: "space-between",
          gap: 10,
          marginBottom: 20,
        }}
      >
        <div>
          <h1>🗓️ Balentina Schedule</h1>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {currentUser ? `Logged in: ${currentUser}` : "Not logged in"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <Input
            type="password"
            placeholder="PIN"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
          />
          <Button onClick={login}>Login</Button>
        </div>
      </div>

      {/* MONTH */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 20,
          marginBottom: 20,
        }}
      >
        <Button onClick={() => changeMonth(-1)}>◀</Button>
        <h2>{monthName}</h2>
        <Button onClick={() => changeMonth(1)}>▶</Button>
      </div>

      {/* INPUT */}
      {currentUser && (
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            flexDirection: columns === 2 ? "column" : "row",
            gap: 10,
          }}
        >
          <Input
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value })
            }
          />

          <select
            value={form.time}
            onChange={(e) =>
              setForm({ ...form, time: e.target.value })
            }
          >
            <option value="">Select time</option>
            {timeOptions.map((t) => (
              <option key={t} value={t}>
                {formatTime(t)}
              </option>
            ))}
          </select>

          <Input
            placeholder="Note"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <Button onClick={submitEvent}>
            {editingId ? "Update" : "Add"}
          </Button>
        </div>
      )}

      {/* CALENDAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 10,
        }}
      >
        {calendarDays.map((day, i) => {
          const isToday =
            day &&
            day.dateObj.toDateString() === today.toDateString();

          return (
            <Card
              key={i}
              onClick={() => handleSelectDate(day)}
              style={{
                border: isToday ? "2px solid #22c55e" : undefined,
              }}
            >
              {day && (
                <>
                  {/* UPDATED HEADER INSIDE CARD */}
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize:
                        window.innerWidth < 600 ? 13 : 16,
                      marginBottom: 4,
                    }}
                  >
                    {day.dateObj.toLocaleDateString("en-US", {
                      weekday: "short",
                    })}{" "}
                    - {day.dateObj.getDate()}
                  </div>

                  {grouped[day.key]
                    ?.slice()
                    .sort((a, b) =>
                      a.time.localeCompare(b.time)
                    )
                    .map((e) => (
                      <div
                        key={e.id}
                        style={{
                          borderLeft: `4px solid ${colors[e.user]}`,
                          padding: 4,
                          marginBottom: 4,
                        }}
                      >
                        <div>{e.title}</div>
                        <div>{formatTime(e.time)}</div>
                        <div style={{ color: colors[e.user] }}>
                          {e.user}
                        </div>

                        {currentUser === e.user && (
                          <>
                            <Button onClick={() => handleEdit(e)}>
                              Edit
                            </Button>
                            <Button
                              variant="danger"
                              onClick={() => handleDelete(e)}
                            >
                              Del
                            </Button>
                          </>
                        )}
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