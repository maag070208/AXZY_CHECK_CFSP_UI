import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput, ITSelect } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState, useMemo, useEffect } from "react";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { createUser, updateUser, User } from "../services/UserService";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { getSchedules, Schedule } from "../../schedules/SchedulesService";
import {
  FaCheck,
  FaUser,
  FaShieldAlt,
  FaClipboardCheck,
  FaClock,
  FaIdCard,
  FaLock,
} from "react-icons/fa";

interface Props {
  userToEdit?: User;
  onCancel: () => void;
  onSuccess: () => void;
}

export const CreateUserWizard: React.FC<Props> = ({
  userToEdit,
  onCancel,
  onSuccess,
}) => {
  const isEditing = !!userToEdit;
  const dispatch = useDispatch();
  const [currentStep, setCurrentStep] = useState(0);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const { data: roles } = useCatalog("role");
  const { data: clients } = useCatalog("client");

  useEffect(() => {
    getSchedules().then(setSchedules);
  }, []);

  const roleOptions = useMemo(
    () => roles.map((r) => ({ label: r.value, value: String(r.id) })),
    [roles],
  );
  const formik = useFormik({
    initialValues: {
      name: userToEdit?.name || "",
      lastName: userToEdit?.lastName || "",
      username: userToEdit?.username || "",
      password: "",
      confirmPassword: "",
      roleId: userToEdit?.roleId ? String(userToEdit.roleId) : "",
      scheduleId: userToEdit?.scheduleId ? String(userToEdit.scheduleId) : "",
      clientId: userToEdit?.clientId ? String(userToEdit.clientId) : "",
      active: userToEdit ? userToEdit.active : true,
    },
    validationSchema: Yup.object({
      name: Yup.string().required("Requerido"),
      lastName: Yup.string().required("Requerido"),
      username: Yup.string().required("Requerido"),
      password: isEditing
        ? Yup.string()
        : Yup.string().min(6, "Mínimo 6").required("Requerido"),
      confirmPassword: isEditing
        ? Yup.string()
        : Yup.string()
            .oneOf([Yup.ref("password")], "No coinciden")
            .required("Requerido"),
      roleId: Yup.string().required("Selecciona un rol"),
      scheduleId: Yup.string().when("roleId", {
        is: () => isOperationalRole,
        then: () => Yup.string().required("Horario obligatorio"),
      }),
      clientId: Yup.string().when("roleId", {
        is: () => isOperationalRole,
        then: () => Yup.string().required("Cliente obligatorio"),
      }),
    }),
    onSubmit: async (values) => {
      try {
        const payload = {
          ...values,
          scheduleId: values.scheduleId || undefined,
          clientId: values.clientId || undefined,
        };
        const res =
          isEditing && userToEdit
            ? await updateUser(userToEdit.id, payload)
            : await createUser(payload);

        if (res.success) {
          dispatch(
            showToast({
              message: `Usuario ${isEditing ? "editado" : "creado"} con éxito`,
              type: "success",
            }),
          );
          onSuccess();
        } else {
          dispatch(
            showToast({ message: res.messages?.[0] || "Error", type: "error" }),
          );
        }
      } catch (error: any) {
        dispatch(
          showToast({
            message: error?.messages?.[0] || "Error inesperado",
            type: "error",
          }),
        );
      }
    },
  });
  const isOperationalRole = useMemo(() => {
    const selectedRole = roles.find(
      (r) => String(r.id) === String(formik.values.roleId),
    );
    return ["GUARD", "SHIFT", "MAINT"].includes(selectedRole?.name || "");
  }, [roles, formik.values.roleId]);

  const steps = [
    {
      label: "Identidad",
      icon: <FaUser />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <ITInput
              label="Nombre(s)"
              name="name"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={() => {}}
              error={formik.errors.name}
              touched={formik.touched.name}
              placeholder="Ej. Roberto"
            />
            <ITInput
              label="Apellidos"
              name="lastName"
              value={formik.values.lastName}
              onChange={formik.handleChange}
              error={formik.errors.lastName}
              onBlur={() => {}}
              touched={formik.touched.lastName}
              placeholder="Ej. García"
            />
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white rounded-lg border border-slate-100 shadow-sm text-slate-400">
                <FaIdCard size={14} />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Identificador del Sistema
              </span>
            </div>
            <ITInput
              label="Nombre de Usuario"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={() => {}}
              error={formik.errors.username}
              touched={formik.touched.username}
              placeholder="Ej. rgarcia"
              className="!bg-white"
            />
            <p className="text-[10px] text-slate-400 mt-2 ml-1 italic">
              Este nombre será el login oficial para la plataforma.
            </p>
          </div>
        </div>
      ),
    },
    {
      label: "Acceso y Seguridad",
      icon: <FaShieldAlt />,
      content: (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
            <ITSelect
              label="Rol de Usuario"
              name="roleId"
              value={formik.values.roleId}
              onChange={formik.handleChange}
              options={roleOptions}
              error={formik.errors.roleId}
              touched={formik.touched.roleId}
            />

            {!isEditing && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <ITInput
                  label="Contraseña"
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={() => {}}
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  placeholder="••••••"
                />
                <ITInput
                  label="Confirmar"
                  name="confirmPassword"
                  type="password"
                  value={formik.values.confirmPassword}
                  onChange={formik.handleChange}
                  error={formik.errors.confirmPassword}
                  onBlur={() => {}}
                  touched={formik.touched.confirmPassword}
                  placeholder="••••••"
                />
              </div>
            )}
          </div>

          {isOperationalRole && (
            <div className="bg-emerald-50/40 p-5 rounded-2xl border border-emerald-100 space-y-5">
              <h4 className="text-[10px] font-black text-emerald-700 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{" "}
                Asignación Operativa
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ITSelect
                  label="Horario Laboral"
                  name="scheduleId"
                  value={formik.values.scheduleId}
                  onChange={formik.handleChange}
                  options={schedules.map((s) => ({
                    label: `${s.name}`,
                    value: String(s.id),
                  }))}
                  error={formik.errors.scheduleId}
                  touched={formik.touched.scheduleId}
                />
                <ITSelect
                  label="Cliente"
                  name="clientId"
                  value={formik.values.clientId}
                  onChange={formik.handleChange}
                  options={clients.map((c) => ({
                    label: c.name,
                    value: String(c.id),
                  }))}
                  error={formik.errors.clientId}
                  touched={formik.touched.clientId}
                />
              </div>
            </div>
          )}

          {isEditing && (
            <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                name="active"
                checked={formik.values.active}
                onChange={formik.handleChange}
                className="w-5 h-5 accent-emerald-600 rounded-lg"
              />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-700">
                  Usuario habilitado
                </span>
                <span className="text-[10px] text-slate-400">
                  Permitir el acceso a la aplicación
                </span>
              </div>
            </label>
          )}
        </div>
      ),
    },
    {
      label: "Confirmación",
      icon: <FaClipboardCheck />,
      content: (
        <div className="animate-in zoom-in-95 duration-300">
          <div className="bg-slate-900 rounded-3xl p-6 text-white relative overflow-hidden shadow-2xl">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center text-xl font-black">
                {formik.values.name.charAt(0)}
                {formik.values.lastName.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  {formik.values.name} {formik.values.lastName}
                </h3>
                <p className="text-emerald-400 text-xs font-medium">
                  @{formik.values.username}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-y-6 gap-x-4 border-t border-white/10 pt-6">
              <SummaryItem
                label="Rol Asignado"
                value={
                  roles.find((r) => String(r.id) === formik.values.roleId)
                    ?.value
                }
                icon={<FaShieldAlt className="text-emerald-400" />}
              />
              {isOperationalRole && (
                <>
                  <SummaryItem
                    label="Turno"
                    value={
                      schedules.find(
                        (s) => String(s.id) === formik.values.scheduleId,
                      )?.name
                    }
                    icon={<FaClock className="text-emerald-400" />}
                  />
                  <SummaryItem
                    label="Cliente"
                    value={
                      clients.find(
                        (c) => String(c.id) === formik.values.clientId,
                      )?.name
                    }
                    icon={<FaUser className="text-emerald-400" />}
                  />
                </>
              )}
              <SummaryItem
                label="Estado"
                value={formik.values.active ? "Activo" : "Inactivo"}
                icon={
                  <div
                    className={`w-2 h-2 rounded-full ${formik.values.active ? "bg-emerald-400" : "bg-red-400"}`}
                  />
                }
              />
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-6 font-medium">
            Verifica que los datos sean correctos antes de procesar el registro.
          </p>
        </div>
      ),
    },
  ];

  const handleNext = async () => {
    const errors = await formik.validateForm();
    const currentFields =
      currentStep === 0
        ? ["name", "lastName", "username"]
        : ["roleId", "password", "confirmPassword", "scheduleId", "clientId"];
    const hasErrors = currentFields.some((f) => (errors as any)[f]);

    if (hasErrors) {
      const touched = currentFields.reduce(
        (acc, f) => ({ ...acc, [f]: true }),
        {},
      );
      formik.setTouched({ ...formik.touched, ...touched });
      dispatch(
        showToast({
          message: "Completa los campos obligatorios",
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
    <div className="w-full max-w-2xl mx-auto py-4">
      {/* Progress Stepper */}
      <div className="flex justify-between px-8 mb-12 relative">
        <div className="absolute top-5 left-12 right-12 h-[2px] bg-slate-100 -z-0" />
        <div
          className="absolute top-5 left-12 h-[2px] bg-emerald-500 transition-all duration-500 ease-out -z-0"
          style={{ width: `${(currentStep / (steps.length - 1)) * 80}%` }}
        />

        {steps.map((step, index) => (
          <div key={index} className="flex flex-col items-center relative z-10">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                index <= currentStep
                  ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100"
                  : "bg-white border-slate-200 text-slate-400"
              }`}
            >
              {index < currentStep ? <FaCheck size={12} /> : index + 1}
            </div>
            <span
              className={`absolute -bottom-7 text-[9px] font-black uppercase tracking-tighter w-max ${index === currentStep ? "text-emerald-600" : "text-slate-300"}`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="px-6 py-4 min-h-[380px]">
        {steps[currentStep].content}
      </div>

      <div className="flex justify-between items-center px-6 pt-8 mt-4 border-t border-slate-100">
        <ITButton
          type="button"
          variant="ghost"
          onClick={
            currentStep === 0
              ? onCancel
              : () => setCurrentStep((prev) => prev - 1)
          }
          className="!text-slate-400 !px-0"
        >
          {currentStep === 0 ? "Cancelar" : "Volver atrás"}
        </ITButton>
        <ITButton
          type="button"
          onClick={handleNext}
          disabled={formik.isSubmitting}
          className="!bg-slate-900 !rounded-xl !px-10 shadow-xl shadow-slate-200"
        >
          {currentStep === steps.length - 1
            ? formik.isSubmitting
              ? "Procesando..."
              : "Confirmar"
            : "Continuar"}
        </ITButton>
      </div>
    </div>
  );
};

const SummaryItem = ({ label, value, icon }: any) => (
  <div className="flex flex-col gap-1.5">
    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">
      {label}
    </span>
    <div className="flex items-center gap-2">
      {icon}
      <span className="text-sm font-semibold truncate">
        {value || "No definido"}
      </span>
    </div>
  </div>
);
