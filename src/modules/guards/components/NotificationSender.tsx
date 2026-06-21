import { post } from "@app/core/axios/axios";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  ITButton,
  ITDialog,
  ITInput,
  ITLoader,
  ITSelect,
  ITSlideToggle,
} from "@axzydev/axzy_ui_system";
import { useState } from "react";
import {
  FaBell,
  FaPaperPlane,
} from "react-icons/fa";
import { useDispatch } from "react-redux";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSender = ({ isOpen, onClose }: Props) => {
  const dispatch = useDispatch();
  const { data: guards } = useCatalog("guard");
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    guardId: "",
    title: "",
    message: "",
    type: "info" as "info" | "success" | "warning" | "error",
    persistent: false,
  });

  const handleSend = async () => {
    if (!form.message.trim()) {
      dispatch(showToast({ message: "El mensaje es requerido", type: "error" }));
      return;
    }
    setSending(true);
    try {
      const res = await post("/notifications/send", {
        title: form.title || undefined,
        message: form.message,
        type: form.type,
        userId: form.guardId || undefined,
        channel: "global",
        persistent: form.persistent,
      });
      if ((res as any).success) {
        dispatch(showToast({ message: "Notificación enviada", type: "success" }));
        setForm({ guardId: "", title: "", message: "", type: "info", persistent: false });
        onClose();
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] || "Error al enviar", type: "error" }));
    } finally {
      setSending(false);
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="!max-w-lg !w-full"
    >
      <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
        <div className="px-8 pt-8 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
              <FaBell size={18} />
            </div>
            <div>
              <h3 className="text-base font-medium text-slate-800">Enviar Notificación</h3>
              <p className="text-xs text-slate-400 font-light">Mensaje instantáneo a guardias</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-4">
          <ITSelect
            label="Destinatario"
            name="guardId"
            placeholder="TODOS LOS GUARDIAS"
            value={form.guardId}
            onChange={(e: any) => setForm((p) => ({ ...p, guardId: e.target.value }))}
            options={[
              { label: "Todos los guardias", value: "" },
              ...(guards || []).map((g: any) => ({
                label: g.value || g.name,
                value: g.id,
              })),
            ]}
          />

          <ITSelect
            label="Tipo de notificación"
            name="type"
            value={form.type}
            onChange={(e: any) => setForm((p) => ({ ...p, type: e.target.value }))}
            options={[
              { label: "Informativa", value: "info" },
              { label: "Éxito", value: "success" },
              { label: "Advertencia", value: "warning" },
              { label: "Alerta", value: "error" },
            ]}
          />

          <ITInput
            label="Título (opcional)"
            name="title"
            placeholder="Ej: Cambio de turno"
            value={form.title}
            onChange={(e: any) => setForm((p) => ({ ...p, title: e.target.value }))}
            onBlur={() => {}}
          />

          <ITInput
            type="textarea"
            label="Mensaje"
            name="message"
            placeholder="Escribe el mensaje de la notificación..."
            value={form.message}
            onChange={(e: any) => setForm((p) => ({ ...p, message: e.target.value }))}
            onBlur={() => {}}
          />

          {form.guardId && (
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div>
                <p className="text-xs font-medium text-amber-700">Persistente</p>
                <p className="text-[10px] text-amber-500">No se podrá deslizar en Android</p>
              </div>
              <ITSlideToggle
                isOn={form.persistent}
                onToggle={(v) => setForm((p) => ({ ...p, persistent: v }))}
              />
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <p className="text-[10px] text-slate-400">
              <FaBell className="inline mr-1" size={10} />
              La notificación se enviará en tiempo real vía toast en WEB y push notification en APP.
            </p>
          </div>
        </div>

        <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
          <ITButton
            variant="ghost"
            onClick={onClose}
            size="small"
            className="px-5 whitespace-nowrap shadow shadow-slate-100"
          >
            Cancelar
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            size="small"
            className="px-5 whitespace-nowrap shadow shadow-emerald-100"
            onClick={handleSend}
            disabled={sending || !form.message.trim()}
          >
            <div className="flex items-center gap-1.5">
              {sending ? <ITLoader size="sm" color="white" /> : <FaPaperPlane size={14} />}
              <span className="text-xs">{sending ? "Enviando..." : "Enviar"}</span>
            </div>
          </ITButton>
        </div>
      </div>
    </ITDialog>
  );
};
