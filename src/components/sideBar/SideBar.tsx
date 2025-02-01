import {Box, Drawer, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import defaultAvatar from "../../assets/avatars/Sss.png";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import RoomIcon from "@mui/icons-material/Room";
import MailIcon from "@mui/icons-material/Mail";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import SmsFailedIcon from "@mui/icons-material/SmsFailed";
import {useNavigate} from "react-router-dom";
import {useState} from "react";
import {makeStyles} from "@mui/styles";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";

const useStyles = makeStyles(() => ({
   root: {
      backgroundColor: 'rgba(85, 155, 147, 1)',
      color: 'white',
   },

   drawerWrapper: {
      width: '250px',
      height: '100%',
      display: 'flex',
      flexDirection: 'column'
   },
   drawerHeader: {
      height: '200px!important',
      display: 'flex',
      alignItems: 'flex-start',
      padding: '10px 0',
      // ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
   },
   userName: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translate(-50%)',
      color: 'white'
   },
   feedback: {
      marginTop: 'auto'
   },
   icons: {}
}))

const SideBar = () => {
   const cls = useStyles();
   const dispatch = useAppDispatch();
   const navigate = useNavigate();
   const {isOpenSideBar} = useAppSelector(state => state.drawer);
   const {openSideBar} =    drawerSlice.actions;
   const [name, setName] = useState<string>('Ro..');
   const [avatar, setAvatar] = useState<any>('')

   return (
       <Drawer
           anchor="left"
           open={isOpenSideBar}
           onClose={()=> dispatch(openSideBar(false))}
       >
          <Box className={cls.drawerWrapper} onClick={()=> dispatch(openSideBar(false))}>
             <Box className={cls.drawerHeader}
                  style={{
                     position: 'relative',
                     backgroundImage: `url(${avatar ? avatar : defaultAvatar})`,
                     backgroundRepeat: 'no-repeat',
                     backgroundPosition: 'center center',
                     backgroundSize: 'cover',
                     minHeight: '220px'
                  }}
             >
                <Typography variant="h4" align='center' className={cls.userName}>
                   {name}
                </Typography>
             </Box>
             <List>
                <ListItemButton onClick={() => navigate('/map')}>
                   <ListItemIcon>
                      <RoomIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'Map'}/>
                </ListItemButton>

                <ListItemButton onClick={() => navigate('/chat')}>
                   <ListItemIcon>
                      <MailIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'Messages'}/>
                </ListItemButton>

                <Divider/>

                <ListItemButton onClick={() => navigate('/profile')}>
                   <ListItemIcon>
                      <PersonIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'My account'}/>
                </ListItemButton>
             </List>

             <List sx={{marginTop: 'auto'}}>
                <Divider/>

                <ListItemButton onClick={() => console.log('logoutuid)')}>
                   <ListItemIcon>
                      <LogoutIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'Logout'}/>
                </ListItemButton>


                <ListItemButton onClick={() => console.log('logoutuid)')}>
                   <ListItemIcon>
                      <SmsFailedIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'v: v0.0.8'}/>
                </ListItemButton>
             </List>
          </Box>
       </Drawer>
   )
}

export default SideBar;