import {MapContainer} from 'react-leaflet/MapContainer';
import {TileLayer} from 'react-leaflet/TileLayer';
import {useHeaderHeight} from "../../utils/hooks.ts";
import {useEffect, useRef, useState} from "react";
import MarkerComponent from "../../components/marker/MarkerComponent.tsx";
import mockedUsers from '../../mockedData/mockedUsers.json';
import {useAppSelector} from "../../redux/hooks";
import {useMap} from "react-leaflet/hooks";
import {getUsersOnline} from "../../api/tempApi/UsersOnline.ts";
import {IUser} from "../../types.ts";

const DEFAULT_LAT = -48.876667;
const DEFAULT_LNG = -123.393333;

const MapUpdater = ({zoom, lat, lng}: { zoom: number, lat: number; lng: number }) => {
   const map = useMap();

   useEffect(() => {
      if (map && lat && lng) {
         console.log(`📌 Update map: lat=${lat}, lng=${lng}`);
         map.setView([lat, lng], zoom, {animate: true});
      }
   }, [lat, lng, map]);

   return null;
};

const Map = () => {
   const intervalRef = useRef<NodeJS.Timeout | null>(null);
   const headerHeight = useHeaderHeight();
   const zoom = useRef<number>(17);
   const {isOnline, lng, lat, name, image, description, age, sex} = useAppSelector(state => state.user);
   const [heightHeader, setHeightHeader] = useState<number>(0);
   const [usersOnline, setUsersOnline] = useState<IUser[]>([])
   console.log(usersOnline)
   const user = {
      name, image, description, age, sex, lat, lng, isOnline
   }
   useEffect(() => {
      if (headerHeight) {
         setHeightHeader(headerHeight)
      }
   }, [headerHeight]);

   useEffect(() => {
      if (!isOnline) {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setUsersOnline([]);
         }
      } else if (isOnline) {
         intervalRef.current = setInterval(async() => {
            let response = await getUsersOnline();
            const users = response.map((user: IUser) => ({
               ...user,
               image: `/uploads/${user.image}`
            }));
            setUsersOnline(users);
         }, 3000);
      }

      return () => {
         if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setUsersOnline([]);
         }
      }
   }, [isOnline]);

   return (
       <div style={{height: `calc(100svh - ${heightHeader}px)`}}>
          <MapContainer center={[lat ?? DEFAULT_LAT, lng ?? DEFAULT_LNG]} zoom={zoom.current}
                        scrollWheelZoom={true}
                        style={{height: "100%", width: "100%"}}>
             <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />
             {isOnline && usersOnline.map(user => {
                return <MarkerComponent user={user} key={user.id}/>;
             })}
             <MarkerComponent user={user} self={true}/>
             <MapUpdater lat={lat ?? DEFAULT_LAT} lng={lng ?? DEFAULT_LNG} zoom={zoom.current}/>
          </MapContainer>
       </div>
   )
}

export default Map;