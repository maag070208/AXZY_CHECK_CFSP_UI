import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./auth/auth.slice";
import toastReducer from "./toast/toast.slice";
import loaderReducer from "./loader/loader.slice";
import panicReducer from "./panic/panic.slice";
import activityReducer from "./activity/activity.slice";

const rootReducer = {
  auth: authReducer,
  toast: toastReducer,
  loader: loaderReducer,
  panic: panicReducer,
  activity: activityReducer,
};

/**
 * Crea un store aislado. Los tests deben usar esto y no el singleton: el store
 * compartido filtraba estado entre casos y obligaba a resetear a mano.
 */
export const makeStore = () => configureStore({ reducer: rootReducer });

/** Store de la aplicación (una sola instancia en runtime). */
const store = makeStore();

export type AppState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
