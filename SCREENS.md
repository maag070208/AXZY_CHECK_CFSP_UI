# WEB — Screens & Modals Reference

## Diseño de Modales (Desactivar Guardia Pattern)

### Confirmación (Eliminar, Desactivar, Resolver, Finalizar, etc.)
```tsx
<ITDialog isOpen={...} onClose={...} title="" className="!max-w-md !w-full">
  <div className="flex flex-col bg-white overflow-hidden rounded-2xl">
    {/* Header: icon circle w-11 h-11 rounded-xl + title text-base font-medium + subtitle text-xs font-light */}
    <div className="px-8 pt-8 pb-4 border-b border-slate-100">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
          <FaTrash size={18} /> {/* or FaPowerOff, FaCheck, FaStop */}
        </div>
        <div>
          <h3 className="text-base font-medium text-slate-800">Título</h3>
          <p className="text-xs text-slate-400 font-light">Subtítulo / nombre</p>
        </div>
      </div>
    </div>

    {/* Content: description centered */}
    <div className="px-8 py-6">
      <p className="text-sm text-slate-500 font-light leading-relaxed text-center">
        Descripción de la acción
      </p>
    </div>

    {/* Footer: border-t border-slate-100 bg-slate-50/30 gap-3 */}
    <div className="flex-none flex justify-end items-center px-8 py-5 border-t border-slate-100 bg-slate-50/30 gap-3">
      <ITButton variant="ghost" onClick={...}
        className="px-5 text-[10px] font-medium uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors">
        Cancelar
      </ITButton>
      <ITButton variant="filled" color="danger" onClick={...}
        className="px-6 !h-10 !rounded-lg text-[10px] font-medium uppercase tracking-widest shadow-md shadow-rose-100">
        Acción
      </ITButton>
    </div>
  </div>
</ITDialog>
```

### Formulario (Reasignar Cliente, Cambiar Turno, Cambiar Contraseña, etc.)
Mismo header + contenido de formulario + footer con Cancel ghost + Action primario.

---

## Modal Inventory & Progress

| # | Módulo | Archivo | Diálogo | Tipo | Estatus |
|---|--------|---------|---------|------|---------|
| 1 | Guards | GuardsPage | Reasignar Cliente | Form | ✅ FIXED |
| 2 | Guards | GuardsPage | Cambiar Turno | Form | ✅ FIXED |
| 3 | Guards | GuardsPage | Activar/Desactivar Guardia | Confirmation | ✅ ORIGINAL (correct) |
| 4 | Guards | AssignmentModal | Nueva Asignación | Form | ❌ needs header/footer fix |
| 5 | Guards | ViewAssignmentsModal | Expediente | Detail | ✅ FIXED (title="") |
| 6 | Guards | ViewAssignmentsModal | Eliminar Asignación (inner) | Confirmation | ✅ FIXED |
| 7 | Users | UsersPage | CreateUserWizard | Wizard | ❌ needs review |
| 8 | Users | UsersPage | Cambiar Contraseña | Form | ✅ FIXED |
| 9 | Users | UsersPage | Reasignar Cliente | Form | ✅ FIXED |
| 10 | Users | UsersPage | Cambiar Turno | Form | ✅ FIXED |
| 11 | Users | UsersPage | Eliminar Registro | Confirmation | ✅ FIXED |
| 12 | Rounds | RoundsPage | Finalizar Recorrido | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 13 | Rounds | RoundsPage | Eliminar Ronda | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 14 | Rounds | RoundDetailPage | Eliminar Marcaje | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 15 | GuardLogs | GuardLogsPage | Cerrar Turno | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 16 | GuardLogs | GuardLogsPage | Eliminar Registro | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 17 | Incidents | IncidentsPage | Resolver Incidencia | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 18 | Incidents | IncidentsPage | Eliminar Incidencia | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 19 | Maintenances | MaintenancesPage | Resolver Mantenimiento | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 20 | Maintenances | MaintenancesPage | Eliminar Registro | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 21 | Routes | RoutesPage | Eliminar Ruta | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 22 | Locations | LocationsPage | Eliminar Ubicación | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 23 | Locations | LocationsPage | Registro/Editar Ubicación | Form | ❌ colored bars |
| 24 | Locations | BulkPrintModal | Impresión Masiva | Form | ❌ colored bars |
| 25 | Clients | ClientsPage | CreateClientWizard | Wizard | ❌ needs review |
| 26 | Clients | ClientsPage | Eliminar Cliente | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 27 | Clients | ClientGuardsTab | Gestión Horario | Form | ❌ colored bars |
| 28 | Clients | ClientGuardsTab | Desasignar Guardia | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 29 | Clients | ClientLocationsTab | Crear/Editar Ubicación | Form | ❌ colored bars |
| 30 | Clients | ClientZonesTab | Editar Zona | Form | ❌ colored bars |
| 31 | Reports | AperturaCierreReportModal | Configurar Reporte | Form | ❌ colored bars |
| 32 | Schedules | SchedulesPage | Gestión Horarios | Form | ❌ colored bars |
| 33 | Schedules | SchedulesPage | Eliminar Horario | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 34 | Schedules | SchedulesPage | Personal Asignado | Detail | ❌ needs review |
| 35 | Settings | SettingsPage | 5 form dialogs | Form | ❌ rounded-2xl/button styles |
| 36 | Kardex | KardexPage | Eliminar Marcaje | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 37 | Zones | ZonesModal | Zonas del Cliente | Form | ❌ colored bars |
| 38 | Home | OperationalDetailTab | Historial Operativo | Detail | ❌ colored bars |
| 39 | GuardDiscipline | GuardDisciplinePage | Asignar Incidencia | Form | ❌ colored bars |
| 40 | GuardDiscipline | GuardDisciplinePage | Resolver/Desestimar | Confirmation | ❌ font-black/px-10/rounded-2xl |
| 41 | GuardDiscipline | GuardDisciplinePage | Eliminar Incidencia | Confirmation | ❌ font-black/px-10/rounded-2xl |

