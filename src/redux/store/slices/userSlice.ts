import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from "@reduxjs/toolkit";

interface IUser {
    name: string
    isAuthenticated: boolean
    isOnline: boolean
}

const initialState: IUser = {
    name: '',
    isAuthenticated: false,
    isOnline: false
}
export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setName(state, action: PayloadAction<string>) {
            state.name = action.payload;
        },
        login: (state) => {
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.isAuthenticated = false;
        },
        toggleIsOnline: (state) => {
            state.isOnline = !state.isOnline
        }
    }
})

// export const userActions = userSlice.actions;
// export const userReducer = userSlice.reducer;

export const {setIsOnline, setName, login, logout} = userSlice.actions;
export const userReducer = userSlice.reducer;
export default userSlice.reducer;