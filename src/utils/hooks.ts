import {useState, useEffect, useRef} from 'react';
import {getOnline, getSelf} from "../api/tempApi/userApi.ts";
import {useAppDispatch} from "../redux/hooks";
import {userSlice} from "../redux/store/slices/userSlice.ts";
import {IMessages} from "../types.ts";
import sound from '../../public/message2.mp3';

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
   const dispatch = useAppDispatch();
   const { setUserField } = userSlice.actions;

   useEffect(() => {
      const handleTabInactive = () => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }

         timeoutRef.current = setTimeout(async () => {
            timeoutRef.current = null;

            const token = localStorage.getItem("accessToken");
            console.log("🕑 Tab was inactive for 2 minutes!");

            try {
               await getOnline({
                  token,
                  is_online: 0,
                  lat: null,
                  lng: null,
               });

               if (token) {
                  const self: any = await getSelf(token);
                  const isOnline = self.data.is_online === 1;
                  dispatch(setUserField({field: 'is_online', value: isOnline}));
                  dispatch(setUserField({field: 'isOnline', value: isOnline}));
                  dispatch(setUserField({field: 'lng', value: null}));
                  dispatch(setUserField({field: 'lat', value: null}));
               }
            } catch (error) {
               console.error("❌ Error setting user offline:", error);
            }
         }, 2 * 60 * 1000); // 2 minutes
      };

      const handleTabActive = () => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
            console.log("✅ Tab became active, timeout cleared");
         } else {
            console.log("🟢 Tab became active, but timeout already expired");
         }
      };

      const onVisibilityChange = () => {
         if (document.hidden) {
            console.log("📴 Tab hidden");
            handleTabInactive();
         } else {
            handleTabActive();
         }
      };

      document.addEventListener("visibilitychange", onVisibilityChange);

      return () => {
         if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
         }
         document.removeEventListener("visibilitychange", onVisibilityChange);
      };
   }, []);
};

export const useSelfPolling = () => {
   const dispatch = useAppDispatch();

   const { setUserField } = userSlice.actions;
   const intervalRef = useRef<NodeJS.Timeout | null>(null);

   useEffect(() => {
      const fetchSelf = async () => {
         const token = localStorage.getItem("accessToken");
         if (!token) return;

         try {
            const self: any = await getSelf(token);

            const isOnline = self.data.is_online === 1;
            dispatch(setUserField({field: 'is_online', value: isOnline}));
            dispatch(setUserField({field: 'isOnline', value: isOnline}));
            dispatch(setUserField({field: 'lng', value: self.data.lng}));
            dispatch(setUserField({field: 'lat', value: self.data.lat}));
         } catch (error) {
            console.error("Error polling /self:", error);
         }
      }
      fetchSelf();

      intervalRef.current = setInterval(fetchSelf, 2 * 60 * 1000);

      return () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
         }
      };
   })
}
/* TEST FOR SOUND for MOBILE*/
export const useMessageSound = (receiveMessages: IMessages) => {
   const prevObj = useRef<IMessages>({});
   const [isAudioUnlocked, setIsAudioUnlocked] = useState(false);
   const audioRef = useRef<HTMLAudioElement | null>(null);

   // Создаём и разблокируем звук после первого взаимодействия
   useEffect(() => {
      audioRef.current = new Audio(sound);

      const unlockAudio = () => {
         if (!audioRef.current) return;
         audioRef.current.play().catch(() => {}); // тихий "пинок"
         audioRef.current.pause();
         audioRef.current.currentTime = 0;
         setIsAudioUnlocked(true);

         document.removeEventListener("click", unlockAudio);
         document.removeEventListener("touchstart", unlockAudio);
         document.removeEventListener("keydown", unlockAudio);
      };

      document.addEventListener("click", unlockAudio);
      document.addEventListener("touchstart", unlockAudio); // для телефонов
      document.addEventListener("keydown", unlockAudio);

      return () => {
         document.removeEventListener("click", unlockAudio);
         document.removeEventListener("touchstart", unlockAudio);
         document.removeEventListener("keydown", unlockAudio);
      };
   }, []);

   // Следим за изменениями сообщений
   useEffect(() => {
      const isEmpty = (obj: IMessages) => Object.keys(obj).length === 0;
      const isChanged = (a: IMessages, b: IMessages) => {
         const aKeys = Object.keys(a);
         const bKeys = Object.keys(b);
         if (aKeys.length !== bKeys.length) return true;
         return aKeys.some(key => a[key] !== b[key]);
      };

      if (
          isAudioUnlocked &&
          !isEmpty(receiveMessages) &&
          isChanged(receiveMessages, prevObj.current)
      ) {
         audioRef.current?.play().catch(() => {});
      }

      prevObj.current = receiveMessages;
   }, [receiveMessages, isAudioUnlocked]);
};