export const getDeviceType = () => {
   const userAgent = navigator.userAgent.toLowerCase();
   const isMobile = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/.test(userAgent);
   const isTablet = /ipad|android(?!.*mobile)/.test(userAgent);
   const isDesktop = !isMobile && !isTablet;

   if (isMobile) return 'Mobile';
   if (isTablet) return 'Tablet';
   return 'Desktop';
};
