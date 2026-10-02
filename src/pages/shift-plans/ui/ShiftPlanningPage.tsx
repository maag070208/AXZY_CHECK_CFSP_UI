import { ITPage, ITTabs } from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaCalendarAlt, FaCalendarCheck, FaSlidersH } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useSupervisionPermissions } from "@app/core/hooks/supervisionPermissions.hook";
import { AgendaBoard } from "./AgendaBoard";
import { ShiftPlansTab } from "./ShiftPlansTab";

/**
 * Programación de entregas de turno y revisiones de uniforme:
 * la agenda del día (qué toca, qué falta, qué venció) y su configuración.
 */
const ShiftPlanningPage = () => {
  const navigate = useNavigate();
  const { canRegister, canManage, isClient } = useSupervisionPermissions();
  const [activeTab, setActiveTab] = useState("agenda");
  const [reloadKey, setReloadKey] = useState(0);

  const agenda = (
    <AgendaBoard
      canRegister={canRegister}
      isClient={isClient}
      reloadKey={reloadKey}
      onConfigure={canManage ? () => setActiveTab("plans") : undefined}
    />
  );

  return (
    <ITPage
      noPadding
      title="Programación de turnos"
      description="Agenda diaria de entregas de turno y revisiones de uniforme, y en qué turnos se exigen."
      icon={<FaCalendarCheck size={20} />}
      backAction={() => navigate(-1)}
      breadcrumbs={[{ label: "Inicio", onClick: () => navigate("/home") }, { label: "Programación de turnos" }]}
    >
      {isClient ? (
        agenda
      ) : (
        <ITTabs
          key={activeTab}
          variant="line"
          defaultActiveId={activeTab}
          onChange={setActiveTab}
          items={[
            { id: "agenda", label: "Agenda", icon: <FaCalendarAlt />, content: agenda },
            {
              id: "plans",
              label: "Programación",
              icon: <FaSlidersH />,
              content: <ShiftPlansTab canManage={canManage} onChanged={() => setReloadKey((k) => k + 1)} />,
            },
          ]}
        />
      )}
    </ITPage>
  );
};

export default ShiftPlanningPage;
