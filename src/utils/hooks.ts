import {useState, useEffect, useRef} from 'react';
import {getOnline, getSelf} from "../api/tempApi/userApi.ts";
import {useAppDispatch} from "../redux/hooks";
import {userSlice} from "../redux/store/slices/userSlice.ts";

export const useHeaderHeight = (): number => {
   const [headerHeight, setHeaderHeight] = useState<number>(0);

   useEffect(() => {
      const updateHeight = () => {
         const header = document.getElementById('header');
         if (header) {
            setHeaderHeight(header.offsetHeight);
         }
      };

      updateHeight();

      window.addEventListener('resize', updateHeight);
      return () => {
         window.removeEventListener('resize', updateHeight);
      };
   }, []);

   return headerHeight + 2;
};

export const useVisibleTab = () => {
   const timeoutRef = useRef<NodeJS.Timeout | null>(null);
   const hasReturned = useRef(false);
   const dispatch = useAppDispatch();
   const {setUserField} = userSlice.actions;

   useEffect(() => {
      const handleTabInactive = () => {
         hasReturned.current = false;

         // Clear prev timer if it is
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }

         // Run new timer
         timeoutRef.current = setTimeout(async () => {
            if (!hasReturned.current) {
               const token =  localStorage.getItem("accessToken");
               console.log('Tab was inactive for 2 minutes!');
               const data = {
                  token: token,
                  is_online: 0,
                  lat: null,
                  lng: null,
               };

               await getOnline(data);
               if (token) {
                  const self: any = await getSelf(token);
                  const isOnline = self.data.is_online === 1;
                  dispatch(setUserField({field: 'is_online', value: isOnline}));
                  dispatch(setUserField({field: 'isOnline', value: isOnline}));
                  dispatch(setUserField({field: 'lng', value: null}));
                  dispatch(setUserField({field: 'lat', value: null}));
               }
            }
         }, 120000); // 2 minutes
      };

      const handleTabActive = () => {
         hasReturned.current = true;
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            console.log('Tab became active, timeout cleared');
         }
      };

      document.addEventListener("visibilitychange", () => {
         if (document.hidden) {
            handleTabInactive();
            console.log('Tab hidden')
         } else {
            handleTabActive();
         }
      });

      return () => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }
         document.removeEventListener("visibilitychange", handleTabInactive);
      };
   }, []);
};
