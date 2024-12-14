import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { baseApi } from '../../api/baseApi';
import { userReducer } from './slices/userSlice';
import { ThunkDispatch } from 'redux-thunk';  // Импортируем ThunkDispatch

// Настройка store с типизацией
const store = configureStore({
    reducer: {
        [baseApi.reducerPath]: baseApi.reducer,
        user: userReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(baseApi.middleware),
});






export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = ThunkDispatch<RootState, unknown, any>; // Типизируем dispatch

setupListeners(store.dispatch);
export default store;
