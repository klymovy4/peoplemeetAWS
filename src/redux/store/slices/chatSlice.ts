import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from "@reduxjs/toolkit";
import {IUser} from "../../../types.ts";

interface IDrawer {
   activeUser: IUser | null;
   messages: any | null;
   chatPartner: any | null;
}

const initialState: IDrawer = {
   activeUser: null,
   messages: null,
   chatPartner: null
}

export const chatSlice = createSlice({
   name: 'chat',
   initialState,
   reducers: {
      setActiveUser(state, action: PayloadAction<IUser>) {
         state.activeUser = action.payload;
      },
      setDialogObject(state, action: PayloadAction<any>) {
         const {messages, users} = action.payload;
         state.messages = messages;
         state.chatPartner = users;
      }
   }
})

export const chatReducer = chatSlice.reducer;
export default chatSlice.reducer;