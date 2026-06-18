# WEB Design Standards — AXZY CHECK

## Reference: GuardsPage

Todas las pantallas deben seguir el diseño de `GuardsPage.tsx` como referencia absoluta. Layout, tipografía, espaciado, bordes, sombras y comportamiento deben ser idénticos.

---

## 1. ModuleHeader (Todas las pantallas)

```tsx
<ModuleHeader
  title="Directorio de Guardias"             // H1, text-2xl font-bold
  subtitle="Gestión de personal..."           // text-sm text-slate-500
  icon={FaUserShield}                         // Rounded button with icon
  search={{
    value: searchTerm,
    onChange: setSearchTerm,
    placeholder: "BUSCAR GUARDIA...",         // TODO MAYUS, placeholder en MAYUS
  }}
  onRefresh={refreshTable}
  refreshKey={refreshKey}
  extraFilter={
    <ITTripleFilter
      value={activeFilter}
      onChange={setActiveFilter}
      options={[
        { label: "TODOS", value: "all" },
        { label: "ACTIVOS", value: "active" },
        { label: "INACTIVOS", value: "inactive" },
      ]}
    />
  }
/>
```

**Reglas:**
- `actions` para botones personalizados (ej: "Nueva Incidencia")
- `filter` para filtro de cliente (ITSearchSelect, w-full md:w-72)
- `extraFilter` para ITTripleFilter
- `onCreate` + `createLabel` para botón "Nuevo" estándar

---

## 2. DataTable / Card container

```html
<div className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden">
  <ITDataTable ... />
</div>
```

**Reglas:**
- Siempre bg-white, rounded-[24px], shadow-xl shadow-slate-200/40, border border-slate-100
- overflow-hidden para que el border-radius afecte al contenido interno

---

## 3. Columnas del DataTable

### 3.1. Avatar + Nombre (columna principal)

```tsx
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm">
    {row.name?.[0]}
    {row.lastName?.[0]}
  </div>
  <div>
    <ITText className="font-black text-slate-800 uppercase text-[11px] tracking-tight line-clamp-1 block">
      {row.name} {row.lastName}
    </ITText>
    <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">
      @{row.username}
    </ITText>
  </div>
</div>
```

### 3.2. Badges (rol, estado)

```tsx
<ITBadget color="success" size="small">ACTIVO</ITBadget>
```

Colors: `success` (verde), `warning` (ámbar), `danger` (rojo), `primary` (índigo), `secondary` (gris)

### 3.3. Texto con etiqueta + valor

```tsx
<div className="flex flex-col">
  <ITText className="font-black text-slate-700 text-[11px] uppercase tracking-tight mb-1 block">
    {row.client?.name || "SIN ASIGNAR"}
  </ITText>
  <div className="flex items-center gap-1.5">
    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
    <ITText className="text-slate-400 text-[9px] font-black uppercase tracking-widest block">
      HORARIO: 06:00-14:00
    </ITText>
  </div>
</div>
```

### 3.4. Botones de acción

```tsx
<div className="flex items-center gap-2">
  <ITButton onClick={fn} variant="outlined" size="small" color="warning" title="Tooltip">
    <FaClock size={14} />
  </ITButton>
  ...
</div>
```

**Reglas:**
- variant="outlined", size="small", iconos de 14px
- gap-2 entre botones
- tooltip descriptivo en title

---

## 4. Tipografía (Sistema unificado)

| Elemento | Clase | Font Size | Font Weight | Transform | Tracking |
|----------|-------|-----------|-------------|-----------|----------|
| Título H1 | `text-2xl font-bold text-slate-800` | 24px | Bold | normal | normal |
| Subtítulo | `text-sm text-slate-500` | 14px | normal | normal | normal |
| Nombre principal | `text-[11px] font-black text-slate-800 uppercase tracking-tight` | 11px | Black (900) | uppercase | -0.3px |
| Label secundario | `text-[9px] font-bold text-slate-400 uppercase tracking-widest` | 9px | Bold (700) | uppercase | 0.5px |
| Valor de celda | `text-[11px] font-black text-slate-700 uppercase tracking-tight` | 11px | Black | uppercase | tight |
| Etiqueta de detalle | `text-[9px] font-black text-slate-400 uppercase tracking-widest` | 9px | Black | uppercase | 0.2em |
| Valor de detalle | `text-[10px] font-black text-slate-700 uppercase` | 10px | Black | uppercase | normal |
| Texto cuerpo | `text-[13px] text-slate-600 font-medium` | 13px | Medium | normal | normal |

---

## 5. Detail Dialog (Ejemplo: IncidentDetailDialog)

