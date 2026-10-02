/**
 * View-model del envío de notificaciones.
 *
 * La vista importaba `post` del axios legacy directamente — el último sitio de
 * la WEB que hablaba HTTP desde un componente. Ahora pasa por la entidad.
 */
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { sendNotification } from "@entities/supervision";

export interface NotificationForm {
  guardId: string;
  title: string;
  message: string;
  type: string;
  persistent: boolean;
}

const EMPTY_FORM: NotificationForm = {
  guardId: "",
  title: "",
  message: "",
  type: "info",
  persistent: false,
};

export interface UseNotificationSenderOptions {
  onClose: () => void;
}

export const useNotificationSender = ({ onClose }: UseNotificationSenderOptions) => {
  const dispatch = useDispatch();

  const [form, setForm] = useState<NotificationForm>(EMPTY_FORM);
  const [sending, setSending] = useState(false);

  const handleSend = useCallback(async () => {
    if (!form.message.trim()) {
      dispatch(showToast({ message: "El mensaje es requerido", type: "error" }));
      return;
    }

    setSending(true);

    const res = await sendNotification({
      title: form.title || undefined,
      message: form.message,
      type: form.type,
      userId: form.guardId || undefined,
      channel: "global",
      persistent: form.persistent,
    });

    setSending(false);

    if (res.success) {
      dispatch(showToast({ message: "Notificación enviada", type: "success" }));
      setForm(EMPTY_FORM);
      onClose();
    } else {
      dispatch(
        showToast({ message: res.messages?.[0] || "Error al enviar", type: "error" }),
      );
    }
  }, [form, dispatch, onClose]);

  return { form, setForm, sending, handleSend };
};

export type NotificationSenderViewModel = ReturnType<typeof useNotificationSender>;
