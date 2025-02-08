import {MapContainer} from 'react-leaflet/MapContainer';
import {TileLayer} from 'react-leaflet/TileLayer';
import {useHeaderHeight} from "../../utils/hooks.ts";
import {useEffect, useRef, useState} from "react";
import MarkerComponent from "../../components/marker/MarkerComponent.tsx";
import mockedUsers from '../../mockedData/mockedUsers.json';
import {useAppSelector} from "../../redux/hooks";
import {useMap} from "react-leaflet/hooks";

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
   const headerHeight = useHeaderHeight();
   const zoom = useRef<number>(17);
   const {isOnline, location, name, image, description, age, sex} = useAppSelector(state => state.user);
   const [heightHeader, setHeightHeader] = useState<number>(0);

   const user = {
      name, image, description, age, sex, location, isOnline
   }
   useEffect(() => {
      if (headerHeight) {
         setHeightHeader(headerHeight)
      }
   }, [headerHeight]);

   return (
       <div style={{height: `calc(100svh - ${heightHeader}px)`}}>
          <MapContainer center={[location.lat ?? -0.09, location.lng ?? 51.505]} zoom={zoom.current}
                        scrollWheelZoom={true}
                        style={{height: "100%", width: "100%"}}>
             <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />
             {isOnline && mockedUsers.map(user => {
                return <MarkerComponent user={user} key={user.id}/>;
             })}
             <MarkerComponent user={user} self={true}/>
             <MapUpdater lat={location.lat ?? -0.09} lng={location.lng ?? 51.505} zoom={zoom.current}/>
          </MapContainer>
       </div>
   )
}

export default Map;