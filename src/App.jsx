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

// TIME OPTIONS
const timeOptions = [];
for (let h = 0; h < 24; h++) {
  for (let m of [0, 30]) {
    timeOptions.push(
      `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
    );
  }
}

const formatTime = (t) => {
  if (!t) return "";
  let [h, m] = t.split(":");
  h = parseInt(h);
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showLogin, setShowLogin] = useState(true);

  const [form, setForm] = useState({
    date: "",
    time: "",
    title: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

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

  // FIREBASE
  useEffect(() => {
    const eventsRef = ref(db, "events");

    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};

      const formatted = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));

      setEvents(formatted);
    });
  }, []);

  // LOGIN
  const login = () => {
    const user = Object.keys(users).find(
      (u) => users[u] === pinInput
    );

    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
      setPinInput("");
    } else {
      alert("Wrong PIN");
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setShowLogin(true);
  };

  // DATE FORMAT
  const formatKey = (d) =>
    `${String(d.getDate()).padStart(2, "0")}/${String(
      d.getMonth() + 1
    ).padStart(2, "0")}/${d.getFullYear()}`;

  // CALENDAR BUILD
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

  const days = [];

  for (let i = 0; i < start.getDay(); i++) {
    days.push(null);
  }

  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      i
    );

    days.push({
      dateObj: d,
      key: formatKey(d),
    });
  }

  const groupedEvents = useMemo(() => {
    const grouped = {};

    events.forEach((event) => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }

      grouped[event.date].push(event);
    });

    return grouped;
  }, [events]);

  // OPEN ADD EVENT
  const openAdd = (day) => {
    if (!currentUser) return;

    setForm({
      date: day.key,
      time: "",
      title: "",
    });

    setEditingId(null);
    setShowModal(true);
  };

  // OPEN EDIT
  const openEdit = (e, event) => {
    e.stopPropagation();

    if (event.user !== currentUser) return;

    setForm(event);
    setEditingId(event.id);
    setShowModal(true);
  };

  // SAVE EVENT
  const saveEvent = () => {
    if (!form.title || !form.time) return;

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

    setShowModal(false);
    setEditingId(null);

    setForm({
      date: "",
      time: "",
      title: "",
    });
  };

  // DELETE EVENT
  const deleteEvent = () => {
    remove(ref(db, `events/${editingId}`));
    setShowModal(false);
  };

  const changeMonth = (offset) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + offset);
    setCurrentDate(newDate);
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div
      style={{
        background: "#111",
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        overflow: "hidden",
        padding: 10,
      }}
    >
      {/* 16:9 CONTAINER */}
      <div
        style={{
          width: "100%",
          maxWidth: "177.78vh",
          aspectRatio: "16 / 9",
          background: "#000",
          color: "white",
          padding: 20,
          borderRadius: 12,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 15,
          }}
        >
          <div>
            <h2 style={{ margin: 0 }}>Balentina</h2>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              Schedule
            </div>
          </div>

          {currentUser && (
            <button
              onClick={logout}
              style={{
                background: "#ef4444",
                border: "none",
                color: "white",
                padding: "8px 14px",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          )}
        </div>

        {/* MONTH */}
        <h2 style={{ textAlign: "center", marginBottom: 10 }}>
          {monthName}
        </h2>

        {/* WEEKDAYS */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(7,minmax(0,1fr))",
            textAlign: "center",
            marginBottom: 10,
            opacity: 0.7,
          }}
        >
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day) => (
              <div key={day}>{day}</div>
            )
          )}
        </div>

        {/* CALENDAR */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "repeat(7,minmax(0,1fr))",
            gap: 6,
            overflowY: "auto",
          }}
        >
          {days.map((day, i) => {
            if (!day) return <div key={i}></div>;

            const isToday =
              day.dateObj.toDateString() ===
              today.toDateString();

            return (
              <div
                key={i}
                onClick={() => openAdd(day)}
                style={{
                  minHeight: 100,
                  borderRadius: 8,
                  padding: 6,
                  border: isToday
                    ? "2px solid #22c55e"
                    : "1px solid #222",
                  cursor: "pointer",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    fontWeight: "bold",
                    marginBottom: 5,
                  }}
                >
                  {day.dateObj.getDate()}
                </div>

                {(groupedEvents[day.key] || [])
                  .sort((a, b) =>
                    a.time.localeCompare(b.time)
                  )
                  .map((event) => (
                    <div
                      key={event.id}
                      onClick={(e) =>
                        openEdit(e, event)
                      }
                      style={{
                        background:
                          colors[event.user],
                        color: "black",
                        fontSize: 10,
                        padding: "2px 4px",
                        borderRadius: 4,
                        marginBottom: 4,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {event.title}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>

        {/* MONTH NAV */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 15,
            marginTop: 15,
          }}
        >
          <button
            onClick={() => changeMonth(-1)}
            style={{
              background: "#22c55e",
              border: "none",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ◀
          </button>

          <button
            onClick={() => changeMonth(1)}
            style={{
              background: "#22c55e",
              border: "none",
              color: "white",
              padding: "10px 16px",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            ▶
          </button>
        </div>
      </div>

      {/* EVENT MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.8)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#111",
              padding: 20,
              borderRadius: 10,
            }}
          >
            <input
              placeholder="Title"
              value={form.title}
              onChange={(e) =>
                setForm({
                  ...form,
                  title: e.target.value,
                })
              }
            />

            <select
              value={form.time}
              onChange={(e) =>
                setForm({
                  ...form,
                  time: e.target.value,
                })
              }
            >
              <option value="">
                Select Time
              </option>

              {timeOptions.map((t) => (
                <option key={t} value={t}>
                  {formatTime(t)}
                </option>
              ))}
            </select>

            <div style={{ marginTop: 10 }}>
              <button onClick={saveEvent}>
                Save
              </button>

              {editingId && (
                <button
                  onClick={deleteEvent}
                  style={{ marginLeft: 10 }}
                >
                  Delete
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLogin && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "black",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div
            style={{
              background: "#111",
              padding: 20,
              borderRadius: 10,
            }}
          >
            <input
              type="password"
              placeholder="PIN"
              value={pinInput}
              onChange={(e) =>
                setPinInput(e.target.value)
              }
            />

            <button
              onClick={login}
              style={{ marginLeft: 10 }}
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}