import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from "@reduxjs/toolkit";
import {IUser} from "../../../types.ts";

interface IDrawer {
   activeUser: IUser | null;
}

const initialState: IDrawer = {
   activeUser: null
}

export const chatSlice = createSlice({
   name: 'chat',
   initialState,
   reducers: {
      setActiveUser(state, action: PayloadAction<IUser>) {
         state.activeUser = action.payload;
      }
   }
})

// export const {setName, login, logout} = drawerSlice.actions;
export const chatReducer = chatSlice.reducer;
export default chatSlice.reducer;