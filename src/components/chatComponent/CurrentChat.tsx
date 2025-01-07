import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useAppSelector} from "../../redux/hooks";


interface TabPanelProps {
   children?: React.ReactNode;
   index: number;
   value: number;
}

function TabPanel(props: TabPanelProps) {
   const {children, value, index, ...other} = props;

   return (
       <div
           role="tabpanel"
           hidden={value !== index}
           id={`vertical-tabpanel-${index}`}
           aria-labelledby={`vertical-tab-${index}`}
           {...other}
       >
          {value === index && (
              <Box sx={{p: 3}}>
                 <Typography>{children}</Typography>
              </Box>
          )}
       </div>
   );
}

const CurrentChat = () => {
   const {activeUser} = useAppSelector(state => state.chat);

   return (
      <TabPanel value={0} index={0}>
         {`Dialog with ${activeUser?.name}`}
      </TabPanel>
  )
}

export default CurrentChat;