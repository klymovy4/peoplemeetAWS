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

   const uploadPhotoHandler = () => {
   }

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
                 onChange={uploadPhotoHandler}
             >
                Upload Photo
                <input
                    type="file"
                    hidden
                />
             </Button>
          </CardActions>
       </Card>
   )
}

export default AvatarBlock;