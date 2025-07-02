import React, {FC} from 'react';
import {IUser} from "../types.ts";
import {Box, Typography} from "@mui/material";

interface IProps {
   activeUser: IUser | null;
}

const CurrentUserInfo: FC<IProps> = ({activeUser}) => {
   return (
       <Box className='p-3'>
          <Typography variant="h5">User Info</Typography>
          <Typography variant="h6"  sx={{}} >Name: {activeUser?.name}</Typography>
          <Typography variant="h6"  sx={{}} >Sex: {activeUser?.sex}</Typography>
          <Typography variant="h6"  sx={{}} >Age: {activeUser?.age}</Typography>
          <Typography variant="h6"  sx={{}} >Description: {activeUser?.description}</Typography>
       </Box>
   )
}

export default CurrentUserInfo;