import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '../../api/baseApi';
import { userReducer } from './slices/userSlice';
import { drawerReducer } from './slices/drawerSlice';
import { ThunkDispatch } from 'redux-thunk';
import {chatReducer} from "./slices/chatSlice.ts";
import {toastReducer} from "./slices/toastSlice.ts";  // Импортируем ThunkDispatch

// Настройка store с типизацией
const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        user: userReducer,
        drawer: drawerReducer,
        chat: chatReducer,
        toastSlice: toastReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
