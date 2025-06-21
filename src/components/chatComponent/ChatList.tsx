import React, {useEffect, useState} from "react";
import Tabs from "@mui/material/Tabs";
import {Avatar, Badge, ListItem, ListItemAvatar, ListItemButton, ListItemText, Tab} from "@mui/material";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";
import {IUser} from "../../types.ts";
import {getUnreadIncomingCounts} from "../../utils/hepler.ts";
import {removeConversation} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import {Button} from "react-bootstrap";
import {makeStyles} from "@mui/styles";
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

const useStyles = makeStyles((theme: any) => ({
   tabRoot: {
      position: 'relative',
      overflow: 'hidden',
      '&:hover $trash': {
         right: 0,
      },
   },
   trash: {
      height: '100%',
      position: 'absolute',
      right: '-35px',
      transition: 'all 0.3s ease',
      minWidth: 0,
      padding: 4,
      zIndex: 10,

      '&:hover': {
         background: '#fff0f0',
         transition: 'background 0.3s ease',
      }
   },
}))

const ChatList = () => {
   const classes = useStyles();
   const [tabValue, setTabValue] = React.useState<number | false>(false);
   const [users, setUsers] = useState<IUser[]>([]);
   const [unreadMessages, setUnreadMessages] = useState<{ [id: number]: number }>({1: -100});
   const [openDialog, setOpenDialog] = useState(false);
   const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

   const dispatch = useAppDispatch();
   const {setActiveUser} = chatSlice.actions;
   const {activeUser, chatPartner, messages} = useAppSelector(state => state.chat);
   const {showToast} = toastSlice.actions;

   const handleAskDelete = (e: any, id: number) => {
      e.stopPropagation();
      setPendingDeleteId(id);
      setOpenDialog(true);
   };

   const handleConfirmDelete = () => {
      if (pendingDeleteId !== null) {
         removeChat(pendingDeleteId);
      }
      setOpenDialog(false);
      setPendingDeleteId(null);
   };

   const handleCancel = () => {
      setOpenDialog(false);
      setPendingDeleteId(null);
   };

   useEffect(() => {
      setUnreadMessages(getUnreadIncomingCounts(messages))
   }, [messages]);

   useEffect(() => {
      setUsers(Object.values(chatPartner));
   }, [chatPartner]);

   const tabRefs = React.useRef<(HTMLDivElement | null)[]>([]);

   const handleChange = (_: React.SyntheticEvent, newValue: number) => {
      const dialogWith: IUser = {...users[newValue]};
      const token = localStorage.getItem('accessToken');
      if (dialogWith && token) {
         dispatch(setActiveUser(dialogWith));
      }
   };

   useEffect(() => {
      if (!activeUser || !activeUser.id || users.length === 0) {
         setTabValue(false);
         return;
      }

      const activeIndex = users.findIndex(user => user.id === activeUser?.id);
      if (activeIndex !== -1) {
         setTabValue(activeIndex);

         setTimeout(() => {
            tabRefs.current[activeIndex]?.scrollIntoView({
               behavior: 'smooth',
               block: 'nearest',
            });
         }, 0);

      } else {
         setTabValue(false);
      }

   }, [users, activeUser]);

   const removeChat = async (id: number) => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
         return;
      }
      const response = await removeConversation(token, id);
      console.log('response', response)
      if (response.status === 'success') {
         dispatch(setActiveUser(null));
         dispatch(showToast({toastMessage: response.data.message, toastType: 'success'}));
      } else {
         dispatch(showToast({toastMessage: response.data.message, toastType: 'danger'}));
      }
   }

   return (
       <>
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
                const labelId = `tab-${id}`;

                return (
                    <Tab
                        ref={el => (tabRefs.current[index] = el)}
                        key={id}
                        value={index} // Привязка индекса
                        label={
                           <ListItem disablePadding>
                              <ListItemButton className={classes.tabRoot}>
                                 <ListItemAvatar>
                                    <Badge
                                        variant="dot"
                                        color="success"
                                        anchorOrigin={{vertical: 'bottom'}}
                                        invisible={!is_online}>
                                       <Avatar
                                           sx={{width: 50, height: 50}}
                                           alt={name}
                                           src={image}
                                       />
                                    </Badge>
                                 </ListItemAvatar>
                                 <Badge
                                     badgeContent={unreadMessages[id]}
                                     color="secondary"
                                 >
                                    <ListItemText
                                        sx={{
                                           color: activeUser?.id === id ? '#579b93' : 'inherit' // Цвет имени активного пользователя
                                        }}
                                        id={labelId}>{name}</ListItemText>

                                 </Badge>
                                 <Button
                                     className={classes.trash}
                                     variant="outlined"
                                     onClick={(e) => handleAskDelete(e, id)}
                                 >
                                    <DeleteOutlineIcon color='error'/>
                                 </Button>
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
          <Dialog
              open={openDialog}
              onClose={handleCancel}
          >
             <DialogTitle>Delete Chat</DialogTitle>
             <DialogContent>
                <DialogContentText>
                   Are you sure you want to delete this chat? This action cannot be undone.
                </DialogContentText>
             </DialogContent>
             <DialogActions>
                <Button onClick={handleCancel} color="primary">
                   Cancel
                </Button>
                <Button onClick={handleConfirmDelete} color="error" autoFocus>
                   Delete
                </Button>
             </DialogActions>
          </Dialog>
       </>
   )
}

export default ChatList;
