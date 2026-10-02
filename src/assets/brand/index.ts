/**
 * Marcas de CheckApp. Se importan como URL para que Vite las optimice y las
 * cachee; nunca se inlinean en el DOM.
 */
import logoHorizontal from "./checkapp-logo-horizontal.svg";
import logoTile from "./checkapp-logo-horizontal-tile.svg";
import mark from "./checkapp-mark.svg";
import icon from "./checkapp-icon.svg";
import iconDark from "./checkapp-icon-dark.svg";

/** Lockup horizontal con fondo verde (para fondos claros). */
export const BRAND_LOGO_TILE = logoTile;

/** Lockup horizontal transparente (para fondos ya verdes u oscuros). */
export const BRAND_LOGO_HORIZONTAL = logoHorizontal;
export const BRAND_MARK = mark;
export const BRAND_ICON = icon;
export const BRAND_ICON_DARK = iconDark;
