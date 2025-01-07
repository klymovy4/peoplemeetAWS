import React from 'react';
import Box from '@mui/material/Box';
import ChatList from "./ChatList.tsx";
import CurrentChat from "./CurrentChat.tsx";

export default function VerticalTabs() {
   return (
       <Box
           sx={{
              flexGrow: 1,
              paddingLeft: 0,
              display: 'flex',
              // height: 250 <- важная хрень для прокрутки
       }}
       >
          {/* // remove vertical tab*/}
          <ChatList />
          <CurrentChat />
       </Box>
   );
}