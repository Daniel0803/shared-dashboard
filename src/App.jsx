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
    timeOptions.push(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`);
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

  const [form, setForm] = useState({ date: "", time: "", title: "" });
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
    onValue(eventsRef, (snap) => {
      const data = snap.val() || {};
      setEvents(Object.entries(data).map(([id, val]) => ({ id, ...val })));
    });
  }, []);

  // LOGIN
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

  const formatKey = (d) =>
    `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;

  // CALENDAR BUILD
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

  // ADD / EDIT
  const openAdd = (day) => {
    if (!currentUser) return;
    setForm({ date: day.key, time: "", title: "" });
    setEditingId(null);
    setShowModal(true);
  };

  const openEdit = (e, ev) => {
    e.stopPropagation();
    if (ev.user !== currentUser) return;
    setForm(ev);
    setEditingId(ev.id);
    setShowModal(true);
  };

  const saveEvent = () => {
    if (!form.title || !form.time) return;

    if (editingId) {
      update(ref(db, `events/${editingId}`), { ...form, user: currentUser });
    } else {
      push(ref(db, "events"), {
        ...form,
        user: currentUser,
        createdAt: Date.now(),
      });
    }

    setShowModal(false);
    setEditingId(null);
    setForm({ date: "", time: "", title: "" });
  };

  const deleteEvent = () => {
    remove(ref(db, `events/${editingId}`));
    setShowModal(false);
  };

  const changeMonth = (offset) => {
    const d = new Date(currentDate);
    d.setMonth(currentDate.getMonth() + offset);
    setCurrentDate(d);
  };

  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <div style={{
      background:"#000",
      color:"white",
      minHeight:"100vh",
      padding:10,
      maxWidth:"100vw",
      overflowX:"hidden"
    }}>

      {/* HEADER */}
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:700 }}>Balentina</div>
          <div style={{ fontSize:12 }}>Schedule</div>
        </div>

        {currentUser && (
          <button onClick={logout} style={{
            background:"#ef4444",
            border:"none",
            padding:"6px 10px",
            color:"white",
            borderRadius:6
          }}>
            Logout
          </button>
        )}
      </div>

      {/* MONTH */}
      <h2 style={{ textAlign:"center", marginBottom:10 }}>{monthName}</h2>

      {/* WEEK HEADER */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(7,minmax(0,1fr))",
        textAlign:"center",
        opacity:0.7,
        marginBottom:5
      }}>
        {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
      </div>

      {/* CALENDAR */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(7,minmax(0,1fr))",
        gap:4
      }}>
        {days.map((day,i)=>{
          if (!day) return <div key={i}></div>;

          const isToday = day.dateObj.toDateString() === today.toDateString();

          return (
            <div key={i}
              onClick={()=>openAdd(day)}
              style={{
                minHeight:70,
                padding:4,
                borderRadius:6,
                border: isToday ? "2px solid #22c55e" : "1px solid #111",
                borderTop:"1px solid #222",
                overflow:"hidden"
              }}
            >
              <div style={{ fontSize:12 }}>{day.dateObj.getDate()}</div>

              {grouped[day.key]
                ?.slice()
                .sort((a,b)=>a.time.localeCompare(b.time))
                .map(ev=>(
                  <div key={ev.id}
                    onClick={(e)=>openEdit(e,ev)}
                    style={{
                      background:colors[ev.user],
                      marginTop:2,
                      borderRadius:4,
                      padding:"2px 4px",
                      fontSize:10,
                      color:"#000",
                      whiteSpace:"nowrap",
                      overflow:"hidden",
                      textOverflow:"ellipsis",
                      maxWidth:"100%"
                    }}
                  >
                    {ev.title}
                  </div>
                ))}
            </div>
          );
        })}
      </div>

      {/* NAV */}
      <div style={{
        display:"flex",
        justifyContent:"center",
        gap:10,
        marginTop:10
      }}>
        <button onClick={()=>changeMonth(-1)} style={{
          background:"#22c55e",
          padding:10,
          borderRadius:8,
          border:"none"
        }}>
          ◀
        </button>

        <button onClick={()=>changeMonth(1)} style={{
          background:"#22c55e",
          padding:10,
          borderRadius:8,
          border:"none"
        }}>
          ▶
        </button>
      </div>

      {/* MODAL */}
      {showModal && (
        <div style={{
          position:"fixed",top:0,left:0,width:"100%",height:"100%",
          background:"rgba(0,0,0,0.8)",
          display:"flex",justifyContent:"center",alignItems:"center"
        }}>
          <div style={{ background:"#111", padding:20, borderRadius:10 }}>
            <input
              placeholder="Title"
              value={form.title}
              onChange={e=>setForm({...form,title:e.target.value})}
            />

            <select
              value={form.time}
              onChange={e=>setForm({...form,time:e.target.value})}
            >
              <option value="">Select time</option>
              {timeOptions.map(t=>(
                <option key={t} value={t}>{formatTime(t)}</option>
              ))}
            </select>

            <div style={{ marginTop:10 }}>
              <button onClick={saveEvent}>Save</button>
              {editingId && <button onClick={deleteEvent}>Delete</button>}
            </div>
          </div>
        </div>
      )}

      {/* LOGIN */}
      {showLogin && (
        <div style={{
          position:"fixed",top:0,left:0,width:"100%",height:"100%",
          background:"black",
          display:"flex",justifyContent:"center",alignItems:"center"
        }}>
          <div style={{ background:"#111", padding:20, borderRadius:10 }}>
            <input
              type="password"
              placeholder="PIN"
              value={pinInput}
              onChange={e=>setPinInput(e.target.value)}
            />
            <button onClick={login}>Login</button>
          </div>
        </div>
      )}

    </div>
  );
}