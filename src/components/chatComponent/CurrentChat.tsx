import React, {useState, useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import currentChat from '../../mockedData/mockedChat.json'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {IChat} from "../../types.ts";
import {getMessages, readMessages, sendMessage} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";

const styles = {
   paperBody: {
      display: "flex",
      flexDirection: "column",
      background: "transparent",
      overflowX: "auto",
   }
}

const CurrentChat = () => {
   const dispatch = useAppDispatch();
   const {activeUser, messages} = useAppSelector(state => state.chat);
   const {id} = useAppSelector(state => state.user);
   const {showToast} = toastSlice.actions;
   const [message, setMessage] = useState<string>("");
   const dummy = useRef<HTMLDivElement | null>(null);
   const [localChat, setLocalChat] = useState<string[]>(currentChat)
   const [activeChat, setActiveChat] = useState<IChat[]>([]);

   const submitMessage = async () => {
      const token = localStorage.getItem('accessToken');
      if (token &&  activeUser && typeof activeUser.id === 'number') {
         const resp = await sendMessage(token, activeUser.id, message);

         if (resp.status === 'success') {
            getMessages(token);
         } else {
            dispatch(showToast({toastMessage: 'Something went wrong', toastType: 'danger'}));
         }
      }

      const chat = localChat;
      chat.push(message);
      setLocalChat(chat);
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
              justifyContent: "space-between",
           }}
       >
          <Box sx={{marginLeft: '0.5rem', display: 'flex', alignItems: 'end', gap: '1rem'}}>
             <Avatar
                 alt="Remy Sharp"
                 src={activeUser?.image ?? ""}
             />
             <Typography variant="subtitle2" gutterBottom>
                Chat with {activeUser?.name ?? ''}
             </Typography>
          </Box>
          <Divider sx={{marginTop: '0.5rem'}}/>
          <Box sx={styles.paperBody}>
             {activeChat.map((con: any, idx) => {
                return (
                    <Box
                        key={idx}
                        sx={{
                           alignItems: con.sender_id === id ? "end" : "left",
                           position: "relative",
                           display: 'flex',
                           flexDirection: "column",
                           margin: "1rem",
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

          <Box
              sx={{
                 display: 'flex',
                 width: '100%',
                 flexDirection: 'row',
                 margin: "0 1rem",
              }}
          >
             <TextField
                 sx={{
                    width: "100%",
                    maxHeight: "150px",
                    overflow: "auto",
                 }}
                 id="outlined-multiline-static"
                 // label="Write the message"
                 multiline
                 variant="outlined"
                 onKeyDown={handleKeyDown}
                 value={message}
                 onChange={(e) => setMessage(e.target.value)}
                 placeholder="Write Message"
             />
             <Button
                 sx={{
                    background: '#559b93',
                    borderRadius: '8px',
                    marginRight: '1rem'
                 }}
                 variant="contained"
                 onClick={submitMessage}
             >
                Send
             </Button>
          </Box>
       </Box>
   )
}

export default CurrentChat;