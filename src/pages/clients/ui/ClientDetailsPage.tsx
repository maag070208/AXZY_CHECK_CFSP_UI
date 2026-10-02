import { ITBadget, ITPage, ITTabs, ITTabItem } from "@axzydev/axzy_ui_system";
import {
  FaBuilding,
  FaMapMarkedAlt,
  FaSearchLocation,
  FaUserShield,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { ClientGuardsTab } from "./ClientGuardsTab";
import { ClientLocationsTab } from "./ClientLocationsTab";
import { ClientZonesTab } from "./ClientZonesTab";
import { useClientDetailsPage } from "../model/useClientDetailsPage";

const ClientDetailsPage = () => {
  const navigate = useNavigate();
  const {
    id,
    client,
    loading,
    selectedZoneId,
    activeTab,
    setActiveTab,
    tabKey,
    handleSelectZone,
    handleClearZoneSelection,
  } = useClientDetailsPage();

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
