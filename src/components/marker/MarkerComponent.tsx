import {FC, useMemo} from "react";
import {Button, Card, CardActions, CardContent, CardMedia, Divider, Typography} from "@mui/material";
import {Marker, Popup} from "react-leaflet";
import L from 'leaflet';
import {makeStyles} from "@mui/styles";
import {useAppDispatch} from "../../redux/hooks";
import {drawerSlice} from "../../redux/store/slices/drawerSlice.ts";
import {IUser} from "../../types.ts";
import {chatSlice} from "../../redux/store/slices/chatSlice.ts";

const useStyles = makeStyles(() => ({
   customMarker: {
      boxShadow: '0 0 5px rgba(0,0,0,0.3)',
      borderRadius: '50%',
   }
}))

const styles = {
   cardContent: {
      padding: '0 0.5rem 0 0.5rem',
      backgroundColor: '#fff',
      // '&:hover': {backgroundColor: '#f0f0f0'},
   },
   typography: {
      margin: '.5rem 0px !important',
   },
   cardActions: {
      // '&:hover': {backgroundColor: '#f0f0f0'},
   },
   card: {
      borderRadius: '12px',
      width: 255,
      margin: 0,
   },
   thoughtBubble: {
      position: 'absolute',
      top: '509px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: '#ffffff',
      color: '#333',
      padding: '5px 6px',
      borderRadius: '16px',
      fontSize: '0.875rem',
      fontWeight: 500,
      maxWidth: '200px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
      zIndex: 999,

      // Add the "tail"
      '&::after': {
         content: '""',
         position: 'absolute',
         bottom: '-10px',
         left: '20px',
         width: '10px',
         height: '10px',
         backgroundColor: '#fff',
         borderRadius: '50%',
         boxShadow: `
      -12px -12px 0 -2px #fff,
      -24px -24px 0 -4px #fff
    `,
      }
   }
}

const splitPoint = 28;

const MarkerComponent: FC<{ user: IUser, self?: boolean }> = ({user, self = false}) => {
   const {name, image, description, age, sex, lat, lng, distance, thoughts} = user;

   const classes = useStyles();
   const dispatch = useAppDispatch();

   const {openChat} = drawerSlice.actions;
   const {setActiveUser} = chatSlice.actions;

   // const avatarIcon = L.icon({
   //    className: classes.avatar,
   //    iconUrl: image,
   //    iconSize: [56, 56],
   //    popupAnchor: [0, -30]
   // });

   const bubbleText = thoughts && thoughts.length > splitPoint
       ? thoughts.slice(0, splitPoint) + '...'
       : thoughts

   const customIcon = useMemo(() => {
      return L.divIcon({

         className: classes.customMarker,
         popupAnchor: [0, -30],
         iconSize: [56, 56],
         html: `<div>${thoughts ? `<div style="
                background: white;
                position: absolute;
                left: 40px;
                top: -10px;
                padding: 0 0.5rem;
                border-radius: 16px;
                font-weight: 500;
                font-size: 12px;
                box-shadow: 0 0 5px rgba(0,0,0,0.3);
                max-width: 200px;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            ">${bubbleText}</div>` : ''
         }
         <img
         
             src="${image}"
             alt="thought"
             style="box-shadow: 0 0 5px rgba(0,0,0,0.3); width: 56px; height: 56px; border-radius: 50%; object-fit: cover;"
         />
      </div>
      `
      });
   }, [user.thoughts, user.image]);

   return (
       <>
          {lat && lng && (
              <>
                 <Marker position={[lat, lng]}
                         icon={customIcon}
                     // icon={avatarIcon}
                     // eventHandlers={()}
                 >
                    <Popup>
                       <Card sx={styles.card}>
                          <CardMedia
                              component="img"
                              height="194"
                              image={image}
                              alt="user avatar"
                              sx={{
                                 height: "255px",
                                 backgroundSize: "contain",
                              }}
                          />
                          <CardContent sx={styles.cardContent}>
                             <Typography
                                 gutterBottom variant="h5" component="h2"
                             >
                                {name}
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
                             {!self &&
                                 <Typography
                                     variant="body2"
                                     color="textSecondary"
                                     component="p"
                                     sx={styles.typography}
                                 >
                                     Distance: {distance}
                                 </Typography>
                             }

                             <Divider/>
                             <Typography
                                 variant="body2"
                                 color="textSecondary"
                                 component="p"
                                 sx={styles.typography}
                             >
                                Description:
                             </Typography>
                             <Typography
                                 variant="body2"
                                 color="textSecondary"
                                 component="p"
                                 sx={styles.typography}
                             >
                                {description}
                             </Typography>
                             <Divider/>

                             {!self &&
                                 <Typography
                                    variant="body2"
                                    color="textSecondary"
                                    component="p"
                                    sx={styles.typography}
                                 >{thoughts && thoughts.length > splitPoint
                                    ? '...' + thoughts.slice(splitPoint)
                                    : ''}
                                 </Typography>
                             }

                          </CardContent>
                          <CardActions
                              sx={styles.cardActions}
                          >
                             <Button
                                 disabled={self}
                                 onClick={() => {
                                    dispatch(openChat(true));
                                    dispatch(setActiveUser(user));
                                 }}
                                 size="small"
                                 sx={{color: '#559b93'}}
                                 // color="primary"
                                 // disabled={user.uid === authFromState.uid}
                             >
                                {self ? `It's you` : `Write`}
                             </Button>
                          </CardActions>
                       </Card>
                    </Popup>
                 </Marker>
              </>
          )}
       </>
   )
}

export default MarkerComponent;