import React, { useEffect, useMemo, useState, useRef } from "react";
import { initializeApp } from "firebase/app";
import {
  getDatabase,
  ref,
  onValue,
  push,
  update,
  remove
} from "firebase/database";

// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAfDf9HXxty8UrVQNvlVKxx_ERT9VLClQU",
  authDomain: "shared-dashboard-f428d.firebaseapp.com",
  databaseURL:
    "https://shared-dashboard-f428d-default-rtdb.firebaseio.com",
  projectId: "shared-dashboard-f428d"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ---------------- TIME OPTIONS ----------------
const timeOptions = [];

for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    timeOptions.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
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

// ---------------- CARD ----------------
const Card = React.forwardRef(
  ({ children, style, ...props }, ref) => (
    <div
      ref={ref}
      {...props}
      style={{
        background: "white",
        borderRadius: 16,
        padding: 12,
        minHeight: 160,
        maxHeight: 180,
        overflowY: "auto",
        color: "#111",
        border: "1px solid #e5e7eb",
        boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "0.2s",
        ...style
      }}
    >
      {children}
    </div>
  )
);

// ---------------- BUTTON ----------------
const Button = ({
  children,
  variant = "primary",
  ...props
}) => {
  const colors = {
    primary: "#4285F4",
    danger: "#EA4335"
  };

  return (
    <button
      {...props}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "none",
        background: colors[variant],
        color: "white",
        fontWeight: 600,
        cursor: "pointer",
        marginTop: 10
      }}
    >
      {children}
    </button>
  );
};

// ---------------- APP ----------------
export default function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [columns, setColumns] = useState(getColumns());

  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    date: "",
    time: "",
    title: ""
  });

  const todayRef = useRef(null);
  const today = new Date();

  const users = {
    Daniel: "0803",
    Dillon: "2712",
    Marlon: "1004",
    Dellary: "2608",
    Marelly: "2811"
  };

  const colors = {
    Daniel: "#4285F4",
    Dillon: "#34A853",
    Marlon: "#FBBC05",
    Dellary: "#EA4335",
    Marelly: "#9C27B0"
  };

  // Resize columns
  useEffect(() => {
    const handleResize = () => setColumns(getColumns());

    window.addEventListener("resize", handleResize);

    return () =>
      window.removeEventListener("resize", handleResize);
  }, []);

  // Firebase listener
  useEffect(() => {
    const eventsRef = ref(db, "events");

    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};

      setEvents(
        Object.entries(data).map(([id, val]) => ({
          id,
          ...val
        }))
      );
    });
  }, []);

  // Login
  const login = () => {
    const user = Object.keys(users).find(
      (u) => users[u] === pinInput
    );

    if (user) {
      setCurrentUser(user);
      setPinInput("");
      setShowLoginModal(false);
    } else {
      alert("Wrong PIN");
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setShowLoginModal(true);
  };

  // Save event
  const submitEvent = () => {
    if (!form.time || !form.title) return;

    if (editingId) {
      update(ref(db, `events/${editingId}`), {
        ...form,
        user: currentUser
      });
    } else {
      push(ref(db, "events"), {
        ...form,
        user: currentUser,
        createdAt: Date.now()
      });
    }

    setShowModal(false);
    setEditingId(null);

    setForm({
      date: "",
      time: "",
      title: ""
    });
  };

  // Edit event
  const handleEventClick = (e, event) => {
    e.stopPropagation();

    if (event.user !== currentUser) return;

    setForm(event);
    setEditingId(event.id);
    setShowModal(true);
  };

  // Delete event
  const handleDelete = () => {
    remove(ref(db, `events/${editingId}`));
    setShowModal(false);
  };

  // Change month
  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(d);
  };

  // Scroll to today
  const scrollToToday = () => {
    if (todayRef.current) {
      todayRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
    }
  };

  // Calendar dates
  const start = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  );

  const end = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  );

  const calendarDays = [];

  for (let i = 0; i < start.getDay(); i++) {
    calendarDays.push(null);
  }

  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      i
    );

    const key = `${String(d.getDate()).padStart(
      2,
      "0"
    )}/${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}/${d.getFullYear()}`;

    calendarDays.push({
      key,
      dateObj: d
    });
  }

  // Group events
  const grouped = useMemo(() => {
    const g = {};

    events.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });

    return g;
  }, [events]);

  const monthName = currentDate.toLocaleDateString(
    "en-GB",
    {
      month: "long",
      year: "numeric"
    }
  );

  return (
    <div
      style={{
        padding: 20,
        background: "#f8f9fa",
        minHeight: "100vh"
      }}
    >
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 20
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Balentina Calendar</h1>
          <div style={{ color: "#666" }}>
            Shared family scheduling
          </div>
        </div>

        {currentUser && (
          <div>
            <span
              style={{
                color: colors[currentUser],
                fontWeight: 700
              }}
            >
              {currentUser}
            </span>

            <Button
              variant="danger"
              onClick={logout}
            >
              Logout
            </Button>
          </div>
        )}
      </div>

      {/* CONTROLS */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 10,
          marginBottom: 20
        }}
      >
        <Button onClick={() => changeMonth(-1)}>
          Previous
        </Button>

        <h2>{monthName}</h2>

        <Button onClick={() => changeMonth(1)}>
          Next
        </Button>

        <Button onClick={scrollToToday}>
          Today
        </Button>
      </div>

      {/* CALENDAR */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gap: 12
        }}
      >
        {calendarDays.map((day, i) => {
          const isToday =
            day &&
            day.dateObj.toDateString() ===
              today.toDateString();

          return (
            <Card
              key={i}
              ref={isToday ? todayRef : null}
              onClick={() => {
                if (!day || !currentUser) return;

                setForm({
                  date: day.key,
                  time: "",
                  title: ""
                });

                setEditingId(null);
                setShowModal(true);
              }}
              style={{
                border: isToday
                  ? "2px solid #34A853"
                  : undefined
              }}
            >
              {day && (
                <>
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 8
                    }}
                  >
                    {day.dateObj.getDate()}
                  </div>

                  {grouped[day.key]?.map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) =>
                        handleEventClick(e, event)
                      }
                      style={{
                        background:
                          colors[event.user],
                        color: "white",
                        padding: 6,
                        borderRadius: 8,
                        marginBottom: 6,
                        fontSize: 12
                      }}
                    >
                      {formatTime(event.time)} -{" "}
                      {event.title}
                    </div>
                  ))}
                </>
              )}
            </Card>
          );
        })}
      </div>

      {/* EVENT MODAL */}
      {showModal && (
        <div className="modal">
          <div
            style={{
              background: "white",
              padding: 20,
              borderRadius: 12
            }}
          >
            <select
              value={form.time}
              onChange={(e) =>
                setForm({
                  ...form,
                  time: e.target.value
                })
              }
            >
              <option value="">Select Time</option>
              {timeOptions.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>

            <input
              value={form.title}
              placeholder="Event title"
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value
                })
              }
            />

            <Button onClick={submitEvent}>
              Save
            </Button>

            {editingId && (
              <Button
                variant="danger"
                onClick={handleDelete}
              >
                Delete
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}