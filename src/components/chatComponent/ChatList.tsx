import React, {useEffect, useState} from "react";
import Tabs from "@mui/material/Tabs";
import {Avatar, Badge, ListItem, ListItemAvatar, ListItemButton, ListItemText, Tab} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";
import {IChat, IUser} from "../../types.ts";
import {getUnreadIncomingCounts} from "../../utils/hepler.ts";
import {readMessages} from "../../api/tempApi/userApi.ts";

const baseApi = import.meta.env.VITE_API_URL;
const ChatList = () => {
   const [tabValue, setTabValue] = React.useState(0);
   const [users, setUsers] = useState<IUser[]>([]);
   const [unreadMessages, setUnreadMessages] = useState<{[id: string]: number} | {}>({});
   // const sortedUsers = React.useMemo(() => {
   //    debugger
   //    if (activeUser) {
   //       const index = mockedUsers.findIndex(user => user.id === activeUser.id);
   //       if (index !== -1) {
   //          const active = mockedUsers[index];
   //          const others = mockedUsers.filter(user => user.id !== activeUser.id);
   //          return [active, ...others]; // Ставим активного пользователя первым
   //       }
   //    }
   //    return mockedUsers;
   // }, [activeUser]); todo Conflicts with id , index and active user/ Temporary make scroll to active user!!!

   const dispatch = useAppDispatch();
   const {setActiveUser} = chatSlice.actions;
   const {activeUser, chatPartner, messages} = useAppSelector(state => state.chat);

   useEffect(() => {
      setUnreadMessages(getUnreadIncomingCounts(messages))
   }, [messages]);

   useEffect(() => {
      const users: IUser[] = Object.values(chatPartner);
      /* Set active user by default */
      if (!activeUser && users.length > 0) {
         const firstUser = { ...users[0], image: `${baseApi}/uploads/${users[0].image}` };
         dispatch(setActiveUser(firstUser));
      }


      setUsers(users);
   }, [chatPartner]);

   const tabRefs = React.useRef<(HTMLDivElement | null)[]>([]);

   const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      debugger
      const dialogWith: IUser = {...users[newValue]};
      dialogWith.image = `${baseApi}/uploads/${dialogWith.image}`;
      const token = localStorage.getItem('accessToken');
      if (dialogWith && token) {
         dispatch(setActiveUser(dialogWith));
         readMessages(token, dialogWith.id);
      }
   };

   useEffect(() => {
      if (users.length === 0 || !activeUser?.id) { return; }
      const activeIndex = users.findIndex(user => user.id === activeUser?.id);
      if (activeIndex !== -1) {
         setTabValue(activeIndex);
      }
      tabRefs.current[activeIndex]?.scrollIntoView({
         behavior: 'smooth',
         block: 'nearest',
      });
   }, [users, activeUser]);

   return (
       <Tabs
           scrollButtons={false} // Убираем кнопки прокрутки
           orientation="vertical"
           variant="scrollable"
           value={tabValue}
           indicatorColor="secondary"
           onChange={handleChange}
           aria-label="Vertical tabs example"
           sx={{
              minWidth: '200px',
              borderRight: 1,
              background: 'transparent',
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                 backgroundColor: '#579b93'
              }
           }}
       >
          {/*{sortedUsers.map((user, index) => { // for sorted users */}
          {users.map((user, index) => {
             const {id, name, image, is_online} = user;
             const unreadId = Number(Object.keys(unreadMessages)[0]);
             const unreadCount = Object.values(unreadMessages)[0];
             const labelId = `tab-${id}`;

             return (
                 <Tab
                     ref={el => (tabRefs.current[index] = el)}
                     key={id}
                     value={index} // Привязка индекса
                     label={
                        <ListItem disablePadding>
                           <ListItemButton>
                              <ListItemAvatar>
                                 <Badge
                                     variant="dot"
                                     color="success"
                                     anchorOrigin={{vertical: 'bottom'}}
                                     invisible={!is_online}>
                                    <Avatar
                                        sx={{width: 50, height: 50}}
                                        alt={name}
                                        src={`${baseApi}/uploads/${image}`}
                                    />
                                 </Badge>
                              </ListItemAvatar>
                              <Badge
                                  badgeContent={unreadId === id && unreadCount}
                                  invisible={unreadId !== id}
                                  color="primary"
                              >
                                 <ListItemText
                                     sx={{
                                        color: activeUser?.id === id ? '#579b93' : 'inherit' // Цвет имени активного пользователя
                                     }}
                                     id={labelId}>{name}</ListItemText>

                              </Badge>
                           </ListItemButton>
                        </ListItem>
                     }
                     sx={{
                        padding: 0,
                        // background: 'transparent',
                        background: activeUser?.id === id ? 'rgba(240, 240, 240, 0.8)' : 'transparent',
                        textTransform: 'none',
                        backdropFilter: activeUser?.id === id ? 'blur(3px)' : 'none',

                     }}
                 />
             );
          })}
       </Tabs>
   )
}

export default ChatList;