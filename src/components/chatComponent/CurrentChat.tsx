import React, {useState, useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {IChat, IUser} from "../../types.ts";
import {getMessages, readMessages, sendMessage} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import SendIcon from '@mui/icons-material/Send';
import IconButton from '@mui/material/IconButton';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import {getDeviceType} from "../../utils/hepler.ts";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";
import {Badge} from "@mui/material";

const styles = {
   paperBody: {
      display: "flex",
      flexDirection: "column",
      background: "transparent",
      overflowX: "auto",
      flex: 1
   }
}

const CurrentChat = () => {
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
      if (event.key === "Enter" && !event.shiftKey) { // Если нажата Enter без Shift
         event.preventDefault(); // Предотвращаем добавление новой строки
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

   useEffect(() => {
      if (dummy.current) {
         dummy.current.scrollIntoView({behavior: "smooth"});
      }
   }, [activeChat]);

   return (
       <Box
           sx={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              width: "100%",
              height: "100%",
              padding: 0,
           }}
       >
          <Box sx={{
             display: 'flex',
             alignItems: 'center',
             gap: '1rem',
             padding: '.25rem'
          }}>
             {activeUser && // todo 1 Сделать Когда ты становишься оффлайн -> делать оффлайн!!!!!
                 <Badge
                     variant="dot"
                     color="success"
                     anchorOrigin={{vertical: 'bottom'}}
                     invisible={!activeUser.is_online}
                 >
                     <Avatar
                         alt="Remy Sharp"
                         src={activeUser?.image ?? ""}
                     />
                 </Badge>
             }

             <Typography variant="subtitle2">
                {activeUser?.name ? `Chat with ${activeUser?.name}` : 'Start to chat with someone'}
             </Typography>

             {deviceType !== 'Desktop' &&
                 <IconButton onClick={() => dispatch(setActiveUser(null))}
                             sx={{marginLeft: 'auto'}}><ArrowBackIosNewIcon/></IconButton>
             }

          </Box>
          <Divider sx={{marginBottom: 'auto'}}/>
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
                           margin: "0.5rem",
                           height: 'fit-content'
                        }}
                    >
                       <Box
                           sx={{
                              background: con.sender_id === id ? '#b694dc' : '#8fd7da',
                              maxWidth: '50%',
                              color: 'white',
                              width: 'fit-content',
                              padding: '0.5rem',
                              borderRadius: '8px',
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
                  }}
              >
                  <TextField
                      sx={{
                         width: "100%",
                         maxHeight: "150px",
                         overflow: "auto",
                      }}
                      id="outlined-multiline-static"
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
                      }}
                      variant="contained"
                      onClick={submitMessage}
                  >
                     {/*send */}
                      <SendIcon sx={{rotate: '-33deg'}}/>
                  </Button>
              </Box>
          }
       </Box>
   )
}

export default CurrentChat;