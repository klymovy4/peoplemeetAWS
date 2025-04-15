import {IAccountUser} from "../types.ts";

export const getDeviceType = () => {
   const userAgent = navigator.userAgent.toLowerCase();
   const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
   const isTablet = /ipad|android(?!.*mobile)/.test(userAgent);
   const isDesktop = !isMobile && !isTablet;

   if (isMobile) return 'Mobile';
   if (isTablet) return 'Tablet';
   return 'Desktop';
};

export const isAccountComplete = (user: IAccountUser): boolean => {
   const {name, age, sex, description, image} = user;
   return !(name && age && sex && description && image !== '/assets/avatar-3o8LVFJJ.jpg'); // mocked default avatar
}