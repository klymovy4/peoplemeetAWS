import {createSlice} from '@reduxjs/toolkit';
import type {PayloadAction} from "@reduxjs/toolkit";

interface IDrawer {
   isOpenSideBar: boolean
   isOpenChat: boolean
}

const initialState: IDrawer = {
   isOpenSideBar: false,
   isOpenChat: false
}

export const drawerSlice = createSlice({
   name: 'drawer',
   initialState,
   reducers: {
      toggleOpenChat(state) {
         state.isOpenChat = !state.isOpenChat;
      },
      openChat(state, action: PayloadAction<boolean>) {
         state.isOpenChat = action.payload;
      },
      openSideBar(state, action: PayloadAction<boolean>) {
         state.isOpenSideBar = action.payload;
      },
   }
})

export const drawerReducer = drawerSlice.reducer;
export default drawerSlice.reducer;