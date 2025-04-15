import React, {useEffect, useRef, useState} from "react";
import {useLocation} from 'react-router-dom';
import {IconButton, Toolbar} from "@mui/material";
import {makeStyles} from "@mui/styles";
import Typography from '@mui/material/Typography';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import MenuIcon from '@mui/icons-material/Menu';
import {useAppDispatch, useAppSelector} from "../redux/hooks";
import {userSlice} from "../redux/store/slices/userSlice";
import EmailIcon from '@mui/icons-material/Email';
import {drawerSlice} from "../redux/store/slices/drawerSlice.ts";
import {toastSlice} from "../redux/store/slices/toastSlice.ts";
import {getOnline, getSelf} from "../api/tempApi/userApi.ts";

import defAvatar from "../assets/avatars/avatar.jpg";
import {useDetectTabClose} from "../utils/hooks.ts";
import {isAccountComplete} from "../utils/hepler.ts";
import {getUsersOnline} from "../api/UsersOnline.ts";


const useStyles = makeStyles(() => ({
   root: {
      backgroundColor: 'rgba(85, 155, 147, 1)',
      color: 'white',
   }
}))

// const IOSSwitch = styled((props: SwitchProps) => (
//     <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
// ))(({ theme }) => ({
//     width: 42,
//     height: 26,
//     padding: 0,
//     '& .MuiSwitch-switchBase': {
//         padding: 0,
//         margin: 2,
//         transitionDuration: '300ms',
//         '&.Mui-checked': {
//             transform: 'translateX(16px)',
//             color: '#purpure',
//             '& + .MuiSwitch-track': {
//                 backgroundColor: '#65C466',
//                 opacity: 1,
//                 border: 0,
//                 ...theme.applyStyles('dark', {
//                     backgroundColor: '#2ECA45',
//                 }),
//             },
//             '&.Mui-disabled + .MuiSwitch-track': {
//                 opacity: 0.5,
//             },
//         },
//         '&.Mui-focusVisible .MuiSwitch-thumb': {
//             color: '#33cf4d',
//             border: '6px solid #fff',
//         },
//         '&.Mui-disabled .MuiSwitch-thumb': {
//             color: theme.palette.grey[100],
//             ...theme.applyStyles('dark', {
//                 color: theme.palette.grey[600],
//             }),
//         },
//         '&.Mui-disabled + .MuiSwitch-track': {
//             opacity: 0.7,
//             ...theme.applyStyles('dark', {
//                 opacity: 0.3,
//             }),
//         },
//     },
//     '& .MuiSwitch-thumb': {
//         boxSizing: 'border-box',
//         width: 22,
//         height: 22,
//     },
//     '& .MuiSwitch-track': {
//         borderRadius: 26 / 2,
//         backgroundColor: '#E9E9EA',
//         opacity: 1,
//         transition: theme.transitions.create(['background-color'], {
//             duration: 500,
//         }),
//         ...theme.applyStyles('dark', {
//             backgroundColor: '#39393D',
//         }),
//     },
// }));
const Header = () => {
   const location = useLocation();
   useDetectTabClose();
   const classes = useStyles();
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
   const dispatch = useAppDispatch();
   const {isOnline, name, sex, age, description, image} = useAppSelector(state => state.user);
   const {toggleIsOnline, setLocation} = userSlice.actions;
   const {showToast} = toastSlice.actions;
   const {toggleOpenChat, openSideBar} = drawerSlice.actions;
   const {setUser} = userSlice.actions;
   const [isDisabledSwitcher, setIsDisabledSwitcher] = useState<boolean>(true);

   useEffect(() => {
      setIsDisabledSwitcher(isAccountComplete({image, name, sex, description, age}));
   }, [name, sex, age, description, image]);

   useEffect(() => {
      const fetchSelf = async () => {
         const token = localStorage.getItem('accessToken');
         const response = await getSelf(token!);

         if (response.status === 'success') {
            const {name, age, description, sex, is_online, image, lng, lat, email} = response.data;

            const data = {
               name,
               age,
               description,
               sex,
               isOnline: is_online === 1,
               image: image ? `/uploads/${image}` : defAvatar,
               lng,
               lat,
               email
            }
            dispatch(setUser(data))
         } else {
            dispatch(showToast({toastMessage: response?.data?.message ?? 'Something went wrong', toastType: 'danger'}))
         }
         return response;
      }

      fetchSelf().catch(() => {
         dispatch(showToast({toastMessage: 'Something went wrong', toastType: 'danger'}));
      })
   }, [])

   const toggleOnlineHandler = async () => {
      if (isOnline) {
         const data = {
            token: localStorage.getItem("accessToken"),
            is_online: 0,
            lat: null,
            lng: null
         }
         const response = await getOnline(data);
         if (response.status === 'success') {
            dispatch(setLocation({lat: null, lng: null}));
            dispatch(showToast({toastMessage: 'Offline', toastType: 'info'}));
            dispatch(toggleIsOnline());

            // if (intervalRef.current) {
            //    clearInterval(intervalRef.current);
            //    intervalRef.current = null;
            // }
         }
      } else {
         navigator.geolocation.getCurrentPosition(
             async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;

                const data = {
                   token: localStorage.getItem("accessToken"),
                   is_online: 1,
                   lat: latitude,
                   lng: longitude
                }
                const response = await getOnline(data);
                if (response.status === 'success') {
                   console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                   dispatch(setLocation({lat: latitude, lng: longitude}));
                   dispatch(showToast({toastMessage: "Online", toastType: "success"}));
                   dispatch(toggleIsOnline());
                   getUsersOnline();

                } else if (response.status === 'failed') {
                   dispatch(showToast({
                      toastMessage: response?.data?.message ?? 'Something went wrong',
                      toastType: "danger"
                   }));
                }
             },
             (error) => {
                console.error("Error with obtaining coords:", error);
                dispatch(showToast({toastMessage: "Something went wrong", toastType: "danger"}));
             }
         );
      }
   }

   useEffect(() => {
      if (!isOnline || location.pathname !== '/map') {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
         }
      } else if (isOnline && location.pathname === '/map') {
         intervalRef.current = setInterval(() => {
            getUsersOnline();
         }, 3000);
      }
   }, [isOnline, location.pathname]);

   return (
       <Toolbar className={classes.root} id='header'>
          <IconButton
              onClick={() => dispatch(openSideBar(true))}
              size="large"
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{mr: 2}}
          >
             <MenuIcon/>
          </IconButton>
          <IconButton onClick={() => dispatch(toggleOpenChat())}>
             <EmailIcon sx={{color: 'white'}}/>
          </IconButton>
          <Typography variant="h6" component="div" sx={{flexGrow: 1}}>
             People Meet
          </Typography>
          <FormGroup>
             <FormControlLabel
                 label={isOnline ? 'Online' : 'Offline'}
                 labelPlacement="start"
                 className='switcher'
                 control={
                    <Switch
                        style={{margin: 0}}
                        disabled={isDisabledSwitcher}
                        checked={isOnline}
                        onChange={() => toggleOnlineHandler()}
                        name="isonline"
                        sx={{
                           "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "rgba(39, 203, 202, 0.96)", // Цвет бегунка
                           },
                           "& .MuiSwitch-switchBase": {
                              color: "rgba(209, 171, 225, 1)", // Цвет бегунка
                           },
                           "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#3ebaa4f5", // Цвет дорожки, когда включено
                           },
                           ".MuiSwitch-track": {
                              backgroundColor: "#111", // Цвет дорожки, когда включено
                           },
                           "& .MuiSwitch-track": {
                              backgroundColor: "rgba(62, 186,164, 0.96)", // Цвет дорожки, когда выключено
                           },
                           "& .Mui-disabled .MuiSwitch-thumb": {
                              backgroundColor: "gray"
                           }
                        }}
                    />
                 }

             />
          </FormGroup>
          {/*<FormControlLabel*/}
          {/*    control={<IOSSwitch sx={{ m: 1 }} defaultChecked />}*/}
          {/*    label="iOS style"*/}
          {/*/>*/}

       </Toolbar>
   );
};

export default Header;