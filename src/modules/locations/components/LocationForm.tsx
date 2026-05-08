import { useFormik } from "formik";
import * as Yup from "yup";
import { ITInput, ITButton, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { useEffect, useState } from "react";
import { getZonesByClient, Zone } from "../../zones/services/ZonesService";

interface Props {
  onSubmit: (data: any, keepOpen?: boolean) => void;
  onCancel: () => void;
  initialData?: any;
}

export const LocationForm = ({ onSubmit, onCancel, initialData }: Props) => {
  const { data: clients } = useCatalog("client");
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
      const selectedZone = zones.find(z => String(z.id) === String(values.zoneId));
      const selectedClient = clients?.find((c: any) => String(c.id) === String(values.clientId));
      
      const clientName = selectedClient?.name || 'S/C';
      const zoneName = selectedZone?.name || 'S/Z';
      
      const prefix = `${clientName}-${zoneName}-`;
      let finalName = values.name;
      
      // Ensure it starts with the prefix exactly once
      if (!finalName.startsWith(prefix)) {
        finalName = `${prefix}${finalName}`;
      }

      onSubmit({
          ...values,
          name: finalName,
          clientId: values.clientId,
          zoneId: values.zoneId,
          zoneName: zoneName
      }, isSavingAndNew);

      if (isSavingAndNew) {
        // Keep client and zone, clear name and reference
        resetForm({
          values: {
            ...values,
            name: "",
            reference: ""
          }
        });
      }
    },
  });

  useEffect(() => {
    if (formik.values.clientId) {
        setLoadingZones(true);
        getZonesByClient(String(formik.values.clientId))
            .then(data => setZones(data))
            .finally(() => setLoadingZones(false));
    } else {
        setZones([]);
    }
  }, [formik.values.clientId]);

  return (
    <form onSubmit={formik.handleSubmit} className="flex flex-col gap-4 p-4">
       <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Cliente *</label>
          <ITSearchSelect
            placeholder="Selecciona un cliente"
            options={(clients || []).map((c: any) => ({ label: c.name || c.label, value: c.id }))}
            value={formik.values.clientId}
            onChange={(val) => formik.setFieldValue("clientId", val)}
          />
          {formik.errors.clientId && formik.touched.clientId && (
              <span className="text-[10px] text-red-500 font-bold">{formik.errors.clientId as string}</span>
          )}
      </div>

      <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 mb-1 uppercase tracking-wider text-[10px]">Recurrente (Zona) *</label>
          <select
            name="zoneId"
            value={formik.values.zoneId}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            className={`w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none text-sm transition-all focus:border-emerald-500 ${formik.errors.zoneId && formik.touched.zoneId ? 'border-red-500' : 'border-slate-200'}`}
            disabled={loadingZones || !formik.values.clientId}
          >
              <option value="">{loadingZones ? 'Cargando...' : 'Selecciona un recurrente'}</option>
              {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
              ))}
          </select>
          {formik.errors.zoneId && formik.touched.zoneId && (
              <span className="text-[10px] text-red-500 font-bold">{formik.errors.zoneId as string}</span>
          )}
      </div>

      <ITInput
        label="Nombre Ubicación"
        name="name"
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={() => {}}
        placeholder="Ej: Recepción, Oficina 101"
      />

      <ITInput
        label="Referencia (Opcional)"
        name="reference"
        value={formik.values.reference}
        onChange={formik.handleChange}
        onBlur={() => {}}
        placeholder="Ej: A un lado del elevador"
      />
      
      <div className="flex justify-end gap-2 mt-4">
        <ITButton color="secondary" onClick={onCancel} type="button" variant="outlined">Cancelar</ITButton>
        <ITButton 
          type="submit" 
          onClick={() => setIsSavingAndNew(true)}
          variant="outlined" 
          className="border-emerald-600 text-emerald-600 hover:bg-emerald-50"
        >
          Guardar y Nueva
        </ITButton>
        <ITButton 
          type="submit" 
          onClick={() => setIsSavingAndNew(false)}
          className="bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
        >
          Guardar Ubicación
        </ITButton>
      </div>
    </form>
  );
};
