import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '../../api/baseApi';
import { userReducer } from './slices/userSlice';
import { drawerReducer } from './slices/drawerSlice';
import {chatReducer} from "./slices/chatSlice.ts";

// Настройка store с типизацией
const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        user: userReducer,
        drawer: drawerReducer,
        chat: chatReducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});

export default store

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch;
