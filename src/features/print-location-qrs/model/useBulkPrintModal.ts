/**
 * View-model del modal de impresión masiva de QRs.
 */
import { useEffect, useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "@app/core/store/toast/toast.slice";
import { useCatalog } from "@app/core/hooks/catalog.hook";
import { fetchLocationsTable, type Location } from "@entities/location";
import { fetchZonesTable, type Zone } from "@entities/zone";

export interface BulkPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  initialClientId?: string;
}

export const useBulkPrintModal = ({ isOpen, onConfirm, initialClientId }: BulkPrintModalProps) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState<"SEARCH" | "SELECTED">("SEARCH");
  const [clientId, setClientId] = useState(initialClientId || "");
  const [bulkFilterZone, setBulkFilterZone] = useState<string>("");
  const [bulkFilterSearch, setBulkFilterSearch] = useState<string>("");
  const [allZones, setAllZones] = useState<Zone[]>([]);
  const [locationsToChoose, setLocationsToChoose] = useState<Location[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<Location[]>([]);
  const [animateBadge, setAnimateBadge] = useState(false);

  const { data: clients } = useCatalog("client");

  useEffect(() => {
    if (selectedIds.length > 0) {
      setAnimateBadge(true);
      const timer = setTimeout(() => setAnimateBadge(false), 500);
      return () => clearTimeout(timer);
    }
  }, [selectedIds.length]);

  const fetchBulkLocations = useCallback(async () => {
    const res = await fetchLocationsTable({
      page: 1,
      limit: 1000,
      // `undefined` no es un `ColumnFilterValue` válido: se omite la clave.
      filters: {
        ...(bulkFilterSearch ? { name: bulkFilterSearch } : {}),
        ...(bulkFilterZone ? { zoneId: bulkFilterZone } : {}),
        ...(clientId ? { clientId } : {}),
      },
    });
    if (res.data) {
      setLocationsToChoose(res.data);
    }
  }, [bulkFilterSearch, bulkFilterZone, clientId]);

  useEffect(() => {
    if (isOpen) {
      void fetchZonesTable({ page: 1, limit: 1000, filters: {} }).then((res) => {
        setAllZones(res.data ?? []);
      });
      fetchBulkLocations();
    }
  }, [isOpen, fetchBulkLocations]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(fetchBulkLocations, 300);
      return () => clearTimeout(timer);
    }
  }, [bulkFilterSearch, bulkFilterZone, isOpen, fetchBulkLocations]);

  const handleConfirm = () => {
    if (selectedIds.length === 0) {
      dispatch(
        showToast({
          message: "Selecciona al menos una ubicación",
          type: "warning",
        }),
      );
      return;
    }
    onConfirm(selectedIds);
  };


  return {
    activeTab, setActiveTab, clients, clientId, setClientId,
    bulkFilterZone, setBulkFilterZone, bulkFilterSearch, setBulkFilterSearch,
    allZones, locationsToChoose, selectedIds, setSelectedIds,
    selectedLocations, setSelectedLocations, animateBadge, fetchBulkLocations, handleConfirm,
  };
};

export type BulkPrintModalViewModel = ReturnType<typeof useBulkPrintModal>;
