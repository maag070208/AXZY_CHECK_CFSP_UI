import { useCatalog } from "@app/core/hooks/catalog.hook";
import {
  ITButton,
  ITInput,
  ITSearchSelect,
  ITSelect,
} from "@axzydev/axzy_ui_system";
import { useFormik } from "formik";
import { useEffect, useState } from "react";
import * as Yup from "yup";
import { getZonesByClient, Zone } from "../../zones/services/ZonesService";

interface Props {
  onSubmit: (data: any, keepOpen?: boolean) => void;
  onCancel: () => void;
  initialData?: any;
}

export const LocationForm = ({ onSubmit, onCancel, initialData }: Props) => {
  const { data: clients, loading: loadingClients } = useCatalog("client");
  const [zones, setZones] = useState<Zone[]>([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [isSavingAndNew, setIsSavingAndNew] = useState(false);

  const formik = useFormik({
    initialValues: {
      clientId: initialData?.clientId || "",
      zoneId: initialData?.zoneId || "",
      name: initialData?.name || "",
      reference: initialData?.reference || "",
    },
    validationSchema: Yup.object({
      clientId: Yup.string().required("El cliente es requerido"),
      zoneId: Yup.string().required("El recurrente es requerido"),
      name: Yup.string().required("El nombre de ubicación es requerido"),
      reference: Yup.string().optional(),
    }),
    onSubmit: (values, { resetForm }) => {
      const selectedZone = zones.find(
        (z) => String(z.id) === String(values.zoneId),
      );
      const selectedClient = clients?.find(
        (c: any) => String(c.id) === String(values.clientId),
      );

      const clientName = selectedClient?.name || "S/C";
      const zoneName = selectedZone?.name || "S/Z";

      const prefix = `${clientName}-${zoneName}-`;
      let finalName = values.name;

      if (!finalName.startsWith(prefix)) {
        finalName = `${prefix}${finalName}`;
      }

      onSubmit(
        {
          ...values,
          name: finalName,
          clientId: values.clientId,
          zoneId: values.zoneId,
          zoneName: zoneName,
        },
        isSavingAndNew,
      );

      if (isSavingAndNew) {
        resetForm({
          values: {
            ...values,
            name: "",
            reference: "",
          },
        });
      }
    },
  });

  useEffect(() => {
    if (formik.values.clientId) {
      setLoadingZones(true);
      getZonesByClient(String(formik.values.clientId))
        .then((data) => setZones(data))
        .finally(() => setLoadingZones(false));
    } else {
      setZones([]);
    }
  }, [formik.values.clientId]);

  return (
    <div className="flex flex-col bg-white overflow-hidden">
      <form onSubmit={formik.handleSubmit} className="flex flex-col h-full">
        <div className="p-10 space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-1.5 h-4 bg-emerald-500 rounded-full" />
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Configuración de Ubicación
              </h4>
            </div>

            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ITSearchSelect
                  label="Cliente Responsable"
                  placeholder={
                    loadingClients
                      ? "Cargando clientes..."
                      : "Seleccionar cliente..."
                  }
                  options={(clients || []).map((c: any) => ({
                    label: c.name || c.label,
                    value: c.id,
                  }))}
                  value={formik.values.clientId}
                  onChange={(val) => formik.setFieldValue("clientId", val)}
                  error={formik.errors.clientId as string}
                  touched={!!formik.touched.clientId}
                />

                <ITSelect
                  label="Recurrente (Zona)"
                  name="zoneId"
                  value={formik.values.zoneId}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.errors.zoneId as string}
                  touched={!!formik.touched.zoneId}
                  placeholder={
                    loadingZones ? "Cargando..." : "Seleccionar zona"
                  }
                  options={zones.map((z) => ({ label: z.name, value: z.id }))}
                  disabled={loadingZones || !formik.values.clientId}
                />
              </div>

              <ITInput
                label="Nombre de la Ubicación"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.errors.name as string}
                touched={!!formik.touched.name}
                placeholder="Ej: Recepción, Oficina 101"
              />
            </div>
          </section>
        </div>

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
            onClick={() => setIsSavingAndNew(true)}
            variant="filled"
            color="warning"
          >
            Guardar y Nueva
          </ITButton>
          <ITButton
            type="submit"
            onClick={() => setIsSavingAndNew(false)}
            color="primary"
          >
            Registrar Punto
          </ITButton>
        </div>
      </form>
    </div>
  );
};
