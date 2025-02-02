import {useState} from 'react';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Box from '@mui/material/Box';
import {CardActions, Typography} from "@mui/material";
import {makeStyles} from "@mui/styles";
import avatar from '../../assets/avatars/Sss.png'
import Divider from "@mui/material/Divider";
import {Button} from "react-bootstrap";
import ImageListItem from '@mui/material/ImageListItem';
import {useAppSelector} from "../../redux/hooks";


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
   }
}))
const AvatarBlock = () => {
   const classes = useStyles();
   const {name} = useAppSelector(state => state.user);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);

   const handleUploadPhoto = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];

      if (!file) {
         console.error("No file selected");
         return;
      }

      setSelectedFile(file);
      console.log("Selected file:", file.name);

      // Можно загрузить файл на сервер:
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("token", localStorage.getItem("accessToken"));

      fetch("/upload", { // /uploads get image
         method: "POST",
         body: formData,
      })
          .then((response) => response.json())
          .then((data) => {
             console.log("Upload successful:", data);
          })
          .catch((error) => {
             console.error("Upload failed:", error);
          });
   };

   const openFileDialog = () => {
      document.getElementById("fileInput")?.click();
   };

   return (
       <Card sx={{margin: '1rem'}}>
          <ImageListItem>
             <img
                 src={avatar}
                 alt={'item.title'}
                 loading="lazy"
             />
          </ImageListItem>
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