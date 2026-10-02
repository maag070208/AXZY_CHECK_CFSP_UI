/**
 * View-model de la pestaña de guardias asignados a un cliente.
 *
 * La lógica se extrajo tal cual; el acceso a datos ya pasaba por las entidades
 * (`request`, que nunca lanza).
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { fetchUsersTable, updateUser, type User } from "@entities/user";
import { listSchedules } from "@entities/schedule";

export interface UseClientGuardsTabOptions {
  clientId: string;
}

export const useClientGuardsTab = ({ clientId }: UseClientGuardsTabOptions) => {
  const dispatch = useDispatch();
  const [refreshKey, setRefreshKey] = useState(0);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [changingScheduleUser, setChangingScheduleUser] = useState<User | null>(
    null,
  );
  const [removingUser, setRemovingUser] = useState<User | null>(null);

  useEffect(() => {
    listSchedules().then((res) => setSchedules(res.success && Array.isArray(res.data) ? res.data : []));
  }, []);

  const memoizedFetch = useCallback(
    (params: any) => {
      return fetchUsersTable({
        ...params,
        filters: {
          ...params.filters,
          clientId,
          role: { name: { in: ["GUARD", "SHIFT", "MAINT"] } },
        },
      });
    },
    [clientId],
  );

  const handleRemoveFromClient = async (user: User) => {
      const res = await updateUser(user.id, { clientId: null });
      if (res.success) {
        dispatch(
          showToast({
            message: "Guardia removido del cliente con éxito",
            type: "success",
          }),
        );
        setRefreshKey((prev) => prev + 1);
        setRemovingUser(null);
      } else {
        dispatch(
          showToast({
            message: res.messages?.[0] || "No se pudo remover al guardia",
            type: "error",
          }),
        );
      }
  };

  /** Cambia el horario del guardia desde el modal. */
  const handleScheduleChange = useCallback(
    async (scheduleId: string) => {
      if (!changingScheduleUser) return;
      const target = changingScheduleUser;

      const res = await updateUser(target.id, { scheduleId });

      if (res.success) {
        dispatch(showToast({ message: "Horario actualizado con éxito", type: "success" }));
        setRefreshKey((prev) => prev + 1);
        setChangingScheduleUser(null);
      } else {
        dispatch(
          showToast({ message: res.messages?.[0] || "Error al actualizar", type: "error" }),
        );
      }
    },
    [changingScheduleUser, dispatch],
  );

  return {
    refreshKey,
    setRemovingUser,
    handleScheduleChange,
    setRefreshKey,
    changingScheduleUser,
    setChangingScheduleUser,
    handleRemoveFromClient,
    memoizedFetch,
    removingUser,
    schedules,
  };
};

export type ClientGuardsTabViewModel = ReturnType<typeof useClientGuardsTab>;
