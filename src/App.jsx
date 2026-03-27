// FULL PRODUCTION VERSION (Firebase + PIN + TV Mode)

import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, update, remove } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAfDf9HXxty8UrVQNvlVKxx_ERT9VLClQU",
  authDomain: "shared-dashboard-f428d.firebaseapp.com",
  databaseURL: "https://shared-dashboard-f428d-default-rtdb.firebaseio.com",
  projectId: "shared-dashboard-f428d",
  storageBucket: "shared-dashboard-f428d.firebasestorage.app",
  messagingSenderId: "205075244796",
  appId: "1:205075244796:web:5983194662892a51af1979",
  measurementId: "G-0JLZKW5KRC"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [pin, setPin] = useState("");
  const [form, setForm] = useState({ date: "", time: "", title: "" });
  const [editingId, setEditingId] = useState(null);
  const [tvMode, setTvMode] = useState(false);

  const users = {
    Daniel: "0803",
    Dillon: "2712",
    Marlon: "1004",
    Dellary: "2608",
    Marelly: "2811",
  };

  const colors = {
    Daniel: "#dbeafe",
    Dillon: "#dcfce7",
    Marlon: "#fef9c3",
    Dellary: "#fce7f3",
    Marelly: "#f3e8ff",
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

  const login = () => {
    if (pin === "0000") {
      setTvMode(true);
      setCurrentUser("TV");
      return;
    }
    const user = Object.keys(users).find((u) => users[u] === pin);
    if (user) {
      setCurrentUser(user);
      setPin("");
    } else alert("Wrong PIN");
  };

  const submit = () => {
    if (!form.date || !form.time || !form.title) return;

    const date = formatDate(form.date);

    if (editingId) {
      update(ref(db, "events/" + editingId), {
        ...form,
        user: currentUser,
        date,
      });
      setEditingId(null);
    } else {
      push(ref(db, "events"), {
        ...form,
        user: currentUser,
        date,
        createdAt: Date.now(),
      });
    }

    setForm({ date: "", time: "", title: "" });
  };

  const del = (id) => remove(ref(db, "events/" + id));

  const edit = (e) => {
    if (e.user !== currentUser) return;
    const [d, m, y] = e.date.split("/");
    setForm({ date: `${y}-${m}-${d}`, time: e.time, title: e.title });
    setEditingId(e.id);
  };

  const grouped = {};
  events.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  if (!currentUser) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div>
          <h2>Enter PIN</h2>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
          <button onClick={login}>Login</button>
          <p>TV PIN: 0000</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {!tvMode && (
        <div>
          <h3>{currentUser}</h3>
          <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
          <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
          <input placeholder="Note" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <button onClick={submit}>{editingId ? "Update" : "Add"}</button>
        </div>
      )}

      <h2>{tvMode ? "TV Dashboard" : "Dashboard"}</h2>

      {Object.keys(grouped).map((date) => (
        <div key={date}>
          <h3>{date}</h3>
          {grouped[date].map((e) => (
            <div key={e.id} style={{ background: colors[e.user], padding: 10, marginBottom: 5 }}>
              <div>{e.title} - {e.time}</div>
              <div style={{ fontSize: 12 }}>{e.user}</div>

              {!tvMode && e.user === currentUser && (
                <>
                  <button onClick={() => edit(e)}>Edit</button>
                  <button onClick={() => del(e.id)}>Delete</button>
                </>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
