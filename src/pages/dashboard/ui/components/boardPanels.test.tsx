import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { IAgendaItem, IAgendaSummary, IAttendanceReport, ILiveAlert, IPendingCounts } from "@entities/supervision";
import { renderWithProviders } from "../../../../app/testing/renderWithProviders";
import "@testing-library/jest-dom";
import { AttendancePanel } from "./AttendancePanel";
import { CompliancePanel } from "./CompliancePanel";
import { LiveAlertsPanel } from "./LiveAlertsPanel";
import { PendingCountsPanel } from "./PendingCountsPanel";
import { StatusStrip } from "./StatusStrip";

const summary = (done: number, total: number, percent: number): IAgendaSummary => ({
  total,
  done,
  inWindow: 0,
  overdue: total - done,
  missed: 0,
  upcoming: 0,
  compliancePercent: percent,
});

const pendingItem: IAgendaItem = {
  id: "agenda-1",
  type: "HANDOVER",
  status: "OVERDUE",
  shiftDate: "2026-10-04",
  startAt: "2026-10-04T06:00:00.000Z",
  dueAt: "2026-10-04T06:30:00.000Z",
  endAt: "2026-10-04T14:00:00.000Z",
  planId: "plan-1",
  client: { id: "client-1", name: "Hotel Puerto Nuevo" },
  schedule: { id: "sched-1", name: "Matutino", startTime: "06:00", endTime: "14:00" },
  guard: { id: "guard-1", name: "Ana", lastName: "Ríos" },
  record: null,
};

const alert = (over: Partial<ILiveAlert>): ILiveAlert => ({
  id: "alert-1",
  type: "INCIDENT_OPEN",
  severity: "medium",
  title: "Incidencia sin atender",
  detail: null,
  clientName: "Hotel Puerto Nuevo",
  at: new Date().toISOString(),
  refId: null,
  ...over,
});

describe("Tablero de monitoreo", () => {
  it("la banda de estado muestra las métricas y navega al hacer click", async () => {
    const onClick = vi.fn();
    renderWithProviders(
      <StatusStrip
        items={[
          { label: "Rondas activas", value: 0, note: "sin pendientes" },
          { label: "Incidencias abiertas", value: 3, note: "por atender", onClick },
        ]}
      />,
    );

    expect(screen.getByText("Rondas activas")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();

    screen.getByRole("button", { name: /Incidencias abiertas/ }).click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("el cumplimiento muestra porcentajes y pendientes del turno", () => {
    renderWithProviders(
      <CompliancePanel
        canRegister={false}
        compliance={{
          handover: summary(3, 4, 75),
          uniform: summary(1, 4, 25),
          pending: [pendingItem],
        }}
      />,
    );

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
    expect(screen.getByText(/Entrega · Matutino/)).toBeInTheDocument();
    expect(screen.getByText("Vencido")).toBeInTheDocument();
  });

  it("las alertas listan lo crítico y respetan el estado vacío", () => {
    const { unmount } = renderWithProviders(
      <LiveAlertsPanel alerts={[alert({ id: "a1" }), alert({ id: "a2", severity: "critical", type: "PANIC", title: "Botón de pánico" })]} />,
    );

    expect(screen.getByText("Botón de pánico")).toBeInTheDocument();
    expect(screen.getByText("Incidencia sin atender")).toBeInTheDocument();
    unmount();

    renderWithProviders(<LiveAlertsPanel alerts={[]} />);
    expect(screen.getByText(/Todo en orden/)).toBeInTheDocument();
  });

  it("los pendientes muestran los conteos accionables", () => {
    const counts: IPendingCounts = { incidents: 4, maintenances: 2, disciplines: 1, activeRounds: 3, panicAlerts: 1 };
    renderWithProviders(<PendingCountsPanel counts={counts} />);

    expect(screen.getByText(/Incidencias abiertas/)).toBeInTheDocument();
    expect(screen.getByText("Pánico sin atender")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("la asistencia marca faltas y retardos del día", () => {
    const report: IAttendanceReport = {
      generatedAt: new Date().toISOString(),
      shiftDate: "2026-10-04",
      scope: "ALL",
      totals: { expected: 3, onTime: 1, late: 1, absent: 1, pending: 0 },
      items: [
        {
          guardId: "g-ausente",
          name: "Ana",
          lastName: "Ríos",
          role: "GUARD",
          clientId: "c1",
          clientName: "Hotel Puerto Nuevo",
          scheduleId: "s1",
          scheduleName: "Matutino",
          scheduledStart: "2026-10-04T06:00:00.000Z",
          checkInAt: null,
          status: "ABSENT",
          minutesLate: null,
        },
        {
          guardId: "g-tarde",
          name: "Beto",
          lastName: "Soto",
          role: "GUARD",
          clientId: "c1",
          clientName: "Hotel Puerto Nuevo",
          scheduleId: "s1",
          scheduleName: "Matutino",
          scheduledStart: "2026-10-04T06:00:00.000Z",
          checkInAt: "2026-10-04T06:45:00.000Z",
          status: "LATE",
          minutesLate: 45,
        },
      ],
    };

    renderWithProviders(<AttendancePanel report={report} />);

    expect(screen.getAllByText("Falta").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Retardo").length).toBeGreaterThan(0);
    expect(screen.getByText("+45 min")).toBeInTheDocument();
    expect(screen.getByText("Ana Ríos")).toBeInTheDocument();
  });

  it("la asistencia avisa cuando no hay turnos programados", () => {
    renderWithProviders(<AttendancePanel report={null} />);
    expect(screen.getByText(/Sin turnos programados/)).toBeInTheDocument();
  });
});