```tsx
<ITDialog
  isOpen={isOpen}
  onClose={onClose}
  title="Detalle de Incidencia"
  className="!max-w-[95vw] md:!max-w-[80vw] lg:!max-w-5xl !w-full"
>
  <div className="flex flex-col h-[85vh] w-full bg-white overflow-hidden">
    {/* Scrollable content */}
    <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main column (7 cols) */}
        <div className="lg:col-span-7 space-y-10">
          {/* section header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-4 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.3)]" />
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Información General
            </h4>
          </div>
        </div>
        {/* Sidebar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">...</div>
      </div>
    </div>
    {/* Sticky footer */}
    <div className="flex-none flex justify-end items-center px-8 py-6 border-t border-slate-100 bg-slate-50/50 gap-4">
      <ITButton ...>Cerrar Visor</ITButton>
    </div>
  </div>
</ITDialog>
```

### Acción inline (sidebar, status PENDING)

```tsx
<div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 space-y-3">
  <h5 className="text-[9px] font-black text-amber-500 uppercase tracking-widest">
    Acción Requerida
  </h5>
  <ITButton className="w-full !rounded-xl !h-12" variant="filled" color="success">
    <div className="flex items-center justify-center gap-2 font-black text-[9px] tracking-widest uppercase">
      <FaCheck size={12} /> Resolver Incidencia
    </div>
  </ITButton>
</div>
```

### Resolución completada (sidebar, status RESOLVED)

```tsx
<div className="bg-emerald-500 p-6 rounded-3xl text-white shadow-lg shadow-emerald-500/10 relative overflow-hidden">
  <div className="absolute top-0 right-0 p-6 opacity-10"><FaCheckCircle size={60} /></div>
  <div className="relative z-10">
    <h5 className="text-[9px] font-black text-emerald-100 uppercase tracking-widest mb-2">Incidencia Resuelta</h5>
    <p className="text-[10px] font-bold text-emerald-100/80 uppercase tracking-tight">...</p>
  </div>
</div>
```

---

## 6. Modales de Confirmación (pequeños)

```tsx
<ITDialog isOpen={isOpen} onClose={close} title="Confirmar Acción">
  <div className="p-10 text-center">
    <div className="w-20 h-20 rounded-3xl bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-8 border border-rose-100 shadow-sm">
      <FaPowerOff size={32} />
    </div>
    <ITText className="text-xl font-black text-slate-800 uppercase tracking-tight mb-3 block">
      ¿Desactivar Guardia?
    </ITText>
    <ITText className="text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto block">
      Descripción de lo que ocurrirá...
    </ITText>
    <div className="flex gap-4 justify-center">
      <ITButton variant="ghost" className="px-8 font-black text-[11px] uppercase tracking-widest text-slate-400" onClick={close}>Cancelar</ITButton>
      <ITButton variant="filled" color="danger" className="px-10 !rounded-2xl shadow-xl shadow-rose-200" onClick={confirm} disabled={loading}>
        {loading ? <ITLoader size="sm" /> : "CONFIRMAR ACCIÓN"}
      </ITButton>
    </div>
  </div>
</ITDialog>
```

**Reglas:**
- Icono grande (w-20 h-20 rounded-3xl) con color semántico
- Título: text-xl font-black uppercase tracking-tight
- Descripción: text-[11px] font-bold uppercase tracking-widest, max-w-xs
- Botón ghost "Cancelar" + botón filled color semántico "CONFIRMAR ACCIÓN"
- padding: p-10

---

## 7. Formularios en ITDialog (create/edit)

```tsx
<ITDialog isOpen={isOpen} onClose={close} title="Asignar Incidencia a Guardia">
  <div className="p-6 space-y-4">
    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block">Guardia *</label>
    <ITSearchSelect ... />
    <div className="flex justify-end gap-3 pt-2">
      <ITButton variant="ghost">Cancelar</ITButton>
      <ITButton variant="filled" color="primary" disabled={submitting}>
        {submitting ? <ITLoader size="sm" /> : "Asignar Incidencia"}
      </ITButton>
    </div>
  </div>
</ITDialog>
```

**Labels:**
- `text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block`
- Inputs: `w-full px-3 py-2.5 text-[12px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl`
- Textareas: same + `resize-none`

**Upload de archivos:**
```tsx
<label className="flex items-center justify-center w-full py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
  <input type="file" accept="image/*,video/*" onChange={handleFileUpload} className="hidden" />
  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">+ Agregar archivo</span>
</label>
```

---

## 8. Resumen de clases CSS core

