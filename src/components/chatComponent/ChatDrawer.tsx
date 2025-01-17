import {Drawer} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import Box from "@mui/material/Box";
import {getDeviceType} from "../../utils/hepler.ts";
import chatBg from "../../assets/chatBachground.jpg";
import ChatList from "./ChatList.tsx";
import CurrentChat from "./CurrentChat.tsx";
import React from "react";

const ChatDrawer = () => {
   const deviceType = getDeviceType();
   const dispatch = useAppDispatch();
   const {isOpenChat} = useAppSelector(state => state.drawer);
   const {openChat} = drawerSlice.actions;
   // last work was here todo 1
   return (
       <Drawer
           sx={{
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              '& .MuiPaper-root::before': {
                 content: '""',
                 position: 'absolute',
                 top: 0,
                 left: 0,
                 width: '100%',
                 height: '100%',
                 backgroundImage: `url(${chatBg})`,
                 filter: 'brightness(90%)', /* 50% яркости */
                 backgroundSize: 'cover',
                 backgroundRepeat: 'no-repeat',
                 backgroundPosition: 'center',
                 opacity: 0.2,
                 zIndex: -1,
              },
           }}
           // className="bottomDrawer"
           anchor={'bottom'}
           open={isOpenChat}
           onClose={() => dispatch(openChat(false))}
       >
          <Box className="row" sx={{
             margin: '0.3rem',
             height: '33vh',
             overflow: 'hidden',
             display: "flex",
             background: 'transparent',
          }}>
             {deviceType === 'Desktop' ?
                 <Box
                     sx={{
                        flexGrow: 1,
                        paddingLeft: 0,
                        display: 'flex',
                        height: '100% '// <- важная хрень для прокрутки
                     }}
                 >
                    <ChatList/>
                    <CurrentChat/>
                 </Box> :
                 <>
                    Chat Mobile here
                 </>
             }
          </Box>
       </Drawer>
   )
}

export default ChatDrawer;