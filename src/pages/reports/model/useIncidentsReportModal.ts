/**
 * View-model del modal de reporte de incidencias.
 */
import dayjs from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { getIncidentReport, type IIncidentReport } from "@entities/report";

export interface UseIncidentsReportModalOptions {
  isOpen: boolean;
  initialClientId?: string;
}

export const useIncidentsReportModal = ({ isOpen, initialClientId }: UseIncidentsReportModalOptions) => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    dayjs().startOf("month").toDate(),
    dayjs().toDate(),
  ]);
  const [data, setData] = useState<IIncidentReport | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    if (!dateRange[0] || !dateRange[1]) return;
    setLoading(true);

    const res = await getIncidentReport({
      startDate: dayjs(dateRange[0]).format("YYYY-MM-DD"),
      endDate: dayjs(dateRange[1]).format("YYYY-MM-DD"),
      clientId: initialClientId,
    });

    setData(res.success && res.data ? res.data : null);
    setLoading(false);
  }, [dateRange, initialClientId]);

  useEffect(() => {
    if (isOpen) void fetchReport();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  return { dateRange, setDateRange, data, loading, fetchReport };
};

export type IncidentsReportModalViewModel = ReturnType<typeof useIncidentsReportModal>;
