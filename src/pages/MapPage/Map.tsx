import {MapContainer} from 'react-leaflet/MapContainer';
import {TileLayer} from 'react-leaflet/TileLayer';
import {useHeaderHeight} from "../../utils/hooks.ts";
import {useEffect, useState} from "react";
import MarkerComponent from "../../components/marker/MarkerComponent.tsx";
import mockedUsers from '../../mockedData/mockedUsers.json';
import {useAppSelector} from "../../redux/hooks";

const Map = () => {
   const headerHeight = useHeaderHeight();
   const {isOnline} = useAppSelector(state => state.user);
   const [heightHeader, setHeightHeader] = useState<number>(0);

   useEffect(() => {
      if (headerHeight) {
         setHeightHeader(headerHeight)
      }
   }, [headerHeight]);

   return (
       <div style={{height: `calc(100svh - ${heightHeader}px)`}}>
          <MapContainer center={[51.505, -0.09]} zoom={17} scrollWheelZoom={true}
                        style={{height: "100%", width: "100%"}}>
             <TileLayer
                 attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
             />
             {isOnline && mockedUsers.map(user => {
                return <MarkerComponent user={user} key={user.id}/>;
             })}
          </MapContainer>
       </div>
   )
}

export default Map;