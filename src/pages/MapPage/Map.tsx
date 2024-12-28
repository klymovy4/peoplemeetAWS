import {MapContainer} from 'react-leaflet/MapContainer';
import {TileLayer} from 'react-leaflet/TileLayer';
import useHeaderHeight from "../../utils/hooks.ts";
import {useEffect, useState} from "react";
import MarkerComponent from "../../components/marker/MarkerComponent.tsx";

const Map = () => {
   const headerHeight = useHeaderHeight();
   const [heightHeader, setHeightHeader] = useState<number>(0);
   const [mockedUsers, setMockedUsers] = useState([{
      name: "Alice",
      isOnline: true,
      location: {
         lat: 40.7128,
         lng: -74.0060
      }
   },
      {
         name: "Bob",
         isOnline: false,
         location: {
            lat: 34.0522,
            lng: -118.2437
         }
      },
      {
         name: "Charlie",
         isOnline: true,
         location: {
            lat: 51.5074,
            lng: -0.1278
         }
      },
      {
         name: "Diana",
         isOnline: false,
         location: {
            lat: 48.8566,
            lng: 2.3522
         }
      }])
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
             {mockedUsers.map((user, i) => {
                return <MarkerComponent user={user} key={i} />;
             })}

          </MapContainer>
       </div>
   )
}

export default Map;