import { showToast } from "@app/core/store/toast/toast.slice";
import { ITButton, ITInput } from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import React, { useState } from "react";
import { FaUserShield } from "react-icons/fa";
import { useDispatch } from "react-redux";
import * as Yup from "yup";
import { Client, createClient, updateClient } from "../services/ClientsService";

interface Props {
    clientToEdit?: Client;
    onCancel: () => void;
    onSuccess: () => void;
}

export const CreateClientWizard = ({ clientToEdit, onCancel, onSuccess }: Props) => {
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(false);

    const formik = useFormik({
        initialValues: {
            name: clientToEdit?.name || "",
            address: clientToEdit?.address || "",
            rfc: clientToEdit?.rfc || "",
            contactName: clientToEdit?.contactName || "",
            contactPhone: clientToEdit?.contactPhone || "",
            active: clientToEdit ? clientToEdit.active : true,
            appUsername: clientToEdit?.users?.[0]?.username || "",
            appPassword: "",
        },
        validationSchema: Yup.object({
            name: Yup.string().max(100, "Nombre demasiado largo").required("El nombre es requerido"),
            address: Yup.string().optional(),
            rfc: Yup.string()
                .min(12, "El RFC debe tener al menos 12 caracteres")
                .max(13, "El RFC no puede tener más de 13 caracteres")
                .optional(),
            contactName: Yup.string().optional(),
            contactPhone: Yup.string()
                .matches(/^[0-9]*$/, "El teléfono solo debe contener números")
                .max(10, "El teléfono debe tener máximo 10 dígitos")
                .optional(),
            active: Yup.boolean().required(),
            appUsername: Yup.string().min(4, "Mínimo 4 caracteres").optional(),
            appPassword: Yup.string().min(6, "Mínimo 6 caracteres").optional(),
        }),
        onSubmit: async (values) => {
            setLoading(true);
            try {
                if (clientToEdit) {
                    await updateClient(clientToEdit.id, values);
                    dispatch(showToast({ message: "Cliente actualizado", type: "success" }));
                } else {
                    await createClient(values);
                    dispatch(showToast({ message: "Cliente creado", type: "success" }));
                }
                onSuccess();
            } catch (error: any) {
                dispatch(showToast({ message: error.messages?.[0] || "Error al guardar cliente", type: "error" }));
            } finally {
                setLoading(false);
            }
        },
    });

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.replace(/[^0-9]/g, '');
        if (val.length <= 10) {
            formik.setFieldValue("contactPhone", val);
        }
    };

    const handleRFCChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value.toUpperCase();
        if (val.length <= 13) {
            formik.setFieldValue("rfc", val);
        }
    };

    return (
        <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
                <div className="md:col-span-2">
                    <ITInput
                        label="Nombre del Cliente *"
                        name="name"
                        value={formik.values.name}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.name}
                        touched={formik.touched.name}
                        placeholder="Ej. Condominio Las Palmas"
                        maxLength={100}
                    />
                </div>
                
                <div className="md:col-span-2">
                    <ITInput
                        label="Lugar / Dirección"
                        name="address"
                        value={formik.values.address}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.address}
                        touched={formik.touched.address}
                        placeholder="Dirección completa"
                    />
                </div>

                <div>
                    <ITInput
                        label="RFC"
                        name="rfc"
                        value={formik.values.rfc}
                        onChange={handleRFCChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.rfc}
                        touched={formik.touched.rfc}
                        placeholder="12 o 13 caracteres"
                        maxLength={13}
                    />
                </div>

                <div>
                    <ITInput
                        label="Nombre Encargado"
                        name="contactName"
                        value={formik.values.contactName}
                        onChange={formik.handleChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.contactName}
                        touched={formik.touched.contactName}
                        placeholder="Nombre completo"
                    />
                </div>

                <div>
                    <ITInput
                        label="Teléfono Encargado"
                        name="contactPhone"
                        value={formik.values.contactPhone}
                        onChange={handlePhoneChange}
                        onBlur={formik.handleBlur}
                        error={formik.errors.contactPhone}
                        touched={formik.touched.contactPhone}
                        placeholder="10 dígitos"
                        maxLength={10}
                    />
                </div>

                <div className="flex items-center gap-2 pt-6">
                    <input
                        type="checkbox"
                        name="active"
                        checked={formik.values.active}
                        onChange={formik.handleChange}
                        id="active"
                        className="w-5 h-5 text-emerald-600 border-slate-300 rounded-lg focus:ring-emerald-500 cursor-pointer"
                    />
                    <label htmlFor="active" className="text-sm font-bold text-slate-700 cursor-pointer uppercase tracking-wider text-[10px]">Cliente Activo</label>
                </div>

                <div className="md:col-span-2 mt-4 pt-6 border-t border-slate-100">
                    <div className="flex items-center gap-2 mb-4">
                        <FaUserShield className="text-emerald-500" />
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Credenciales para la App</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <ITInput
                            label="Nombre de Usuario"
                            name="appUsername"
                            value={formik.values.appUsername}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.appUsername}
                            touched={formik.touched.appUsername}
                            placeholder="Ej. plaza2000_app"
                            className="!bg-white"
                        />
                        <ITInput
                            label="Contraseña"
                            name="appPassword"
                            type="password"
                            value={formik.values.appPassword}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.errors.appPassword}
                            touched={formik.touched.appPassword}
                            placeholder={clientToEdit ? "Dejar en blanco para no cambiar" : "Mínimo 6 caracteres"}
                            className="!bg-white"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
                <ITButton variant="outlined" onClick={onCancel} disabled={loading} className="!rounded-xl px-6">
                    Cancelar
                </ITButton>
                <ITButton className="bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 !rounded-xl px-8 shadow-lg shadow-emerald-100" onClick={() => formik.handleSubmit()} disabled={loading}>
                    {loading ? "Guardando..." : "Guardar Cliente"}
                </ITButton>
            </div>
        </div>
    );
};