```css
/* Page container */
.p-6 min-h-screen font-sans

/* Card container */
.bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden

/* Avatar circle */
.w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black border border-slate-100 uppercase text-sm

/* Labels */
.text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 block

/* Input fields */
.w-full px-3 py-2.5 text-[12px] font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400

/* Primary text */
.text-[11px] font-black text-slate-800 uppercase tracking-tight

/* Secondary text */
.text-[9px] font-bold text-slate-400 uppercase tracking-widest

/* Section header with colored bar */
.w-1.5 h-4 bg-{color}-500 rounded-full shadow-[0_0_10px_rgba(...)]

/* Detail dialog sidebar card */
.bg-white p-6 rounded-3xl border border-slate-100 shadow-sm

/* Detail dialog grid */
.grid grid-cols-1 lg:grid-cols-12 gap-10
/* Main: lg:col-span-7 */
/* Side: lg:col-span-5 */

/* Footer bar */
.flex-none flex justify-end items-center px-8 py-6 border-t border-slate-100 bg-slate-50/50 gap-4

/* Confirmation dialog content */
.p-10 text-center
.w-20 h-20 rounded-3xl mx-auto mb-8
.text-xl font-black text-slate-800 uppercase tracking-tight mb-3
.text-slate-500 text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 max-w-xs mx-auto
```

---

## 9. ITTheme Colors (Sistema de colores temáticos)

**NO USAR COLORES DUROS.** Todos los colores deben venir del ITTheme definido en `main.tsx` y `theme/theme.ts`.

### Clases disponibles del ITTheme (vía CSS de la librería)

| Categoría | Clases disponibles |
|-----------|-------------------|
| Background | `bg-primary-50` a `bg-primary-900`, `bg-secondary-*`, `bg-success-*`, `bg-danger-*`, `bg-warning-*`, `bg-info-*` |
| Texto | `text-primary-50` a `text-primary-900`, `text-secondary-*`, `text-success-*`, `text-danger-*`, `text-warning-*`, `text-info-*` |
| Borde | `border-primary-50` a `border-primary-900`, `border-secondary-*`, `border-success-*`, `border-danger-*`, `border-warning-*`, `border-info-*` |
| Hover | `hover:bg-primary-700`, `hover:border-primary-400`, `hover:text-primary-600/700/800` |
| Focus | `focus:ring-primary-500`, `focus:border-primary-500` |
| Group hover | `group-hover:bg-primary-50`, `group-hover:border-primary-500`, `group-hover:text-primary-400/500` |
| Dark mode | `dark:text-primary-300/400` |

### Componentes con color temático

- `ITButton color="primary"` / `"secondary"` / `"danger"` / `"success"` / `"info"` / `"warning"`
- `ITBadget color="primary"` / `"secondary"` / `"success"` / `"danger"` / `"warning"` / `"info"` / `"error"`
- `ITLoader color="white"` / `"primary"`

### Paleta ITTheme actual (`main.tsx`)

| Token | Hex | Tailwind equivalente |
|-------|-----|---------------------|
| primary | `#0ea5e9` | sky-500 |
| secondary | `#54634d` | olive/custom |
| success | `#4ADE80` | green-400 |
| danger | `#BA1A1A` | red-700 |
| info | `#512bbb` | violet-600 |

### Reglas de color para modales

- **Íconos decorativos**: `text-primary-500` o `text-slate-400` (evitar indigo/emerald)
- **Botones primarios**: `ITButton color="primary"` (hereda el tema)
- **Botones de peligro**: `ITButton color="danger"`
- **Badges de estado**: `ITBadget color="success"/"danger"/"warning"/"primary"`
- **Barras decorativas de sección**: `bg-primary-500` con `shadow-[0_0_10px_rgba(14,165,233,0.3)]`
- **Textos neutrales**: `text-slate-400`, `text-slate-700`, `text-slate-800`
- **Fondos de input**: `bg-slate-50`, `border-slate-200`
- **Fondo de footer**: `bg-slate-50/50`, `border-slate-100`
- **Fondo vacío/placeholder**: `bg-slate-50`, `border-dashed border-slate-200`

---

## 10. Checklist de revisión

Cada pantalla debe verificar:

- [ ] `ModuleHeader` con icon, title, subtitle, search, filters, refresh
- [ ] Tabla dentro de `bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 overflow-hidden`
- [ ] Avatares redondeados (rounded-2xl) con iniciales
- [ ] Tipografía consistente (11px black / 9px bold uppercase)
- [ ] Colores usan ITTheme (`text-primary-500`, `bg-primary-50`, `border-primary-200`) — NO indigo/emerald/rose hardcoded
- [ ] Botones usan `color="primary"/"danger"/"info"` (no Tailwind color classes directas)
- [ ] `ITBadget` para estados con color semántico
- [ ] Detail dialog con `!max-w-5xl`, `h-[85vh]`, grid 7/5, sticky footer
- [ ] Acciones inline en sidebar (no modales separados para resolver)
- [ ] Confirmaciones con icono grande + texto descriptivo
- [ ] Inputs con bg-slate-50, border-slate-200, rounded-xl
- [ ] Labels en text-[10px] font-black uppercase tracking-widest
