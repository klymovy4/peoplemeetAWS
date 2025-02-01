import {Button, Card, CardActions, CardContent, CardMedia, Divider, Typography} from "@mui/material";
import photo from "../../assets/avatars/Sss.png";
import {Marker, Popup} from "react-leaflet";
import L from 'leaflet';
import {makeStyles} from "@mui/styles";
import {useAppDispatch} from "../../redux/hooks";
import {useMap} from "react-leaflet/hooks";
import {FC, useEffect} from "react";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import {IUser} from "../../types.ts";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";

const useStyles = makeStyles(() => ({
   avatar: {
      borderRadius: '50%',
   }
}))

const styles = {
   cardContent: {
      padding: '0 0.5rem 0 0.5rem',
      backgroundColor: '#fff',
      // '&:hover': {backgroundColor: '#f0f0f0'}, // Ховер
   },
   typography: {
      margin: '.5rem 0px !important',
   },
   cardActions: {
      // '&:hover': {backgroundColor: '#f0f0f0'}, // Ховер
   },
   card: {
      borderRadius: '12px',
      width: 255,
      margin: 0,
   }
}

const MapView = ({lat, lng}: { lat: number; lng: number }) => {
   const map = useMap();

   useEffect(() => {
      if (lat && lng) {
         map.setView([lat, lng], map.getZoom());
      }
   }, [lat, lng, map]);

   return null;
}


const MarkerComponent: FC<{ user: IUser }> = ({user}) => {
   const {name, isOnline, avatar, description, id, age, sex, location} = user;
   const classes = useStyles();
   const dispatch = useAppDispatch();

   const {openChat} = drawerSlice.actions;
   const {setActiveUser} = chatSlice.actions;

   const avatarIcon = L.icon({
      className: classes.avatar,
      iconUrl: avatar,
      iconSize: [56, 56],
      popupAnchor: [0, -30]
   });

   return (
       <>
          {
              location.lat && location.lng && (
                  <>
                     {/*<MapView lat={location.lat} lng={location.lng}/>*/}
                     <Marker position={[location.lat, location.lng]}
                             icon={avatarIcon}
                         // eventHandlers={()}
                     >
                        <Popup>
                           <Card sx={styles.card}>
                              <CardMedia
                                  component="img"
                                  height="194"
                                  image={avatar}
                                  alt="Paella dish"
                                  sx={{
                                     height: "200px",
                                     backgroundSize: "cover",
                                  }}
                              />
                              <CardContent sx={styles.cardContent}>
                                 <Typography
                                     gutterBottom variant="h5" component="h2"
                                 >
                                    {name}{id}
                                 </Typography>
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    Age - {age}
                                 </Typography>
                                 <Divider/>
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    Sex - {sex}
                                 </Typography>
                                 <Divider/>
                                 {/*<RenderDistance/>*/}
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    Render Distance - 0km
                                 </Typography>
                                 <Divider/>
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    Description
                                 </Typography>
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    {description}
                                 </Typography>
                              </CardContent>
                              <CardActions
                                  sx={styles.cardActions}
                              >
                                 <Button
                                     onClick={() => {
                                        dispatch(openChat(true));
                                        dispatch(setActiveUser(user));
                                     }}
                                     size="small"
                                     sx={{color: '#559b93'}}
                                     // color="primary"
                                     // disabled={user.uid === authFromState.uid}
                                 >
                                    Write
                                 </Button>
                              </CardActions>
                           </Card>
                        </Popup>
                     </Marker>
                  </>

              )
          }
       </>
   )
}

export default MarkerComponent;