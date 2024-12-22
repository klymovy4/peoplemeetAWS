import {MapContainer} from 'react-leaflet/MapContainer';
import {TileLayer} from 'react-leaflet/TileLayer';
import {useMap} from 'react-leaflet/hooks';
import {Marker, Popup} from "react-leaflet";
import useHeaderHeight from "../../utils/hooks.ts";
import {useEffect, useState} from "react";
import {useAppSelector} from "../../redux/hooks";


const Map = () => {
    const {isOnline} = useAppSelector(state => state.user);
    const headerHeight = useHeaderHeight();
    const [heightHeader, setHeightHeader] = useState<number>(0);
    useEffect(() => {
        if (headerHeight) {
            setHeightHeader(headerHeight)
        }
    }, [headerHeight]);

    useEffect(() => {
        console.log(isOnline)
    }, [isOnline]);

    return (
        <div style={{height: `calc(100svh - ${heightHeader}px)`}}>
            <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={true} style={{ height: "100%", width: "100%"}}>
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[51.505, -0.09]}>
                    <Popup>
                        A pretty CSS3 popup. <br/> Easily customizable.
                    </Popup>
                </Marker>
            </MapContainer>
        </div>

    )
}

export default Map;