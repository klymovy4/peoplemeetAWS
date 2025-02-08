import React, {useState, useEffect, useRef} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import currentChat from '../../mockedData/mockedChat.json'
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Divider from '@mui/material/Divider';
import {useAppSelector} from "../../redux/hooks";

const styles = {
   paperBody: {
      display: "flex",
      flexDirection: "column",
      background: "transparent",
      overflowX: "auto",
   }
}

const CurrentChat = () => {
   const {activeUser} = useAppSelector(state => state.chat);

   const [message, setMessage] = useState<string>("");
   const dummy = useRef<HTMLDivElement | null>(null);
   const [localChat, setLocalChat] = useState<string[]>(currentChat)

   const submitMessage = () => {
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
      if (dummy.current) {
         dummy.current.scrollIntoView({behavior: "smooth"});
      }
   }, [localChat.length]);

   console.log(activeUser)
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
             {localChat.map((con: any, idx) => {
                return (
                    <Box
                        key={idx}
                        sx={{
                           alignItems: idx % 2 === 0 ? "end" : "left",
                           position: "relative",
                           display: 'flex',
                           flexDirection: "column",
                           margin: "1rem",
                           height: 'fit-content'
                        }}
                    >
                       <Box
                           sx={{
                              background: idx % 2 === 0 ? '#b694dc' : '#8fd7da',
                              maxWidth: '50%',
                              color: 'white',
                              width: 'fit-content',
                              padding: '0.5rem',
                              borderRadius: '8px',
                              boxShadow: '0px 3px 3px -2px rgba(0, 0, 0, 0.2), 0px 3px 4px 0px rgba(0, 0, 0, 0.14), 0px 1px 8px 0px rgba(0, 0, 0, 0.12);'
                           }}
                       >
                          {/*{ReactEmoji.emojify(con.message)}*/} {con}
                       </Box>

                       <Typography sx={{
                          display: "inline-block",
                          fontSize: "13px",
                          color: 'black'
                       }}>
                          {/*{timeStamp}*/}{new Date().toLocaleTimeString()}
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