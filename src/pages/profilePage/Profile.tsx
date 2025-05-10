import React, {useState} from 'react';
import {makeStyles} from "@mui/styles";
import Container from '@mui/material/Container';
import Grid2 from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import AvatarBlock from './AvatarBlock.tsx'
import ProfileDetails from './ProfileDetails.tsx'
import Paper from '@mui/material/Paper';
import {styled} from '@mui/material/styles';
import {useLazyGetUserQuery} from "../../api/UserApi.ts";

const Item = styled(Paper)(({theme}) => ({
   backgroundColor: '#fff',
   ...theme.typography.body2,
   padding: theme.spacing(1),
   textAlign: 'center',
   color: theme.palette.text.secondary,
   ...theme.applyStyles('dark', {
      backgroundColor: '#1A2027',
   }),
}));

const useStyles = makeStyles(() => ({
   root: {},
   userPageWrapper: {
      // border: '1px solid red'
   },
   container: {
      paddingLeft: '0 !important',
      paddingRight: '0 !important'
   }
}));

const Profile = () => {
   const classes = useStyles();
   const [getSelf] = useLazyGetUserQuery();
   const [resp, setResp] = useState('')

   const test = async() => {
      const response = await getSelf(localStorage.getItem('accessToken'));

      setResp(response.data)
   }
   return (
       <>
          <Box className={classes.userPageWrapper}>
             <Container className={classes.container}>
                <Grid2
                    container
                    className={classes.root}
                    sx={{display: 'flex', alignItems: 'stretch'}}
                >
                   <Grid2
                       sx={{display: 'flex', flexDirection: 'column'}}
                       size={{xs: 12, md: 5}}
                   >
                      <AvatarBlock/>
                   </Grid2>
                   <Grid2
                       sx={{display: 'flex', flexDirection: 'column'}}
                       size={{xs: 12, md: 7}}
                   >
                      <ProfileDetails/>
                   </Grid2>
                </Grid2>

                <button onClick={test}>/self</button>
                <pre>{JSON.stringify(resp, null, 2)}</pre>
             </Container>
          </Box>
       </>
   );
}

export default Profile;