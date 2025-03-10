import React from 'react';
import {useState, useEffect} from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import {CardActions, Typography} from "@mui/material";
import {makeStyles} from "@mui/styles";
import Divider from "@mui/material/Divider";
import {Button} from "react-bootstrap";
import ImageListItem from '@mui/material/ImageListItem';
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {getSelf, uploadAvatar} from "../../api/tempApi/userApi.ts";
import {toastSlice} from "../../redux/store/slices/toastSlice.ts";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import defAvatar from '../../assets/avatars/avatar.jpg';

const useStyles = makeStyles(() => ({
   avatar: {
      // height: 200,
      // width: 200
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
   },
   defAvatar: {
      height: '160px',
      backgroundImage: `url(${defAvatar})`,
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'contain',
      backgroundPosition: 'center'
   },
}))
const AvatarBlock = () => {
   const dispatch = useAppDispatch();
   const {image} = useAppSelector(state => state.user);
   const [avatar, setAvatar] = useState<string>('');
   const {showToast} = toastSlice.actions;
   const {setUserField} = userSlice.actions;
   const classes = useStyles();
   const {name} = useAppSelector(state => state.user);

   const handleUploadPhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
         console.error("No file selected");
         return;
      }
      const token = localStorage.getItem('accessToken');

      const response = await uploadAvatar(file, token!);

      if (response.status === 'success') {
         dispatch(showToast({toastMessage: response.data.message, toastType: 'success'}));
         const self = await getSelf(token!);

         if (self.status === 'success') {
            dispatch(setUserField({field: 'image', value: `/uploads/${self.data.image}`}));
         } else {
            dispatch(showToast({toastMessage: response?.data?.message, toastType: 'danger'}));
         }
      } else {
         dispatch(showToast({toastMessage: response?.data?.message, toastType: 'danger'}));
      }
   };

   const openFileDialog = () => {
      document.getElementById("fileInput")?.click();
   };

   useEffect(() => {
      if (image) setAvatar(image);
   }, [image])

   return (
       <Card sx={{margin: '1rem'}}>
          {image ?
              <ImageListItem>
                 <img
                     src={avatar}
                     alt={'item.title'}
                     loading="lazy"
                 />
              </ImageListItem> :
              <Box className={classes.defAvatar}></Box>
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