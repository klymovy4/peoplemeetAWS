import React, {useEffect, useRef, useState} from "react";
import {IconButton, Toolbar, Badge} from "@mui/material";
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
import {getMessages, getOnline, getSelf} from "../api/tempApi/userApi.ts";

import defAvatar from "../assets/avatars/avatar.jpg";
import {useMessageSound, useVisibleTab} from "../utils/hooks.ts";
import {getUnreadIncomingCounts, isAccountComplete} from "../utils/hepler.ts";
import {getUsersOnline} from "../api/tempApi/UsersOnline.ts";
import {chatSlice} from "../redux/store/slices/chatSlice.ts";
import {useNavigate} from "react-router-dom";
import {IMessages, IUser} from "../types.ts";
import sound from '../../public/message2.mp3';
import {showToast} from "../utils/toast.ts";

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
   useVisibleTab();
   const navigate = useNavigate();
   const baseUrl = import.meta.env.VITE_API_URL;
   const classes = useStyles();
   const dispatch = useAppDispatch();
   const {isOnline, name, sex, age, description, image} = useAppSelector(state => state.user);
   const {activeUser} = useAppSelector(state => state.chat);
   const activeUserRef = useRef<IUser | null>(activeUser);
   const {toggleIsOnline, setLocation, setUser} = userSlice.actions;
   const {setDialogObject, setActiveUser} = chatSlice.actions;
   const {toggleOpenChat, openSideBar} = drawerSlice.actions;
   const [isDisabledSwitcher, setIsDisabledSwitcher] = useState<boolean>(true);
   const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
   const [receiveMessages, setReceiveMessages] = useState<IMessages | {}>({});
   const prevObj = useRef<IMessages | {}>({});

   // /* Create sound on receive messages*/
   // useEffect(() => {
   //    const isEmpty = (receiveMessages: IMessages) => Object.keys(receiveMessages).length === 0;
   //    const isChanged = (a: IMessages, b: IMessages) => {
   //       const aKeys = Object.keys(a);
   //       const bKeys = Object.keys(b);
   //       if (aKeys.length !== bKeys.length) return true;
   //       return aKeys.some(key => a[key] !== b[key]);
   //    };
   //
   //    if (!isEmpty(receiveMessages) && isChanged(receiveMessages, prevObj.current)) {
   //       const audio = new Audio(sound);
   //       audio.play();
   //    }
   //    prevObj.current = receiveMessages;
   // }, [receiveMessages]);

   /* TEST FOR SOUND*/
   useMessageSound(receiveMessages);

   useEffect(() => {
      setIsDisabledSwitcher(isAccountComplete({image, name, sex, description, age}));
   }, [name, sex, age, description, image]);

   useEffect(() => {
      activeUserRef.current = activeUser;
   }, [activeUser]);

   useEffect(() => {
      const poll = async () => {
         const token = localStorage.getItem("accessToken");
         if (!token) {
            localStorage.removeItem('accessToken');
            navigate('/login');
            showToast({toastMessage: 'Token is required', toastType: 'error'});
            return;
         }
         try {
            const resp = await getMessages(token);
            if (resp.status === 'success') {
               dispatch(setDialogObject(resp.data));
               const chatWithUsers = resp.data.users;
               if (activeUserRef.current && Object.keys(chatWithUsers).length > 0) {
                  const {name, is_online, description, sex, age} = chatWithUsers[activeUserRef?.current?.id];
                  const updatedIsActiveUser = {
                     ...activeUserRef.current,
                     is_online,
                     name,
                     age,
                     sex,
                     description,
                  }
                  dispatch(setActiveUser(updatedIsActiveUser));
               }
               const result = getUnreadIncomingCounts(resp.data.messages);
               setReceiveMessages(result);
               setUnreadMessagesCount(Object.keys(result).length);
            } else {
               if (resp.data?.message === 'Invalid or expired token') {
                  localStorage.removeItem('accessToken');
                  navigate('/login');
               }
               showToast({toastMessage: resp.data.message, toastType: 'error'});
            }
         } catch (err) {
            console.error('Polling error:', err);
         }
      };

      poll();
      const interval = setInterval(poll, 5000);
      return () => clearInterval(interval);
   }, [])

   useEffect(() => {
      const fetchSelf = async () => {
         const token = localStorage.getItem('accessToken');
         const response = await getSelf(token!);

         if (response.status === 'success') {
            const {name, age, description, sex, is_online, image, lng, lat, email, id, thoughts} = response.data;

            const data = {
               id,
               name,
               age,
               description,
               sex,
               isOnline: is_online === 1,
               image: image ? `${baseUrl}/uploads/${image}` : defAvatar,
               lng,
               lat,
               email,
               thoughts
            }
            dispatch(setUser(data))
         } else {
            showToast({toastMessage: response?.data?.message ?? 'Something went wrong', toastType: 'error'})
         }
         return response;
      }

      fetchSelf().catch(() => {
         showToast({toastMessage: 'Something went wrong', toastType: 'error'});
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
            showToast({toastMessage: 'Offline', toastType: 'info'});
            dispatch(toggleIsOnline());
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
                   navigate('/map');
                   console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
                   dispatch(setLocation({lat: latitude, lng: longitude}));
                   showToast({toastMessage: "Online", toastType: "success"});
                   dispatch(toggleIsOnline());
                   getUsersOnline();

                } else if (response.status === 'failed') {
                   showToast({
                      toastMessage: response?.data?.message ?? 'Something went wrong',
                      toastType: "error"
                   });
                }
             },
             (error) => {
                console.error("Error with obtaining coords:", error);
                showToast({toastMessage: "Something went wrong", toastType: "error"});
             }
         );
      }
   }

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
             <Badge badgeContent={unreadMessagesCount} color="secondary">
                <EmailIcon sx={{color: 'white'}} />
             </Badge>
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
                              color: "rgba(39, 203, 202, 0.96)",
                           },
                           "& .MuiSwitch-switchBase": {
                              color: "rgba(209, 171, 225, 1)",
                           },
                           "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#3ebaa4f5",
                           },
                           ".MuiSwitch-track": {
                              backgroundColor: "#111",
                           },
                           "& .MuiSwitch-track": {
                              backgroundColor: "rgba(62, 186,164, 0.96)",
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