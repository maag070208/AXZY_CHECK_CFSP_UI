/**
 * Modelo de la entidad Turno/Horario.
 *
 * Se extrae del módulo `schedules` porque `entities/user` (y con él medio
 * sistema) necesita la referencia a un horario: en FSD una entidad no puede
 * importar de un módulo/feature.
 */
export type Schedule = {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  active: boolean;
};

