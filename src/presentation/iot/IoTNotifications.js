import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { iotApi } from "../../infrastructure/api/iotApi";
import { resultLink, useIoTNotifications } from "./IoTNotificationProvider";
import { date } from "./IoTChart";
export default function IoTNotifications() {
  const { items: recent, markRead, error } = useIoTNotifications();
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pages, setPages] = useState(1);
  const [failure, setFailure] = useState("");
  useEffect(() => {
    let active = true;
    iotApi
      .get("/notifications", { page, limit: 25 })
      .then(({ data }) => {
        if (active) {
          setItems(data.items);
          setPages(data.pagination.totalPages);
        }
      })
      .catch((e) => active && setFailure(e.message));
    return () => {
      active = false;
    };
  }, [page, recent]);
  async function read(n) {
    try {
      await markRead(n);
    } catch (e) {
      setFailure(e.message);
    }
  }
  return (
    <section>
      <h2>Notificações</h2>
      {(error || failure) && <p role="alert">{error || failure}</p>}
      {!items.length && <p>Nenhuma notificação.</p>}
      {items.map((n) => (
        <article className="iot-panel" key={n.notificationId}>
          <h3>
            {n.title} {!n.readAt && "•"}
          </h3>
          <p>{n.message}</p>
          <time>{date(n.createdAt)}</time>
          <p>
            <Link to={resultLink(n)} onClick={() => read(n)}>
              Ver resultado / solicitação
            </Link>
          </p>
          {!n.readAt && (
            <button onClick={() => read(n)}>Marcar como lida</button>
          )}
        </article>
      ))}
      <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
        Anterior
      </button>{" "}
      {page}{" "}
      <button disabled={page >= pages} onClick={() => setPage(page + 1)}>
        Próxima
      </button>
    </section>
  );
}
