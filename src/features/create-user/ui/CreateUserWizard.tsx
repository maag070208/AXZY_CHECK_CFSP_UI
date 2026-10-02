import {
  ITButton,
  ITInput,
  ITSelect,
  ITSlideToggle,
  ITText,
} from "@axzydev/axzy_ui_system";
import React from "react";
import { FaShieldAlt } from "react-icons/fa";
import type { User } from "@entities/user";
import { useCreateUserForm } from "../model/useCreateUserForm";

interface Props {
  userToEdit?: User;
  onCancel: () => void;
  onSuccess: () => void;
}

/**
 * Vista del formulario de usuario. Toda la lógica (catálogos, validación y
 * envío) vive en `useCreateUserForm`.
 */
export const CreateUserWizard: React.FC<Props> = ({
  userToEdit,
  onCancel,
  onSuccess,
}) => {
  const {
    isEditing,
    formik,
    roleOptions,
    clients,
    schedules,
    loadingRoles,
    loadingClients,
    loadingSchedules,
    isOperationalRole,
  } = useCreateUserForm({ userToEdit, onSuccess });


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
                    <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
                    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      Detalles del Perfil
                    </ITText>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ITInput
                            label="Nombre(s)"
                            name="name"
                            value={formik.values.name}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.name}
                            touched={formik.touched.name}
                            placeholder="Ej. Juan"
                    />
                    <ITInput
                            label="Apellido(s)"
                            name="lastName"
                            value={formik.values.lastName}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.lastName}
                            touched={formik.touched.lastName}
                            placeholder="Ej. Pérez"
                    />
                  </div>
                </section>

                {/* SECTION 2: ACCESS CREDENTIALS */}
                <section>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1.5 h-4 bg-sky-500 rounded-full" />
                    <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                      Credenciales de Acceso
                    </ITText>
                  </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                  label="Nombre de Usuario"
                  name="username"
                  value={formik.values.username}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.username}
                  touched={formik.touched.username}
                  placeholder="Ej. rgarcia"
                />
                <ITSelect
                  label="Rol de Usuario"
                  name="roleId"
                  value={formik.values.roleId}
                  onChange={formik.handleChange}
                  options={roleOptions}
                  error={formik.errors.roleId}
                  touched={formik.touched.roleId}
                  placeholder={
                    loadingRoles ? "Cargando roles..." : "Seleccionar rol..."
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ITInput
                  label={
                    isEditing ? "Cambiar Contraseña (Opcional)" : "Contraseña"
                  }
                  name="password"
                  type="password"
                  value={formik.values.password}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.password}
                  touched={formik.touched.password}
                  placeholder="••••••"
                  iconLeft={<FaShieldAlt className="text-slate-300" />}
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
                  placeholder="••••••"
                />
              </div>
            </div>
          </section>

          {/* SECTION 3: OPERATIONAL ASSIGNMENT */}
          {isOperationalRole(formik.values.roleId) && (
            <section className="animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                <ITText className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] block">
                  Asignación Operativa
                </ITText>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  placeholder={
                    loadingSchedules
                      ? "Cargando horarios..."
                      : "Seleccionar horario..."
                  }
                />
                <ITSelect
                  label="Cliente Asignado"
                  name="clientId"
                  value={formik.values.clientId}
                  onChange={formik.handleChange}
                  options={clients.map((c) => ({
                    label: c.name,
                    value: String(c.id),
                  }))}
                  error={formik.errors.clientId}
                  touched={formik.touched.clientId}
                  placeholder={
                    loadingClients
                      ? "Cargando clientes..."
                      : "Seleccionar cliente..."
                  }
                />
              </div>
            </section>
          )}

          {/* SECTION 4: STATUS (ONLY IF EDITING) */}
          {isEditing && (
            <section>
              <div className="mt-8 flex items-center justify-between p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                <div>
                  <ITText className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
                    Estado del usuario
                  </ITText>
                  <ITText className="text-[10px] text-slate-400 font-medium mt-0.5 block">
                    Habilitar o restringir acceso al sistema
                  </ITText>
                </div>
                <ITSlideToggle
                  isOn={formik.values.active}
                  onToggle={(val) => formik.setFieldValue("active", val)}
                />
              </div>
            </section>
          )}
        </div>

        {/* Footer Actions */}
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
                ? "Actualizar Usuario"
                : "Registrar Usuario"}
          </ITButton>
        </div>
      </form>
    </div>
  );
};
