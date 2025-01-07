import {Drawer} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import Box from "@mui/material/Box";
import {getDeviceType} from "../../utils/hepler.ts";
import VerticalTabs from "./VerticalTab.tsx";
import chatBg from "../../assets/chatBachground.jpg";

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
                 backgroundSize: 'cover',
                 backgroundRepeat: 'no-repeat',
                 backgroundPosition: 'center',
                 opacity: 0.3,
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
                 <>
                    <VerticalTabs/>
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