/**
 * View-model del formulario de alta/edición de usuario.
 *
 * Es una **feature** porque la consumen dos páginas (`/users` y
 * `/routes/new`). Concentra catálogos, validación y envío; la vista sólo
 * enlaza campos.
 */
import { useEffect, useMemo, useState } from "react";
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { listSchedules, type Schedule } from "@entities/schedule";
import { createUser, updateUser, type User } from "@entities/user";

/** Roles que exigen cliente y turno. */
const OPERATIONAL_ROLES = ["GUARD", "SHIFT", "MAINT"];

export interface UseCreateUserFormOptions {
  userToEdit?: User;
  onSuccess: () => void;
}

export const useCreateUserForm = ({ userToEdit, onSuccess }: UseCreateUserFormOptions) => {
  const isEditing = Boolean(userToEdit);
  const dispatch = useDispatch();

  const { data: roles, loading: loadingRoles } = useCatalog("role");
  const { data: clients, loading: loadingClients } = useCatalog("client");

  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loadingSchedules, setLoadingSchedules] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await listSchedules();
      if (cancelled) return;
      if (res.success && Array.isArray(res.data)) setSchedules(res.data);
      setLoadingSchedules(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** El rol del usuario decide si cliente y horario son obligatorios. */
  const isOperationalRole = (roleId: string): boolean => {
    const role = roles.find((r) => String(r.id) === String(roleId));
    return OPERATIONAL_ROLES.includes(role?.name ?? "");
  };

  const roleOptions = useMemo(
    () => roles.filter((r) => r.name !== "RESDN").map((r) => ({ label: r.value, value: String(r.id) })),
    [roles],
  );

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: userToEdit?.name ?? "",
      lastName: userToEdit?.lastName ?? "",
      username: userToEdit?.username ?? "",
      password: "",
      confirmPassword: "",
      roleId: userToEdit?.roleId ? String(userToEdit.roleId) : userToEdit?.role?.id ? String(userToEdit.role.id) : "",
      scheduleId: userToEdit?.scheduleId
        ? String(userToEdit.scheduleId)
        : userToEdit?.schedule?.id
          ? String(userToEdit.schedule.id)
          : "",
      clientId: userToEdit?.clientId
        ? String(userToEdit.clientId)
        : userToEdit?.client?.id
          ? String(userToEdit.client.id)
          : "",
      active: userToEdit ? userToEdit.active : true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Requerido"),
      lastName: Yup.string().required("Requerido"),
      username: Yup.string().required("Requerido"),
      password: isEditing
        ? Yup.string().min(6, "Mínimo 6")
        : Yup.string().min(6, "Mínimo 6").required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("password")], "No coinciden")
        .when("password", {
          is: (val: string) => Boolean(val && val.length > 0),
          then: (schema) => schema.required("Requerido"),
        }),
      roleId: Yup.string().required("Selecciona un rol"),
      scheduleId: Yup.string().when("roleId", {
        is: (roleId: string) => isOperationalRole(roleId),
        then: () => Yup.string().required("Horario obligatorio"),
      }),
      clientId: Yup.string().when("roleId", {
        is: (roleId: string) => isOperationalRole(roleId),
        then: () => Yup.string().required("Cliente obligatorio"),
      }),
    }),
    onSubmit: async (values) => {
      dispatch(showLoader());

      const { confirmPassword: _confirmPassword, ...data } = values;
      void _confirmPassword;
      const payload = {
        ...data,
        password: data.password || undefined,
        scheduleId: data.scheduleId || undefined,
        clientId: data.clientId || undefined,
      };

      const res =
        isEditing && userToEdit ? await updateUser(userToEdit.id, payload) : await createUser(payload);

      dispatch(hideLoader());

      if (res.success) {
        dispatch(
          showToast({
            message: `Usuario ${isEditing ? "editado" : "creado"} con éxito`,
            type: "success",
          }),
        );
        onSuccess();
      } else {
        dispatch(showToast({ message: res.messages?.[0] || "Error al guardar", type: "error" }));
      }
    },
  });

  return {
    isEditing,
    formik,
    /** ¿El rol elegido exige cliente y turno? */
    isOperationalRole,
    roleOptions,
    clients,
    schedules,
    loadingRoles,
    loadingClients,
    loadingSchedules,
  };
};
