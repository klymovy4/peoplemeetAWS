import React, {useRef, useState, useEffect} from 'react';
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
import ReactCrop, {
   centerCrop,
   makeAspectCrop,
   type Crop,
   type PixelCrop,
} from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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

   /* Crop uploaded photo*/
   const [cropMode, setCropMode] = useState<boolean>(false)
   const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
   const [imgSrc, setImgSrc] = useState<string | null>(null);
   const [crop, setCrop] = useState<Crop>();
   const imgRef = useRef<HTMLImageElement | null>(null);

   const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
         const file = files[0];

         if (file.type === 'image/gif') {
            dispatch(showToast({
               toastMessage: 'GIF images are not supported for cropping. Please upload JPG or PNG.',
               toastType: 'info'
            }));
            setCropMode(false);
            e.target.value = '';
            return;
         }

         const reader = new FileReader();
         reader.addEventListener('load', () => {
            setImgSrc(null); // ✅ Force reset before loading the same image again
            setTimeout(() => setImgSrc(reader.result as string), 0); // ✅ Delay ensures re-render
         });
         reader.readAsDataURL(file);
         setCropMode(true);
      } else {
         setCropMode(false);
      }
      e.target.value = '';
   };

   const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      const crop = centerCrop(
          makeAspectCrop(
              {
                 unit: 'px',
                 width: 200,
              },
              1, // aspect ratio 1:1
              width,
              height
          ),
          width,
          height
      );
      setCrop(crop);
      imgRef.current = e.currentTarget;
   };

   const handleUploadPhoto = async (file: File) => {
      if (!file) {
         console.error("No file to upload");
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

   const onSave = async () => {
      if (imgRef.current && completedCrop) {
         try {
            const blob = await getCroppedBlob(imgRef.current, completedCrop);

            if (blob) {
               const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
               await handleUploadPhoto(file);
               const croppedImageUrl = URL.createObjectURL(blob);
               setAvatar(croppedImageUrl);
               setImgSrc(null);
               setCropMode(false);
            }
         } catch (err) {
            console.error(err);
            dispatch(showToast({ toastMessage: 'Crop your photo', toastType: 'info' }));
         }
      }
   };

   function getCroppedBlob(
       image: HTMLImageElement,
       crop: PixelCrop
   ): Promise<Blob> {
      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      let canvasWidth = crop.width * scaleX;
      let canvasHeight = crop.height * scaleY;

      const maxWidth = 800;
      const maxHeight = 800;

      if (canvasWidth > maxWidth) {
         canvasHeight = canvasHeight * (maxWidth / canvasWidth);
         canvasWidth = maxWidth;
      }
      if (canvasHeight > maxHeight) {
         canvasWidth = canvasWidth * (maxHeight / canvasHeight);
         canvasHeight = maxHeight;
      }
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
         throw new Error('No 2D context');
      }

      ctx.drawImage(
         image,
         crop.x * scaleX,
         crop.y * scaleY,
         crop.width * scaleX,
         crop.height * scaleY,
         0,
         0,
         canvasWidth,
         canvasHeight
      );      

      return new Promise((resolve, reject) => {
         canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(() => new Error("Canvas is empty"));
         }, 'image/jpeg');
      });
   }
   /* End Crop uploaded photo*/

   useEffect(() => {
      if (image) setAvatar(image);
      else setAvatar(null);
   }, [image])

   return (
       <Card sx={{margin: '1rem'}}>
          {!imgSrc && image &&
              <img
                  className={classes.avatar}
                  src={avatar ? avatar : defAvatar}
                  alt='avatar'
                  loading="lazy"
              />
          }
          <div>
             {imgSrc && (
                 <ReactCrop
                     crop={crop}
                     onComplete={(c) => setCompletedCrop(c)}
                     onChange={(_, percentCrop) => setCrop(percentCrop)}
                     aspect={1}
                 >
                    <img
                        ref={imgRef}
                        src={imgSrc}
                        onLoad={onImageLoad}
                        alt="Source"
                    />
                 </ReactCrop>
             )}
          </div>

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
                 onClick={cropMode ? onSave : openFileDialog}
             >
                {cropMode ? 'Save' : 'Upload Photo'}
                <input
                    id="fileInput"
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={onSelectFile}
                />
             </Button>
          </CardActions>
       </Card>
   )
}

export default AvatarBlock;