import {Button, Card, CardActions, CardContent, CardMedia, Divider, Typography} from "@mui/material";
import photo from "../../assets/avatars/Sss.png";
import {Marker, Popup} from "react-leaflet";
import L, {DomUtil} from 'leaflet';
import {makeStyles} from "@mui/styles";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {useMap} from "react-leaflet/hooks";
import {FC, useEffect} from "react";
import {userSlice} from "../../redux/store/slices/userSlice.ts";
import getPosition = DomUtil.getPosition;

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
interface IUser {
   name: string;
   isOnline: boolean;
   location: {
      lat: number;
      lng: number;
   }
}

const MarkerComponent: FC<{ user: IUser }> = ({user}) => {
   const {name, isOnline, location} = user;
   console.log(user)
   const classes = useStyles();
   const dispatch = useAppDispatch();
   const {setLocation} = userSlice.actions;
   // const {name, isOnline, location} = useAppSelector(state => state.user);
   const avatarIcon = L.icon({
      className: classes.avatar,
      iconUrl: photo,
      iconSize: [56, 56],
      popupAnchor: [0, -30]
   });

   useEffect(() => {
      if (isOnline) {
         const getPosition = async () => {
            navigator.geolocation.getCurrentPosition((position) => {
               const latitude = position.coords.latitude;
               const longitude = position.coords.longitude;
               console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
               dispatch(setLocation({lat: latitude, lng: longitude}));
            });
         }

         getPosition().catch(err => console.log(err));
      } else {
         dispatch(setLocation({lat: null, lng: null}));
      }
   }, [isOnline]);

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
                                  image={photo}
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
                                    Roman
                                 </Typography>
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    Age - 12
                                 </Typography>
                                 <Divider/>
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                    Sex - Male
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
                                    user?.description. user?.description. user?.description.
                                    user?.description. user?.description. user?.description.
                                    user?.description. user?.description. user?.description. user?.description.
                                    user?.description. user?.description. user?.description.
                                 </Typography>
                              </CardContent>
                              <CardActions
                                  sx={styles.cardActions}
                              >
                                 <Button
                                     onClick={() => console.log(123)}
                                     size="small"
                                     color="primary"
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