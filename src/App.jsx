import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push } from "firebase/database";

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
