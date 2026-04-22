import React, { useEffect, useMemo, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAfDf9HXxty8UrVQNvlVKxx_ERT9VLClQU",
  authDomain: "shared-dashboard-f428d.firebaseapp.com",
  databaseURL: "https://shared-dashboard-f428d-default-rtdb.firebaseio.com",
  projectId: "shared-dashboard-f428d",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());

  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [showLogin, setShowLogin] = useState(true);

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

  // 🔥 FIREBASE
  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};
      setEvents(Object.entries(data).map(([id, val]) => ({ id, ...val })));
    });
  }, []);

  // 🔐 LOGIN
  const login = () => {
    const user = Object.keys(users).find(u => users[u] === pinInput);
    if (user) {
      setCurrentUser(user);
      setShowLogin(false);
      setPinInput("");
    } else alert("Wrong PIN");
  };

  const logout = () => {
    setCurrentUser(null);
    setShowLogin(true);
  };

  const formatKey = (d) => {
    return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
  };

  // 📅 CALENDAR
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const end = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const days = [];

  for (let i = 0; i < start.getDay(); i++) days.push(null);

  for (let i = 1; i <= end.getDate(); i++) {
    const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    days.push({ dateObj: d, key: formatKey(d) });
  }

  const grouped = useMemo(() => {
    const g = {};
    events.forEach(e => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });
    return g;
  }, [events]);

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "short",
  }).toUpperCase();

  return (
    <div
      style={{
        padding: 12,
        background: "#000",
        minHeight: "100vh",
        color: "white",
        overflowX: "hidden",   // ✅ FIX overflow
        maxWidth: "100vw"      // ✅ FIX overflow
      }}
    >

      {/* ✅ HEADER (RESTORED) */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10
      }}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700 }}>
            🗓️ Balentina Schedule
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {currentUser ? `Logged in: ${currentUser}` : "Not logged in"}
          </div>
        </div>

        {currentUser && (
          <button
            onClick={logout}
            style={{
              background: "#ef4444",
              border: "none",
              padding: "6px 12px",
              borderRadius: 8,
              color: "white",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        )}
      </div>

      {/* MONTH */}
      <div style={{ textAlign: "center", fontSize: 22, marginBottom: 10 }}>
        {monthName}
      </div>

      {/* WEEK HEADER */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0,1fr))", // ✅ FIX
        textAlign: "center",
        opacity: 0.7,
        marginBottom: 6
      }}>
        {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* CALENDAR */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0,1fr))", // ✅ FIX
        gap: 10
      }}>
        {days.map((day, i) => {
          if (!day) return <div key={i}></div>;

          const isToday = day.dateObj.toDateString() === today.toDateString();

          return (
            <div
              key={i}
              style={{
                minHeight: 80,
                padding: 6,
                borderRadius: 10,
                border: isToday
                  ? "2px solid #22c55e"
                  : "1px solid rgba(255,255,255,0.05)"
              }}
            >
              <div style={{ fontWeight: 600 }}>
                {day.dateObj.getDate()}
              </div>

              {/* EVENTS */}
              {grouped[day.key]
                ?.slice()
                .sort((a, b) => a.time?.localeCompare(b.time))
                .map(ev => (
                  <div
                    key={ev.id}
                    style={{
                      fontSize: 10,
                      marginTop: 3,
                      display: "flex",
                      alignItems: "center",
                      gap: 4
                    }}
                  >
                    <div style={{
                      width: 3,
                      height: 12,
                      background: colors[ev.user]
                    }} />

                    <div>
                      {ev.title}
                      <div style={{
                        fontSize: 9,
                        color: colors[ev.user],
                        fontWeight: 600
                      }}>
                        {ev.user}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      {/* MONTH NAV */}
      <div style={{
        position: "fixed",
        bottom: 20,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 20
      }}>
        <button
          onClick={() =>
            setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))
          }
          style={{
            background: "#22c55e",
            border: "none",
            padding: 12,
            borderRadius: 10,
            color: "white"
          }}
        >
          ◀
        </button>

        <button
          onClick={() =>
            setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))
          }
          style={{
            background: "#22c55e",
            border: "none",
            padding: 12,
            borderRadius: 10,
            color: "white"
          }}
        >
          ▶
        </button>
      </div>

      {/* LOGIN */}
      {showLogin && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "black",
          display: "flex",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <div style={{ background:"#0f172a", padding:20, borderRadius:12 }}>
            <input
              placeholder="PIN"
              value={pinInput}
              onChange={e => setPinInput(e.target.value)}
              style={{ padding: 8, marginRight: 10 }}
            />
            <button onClick={login}>Login</button>
          </div>
        </div>
      )}

    </div>
  );
}