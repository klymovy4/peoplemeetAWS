import {createSlice} from '@reduxjs/toolkit';
import type { PayloadAction } from "@reduxjs/toolkit";

type toastType = 'error' |'warning' |'success';

interface IToast {

   toastMessage: string
   toastType: toastType
   isShowToast?: boolean
}
const initialState: IToast  = {
   isShowToast: false,
   toastMessage: '',
   toastType: 'success'
}
export const toastSlice = createSlice({
   name: 'toast',
   initialState,
   reducers: {
      showToast: (state, action: PayloadAction<IToast>) => {
         state.isShowToast = true;
         state.toastMessage = action.payload.toastMessage;
         state.toastType = action.payload.toastType;
      },
      hideToast: (state) => {
         state.isShowToast = false;
         state.toastMessage = '';
      },
   },
});
export const toastReducer = toastSlice.reducer;
