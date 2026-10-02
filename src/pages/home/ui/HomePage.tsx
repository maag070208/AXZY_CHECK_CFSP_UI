import { ITPage } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import { FaClock, FaExclamationTriangle, FaHome, FaWrench } from "react-icons/fa";
import { useHomePage, type HomeShortcutIcon } from "../model/useHomePage";
import { HomeCardItem } from "./HomeCardItem";

/** El view-model devuelve una clave de icono; el mapeo a JSX vive aquí. */
const ICONS: Record<HomeShortcutIcon, ReactNode> = {
  clock: <FaClock />,
  warning: <FaExclamationTriangle />,
  wrench: <FaWrench />,
};

/**
 * Inicio con accesos rápidos por rol.
 *
 * Qué rol ve el monitoreo en vivo lo decide `app/routing/HomeRoute`.
 */
const HomePage = () => {
  const { cards } = useHomePage();

  return (
    <ITPage noPadding title="Inicio" description="Accesos rápidos a tus módulos." icon={<FaHome size={20} />}>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card, index) => (
          <HomeCardItem key={card.path} item={{ ...card, icon: ICONS[card.icon] }} index={index} />
        ))}
      </div>
    </ITPage>
  );
};

export default HomePage;
