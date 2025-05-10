import React from 'react';
import {useState, useEffect} from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import {CardActions, Typography} from "@mui/material";
import {makeStyles} from "@mui/styles";
import Divider from "@mui/material/Divider";
import {Button} from "react-bootstrap";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {getSelf, uploadAvatar} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import defAvatar from '../../assets/avatars/avatar.jpg';
import av from '../../assets/avatars/123.jpg';

const useStyles = makeStyles((theme: any) => ({
   avatar: {
      maxHeight: '300px',
      maxWidth: '300px',
      display: 'block',
      margin: 'auto'
   },
   center: {
      textAlign: 'center'
   },
   activeButtons: {
      width: '100%',
      background: 'rgba(85, 155, 147, 1)',
      color: 'white',
      transition: 'background 0.3s ease',
      '&:hover': {
         background: 'rgba(70, 140, 130, 1)',
         color: 'white'
      }
   }
}))
const AvatarBlock = () => {
   const baseUrl = import.meta.env.VITE_API_URL;
   const classes = useStyles();
   const dispatch = useAppDispatch();
   const {image, name} = useAppSelector(state => state.user);
   const [avatar, setAvatar] = useState<string | null>(null);
   const {showToast} = toastSlice.actions;
   const {setUserField} = userSlice.actions;

   const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
         console.error("No file selected");
         return;
      }
      const token = localStorage.getItem('accessToken');

      const response = await uploadAvatar(file, token!);

      if (response.status === 'success') {
         dispatch(showToast({toastMessage: response?.data?.message, toastType: 'success'}));
         const self = await getSelf(token!);

         if (self.status === 'success') {
            dispatch(setUserField({field: 'image', value: `${baseUrl}/uploads/${self.data.image}`}));
         } else {
            console.log(response);
            dispatch(showToast({toastMessage: response?.data?.message ?? 'Something went wrong', toastType: 'danger'}));
         }
      } else {
         console.log(response);
         dispatch(showToast({toastMessage: response?.data?.message ?? 'Something went wrong', toastType: 'danger'}));
      }
   };

   const openFileDialog = () => {
      document.getElementById("fileInput")?.click();
   };

   useEffect(() => {
      if (image) setAvatar(image);
      else setAvatar(null);
   }, [image])

   return (
       <Card sx={{margin: '1rem'}}>
          {image ?
              <img
                  className={classes.avatar}
                  src={avatar ? avatar : defAvatar}
                  alt='item.title'
                  loading="lazy"
              /> :
              <img
                  className={classes.avatar}
                  src={defAvatar}
                  alt='defAvatar'
              />
          }

          <CardContent sx={{flex: 1}}>
             <Box
                 alignItems="center"
                 display="flex"
                 flexDirection="column"
             >
                <Typography
                    color="textPrimary"

                    variant="h3"
                    className={classes.center}
                >
                   {name}
                </Typography>

                <Typography
                    color="textSecondary"
                    variant="body1"
                >
                </Typography>
                <Typography
                    color="textSecondary"
                    variant="body1"
                >
                </Typography>
             </Box>
          </CardContent>

          <Divider/>
          <CardActions>
             <Button
                 className={classes.activeButtons}
                 variant="contained"
                 // component="label"
                 onClick={openFileDialog}
             >
                Upload Photo
                <input
                    id="fileInput"

                    type="file"
                    hidden
                    onChange={handleUploadPhoto}

                />
             </Button>
          </CardActions>
       </Card>
   )
}

export default AvatarBlock;