import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";
import { MapContainer, TileLayer } from "react-leaflet";
import { Marker, Popup } from "react-leaflet";
import { MAP_CENTER, MAP_ZOOM, RESTAURANT_NAME, RESTAURANT_ADDRESS } from "../../../../config/mapConfig.js";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
});
L.Marker.prototype.options.icon = DefaultIcon;

const Maps = () => {
  return (
    <div className="map" aria-label="Company Location">
      <MapContainer id="map" center={MAP_CENTER} zoom={MAP_ZOOM} scrollWheelZoom={false} loading="lazy">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={MAP_CENTER}>
          <Popup>
            <div>
              <h3>{RESTAURANT_NAME}</h3>
              <p>{RESTAURANT_ADDRESS}</p>
            </div>
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default Maps;
