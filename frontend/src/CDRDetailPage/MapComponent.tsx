import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude: number;
  longitude: number;
}

const MapComponent: React.FC<MapComponentProps> = ({ latitude, longitude }) => (
  <div className="cdr-map-container">
    <MapContainer
      center={[latitude, longitude]}
      zoom={13}
      minZoom={10}
      maxZoom={16}
      style={{ width: '100%', height: '100%', borderRadius: '10px' }}
      scrollWheelZoom={false}
      doubleClickZoom={true}
      zoomControl={true}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <Marker position={[latitude, longitude]}>
        <Popup>
          Chargepoint Location
        </Popup>
      </Marker>
    </MapContainer>
  </div>
);

export default MapComponent;