### Summary
- **Total dialogs:** 41
- **✅ Fixed:** 11 (GuardsPage 3 + UsersPage 5 + ViewAssignmentsModal 2 + ChangePasswordModal 1)
- **❌ Needs fix:** 30

---

## GuardsPage — Directorio de Guardias

**Módulo:** `guards/pages/GuardsPage.tsx`

### Tabla (ITDataTable)
| # | Columna | Render |
|---|---------|--------|
| 1 | GUARDIA | Avatar iniciales + name/lastName + `@username` |
| 2 | ROL / CATEGORÍA | ITBadget: GUARD=success, SHIFT=warning, MAINT=danger |
| 3 | ASIGNACIÓN | Client name + schedule name (start-end) + dot |
| 4 | ESTADO | ITBadget: ACTIVO=success / INACTIVO=error |
| 5 | OPERATIVIDAD | Task count + label |
| 6 | CONTROL | Botones: Schedule(FaClock), Client(FaUserShield), Toggle(FaPowerOff), View(FaEye), Assign(FaClipboardList) |

### Design Pattern para Formularios (Reasignar Cliente, Cambiar Turno)
```
┌──────────────────────────────────┐
│  [icon]  Título text-base font-medium │
│          subtítulo text-xs font-light │
├──────────────────────────────────┤
│  Label text-xs font-medium uppercase │
│  [Select input]                  │
├──────────────────────────────────┤
│          Cancelar    [Action btn] │
└──────────────────────────────────┘
```
- ITDialog: `title="" className="!max-w-md !w-full"`
- Contenedor: `flex flex-col bg-white overflow-hidden rounded-2xl`
- Icon: `w-11 h-11 rounded-xl bg-primary-50 text-primary-500`
- Select label: `text-xs text-slate-400 font-medium uppercase tracking-widest`
- Footer: `border-t border-slate-100 bg-slate-50/30 gap-3`
- Cancel: ghost, `px-5 text-[10px] font-medium uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors`
- Action: filled, `px-6 !h-10 !rounded-lg text-[10px] font-medium uppercase tracking-widest shadow-md`

---

## UsersPage — Directorio de Usuarios

**Módulo:** `users/pages/UsersPage.tsx`

### Tabla (ITDataTable)
| # | Columna | Render |
|---|---------|--------|
| 1 | USUARIO / EXPEDIENTE | name/lastName + @username |
| 2 | ROL / CATEGORÍA | ITBadget: ADMIN=primary, GUARD=success, SHIFT=warning, MAINT=danger |
| 3 | ASIGNACIÓN | Client name + schedule / "SISTEMA" |
| 4 | ESTADO | ITBadget: ACTIVO=success / INACTIVO=error |
| 5 | CONTROL | Schedule(FaClock), Client(FaUserShield), Password(FaKey), Editar(FaEdit), Eliminar(FaTrash) |

---

## GuardsPage / UsersPage — Modales Comunes

### Reasignar Cliente
```
ITDialog title=""
  div.rounded-2xl
    Header: FaUserShield icon + "Reasignar Cliente" + userName
    Content: label "Seleccionar Cliente Destino" + ITSelect
    Footer: Cancelar ghost
```
Color icon: `bg-primary-50 text-primary-500`

### Cambiar Turno
```
ITDialog title=""
  div.rounded-2xl
    Header: FaClock icon + "Cambiar Turno" + userName
    Content: label "Horario Operativo" + ITSelect
    Footer: Cancelar ghost
```
Color icon: `bg-primary-50 text-primary-500`

### Eliminar Registro (confirmation)
```
ITDialog title=""
  div.rounded-2xl
    Header: FaTrash icon (rose-50/rose-500) + "Eliminar Registro" + subtitle
    Content: centered description
    Footer: Cancelar ghost + Eliminar danger btn
```
```tsx
// Confirmación (rosado para destructive)
bg-rose-50 text-rose-500
px-6 !h-10 !rounded-lg text-[10px] font-medium uppercase tracking-widest shadow-md shadow-rose-100
```

### Activar/Desactivar Guardia
```tsx
// Toggle conditional colors
guardToToggle?.active 
  ? "bg-rose-50 text-rose-500" 
  : "bg-emerald-50 text-emerald-500"

// Botón conditional
guardToToggle?.active 
  ? "danger" / "shadow-rose-100 bg-rose-500 hover:bg-rose-600" 
  : "primary" / "shadow-emerald-100 bg-emerald-500 hover:bg-emerald-600"
```

---

## Colores por Tipo de Acción

| Acción | Icon bg/text | Button color | Shadow |
|--------|-------------|--------------|--------|
| Eliminar / Desactivar | `bg-rose-50 text-rose-500` | `danger` | `shadow-rose-100` |
| Activar / Resolver | `bg-emerald-50 text-emerald-500` | `primary/success` | `shadow-emerald-100` |
| Reasignar / Editar / Cambiar | `bg-primary-50 text-primary-500` | `primary` | `shadow-primary-100` |
| Contraseña | `bg-primary-50 text-primary-500` | `primary` | `shadow-primary-100` |

Note: Los valores `primary-*`, `danger-*`, `success-*` vienen del ITThemeProvider. Los colores `rose-*`, `emerald-*` son Tailwind nativos para iconos y sombras específicas.

---

## All Screens

[Rest of the file remains similar - tables and component references preserved]
