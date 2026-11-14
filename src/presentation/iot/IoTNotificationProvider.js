import React, { createContext, useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { iotApi } from "../../infrastructure/api/iotApi";
const Context = createContext({ items: [], count: 0 });
export const useIoTNotifications = () => useContext(Context);
export const resultLink = (n) =>
  `/iot?request=${encodeURIComponent(n.relatedRequestId)}`;
export function IoTNotificationProvider({ children }) {
  const { user } = useAuth();
  const userId = user?.id || user?._id;
  return (
    <NotificationSession key={userId || "guest"} userId={userId}>
      {children}
    </NotificationSession>
  );
}
function NotificationSession({ children, userId }) {
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!userId) return;
    let active = true,
      busy = false,
      known = null;
    async function poll() {
      if (busy || document.visibilityState === "hidden") return;
      busy = true;
      try {
        const [notes, unread] = await Promise.all([
          iotApi.get("/notifications", { limit: 25 }),
          iotApi.get("/notifications/unread-count"),
        ]);
        if (!active) return;
        const next = notes.data.items;
        const arrived =
          known && next.find((n) => !known.has(n.notificationId) && !n.readAt);
        if (arrived) setToast(arrived);
        known = new Set(next.map((n) => n.notificationId));
        setItems(next);
        setCount(unread.data.count);
        setError("");
      } catch (e) {
        if (active) setError("Não foi possível atualizar as notificações.");
      } finally {
        busy = false;
      }
    }
    poll();
    const interval = setInterval(poll, 15000);
    document.addEventListener("visibilitychange", poll);
    return () => {
      active = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", poll);
    };
  }, [userId]);
  async function markRead(n) {
    await iotApi.patch(`/notifications/${n.notificationId}/read`, {});
    setItems((previous) =>
      previous.map((item) =>
        item.notificationId === n.notificationId
          ? { ...item, readAt: new Date().toISOString() }
          : item,
      ),
    );
    if (!n.readAt) setCount((value) => Math.max(0, value - 1));
    setToast(null);
  }
  return (
    <Context.Provider value={{ items, count, markRead, error }}>
      {children}
      {userId && toast && (
        <aside className="iot-toast" role="status">
          <strong>{toast.title}</strong>
          <p>{toast.message}</p>
          <Link
            to={resultLink(toast)}
            onClick={() => markRead(toast).catch(() => {})}
          >
            Ver resultado
          </Link>
          <button onClick={() => setToast(null)} aria-label="Fechar aviso">
            ×
          </button>
        </aside>
      )}
    </Context.Provider>
  );
}
export function IoTNotificationBell() {
  const { user } = useAuth();
  const { count } = useIoTNotifications();
  return user ? (
    <Link
      className="btn btn-primary btn-sm ms-2"
      to="/iot?tab=notifications"
      aria-label={`Notificações IoT: ${count} não lidas`}
    >
      🔔 Meu IoT {count > 0 && <strong>({count})</strong>}
    </Link>
  ) : null;
}
