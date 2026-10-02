import { ITBadget, ITPage, ITTabs, ITTabItem } from "@axzydev/axzy_ui_system";
import { useCallback, useEffect, useState } from "react";
import {
  FaBuilding,
  FaMapMarkedAlt,
  FaSearchLocation,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { ClientGuardsTab } from "../components/details/ClientGuardsTab";
import { ClientLocationsTab } from "../components/details/ClientLocationsTab";
import { ClientZonesTab } from "../components/details/ClientZonesTab";
import { Zone } from "../../zones/services/ZonesService";
import { Client, getClientById } from "../services/ClientsService";

const ClientDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("locations");
  const [tabKey, setTabKey] = useState(0);

  const handleSelectZone = (zone: Zone) => {
    setSelectedZoneId(zone.id);
    setActiveTab("locations");
    setTabKey((prev) => prev + 1);
  };

  const handleClearZoneSelection = () => {
    setSelectedZoneId(null);
  };

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
      content: (
        <ClientLocationsTab
          clientId={id!}
          selectedZoneId={selectedZoneId}
          onCreateFromZone={handleClearZoneSelection}
        />
      ),
    },
    {
      id: "zones",
      label: "Zonas / Recurrentes",
      icon: <FaMapMarkedAlt />,
      content: <ClientZonesTab clientId={id!} onSelectZone={handleSelectZone} />,
    },
    {
      id: "guards",
      label: "Guardias Asignados",
      icon: <FaUserShield />,
      content: <ClientGuardsTab clientId={id!} />,
    },
  ];

  const breadcrumbs = [
    { label: "Inicio", onClick: () => navigate("/home") },
    { label: "Clientes", onClick: () => navigate("/clients") },
    { label: client?.name ?? "Detalle" },
  ];

  return (
    <ITPage
      noPadding
      loading={loading}
      error={!loading && !client ? "El registro que buscas no existe o fue removido del sistema." : null}
      errorTitle="Cliente no encontrado"
      errorActionLabel="Volver al directorio"
      onRetry={() => navigate("/clients")}
      title={client?.name ?? "Cliente"}
      description={
        client ? `RFC: ${client.rfc || "N/A"} · Contacto: ${client.contactName || "N/A"}` : undefined
      }
      icon={<FaBuilding size={20} />}
      backAction={() => navigate("/clients")}
      breadcrumbs={breadcrumbs}
      actions={
        client ? (
          <ITBadget color={client.active ? "success" : "gray"} size="sm">
            {client.active ? "ACTIVO" : "INACTIVO"}
          </ITBadget>
        ) : undefined
      }
    >
      <ITTabs
        key={tabKey}
        items={tabs}
        variant="line"
        defaultActiveId={activeTab}
        onChange={(tabId) => setActiveTab(tabId)}
      />
    </ITPage>
  );
};

export default ClientDetailsPage;
