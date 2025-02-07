import {useState, useEffect} from "react";
import {Box, Drawer, ListItemButton, ListItemIcon, ListItemText} from "@mui/material";
import defaultAvatar from "../../assets/avatars/avatar.jpg";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import RoomIcon from "@mui/icons-material/Room";
import Divider from "@mui/material/Divider";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import SmsFailedIcon from "@mui/icons-material/SmsFailed";
import {useNavigate} from "react-router-dom";
import {makeStyles} from "@mui/styles";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";

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
   const {logout} = userSlice.actions;
   const {showToast} = toastSlice.actions;
   const navigate = useNavigate();
   const {isOpenSideBar} = useAppSelector(state => state.drawer);
   const {image, name, description, age, sex} = useAppSelector(state => state.user);
   const {openSideBar} =    drawerSlice.actions;
   const [disableMapBtn, setDisableMapBtn] = useState<boolean>(true);
   const logoutHandler = () => {
      localStorage.removeItem('accessToken');
      navigate('/login');
      dispatch(logout());
      dispatch(showToast({toastMessage: 'Logout successful', toastType: 'success'}));
   }

   useEffect(() => {
      if (!description || !age || !sex) {
         setDisableMapBtn(true);
      } else {
         setDisableMapBtn(false);
      }
   }, [description, age, sex])

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
                     backgroundImage: `url(${image ? image : defaultAvatar})`,
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
                <ListItemButton disabled={disableMapBtn} onClick={() => navigate('/map')}>
                   <ListItemIcon>
                      <RoomIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'Map'}/>
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

                <ListItemButton onClick={() => logoutHandler()}>
                   <ListItemIcon>
                      <LogoutIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'Logout'}/>
                </ListItemButton>


                <ListItemButton>
                   <ListItemIcon>
                      <SmsFailedIcon/>
                   </ListItemIcon>
                   <ListItemText primary={'v: v0.0.27'}/>
                </ListItemButton>
             </List>
          </Box>
       </Drawer>
   )
}

export default SideBar;