import React, {useState, useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {IChat} from "../../types.ts";
import {getMessages, readMessages, sendMessage} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import InfoOutlineIcon from '@mui/icons-material/InfoOutlined';
import {getDeviceType} from "../../utils/hepler.ts";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";
import {Avatar, Badge, Tabs, Tab, ListItem, ListItemAvatar, ListItemButton} from "@mui/material";
import {makeStyles} from "@mui/styles";

const styles = {
   paperBody: {
      display: "flex",
      flexDirection: "column",
      background: "transparent",
      overflowX: "auto",
      flex: 1
   }
}

const useStyles = makeStyles((theme: any) => ({
   tabRoot: {
      '&:hover $trash': {
         right: 0,
      },
      padding: 0,
   },
   trash: {
      height: '100%',
      position: 'absolute',
      right: '-35px',
      transition: 'all 0.3s ease',
      minWidth: 0,
      padding: 4,
      zIndex: 10,
      display: 'flex',
      alignItems: 'center',
      borderRadius: '8px 0 0 8px',

      '&:hover': {
         // background: '#d3e7ea',

         transition: 'background 0.3s ease',
      }
   }
}))

const CurrentChat = () => {
   const classes = useStyles();
   const dispatch = useAppDispatch();
   const deviceType = getDeviceType();
   const {setActiveUser, setDialogObject} = chatSlice.actions;
   const {activeUser, messages} = useAppSelector(state => state.chat);
   const {id} = useAppSelector(state => state.user);
   const {showToast} = toastSlice.actions;
   const [message, setMessage] = useState<string>("");
   const dummy = useRef<HTMLDivElement | null>(null);
   const [activeChat, setActiveChat] = useState<IChat[]>([]);

   const submitMessage = async () => {
      if (!message) {
         return;
      }
      const token = localStorage.getItem('accessToken');
      if (token && activeUser && typeof activeUser.id === 'number') {
         const resp = await sendMessage(token, activeUser.id, message);

         if (resp.status === 'success') {
            const response = await getMessages(token);
            dispatch(setDialogObject(response.data));
         } else {
            dispatch(showToast({toastMessage: 'Something went wrong', toastType: 'danger'}));
         }
      }
      setMessage('');
   }

   const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
         event.preventDefault();
         submitMessage();
      }
   }

   useEffect(() => {
      const token = localStorage.getItem('accessToken');
      if (token && activeUser && typeof activeUser.id === 'number' && messages) {
         setActiveChat(messages[activeUser.id]);
         readMessages(token, activeUser.id);
      }
   }, [activeUser, messages]);

   const keysLength = activeChat ? Object.keys(activeChat).length : 0;
   useEffect(() => {
      if (dummy.current) {
         dummy.current.scrollIntoView({behavior: "smooth"});
      }
   }, [keysLength]);

   return (
       <Box
           sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: '100%',
              padding: 0,
           }}
       >
          {activeUser &&
              <Tabs
                  scrollButtons={false}
                  variant="scrollable"
                  value={false}
                  orientation="horizontal"
                  sx={{
                     boxShadow: '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12)',
                     padding: 0,
                     maxWidth: '100%'
                  }}
              >
                  <Tab
                      sx={{
                         padding: 0,
                         maxWidth: '100%',
                         width: '100%',
                         WebkitBackdropFilter: 'blur(2px)',
                         backdropFilter: 'blur(2px)',
                      }}
                      label={
                         <ListItem disablePadding>
                            <ListItemButton className={classes.tabRoot} sx={{paddingRight: 0}}>
                               <ListItemAvatar>
                                  <Badge
                                      variant="dot"
                                      color="success"
                                      anchorOrigin={{vertical: 'bottom'}}
                                      invisible={!activeUser?.is_online}
                                  >
                                     <Avatar
                                         sx={{width: 50, height: 50}}
                                         alt="my photo"
                                         src={activeUser?.image ?? ""}
                                     />
                                  </Badge>
                               </ListItemAvatar>
                               <Typography variant='h6'>{activeUser.name}</Typography>
                               {deviceType !== 'Desktop'
                                   ? <IconButton
                                       onClick={() => dispatch(setActiveUser(null))}
                                       sx={{marginLeft: 'auto'}}
                                   >
                                      <ArrowBackIosNewIcon/>
                                   </IconButton>
                                   : <div className={classes.trash}><InfoOutlineIcon color='info'/></div>
                               }
                            </ListItemButton>
                         </ListItem>
                      }
                  />
              </Tabs>
          }
          <Box sx={styles.paperBody}>
             {activeChat && activeChat.map((con: any, idx) => {
                return (
                    <Box
                        key={idx}
                        sx={{
                           alignItems: con.sender_id === id ? "end" : "left",
                           position: "relative",
                           display: 'flex',
                           flexDirection: "column",
                           margin: "0.25rem",
                           height: 'fit-content'
                        }}
                    >
                       <Box
                           sx={{
                              background: con.sender_id === id ? '#b694dc' : '#8fd7da',
                              maxWidth: '75%',
                              color: 'white',
                              width: 'fit-content',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              wordBreak: 'break-word',
                              boxShadow: '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12);'
                           }}
                       >
                          {/*{ReactEmoji.emojify(con.message)}*/} {con.message_text}
                       </Box>

                       <Typography sx={{
                          display: "inline-block",
                          fontSize: "13px",
                          color: 'black'
                       }}>
                          {con.created_at.split(' ')[1]}
                       </Typography>
                    </Box>
                );
             })}
             <div ref={dummy}></div>
          </Box>

          {activeUser &&
              <Box
                  sx={{
                     display: 'flex',
                     alignItems: 'flex-end',
                     gap: 1,
                     boxShadow: '0px -2px 4px rgba(0, 0, 0, 0.12), 0px -2px 3px rgba(0, 0, 0, 0.06)'

                  }}
              >
                  <TextField
                      sx={{
                         width: "100%",
                         // padding: 0,
                         overflow: "auto",
                         padding: '0.4rem',
                         border: 'none',
                         '&:hover': {
                            border: 'none',
                         },
                         '& .MuiOutlinedInput-root': {
                            padding: 0,
                            border: 'none',
                         },
                         '& .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                         },
                         '&:hover .MuiOutlinedInput-notchedOutline': {
                            border: 'none',
                         },
                         '& .MuiInputBase-input': {
                            padding: 0.4 + 'rem',
                         },
                      }}
                      maxRows={5}
                      id="TextField-input-messag"
                      multiline
                      variant="outlined"
                      onKeyDown={handleKeyDown}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Let's go"
                  />
                  <Button
                      sx={{
                         background: '#559b93',
                         borderRadius: '8px',
                         marginBottom: '0.25rem'
                      }}
                      variant="contained"
                      onClick={submitMessage}
                  >
                     {/*send */}
                      <SendIcon sx={{rotate: '-33deg'}}/>
                  </Button>
              </Box>
          }

          {!activeUser &&
              <Typography sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}}
                          variant={'h5'}>Let's go!</Typography>}
       </Box>
   )
}

export default CurrentChat;