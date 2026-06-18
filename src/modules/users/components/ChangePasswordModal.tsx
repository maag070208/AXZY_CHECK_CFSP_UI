import { hideLoader, showLoader } from "@app/core/store/loader/loader.slice";
import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITLoader } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React from "react";
import { FaKey } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { resetPassword, User } from "../services/UserService";

interface Props {
  user: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<Props> = ({
  user,
  onCancel,
  onSuccess,
}) => {
  const dispatch = useDispatch();

  const formik = useFormik({
    initialValues: {
      newPassword: "",
      confirmPassword: "",
    },
    validationSchema: Yup.object({
      newPassword: Yup.string()
        .min(6, "Mínimo 6 caracteres")
        .required("Requerido"),
      confirmPassword: Yup.string()
        .oneOf([Yup.ref("newPassword")], "Las contraseñas no coinciden")
        .required("Requerido"),
    }),
    onSubmit: async (values) => {
      dispatch(showLoader());
      try {
        const res = await resetPassword(user.id, values.newPassword);
        if (res.success) {
          dispatch(
            showToast({
              message: "Contraseña actualizada con éxito",
              type: "success",
              duration: 3000,
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({
              message: res.messages?.[0] || "Error al actualizar",
              type: "error",
            }),
          );
        }
      } catch (error) {
        dispatch(showToast({ message: "Error de conexión", type: "error" }));
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  return (
    <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
      <div className="px-8 pt-8 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
            <FaKey size={18} />
          </div>
          <div>
            <h3 className="text-base font-medium text-slate-800">Cambiar Contraseña</h3>
            <p className="text-xs text-slate-400 font-light">@{user.username}</p>
          </div>
        </div>
      </div>

      <div className="px-8 py-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <ITInput
            label="Nueva Contraseña"
            name="newPassword"
            type="password"
            value={formik.values.newPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.newPassword}
            touched={formik.touched.newPassword}
            placeholder="••••••••"
          />
          <ITInput
            label="Confirmar Contraseña"
            name="confirmPassword"
            type="password"
            value={formik.values.confirmPassword}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.confirmPassword}
            touched={formik.touched.confirmPassword}
            placeholder="••••••••"
          />
        </div>
      </div>

      <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
        <ITButton
          type="button"
          variant="ghost"
          onClick={onCancel}
          size="small"
          className="px-5 whitespace-nowrap shadow shadow-slate-100"
        >
          Cancelar
        </ITButton>

        <ITButton
          onClick={() => formik.submitForm()}
          color="primary"
          disabled={formik.isSubmitting}
          size="small"
          className="px-5 whitespace-nowrap shadow shadow-sky-100"
        >
          {formik.isSubmitting ? <ITLoader size="sm" /> : "Actualizar Clave"}
        </ITButton>
      </div>
    </div>
  );
};
