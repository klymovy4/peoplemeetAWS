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