import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface IPanicRealtimeAlert {
  id: string;
  title: string;
  message: string;
  guardId: string;
  guardName: string;
  clientId: string | null;
  clientName: string | null;
  latitude: number | null;
  longitude: number | null;
  receivedAt: number;
}

interface PanicState {
  liveAlerts: IPanicRealtimeAlert[];
  unreadIds: string[];
}

const MAX_LIVE_ALERTS = 30;

const initialState: PanicState = {
  liveAlerts: [],
  unreadIds: [],
};

const panicSlice = createSlice({
  name: "panic",
  initialState,
  reducers: {
    addLiveAlert: (state, action: PayloadAction<IPanicRealtimeAlert>) => {
      const exists = state.liveAlerts.some(
        (a) => a.id === action.payload.id,
      );
      if (exists) return;
      state.liveAlerts.unshift(action.payload);
      if (state.liveAlerts.length > MAX_LIVE_ALERTS) {
        state.liveAlerts = state.liveAlerts.slice(0, MAX_LIVE_ALERTS);
      }
      state.unreadIds.push(action.payload.id);
    },
    clearLiveAlerts: (state) => {
      state.liveAlerts = [];
      state.unreadIds = [];
    },
    markAlertsRead: (state) => {
      state.unreadIds = [];
    },
    removeLiveAlert: (state, action: PayloadAction<string>) => {
      state.liveAlerts = state.liveAlerts.filter(
        (a) => a.id !== action.payload,
      );
      state.unreadIds = state.unreadIds.filter(
        (id) => id !== action.payload,
      );
    },
  },
});

export const {
  addLiveAlert,
  clearLiveAlerts,
  markAlertsRead,
  removeLiveAlert,
} = panicSlice.actions;

export default panicSlice.reducer;
