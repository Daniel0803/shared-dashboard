import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT.firebaseio.com",
  projectId: "YOUR_PROJECT",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const [events, setEvents] = useState([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.values(data);
      setEvents(parsed);
    });
  }, []);

  const addEvent = () => {
    if (!text) return;
    push(ref(db, "events"), {
      title: text,
      createdAt: Date.now(),
    });
    setText("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Shared Dashboard</h1>

      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Note"
      />
      <button onClick={addEvent}>Add</button>

      <ul>
        {events.map((e, i) => (
          <li key={i}>{e.title}</li>
        ))}
      </ul>
    </div>
  );
}
