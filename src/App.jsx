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

const Card = ({ children, style }) => (
  <div style={{ background: "#0f172a", borderRadius: 16, padding: 16, boxShadow: "0 10px 30px rgba(0,0,0,.4)", ...style }}>
    {children}
  </div>
);

const Button = ({ children, ...props }) => (
  <button {...props} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: "#22c55e", color: "#022c22", fontWeight: 600, cursor: "pointer" }}>
    {children}
  </button>
);

const Input = (props) => (
  <input {...props} style={{ padding: 8, borderRadius: 8, border: "1px solid #334155", background: "#020617", color: "#e5e7eb" }} />
);

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
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

  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setEvents(list);
    });
  }, []);

  const addEvent = () => {
    if (!form.date || !form.time || !form.title) return;
    push(ref(db, "events"), {
      ...form,
      date: formatDate(form.date),
      user: currentUser,
      createdAt: Date.now(),
    });
    setForm({ date: "", time: "", title: "" });
  };

  // ✅ FIXED DATE GENERATION (correct weekday match)
  const getNext7Days = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();

      days.push({
        key: `${dd}/${mm}/${yyyy}`,
        dateObj: d
      });
    }

    return days;
  };

  const week = getNext7Days();

  const grouped = useMemo(() => {
    const g = {};
    week.forEach((d) => (g[d.key] = []));

    events.forEach((e) => {
      if (!g[e.date]) g[e.date] = [];
      g[e.date].push(e);
    });

    return g;
  }, [events, week]);

  return (
    <div style={{ padding: 20, background: "#020617", minHeight: "100vh", color: "white" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h1>📺 Dashboard</h1>

        <div style={{ display: "flex", gap: 10 }}>
          <Input type="password" placeholder="PIN" value={pinInput} onChange={(e)=>setPinInput(e.target.value)} />
          <Button onClick={login}>Login</Button>
        </div>
      </div>

      {/* INPUT */}
      {currentUser && (
        <Card style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 10 }}>
            <Input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} />
            <Input type="time" value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})} />
            <Input placeholder="Note" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
            <Button onClick={addEvent}>Add</Button>
          </div>
        </Card>
      )}

      {/* CALENDAR GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 12 }}>
        {week.map((day) => {
          const weekday = day.dateObj.toLocaleDateString("en-GB", { weekday: "long" });

          return (
            <Card key={day.key} style={{ minHeight: 200 }}>

              {/* HEADER DAY */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{weekday}</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>{day.key}</div>
              </div>

              {/* EVENTS */}
              {grouped[day.key].map((e) => (
                <div key={e.id} style={{ borderLeft: `4px solid ${colors[e.user]}`, padding: 8, marginBottom: 6, borderRadius: 6, background: "#020617" }}>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div style={{ fontSize: 12 }}>{e.time}</div>
                  <div style={{ fontSize: 10 }}>{e.user}</div>
                </div>
              ))}

            </Card>
          );
        })}
      </div>
    </div>
  );
}
