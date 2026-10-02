/**
 * View-model del formulario de verificación de uniforme.
 */
import { useEffect, useMemo, useState } from "react";
import type { ICatalogItem } from "@app/core/types/catalog.types";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { mapToAnswers } from "@app/core/components/ChecklistGrid";
import {
  createUniformCheck,
  getUniformCatalog,
  type IUniformCatalog,
  type IUniformCheck,
} from "@entities/supervision";

/** Opción de guardia con su cliente, para filtrar por cliente. */
type GuardOption = ICatalogItem & { clientId?: string | null };

/** El catálogo no cambia entre aperturas: se cachea a nivel de módulo. */
let catalogCache: IUniformCatalog | null = null;

export interface UniformCheckFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (check: IUniformCheck) => void;
  /** Precarga desde la agenda. */
  initialGuardId?: string;
  shiftDate?: string;
}

export const useUniformCheckFormDialog = ({ isOpen, onSaved, initialGuardId, shiftDate }: UniformCheckFormDialogProps) => {
  const dispatch = useDispatch();
  const { data: clients } = useCatalog("client");
  const { data: guardsRaw, loading: loadingGuards } = useCatalog("guard");
  const guards = guardsRaw as GuardOption[];

  const [catalog, setCatalog] = useState<IUniformCatalog | null>(catalogCache);
  const [clientId, setClientId] = useState("");
  const [guardId, setGuardId] = useState(initialGuardId ?? "");
  const [values, setValues] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setGuardId(initialGuardId ?? "");
    setNotes("");
    if (catalogCache) {
      setValues(Object.fromEntries(catalogCache.items.map((i) => [i.key, true])));
      return;
    }
    getUniformCatalog()
      .then((res) => {
        if (!res.success) return;
        catalogCache = res.data;
        setCatalog(res.data);
        setValues(Object.fromEntries(res.data.items.map((i) => [i.key, true])));
      })
      .catch(() => dispatch(showToast({ message: "No se pudo cargar el catálogo de uniforme", type: "error" })));
  }, [isOpen, initialGuardId, dispatch]);

  const guardOptions = useMemo(
    () =>
      guards
        .filter((g) => !clientId || g.clientId === clientId)
        .map((g) => ({ label: g.value, value: String(g.id) })),
    [guards, clientId],
  );
  const clientOptions = useMemo(() => clients.map((c) => ({ label: c.name, value: String(c.id) })), [clients]);
  const selectedGuard = guards.find((g) => String(g.id) === guardId);
  const guardClient = clients.find((c) => String(c.id) === selectedGuard?.clientId);

  const total = catalog?.items.length ?? 0;
  const okCount = catalog?.items.filter((i) => values[i.key]).length ?? 0;
  const score = total ? Math.round((okCount / total) * 100) : 0;
  const compliant = catalog ? score >= catalog.minCompliantScore : false;

  const handleSave = async () => {
    if (!catalog || !guardId) return;
    setSaving(true);
    try {
      const res = await createUniformCheck({
        guardId,
        shiftDate,
        items: mapToAnswers(catalog.items, values),
        notes: notes.trim() || null,
      });
      if (res.success) {
        dispatch(showToast({ message: "Revisión de uniforme registrada", type: "success" }));
        onSaved(res.data);
      } else {
        dispatch(showToast({ message: res.messages?.[0] ?? "No se pudo guardar", type: "error" }));
      }
    } catch (err: any) {
      dispatch(showToast({ message: err?.messages?.[0] ?? "No se pudo guardar la revisión", type: "error" }));
    } finally {
      setSaving(false);
    }
  };


  return {
    loadingGuards,
    score,
    compliant,
    guardClient,
    selectedGuard,
    total,
    okCount,
    catalog,
    clientId, setClientId,
    clientOptions,
    guardId, setGuardId,
    guardOptions,
    handleSave,
    notes, setNotes,
    saving, setSaving,
    values, setValues,
  };
};

export type UniformCheckFormDialogViewModel = ReturnType<typeof useUniformCheckFormDialog>;
