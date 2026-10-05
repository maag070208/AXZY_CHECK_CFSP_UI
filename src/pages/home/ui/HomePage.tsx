import { ITPage, ITText } from "@axzydev/axzy_ui_system";
import type { ReactNode } from "react";
import { FaClock, FaExclamationTriangle, FaRoute, FaShieldAlt, FaSync, FaWrench } from "react-icons/fa";
import { TONES, type SemanticTone } from "@shared/ui";
import { useHomeDeps } from "../model/deps";
import { useHomePage, type HomeShortcutIcon } from "../model/useHomePage";
import { HomeCardItem } from "./HomeCardItem";
import { HomeStatCard } from "./HomeStatCard";

/** El view-model devuelve una clave de icono; el mapeo a JSX vive aquí. */
const ICONS: Record<HomeShortcutIcon, ReactNode> = {
  clock: <FaClock />,
  warning: <FaExclamationTriangle />,
  wrench: <FaWrench />,
};

/** Tonos rotativos para que los accesos no se vean monocromos. */
const CARD_TONES: SemanticTone[] = ["brand", "info", "warning", "accent"];

/**
 * Inicio con accesos rápidos por rol.
 *
 * Qué rol ve el monitoreo en vivo lo decide `app/routing/HomeRoute`.
 */
const HomePage = () => {
  const { greeting, userName, dateLabel, roleLabel, cards, summary, loading, error, refresh } =
    useHomePage(useHomeDeps());

  const roundTitle = summary.round?.recurringConfiguration?.title ?? undefined;

  return (
    <ITPage maxWidth="7xl">
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section
        aria-labelledby="home-greeting"
        className="relative overflow-hidden rounded-3xl border border-primary-200 bg-primary-50 p-6 sm:p-8"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-40 blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-primary) 45%, transparent)" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 left-1/3 h-56 w-56 rounded-full opacity-30 blur-3xl"
          style={{ backgroundColor: "color-mix(in srgb, var(--color-info) 45%, transparent)" }}
        />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <ITText as="p" className="text-[11px] font-black uppercase tracking-[0.18em] text-primary-700">
              {dateLabel}
            </ITText>
            <ITText
              as="h1"
              id="home-greeting"
              className="mt-1 text-balance text-2xl font-black tracking-tight text-secondary-900 sm:text-3xl"
            >
              {greeting}
              {userName ? `, ${userName}` : ""}
            </ITText>
            <ITText as="p" className="mt-2 max-w-xl text-sm font-medium leading-relaxed text-secondary-500">
              Este es el estado de tu turno y tus accesos rápidos.
            </ITText>
          </div>

          {roleLabel ? (
            <span
              className={`inline-flex flex-shrink-0 items-center gap-2 self-start rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] ${TONES.brand.solid}`}
            >
              <FaShieldAlt aria-hidden="true" />
              {roleLabel}
            </span>
          ) : null}
        </div>
      </section>

      {/* ── Resumen ──────────────────────────────────────────────────── */}
      <section aria-labelledby="home-summary" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <ITText as="h2" id="home-summary" className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary-500">
            Estado de tu turno
          </ITText>
          <button
            type="button"
            onClick={refresh}
            aria-label="Actualizar resumen"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-secondary-200 text-secondary-400 transition-[color,border-color,background-color] duration-200 hover:border-secondary-300 hover:text-secondary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 dark:border-secondary-700 dark:hover:text-secondary-200"
          >
            <FaSync size={12} aria-hidden="true" />
          </button>
        </div>

        {error ? (
          <p
            role="status"
            className="rounded-2xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm font-medium text-warning-700"
          >
            {error}
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <HomeStatCard
              label="Incidencias abiertas"
              value={summary.incidents ?? 0}
              icon={<FaExclamationTriangle />}
              tone="danger"
              loading={loading}
            />
            <HomeStatCard
              label="Mantenimientos pendientes"
              value={summary.maintenances ?? 0}
              icon={<FaWrench />}
              tone="warning"
              loading={loading}
            />
            <HomeStatCard
              label="Recorrido actual"
              value={summary.round ? "En curso" : "Sin recorrido"}
              hint={roundTitle}
              icon={<FaRoute />}
              tone="brand"
              loading={loading}
            />
          </div>
        )}
      </section>

      {/* ── Accesos rápidos ──────────────────────────────────────────── */}
      <section aria-labelledby="home-shortcuts" className="space-y-3">
        <ITText as="h2" id="home-shortcuts" className="text-[11px] font-black uppercase tracking-[0.16em] text-secondary-500">
          Accesos rápidos
        </ITText>

        {cards.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((card, index) => (
              <HomeCardItem
                key={card.path}
                item={{ ...card, icon: ICONS[card.icon] }}
                index={index}
                tone={CARD_TONES[index % CARD_TONES.length]}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-secondary-200 bg-white p-10 text-center dark:border-secondary-800 dark:bg-secondary-900">
            <ITText as="p" className="text-sm font-medium text-secondary-500">
              Tu rol no tiene accesos rápidos asignados.
            </ITText>
          </div>
        )}
      </section>
    </ITPage>
  );
};

export default HomePage;
