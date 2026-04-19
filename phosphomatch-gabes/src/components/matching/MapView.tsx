import { MapContainer, Marker, Polyline, Popup, TileLayer } from 'react-leaflet';
import type { Match } from '../../types';

const sellerPosition: [number, number] = [33.8815, 10.0982];

export function MapView({ matches, sellerLocation }: { matches: Match[]; sellerLocation: string }) {
  return (
    <div className="h-[420px] overflow-hidden rounded-lg border border-border shadow-card">
      <MapContainer center={[37.1, 10.8]} zoom={5} scrollWheelZoom={false} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={sellerPosition}>
          <Popup>Producteur: {sellerLocation}</Popup>
        </Marker>
        {matches.map((match) => {
          const position: [number, number] = [match.latitude, match.longitude];
          return (
            <Marker key={match.id} position={position}>
              <Popup>
                <strong>{match.company_name}</strong>
                <br />
                Score: {match.compatibility_score}%
              </Popup>
            </Marker>
          );
        })}
        {matches.map((match) => (
          <Polyline
            key={`line-${match.id}`}
            positions={[sellerPosition, [match.latitude, match.longitude]]}
            pathOptions={{ color: '#0d7377', dashArray: '8 8', weight: 2 }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
