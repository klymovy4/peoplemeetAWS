import {IAccountUser, IUser} from "../types.ts";

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

type MessageMap = Record<number, Message[]>;
type Message = {
   created_at: string,
   id: number,
   is_read: 0 | 1,
   message_text: string,
   receiver_id: number,
   sender_id: number
};

export const getUnreadIncomingCounts = (chatMap: MessageMap): Record<number, number> => {
   const result: Record<number, number> = {};

   for (const [userIdStr, messages] of Object.entries(chatMap)) {
      const userId = Number(userIdStr);

      const unreadCount = messages.filter(
          (msg) => msg.sender_id === userId && msg.is_read === 0
      ).length;

      if (unreadCount > 0) {
         result[userId] = unreadCount;
      }
   }
   return result;
}

let rad = function (x: number) {
   return x * Math.PI / 180;
};

export const getDistanceToTarget = (p1: IUser, p2: IUser): string => {
   if (p1.lat == null || p1.lng == null || p2.lat == null || p2.lng == null) {
      throw new Error("Latitude and longitude must not be null");
   }
   let R = 6378137; // Earth’s mean radius in meter
   let dLat = rad(p2.lat - p1.lat);
   let dLong = rad(p2.lng - p1.lng);
   let a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
       Math.cos(rad(p1.lat)) * Math.cos(rad(p2.lat)) *
       Math.sin(dLong / 2) * Math.sin(dLong / 2);
   let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
   const d = R * c;

   return d > 1000 ? `${(d / 1000).toFixed(1)} km` : `${Math.round(d)} m`;
}