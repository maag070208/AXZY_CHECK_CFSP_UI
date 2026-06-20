import { showToast } from "@app/core/store/toast/toast.slice";
import * as Ably from "ably";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppState } from "@app/core/store/store";

const ABLY_KEY =
  import.meta.env.VITE_ABLY_API_KEY ||
  "_iYGPA.fJVkAw:ix6oVHub7TpqllbX6JMdmfJgDoqKKEIoZ5wJNRo6Zlc";

const NotificationProvider = () => {
  const dispatch = useDispatch();
  const isAuth = useSelector((state: AppState) => !!state.auth.token);

  useEffect(() => {
    if (!isAuth) return;

    const ably = new Ably.Realtime({ key: ABLY_KEY });

    ably.connection.on("connected", () => {
      console.log("[Ably] Conectado a notificaciones");
    });

    const globalChannel = ably.channels.get("global");

    globalChannel.subscribe("notification", (msg: any) => {
      const { title, message, type } = msg.data;
      dispatch(
        showToast({
          message: `${title ? title + ": " : ""}${message}`,
          type: type || "info",
          duration: type === "error" ? 8000 : 5000,
        } as any)
      );
    });

    return () => {
      globalChannel.unsubscribe();
      ably.close();
    };
  }, [isAuth, dispatch]);

  return null;
};

export default NotificationProvider;
