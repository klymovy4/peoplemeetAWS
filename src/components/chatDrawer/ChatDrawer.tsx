import {Drawer} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import Box from "@mui/material/Box";
import UserChatList from "../userChatList/userChatList.tsx";
import Chat from "../chat/Chat.tsx";
import {getDeviceType} from "../../utils/hepler.ts";

const ChatDrawer = () => {
   const deviceType = getDeviceType();
   console.log(deviceType);
   const dispatch = useAppDispatch();
   const {isOpenChat} = useAppSelector(state => state.drawer);
   const {openChat} = drawerSlice.actions;

   // last work was here todo 1
   return (
       <Drawer
           anchor={'bottom'}
           open={isOpenChat}
           onClose={() => dispatch(openChat(false))}
       >
          <Box sx={{margin: '1rem', border: '1px solid red'}}>
             {deviceType === 'Desktop' ?
                 <>
                     <UserChatList/>
                     {deviceType}
                     <Chat/>
                 </> :
                 <>
                 Chat Mobile here
                 </>
             }
          </Box>
       </Drawer>
   )
}

export default ChatDrawer;