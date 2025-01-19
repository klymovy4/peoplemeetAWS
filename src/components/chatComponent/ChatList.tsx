import React, {useEffect} from "react";
import Tabs from "@mui/material/Tabs";
import mockedUsers from "../../mockedData/mockedUsers.json";
import Tab from "@mui/material/Tab";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Avatar from "@mui/material/Avatar";
import ListItemText from "@mui/material/ListItemText";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";


const ChatList = () => {
   const [value, setValue] = React.useState(0);

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
   const {activeUser} = useAppSelector(state => state.chat);
   const tabRefs = React.useRef<(HTMLDivElement | null)[]>([]);

   const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      const dialogWith = mockedUsers[newValue];

      if (dialogWith) {
         dispatch(setActiveUser(dialogWith));
         setValue(newValue);
      }
   };

   useEffect(() => {
      const activeIndex = mockedUsers.findIndex(user => user.id === activeUser?.id);

      if (activeIndex !== -1) {
         setValue(activeIndex);
      }
      tabRefs.current[activeIndex]?.scrollIntoView({
         behavior: 'smooth',
         block: 'nearest',
      });

   }, [activeUser]);


   return (
       <Tabs
           scrollButtons={false} // Убираем кнопки прокрутки
           orientation="vertical"
           variant="scrollable"
           value={value}
           indicatorColor="secondary"
           onChange={handleChange}
           aria-label="Vertical tabs example"
           sx={{
              borderRight: 1,
              background: 'transparent',
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                 backgroundColor: '#579b93'
              }
           }}
       >
          {/*{sortedUsers.map((user, index) => { // for sorted users */}
          {mockedUsers.map((user, index) => {
             const {id, name, avatar} = user;
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
                                 <Avatar alt={name} src={avatar}/>
                              </ListItemAvatar>
                              <ListItemText
                                  sx={{

                                     color: activeUser?.id === id ? '#579b93' : 'inherit' // Цвет имени активного пользователя
                                  }}
                                  id={labelId}>{name}</ListItemText>
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