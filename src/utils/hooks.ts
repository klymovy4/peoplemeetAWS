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

export const useDetectTabClose = () => {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const hasReturned = useRef(false);
    const dispatch = useAppDispatch();
    const {setUserField, setLocation} = userSlice.actions;

   useEffect(() => {
      const handleTabInactive = () => {
         hasReturned.current = false;

         timeoutRef.current = setTimeout(async () => {
            if (!hasReturned.current) {
               const data = {
                  token: localStorage.getItem('accessToken'),
                  is_online: 0,
                  lat: null,
                  lng: null
               }
               let resp = await getOnline(data);
               if (resp.status === 'success') {
                  dispatch(setUserField({field: 'isOnline', value: resp.data.is_online === 1}));
                  dispatch(setLocation({lat: null, lng: null}));
               }
            }
         }, 120000); // 2 minutes
      };

      const handleTabActive = async () => {
         hasReturned.current = true;
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }
         const token = localStorage.getItem('accessToken');
         let resp = await getSelf(token!);
         if (resp.status === 'success') {
            dispatch(setUserField({field: 'isOnline', value: resp.data.is_online === 1}));
            dispatch(setLocation({lat: resp.data.lat, lng: resp.data.lng}));
         }
      };

      document.addEventListener("visibilitychange", () => {
         if (document.hidden) {
            handleTabInactive();
         } else {
            handleTabActive().catch(console.error);
         }
      });

      window.addEventListener("beforeunload", handleTabInactive);

      return () => {
         document.removeEventListener("visibilitychange", handleTabInactive);
         window.removeEventListener("beforeunload", handleTabInactive);
      };
   }, []);
};
