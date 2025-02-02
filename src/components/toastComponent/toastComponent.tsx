import React, {useEffect} from 'react';
import classes from './Toast.module.scss';
import {toastSlice} from '../../redux/store/slices/toastSlice.ts';
import {useAppDispatch, useAppSelector} from "../../redux/hooks";


const success = '#41b65c';
const error = '#d11124';
const warning = 'rgb(255, 243, 205)';

const ToastComponent = () => {
   const {hideToast} = toastSlice.actions;
   const dispatch = useAppDispatch();
   const {isShowToast, toastMessage, toastType} = useAppSelector((state) => state.toastSlice);

   useEffect(() => {
      if (isShowToast) {
         let timer: number;
         if (toastType !== 'danger') {
            timer = window.setTimeout(() => {
               dispatch(hideToast());
            }, 9000);
         } else {
            timer = window.setTimeout(() => {
               dispatch(hideToast());
            }, 9000);
         }
         return () => clearTimeout(timer);
      }
      return undefined
   }, [isShowToast]);

   const getBorderColor = (): string | void => {
      switch (toastType) {
         case 'success':
            return success;
         case 'danger':
            return error;
         case 'info':
            return warning;
         default:
            return;
      }
   };

   return (
       <div className={`
        ${classes.toastContainer} ${isShowToast ? classes.show : classes.hide} alert alert-${toastType}`}>
          <div className="d-flex align-items-center justify-content-between">
             <div
                 className="toast-body text-center" style={{flex: 1}}
                 dangerouslySetInnerHTML={{__html: toastMessage}}
             />
             {toastType === 'danger' &&
                 <button type="button" className="btn-close btn-close-white m-auto ms-2" data-bs-dismiss="toast"
                         aria-label="Close" onClick={() => dispatch(hideToast())}></button>
             }
          </div>
       </div>
   );
};

export default ToastComponent;
