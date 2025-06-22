import React, {useEffect} from "react";
import {Drawer} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import Box from "@mui/material/Box";
import {getDeviceType} from "../../utils/hepler.ts";
import chatBg from "../../assets/chatBachground.jpg";
import ChatList from "./ChatList.tsx";
import CurrentChat from "./CurrentChat.tsx";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";
import MobileChatList from "./MobileChatList.tsx";

const ChatDrawer = () => {
   const deviceType = getDeviceType();
   const dispatch = useAppDispatch();
   const {isOpenChat} = useAppSelector(state => state.drawer);
   const {activeUser} = useAppSelector(state => state.chat);
   const {openChat} = drawerSlice.actions;
   const {setActiveUser} = chatSlice.actions;

   useEffect(() => {
      if (!isOpenChat) {dispatch(setActiveUser(null))}
   }, [isOpenChat]);

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
             height: `${deviceType !== 'Desktop' && activeUser ? '66vh' : '33vh'}`,
             overflow: 'hidden',
             display: "flex",
             background: 'transparent',
          }}>
             {deviceType === 'Desktop' ?
                 <Box
                     sx={{
                        flexGrow: 1,
                        paddingLeft: 0,
                        paddingRight: 0,
                        display: 'flex',
                        height: '100% '// <- важная хрень для прокрутки
                     }}
                 >
                    <ChatList/>
                    <CurrentChat/>
                 </Box> :
                 <>
                    {activeUser
                        ? <CurrentChat/>
                        : <MobileChatList/>
                    }

                 </>
             }
          </Box>
       </Drawer>
   )
}

export default ChatDrawer;