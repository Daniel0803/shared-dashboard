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

// UI
const Card = ({ children }) => (
  <div style={{
    background: "#0f172a",
    borderRadius: 12,
    padding: 10,
    minHeight: 120
  }}>
    {children}
  </div>
);

const Button = ({ children, ...props }) => (
  <button {...props} style={{
    padding: "8px 12px",
    borderRadius: 8,
    border: "none",
    background: "#22c55e",
    fontWeight: 600,
    cursor: "pointer"
  }}>
    {children}
  </button>
);

const Input = (props) => (
  <input {...props} style={{
    padding: 8,
    borderRadius: 8,
    border: "1px solid #334155",
    background: "#020617",
    color: "white"
  }} />
);

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [form, setForm] = useState({ date: "", time: "", title: "" });

  const [currentDate, setCurrentDate] = useState(new Date());

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

  // LOGIN
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

  // FIREBASE
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

  // 📅 MONTH LOGIC
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  const daysInMonth = endOfMonth.getDate();
  const startDay = startOfMonth.getDay(); // 0=Sunday

  const calendarDays = [];

  // empty slots before month starts
  for (let i = 0; i < startDay; i++) {
    calendarDays.push(null);
  }

  // actual days
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
    <div style={{ padding: 20, background: "#020617", minHeight: "100vh", color: "white" }}>

      {/* HEADER */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>

        <div>
          <h1>🗓️ Balentina Schedule </h1>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {currentUser ? `Logged in: ${currentUser}` : "Not logged in"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Input type="password" placeholder="PIN" value={pinInput} onChange={(e)=>setPinInput(e.target.value)} />
          <Button onClick={login}>Login</Button>
        </div>
      </div>

      {/* MONTH SELECTOR */}
      <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 20 }}>
        <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}>◀</Button>
        <h2>{monthName}</h2>
        <Button onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}>▶</Button>
      </div>

      {/* INPUT */}
      {currentUser && (
        <div style={{ marginBottom: 20 }}>
          <Input type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})} />
          <Input type="time" value={form.time} onChange={(e)=>setForm({...form,time:e.target.value})} />
          <Input placeholder="Note" value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} />
          <Button onClick={addEvent}>Add</Button>
        </div>
      )}

      {/* WEEKDAY HEADER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 10 }}>
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((d) => (
          <div key={d} style={{ textAlign: "center", fontWeight: 600 }}>{d}</div>
        ))}
      </div>

      {/* CALENDAR GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10 }}>
        {calendarDays.map((day, i) => (
          <Card key={i}>
            {day && (
              <>
                <div style={{ fontSize: 12, marginBottom: 6 }}>
                  {day.dateObj.getDate()}
                </div>

                {grouped[day.key]?.map((e) => (
                  <div key={e.id} style={{
                    borderLeft: `4px solid ${colors[e.user]}`,
                    padding: 6,
                    marginBottom: 4,
                    borderRadius: 6,
                    background: "#020617"
                  }}>
                    <div style={{ fontSize: 12 }}>{e.title}</div>
                    <div style={{ fontSize: 10 }}>{e.time}</div>
                    <div style={{ fontSize: 9 }}>{e.user}</div>
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
