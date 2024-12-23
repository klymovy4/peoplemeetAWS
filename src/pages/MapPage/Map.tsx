import {MapContainer} from 'react-leaflet/MapContainer';
import {TileLayer} from 'react-leaflet/TileLayer';
import {useMap} from 'react-leaflet/hooks';
import {Marker, Popup} from "react-leaflet";
import useHeaderHeight from "../../utils/hooks.ts";
import {useEffect, useState} from "react";
import {useAppDispatch, useAppSelector} from "../../redux/hooks";
import {userSlice} from "../../redux/store/slices/userSlice.ts";

const MapView = ({lat, lng}: { lat: number; lng: number }) => {
   const map = useMap();

   useEffect(() => {
      if (lat && lng) {
         map.setView([lat, lng], map.getZoom());
      }
   }, [lat, lng, map]);

   return null;
};

const Map = () => {
   const dispatch = useAppDispatch();
   const {setLocation} = userSlice.actions;
   const {isOnline, location} = useAppSelector(state => state.user);
   const headerHeight = useHeaderHeight();
   const [heightHeader, setHeightHeader] = useState<number>(0);
   useEffect(() => {
      if (headerHeight) {
         setHeightHeader(headerHeight)
      }
   }, [headerHeight]);

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
       <div style={{height: `calc(100svh - ${heightHeader}px)`}}>
          <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true}
                        style={{height: "100%", width: "100%"}}>
             <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />
             {location.lat && location.lng && (
                 <>
                    <MapView lat={location.lat} lng={location.lng}/>
                    <Marker position={[location.lat, location.lng]}>
                       <Popup>
                          A pretty CSS3 popup. <br/> Easily customizable.
                       </Popup>
                    </Marker>
                 </>

             )}
          </MapContainer>
       </div>
   )
}

export default Map;