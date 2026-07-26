import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ActivityType =
  | "incident"
  | "maintenance"
  | "discipline"
  | "panic"
  | "guard_status"
  | "round"
  | "kardex";

export interface IRealtimeActivity {
  id: string;
  type: ActivityType;
  action: string;
  timestamp: string;
  data: Record<string, unknown>;
}

interface ActivityState {
  // Eventos crudos recibidos por Ably (sin filtrar)
  events: IRealtimeActivity[];
  // IDs de eventos ya consumidos (para evitar duplicados en re-renders)
  consumedIds: string[];
}

const initialState: ActivityState = {
  events: [],
  consumedIds: [],
};

const activitySlice = createSlice({
  name: "activity",
  initialState,
  reducers: {
    addActivityEvent: (state, action: PayloadAction<IRealtimeActivity>) => {
      const exists = state.events.some((e) => e.id === action.payload.id);
      if (exists) return;
      state.events.unshift(action.payload);
      if (state.events.length > 100) {
        state.events = state.events.slice(0, 100);
      }
    },
    markEventConsumed: (state, action: PayloadAction<string>) => {
      if (!state.consumedIds.includes(action.payload)) {
        state.consumedIds.push(action.payload);
      }
    },
    clearActivity: (state) => {
      state.events = [];
      state.consumedIds = [];
    },
  },
});

export const { addActivityEvent, markEventConsumed, clearActivity } =
  activitySlice.actions;

export default activitySlice.reducer;
