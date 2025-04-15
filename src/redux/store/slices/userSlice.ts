import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from "@reduxjs/toolkit";

interface IUser {
    isAuthenticated: boolean
    isOnline: boolean
    name: string
    email: string
    age: number
    image: string
    sex: string
    description: string
    lat: null | number
    lng: null | number
}

const initialState: IUser = {
    isAuthenticated: false,
    isOnline: false,
    name: '',
    email: '',
    age: 18,
    sex: '',
    image: '',
    description: '',
    lat: null,
    lng: null
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
        setUser: (state, action: PayloadAction<any>) => {
            state.name = action.payload.name;
            state.age = action.payload.age;
            state.email = action.payload.email;
            state.description = action.payload.description;
            state.sex = action.payload.sex;
            state.isOnline = action.payload.isOnline;
            state.image = action.payload.image;
            state.lng = action.payload.lng;
            state.lat = action.payload.lat;
        },
        logout: (state) => {
            state.isAuthenticated = false;
            state.isOnline = false;
            state.name = '';
            state.email = '';
            state.age = 18;
            state.image = '';
            state.sex = '';
            state.description = '';
            state.lat = null;
            state.lng = null;
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
            state.lat = action.payload.lat;
            state.lng = action.payload.lng;
        },
    }
})

// export const userActions = userSlice.actions;
// export const userReducer = userSlice.reducer;

export const userReducer = userSlice.reducer;
