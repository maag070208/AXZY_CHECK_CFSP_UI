/**
 * View-model del detalle de cliente.
 *
 * La vista queda como puro render: antes llamaba a `getClientById` y guardaba
 * el cliente, la carga y la pestaña activa.
 */
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getClientById, type Client } from "@entities/client";

/** Zona seleccionada desde la pestaña de zonas, para saltar a ubicaciones. */
export interface ClientZoneSelection {
  id: string;
}

export const useClientDetailsPage = () => {
  const { id } = useParams();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("locations");
  const [tabKey, setTabKey] = useState(0);

  const fetchClient = useCallback(async () => {
    if (!id) return;
    setLoading(true);

    const res = await getClientById(id);

    if (res.success && res.data) setClient(res.data);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    void fetchClient();
  }, [fetchClient]);

  const handleSelectZone = useCallback((zone: ClientZoneSelection) => {
    setSelectedZoneId(zone.id);
    setActiveTab("locations");
    setTabKey((prev) => prev + 1);
  }, []);

  const handleClearZoneSelection = useCallback(() => setSelectedZoneId(null), []);

  return {
    id,
    client,
    loading,
    selectedZoneId,
    activeTab,
    setActiveTab,
    tabKey,
    handleSelectZone,
    handleClearZoneSelection,
  };
};

export type ClientDetailsViewModel = ReturnType<typeof useClientDetailsPage>;
