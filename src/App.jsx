import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export default function App() {
  const isTV = window.location.search.includes("tv");

  const [events, setEvents] = useState([]);
  const [currentUser, setCurrentUser] = useState(isTV ? "TV" : null);
  const [pinInput, setPinInput] = useState("");
  const [form, setForm] = useState({ date: "", time: "", title: "" });
  const [editingId, setEditingId] = useState(null);
  const [tvMode, setTvMode] = useState(isTV);

  const users = {
    Daniel: "0803",
    Dillon: "2712",
    Marlon: "1004",
    Dellary: "2608",
    Marelly: "2811",
  };

  const userColors = {
    Daniel: "bg-blue-100",
    Dillon: "bg-green-100",
    Marlon: "bg-yellow-100",
    Dellary: "bg-pink-100",
    Marelly: "bg-purple-100",
  };

  const handleLogin = () => {
    if (pinInput === "0000") {
      setTvMode(true);
      setCurrentUser("TV");
      return;
    }

    const user = Object.keys(users).find((u) => users[u] === pinInput);
    if (user) {
      setCurrentUser(user);
      setPinInput("");
    } else {
      alert("Wrong PIN");
    }
  };

  const formatDate = (dateStr) => {
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  useEffect(() => {
    const eventsRef = ref(db, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const parsed = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setEvents(parsed);
    });
  }, []);

  const handleSubmit = () => {
    if (!form.date || !form.time || !form.title) return;

    const formattedDate = formatDate(form.date);

    if (editingId) {
      update(ref(db, `events/${editingId}`), {
        ...form,
        user: currentUser,
        date: formattedDate,
      });
      setEditingId(null);
    } else {
      push(ref(db, "events"), {
        ...form,
        user: currentUser,
        date: formattedDate,
        createdAt: Date.now(),
      });
    }

    setForm({ date: "", time: "", title: "" });
  };

  const handleDelete = (id) => {
    remove(ref(db, `events/${id}`));
  };

  const handleEdit = (event) => {
    if (event.user !== currentUser) return;

    const [d, m, y] = event.date.split("/");
    const iso = `${y}-${m}-${d}`;

    setForm({ date: iso, time: event.time, title: event.title });
    setEditingId(event.id);
  };

  const grouped = {};
  events.forEach((e) => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  return (
    <>
      {!currentUser ? (
        <div className="flex items-center justify-center h-screen">
          <Card>
            <CardContent className="p-6 space-y-4">
              <h2 className="text-xl font-bold">Enter PIN</h2>
              <input
                type="password"
                className="border p-2 w-full"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
              />
              <Button onClick={handleLogin} className="w-full">
                Login
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="p-4 grid grid-cols-1 lg:grid-cols-4 gap-6">
          {!tvMode && (
            <Card>
              <CardContent className="p-4 space-y-3">
                <h2 className="font-bold">{currentUser}</h2>

                <input
                  type="date"
                  className="w-full p-2 border"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
                <input
                  type="time"
                  className="w-full p-2 border"
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Note"
                  className="w-full p-2 border"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />

                <Button onClick={handleSubmit} className="w-full">
                  {editingId ? "Update" : "Add"}
                </Button>
              </CardContent>
            </Card>
          )}

          <div className={tvMode ? "col-span-4" : "lg:col-span-3"}>
            <h2 className="text-2xl font-bold mb-4">
              {tvMode ? "📺 TV Dashboard" : "Dashboard"}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Object.keys(grouped).map((date) => {
                const [d, m, y] = date.split("/");
                const dateObj = new Date(`${y}-${m}-${d}`);

                const formattedDate = tvMode
                  ? dateObj
                      .toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })
                      .replace(/\//g, "-")
                  : date;

                return (
                  <Card key={date}>
                    <CardContent className="p-4">
                      <h3 className="font-bold mb-2">{formattedDate}</h3>

                      {grouped[date].map((event) => (
                        <div
                          key={event.id}
                          className={`p-2 mb-2 rounded ${userColors[event.user]}`}
                        >
                          <div className="flex justify-between">
                            <span>{event.title}</span>
                            <span>{event.time}</span>
                          </div>

                          <div className="text-xs">{event.user}</div>

                          {!tvMode && event.user === currentUser && (
                            <div className="flex gap-2 mt-1">
                              <Button size="sm" onClick={() => handleEdit(event)}>
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDelete(event.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
