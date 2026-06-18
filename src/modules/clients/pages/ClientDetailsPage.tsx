import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { ITButton, ITTabs, ITTabItem } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaArrowLeft,
  FaBuilding,
  FaMapMarkedAlt,
  FaSearchLocation,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { ClientGuardsTab } from "../components/details/ClientGuardsTab";
import { ClientLocationsTab } from "../components/details/ClientLocationsTab";
import { ClientZonesTab } from "../components/details/ClientZonesTab";
import { Client, getClientById } from "../services/ClientsService";

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await getClientById(id);
      if (res.success) {
        setClient(res.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const tabs: ITTabItem[] = [
    {
      id: "locations",
      label: "Ubicaciones",
      icon: <FaSearchLocation />,
      content: <ClientLocationsTab clientId={id!} />,
    },
    {
      id: "zones",
      label: "Zonas / Recurrentes",
      icon: <FaMapMarkedAlt />,
      content: <ClientZonesTab clientId={id!} />,
    },
    {
      id: "guards",
      label: "Guardias Asignados",
      icon: <FaUserShield />,
      content: <ClientGuardsTab clientId={id!} />,
    },
  ];

  if (loading) {
    return (
      <div className="p-8 min-h-screen">
        <div className="animate-pulse space-y-8">
          <div className="h-4 w-32 bg-slate-200 rounded-full" />
          <div className="flex justify-between items-end">
            <div className="space-y-3">
              <div className="h-10 w-64 bg-slate-200 rounded-2xl" />
              <div className="h-4 w-96 bg-slate-200 rounded-full" />
            </div>
            <div className="h-10 w-32 bg-slate-200 rounded-2xl" />
          </div>
          <div className="h-[500px] w-full bg-slate-100 rounded-[40px] border border-slate-200/50" />
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="text-center space-y-6 max-w-sm">
          <div className="w-20 h-20 bg-red-50 text-red-500 rounded-[30px] flex items-center justify-center mx-auto shadow-inner">
            <FaBuilding size={32} />
          </div>
          <div>
            <p className="text-2xl font-medium text-slate-800">
              Cliente Extraviado
            </p>
            <p className="text-xs text-slate-400 font-light mt-2">
              El registro que buscas no existe o ha sido removido del sistema.
            </p>
          </div>
          <ITButton
            onClick={() => navigate("/clients")}
            variant="primary"
            size="large"
          >
            Volver al Directorio
          </ITButton>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <ITButton
          variant="ghost"
          size="small"
          onClick={() => navigate("/clients")}
          className="px-5 whitespace-nowrap shadow shadow-slate-100"
        >
          <div className="flex items-center gap-1">
            <FaArrowLeft size={14} />
            <span className="text-[10px]">Directorio Principal</span>
          </div>
        </ITButton>
      </div>

      <ModuleHeader
        title={client.name}
        subtitle={`RFC: ${client.rfc || "N/A"} - CONTACTO: ${client.contactName?.toUpperCase() || "N/A"}`}
        icon={FaBuilding}
        actions={
          <div
            className={`px-4 py-1.5 rounded-full text-[10px] font-medium tracking-wide border shadow-sm ${
              client.active
                ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                : "bg-slate-100 text-slate-400 border-slate-200"
            }`}
          >
            {client.active ? "ACTIVO" : "INACTIVO"}
          </div>
        }
      />

      <ITTabs items={tabs} variant="line" defaultActiveId="locations" />
    </div>
  );
};

export default ClientDetailsPage;
