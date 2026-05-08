import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ModuleHeader } from "@app/core/components/ModuleHeader";
import { ITTabs, ITab } from "@app/core/components/ITTabs";
import { ITButton } from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaMapMarkedAlt,
  FaUserShield,
  FaSearchLocation,
  FaArrowLeft,
} from "react-icons/fa";
import { getClientById, Client } from "../services/ClientsService";
import { ClientLocationsTab } from "../components/details/ClientLocationsTab";
import { ClientZonesTab } from "../components/details/ClientZonesTab";
import { ClientGuardsTab } from "../components/details/ClientGuardsTab";

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [activeTab, setActiveTab] = useState("locations");
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

  const tabs: ITab[] = [
    {
      id: "locations",
      label: "Ubicaciones",
      icon: FaSearchLocation,
      content: <ClientLocationsTab clientId={id!} />,
    },
    {
      id: "zones",
      label: "Zonas / Recurrentes",
      icon: FaMapMarkedAlt,
      content: (
        <ClientZonesTab clientId={id!} />
      ),
    },
    {
      id: "guards",
      label: "Guardias Asignados",
      icon: FaUserShield,
      content: <ClientGuardsTab clientId={id!} />,
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-slate-800">
          Cliente no encontrado
        </h2>
        <ITButton onClick={() => navigate("/clients")} className="mt-4">
          Volver al directorio
        </ITButton>
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      <div className="mb-4">
        <button
          onClick={() => navigate("/clients")}
          className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition-colors font-bold text-sm uppercase tracking-wider"
        >
          <FaArrowLeft size={12} />
          Volver al directorio
        </button>
      </div>

      <ModuleHeader
        title={client.name}
        subtitle={`RFC: ${client.rfc || "Sin RFC"} | Contacto: ${client.contactName || "Sin contacto"}`}
        icon={FaBuilding}
        actions={
          <div className="flex gap-2">
            <div
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest ${client.active ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-50 text-slate-400 border border-slate-200"}`}
            >
              {client.active ? "Cliente Activo" : "Cliente Inactivo"}
            </div>
          </div>
        }
      />

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <ITTabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
      </div>
    </div>
  );
};

export default ClientDetailsPage;
