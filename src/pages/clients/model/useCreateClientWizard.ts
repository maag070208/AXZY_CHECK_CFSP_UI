/**
 * View-model del formulario de alta/edición de cliente.
 *
 * Aunque el archivo se llame «wizard», es un formulario de un paso: toda la
 * lógica es la configuración de `formik`.
 */
import { useFormik } from "formik";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import {
  createClient,
  updateClient,
  type Client,
  type ClientCreate,
  type ClientUpdate,
} from "@entities/client";

export interface CreateClientWizardProps {
  clientToEdit?: Client;
  onCancel: () => void;
  onSuccess: () => void;
}

export const useCreateClientWizard = ({ clientToEdit, onSuccess }: CreateClientWizardProps) => {
  const isEditing = !!clientToEdit;
  const dispatch = useDispatch();

  const formik = useFormik<ClientCreate & { active: boolean }>({
    enableReinitialize: true,
    initialValues: {
      name: clientToEdit?.name || "",
      address: clientToEdit?.address || "",
      rfc: clientToEdit?.rfc || "",
      contactName: clientToEdit?.contactName || "",
      contactPhone: clientToEdit?.contactPhone || "",
      appUsername: "",
      appPassword: "",
      active: clientToEdit ? clientToEdit.active : true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("El nombre es requerido"),
      address: Yup.string(),
      rfc: Yup.string(),
      contactName: Yup.string(),
      contactPhone: Yup.string()
        .matches(/^[0-9]+$/, "Solo números")
        .min(10, "Mínimo 10 dígitos")
        .max(10, "Máximo 10 dígitos"),
      appUsername: Yup.string().min(4, "Mínimo 4 caracteres"),
      appPassword: Yup.string().min(6, "Mínimo 6 caracteres"),
    }),
    onSubmit: async (values) => {
      dispatch(showLoader());
      try {
        const payload: ClientCreate & { active: boolean } = {
          ...values,
          appUsername: values.appUsername || undefined,
          appPassword: values.appPassword || undefined,
        };

        const res =
          isEditing && clientToEdit
            ? await updateClient(clientToEdit.id, payload as ClientUpdate)
            : await createClient(payload);

        if (res.success) {
          dispatch(
            showToast({
              message: `Cliente ${isEditing ? "actualizado" : "creado"} con éxito`,
              type: "success",
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({ message: res.messages?.[0] || "Error", type: "error" }),
          );
        }
      } finally {
        dispatch(hideLoader());
      }
    },
  });


  return { isEditing, formik };
};

export type CreateClientWizardViewModel = ReturnType<typeof useCreateClientWizard>;
