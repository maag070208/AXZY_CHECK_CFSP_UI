import { showToast } from "@app/core/store/toast/toast.slice";
import { showLoader, hideLoader } from "@app/core/store/loader/loader.slice";
import { TResult } from "@app/core/types/TResult";
import { ITButton, ITInput, ITSlideToggle } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState } from "react";
import {
  FaBuilding,
  FaClipboardCheck,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaShieldAlt,
  FaUser,
} from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import {
  Client,
  ClientCreate,
  ClientUpdate,
  createClient,
  updateClient,
} from "../services/ClientsService";

interface Props {
  clientToEdit?: Client;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateClientWizard: React.FC<Props> = ({
  clientToEdit,
  onCancel,
  onSuccess,
}) => {
  const isEditing = !!clientToEdit;
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);

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
      } catch (error) {
        const result = error as TResult<void>;
        dispatch(
          showToast({
            message: result?.messages?.[0] || "Error inesperado",
            type: "error",
          }),
        );
      } finally {
        dispatch(hideLoader());
      }
    },
  });

  const steps = [
    {
      label: "Identidad",
      icon: <FaBuilding />,
      content: (
        <div className="space-y-8">
          <ITInput
            label="Nombre del Cliente / Razón Social"
            name="name"
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.errors.name}
            touched={formik.touched.name}
            placeholder="Ej. Corporativo AXZY S.A. de C.V."
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ITInput
              label="RFC (Opcional)"
              name="rfc"
              value={formik.values.rfc}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.rfc}
              touched={formik.touched.rfc}
              placeholder="ABC123456XYZ"
            />
            <ITInput
              label="Dirección"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.errors.address}
              touched={formik.touched.address}
              placeholder="Calle, Número, Col..."
              iconLeft={<FaMapMarkerAlt className="text-slate-400" />}
            />
          </div>

          <div className="bg-slate-50/50 p-8 rounded-[32px] border border-slate-100/50 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-emerald-500 border border-slate-100">
                <FaUser size={14} />
              </div>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest">
                Contacto Principal
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ITInput
                label="Nombre de Contacto"
                name="contactName"
                value={formik.values.contactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.contactName}
                touched={formik.touched.contactName}
                iconLeft={<FaUser className="text-slate-400" />}
                placeholder="Juan Pérez"
              />
              <ITInput
                label="Teléfono Móvil (10 dígitos)"
                name="contactPhone"
                value={formik.values.contactPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  formik.setFieldValue("contactPhone", val.slice(0, 10));
                }}
                onBlur={formik.handleBlur}
                error={formik.errors.contactPhone}
                touched={formik.touched.contactPhone}
                placeholder="5500000000"
                maxLength={10}
                iconLeft={<FaPhone className="text-slate-400" />}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Acceso App",
      icon: <FaShieldAlt />,
      content: (
        <div className="space-y-8">
          <div className="bg-emerald-50/30 p-8 rounded-[32px] border border-emerald-100/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-emerald-100/50 pointer-events-none">
              <FaShieldAlt size={80} />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-sm text-emerald-500">
                  <FaIdCard size={16} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">
                    Seguridad App
                  </span>
                  <span className="text-sm font-bold text-slate-700">
                    Credenciales Operativas
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mb-8 leading-relaxed max-w-md">
                Configure el acceso para que el personal asignado a este cliente
                pueda sincronizar sus actividades desde la aplicación móvil.
              </p>

              <div className="grid grid-cols-1 gap-6">
                <ITInput
                  label="Nombre de Usuario (App)"
                  name="appUsername"
                  value={formik.values.appUsername}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.appUsername}
                  touched={formik.touched.appUsername}
                  placeholder="cliente_admin"
                />
                <ITInput
                  label={
                    isEditing
                      ? "Cambiar Contraseña (Opcional)"
                      : "Contraseña de Acceso"
                  }
                  name="appPassword"
                  type="password"
                  value={formik.values.appPassword}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.appPassword}
                  touched={formik.touched.appPassword}
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {isEditing && <></>}
        </div>
      ),
    },
    {
      label: "Confirmación",
      icon: <FaClipboardCheck />,
      content: (
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -mr-32 -mt-32" />

            <div className="flex items-center gap-6 mb-10">
              <div className="w-20 h-20 rounded-[28px] bg-emerald-500 shadow-xl shadow-emerald-500/20 flex items-center justify-center text-3xl font-black">
                {formik.values.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h3 className="text-2xl font-black truncate max-w-[300px]">
                  {formik.values.name}
                </h3>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${formik.values.active ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                  <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">
                    {formik.values.active ? "Activo" : "Inactivo"}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-8 gap-x-8 border-t border-white/5 pt-10">
              <SummaryItem
                label="Responsable"
                value={formik.values.contactName}
                icon={<FaUser className="text-emerald-400/60" />}
              />
              <SummaryItem
                label="Contacto"
                value={formik.values.contactPhone}
                icon={<FaPhone className="text-emerald-400/60" />}
              />
              <SummaryItem
                label="Identificador App"
                value={
                  formik.values.appUsername ||
                  (isEditing ? "Sin cambios" : "No definido")
                }
                icon={<FaShieldAlt className="text-emerald-400/60" />}
              />
              <SummaryItem
                label="RFC"
                value={formik.values.rfc}
                icon={<FaBuilding className="text-emerald-400/60" />}
              />
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] pt-4">
            Revise cuidadosamente antes de guardar
          </p>
        </div>
      ),
    },
  ];

  const handleNext = async () => {
    const errors = await formik.validateForm();
    const currentFields =
      currentStep === 0 ? ["name"] : ["appUsername", "appPassword"];

    const hasErrors = currentFields.some((f) => (errors as any)[f]);

    if (hasErrors) {
      const touched = currentFields.reduce(
        (acc, f) => ({ ...acc, [f]: true }),
        {},
      );
      formik.setTouched({ ...formik.touched, ...touched });
      dispatch(
        showToast({
          message: "Complete los campos requeridos",
          type: "error",
        }),
      );
      return;
    }

    currentStep < steps.length - 1
      ? setCurrentStep((prev) => prev + 1)
      : formik.submitForm();
  };

  return (
    <div className="flex flex-col w-full bg-white max-h-[85vh]">
      <form
        onSubmit={formik.handleSubmit}
        className="flex flex-col h-full overflow-hidden"
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
          {/* SECTION 1: IDENTITY */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Detalles del Cliente
              </h4>
            </div>

            <div className="space-y-6">
              <ITInput
                label="Nombre del Cliente / Razón Social"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.name}
                touched={formik.touched.name}
                placeholder="Ej. Corporativo AXZY S.A. de C.V."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                  label="RFC (Opcional)"
                  name="rfc"
                  value={formik.values.rfc}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.rfc}
                  touched={formik.touched.rfc}
                  placeholder="ABC123456XYZ"
                />
                <ITInput
                  label="Dirección"
                  name="address"
                  value={formik.values.address}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.address}
                  touched={formik.touched.address}
                  placeholder="Calle, Número, Col..."
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: CONTACT */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-4 bg-indigo-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Contacto Principal
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ITInput
                label="Nombre de Contacto"
                name="contactName"
                value={formik.values.contactName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.contactName}
                touched={formik.touched.contactName}
                placeholder="Juan Pérez"
              />
              <ITInput
                label="Teléfono Móvil (10 dígitos)"
                name="contactPhone"
                value={formik.values.contactPhone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  formik.setFieldValue("contactPhone", val.slice(0, 10));
                }}
                onBlur={formik.handleBlur}
                error={formik.errors.contactPhone}
                touched={formik.touched.contactPhone}
                placeholder="5500000000"
                maxLength={10}
              />
            </div>
          </section>

          {/* SECTION 3: ACCESS */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Seguridad y Acceso
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <ITInput
                label="Usuario App"
                name="appUsername"
                value={formik.values.appUsername}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.appUsername}
                touched={formik.touched.appUsername}
                placeholder="cliente_admin"
              />
              <ITInput
                label={
                  isEditing
                    ? "Cambiar Contraseña (Opcional)"
                    : "Contraseña de Acceso"
                }
                name="appPassword"
                type="password"
                value={formik.values.appPassword}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.appPassword}
                touched={formik.touched.appPassword}
                placeholder="••••••••"
              />
            </div>

            {isEditing && (
              <div className="mt-8 flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Estado del cliente
                  </h5>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    Activar/desactivar operatividad en el sistema
                  </p>
                </div>
                <ITSlideToggle
                  isOn={formik.values.active}
                  onToggle={(val) => formik.setFieldValue("active", val)}
                />
              </div>
            )}
          </section>
        </div>

        {/* Footer actions matching the premium style */}
        <div className="flex-none flex justify-end items-center px-10 py-8 border-t border-slate-100 bg-slate-50/50 gap-4">
          <ITButton
            type="button"
            variant="filled"
            onClick={onCancel}
            color="secondary"
          >
            Cancelar
          </ITButton>

          <ITButton
            type="submit"
            disabled={formik.isSubmitting}
            color="primary"
          >
            {formik.isSubmitting
              ? "Procesando..."
              : isEditing
                ? "Actualizar Información"
                : "Confirmar Registro"}
          </ITButton>
        </div>
      </form>
    </div>
  );
};

interface SummaryItemProps {
  label: string;
  value?: string;
  icon: React.ReactNode;
}

const SummaryItem: React.FC<SummaryItemProps> = ({ label, value, icon }) => (
  <div className="flex flex-col gap-2">
    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
      {label}
    </span>
    <div className="flex items-center gap-3">
      <div className="text-sm">{icon}</div>
      <span className="text-sm font-bold truncate">
        {value || "No especificado"}
      </span>
    </div>
  </div>
);
