/**
 * View-model de autenticación (login y registro).
 *
 * Las páginas quedan como puro render; las formas ya eran presentacionales
 * (recibían `onSubmit`), así que aquí vive el único acceso a datos.
 */
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setAuth } from "@app/core/store/auth/auth.slice";
import { AppDispatch } from "@app/core/store/store";
import { showToast } from "@app/core/store/toast/toast.slice";
import type { IAuthLogin, IAuthRegister } from "@core/types/auth.types";
import { login as loginRequest, register as registerRequest } from "./AuthService";

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (values: IAuthLogin) => {
      setLoading(true);

      const response = await loginRequest(values);

      setLoading(false);

      if (!response.success) {
        dispatch(
          showToast({
            message: response.messages?.[0] || "Error al iniciar sesión",
            type: "error",
            position: "top-right",
          }),
        );
        return;
      }

      dispatch(setAuth(response.data));
      navigate("/home");
    },
    [dispatch, navigate],
  );

  return { loading, handleSubmit };
};

export const useRegister = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const handleSubmit = useCallback(
    async (values: IAuthRegister) => {
      const response = await registerRequest(values);

      if (response.success) {
        dispatch(
          showToast({
            message: "Registro exitoso, por favor inicie sesión",
            type: "success",
            position: "top-right",
          }),
        );
        navigate("/login");
      } else {
        dispatch(
          showToast({
            message: response.messages?.[0] || "Error al registrarse",
            type: "error",
            position: "top-right",
          }),
        );
      }
    },
    [dispatch, navigate],
  );

  return { handleSubmit };
};
