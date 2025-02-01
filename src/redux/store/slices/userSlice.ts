import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from "@reduxjs/toolkit";

interface IUser {
    isAuthenticated: boolean
    isOnline: boolean
    name: string
    email: string
    age: number
    sex: string
    description: string
    location: {
        lat: null | number
        lng: null | number
    }
}

const initialState: IUser = {
    isAuthenticated: false,
    isOnline: false,
    name: '',
    email: '',
    age: 18,
    sex: '',
    description: '',
    location: {
        lat: null,
        lng: null
    }
}

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {
        setUserName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setUserEmail: (state, action: PayloadAction<string>) => {
            state.email = action.payload;
        },
        login: (state) => {
            state.isAuthenticated = true;
        },
        logout: (state) => {
            state.isAuthenticated = false;
        },
        toggleIsOnline: (state) => {
            state.isOnline = !state.isOnline;
        },
        setUserField: (state, action: PayloadAction<{ field: string; value: IUser[keyof IUser] }>) => {
            const { field, value } = action.payload;
            // @ts-ignore
            state[field] = value;
        },
        setLocation: (state, action) => {
            state.location = action.payload;
        },
    }
})

// export const userActions = userSlice.actions;
// export const userReducer = userSlice.reducer;

export const {setUserName, login, logout} = userSlice.actions;
export const userReducer = userSlice.reducer;
export default userSlice.reducer;