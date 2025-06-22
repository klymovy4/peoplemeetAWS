import type {PayloadAction} from "@reduxjs/toolkit";
import {createSlice} from '@reduxjs/toolkit';
import {IUser} from "../../../types.ts";
import {formatToLocal} from "../../../utils/hepler.ts";

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
const baseApi = import.meta.env.VITE_API_URL;
export const chatSlice = createSlice({
   name: 'chat',
   initialState,
   reducers: {
      setActiveUser(state, action: PayloadAction<IUser | null>) {
         state.activeUser = action.payload;
      },
      setDialogObject(state, action: PayloadAction<{ messages: any; users: Record<number, IUser> }>) {
         const {messages, users} = action.payload;
         state.messages = Object.fromEntries(
             // @ts-ignore // Tired =) Finished here
             Object.entries(messages).map(([userId, msgs]: [string, any[]]) => {
                return [
                   userId,
                   msgs.map((msg) => ({
                      ...msg,
                      created_at: formatToLocal(msg.created_at),
                   })),
                ];
             })
         );
         state.chatPartner = Object.fromEntries(
             Object.entries(users).map(([key, user]) => [
                key,
                {
                   ...user,
                   image: `${baseApi}/uploads/${user.image}`,
                },
             ])
         );
      }
   }
})

export const chatReducer = chatSlice.reducer;
export default chatSlice.reducer;