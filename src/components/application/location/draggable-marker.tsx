import { useMapEvents } from "react-leaflet";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix Leaflet default marker icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

interface DraggableMarkerProps {
  /** Current position as [latitude, longitude] */
  position: [number, number];
  /** Callback invoked when the marker position changes */
  onPositionChange: (position: [number, number]) => void;
}

/**
 * Renders a Leaflet marker that responds to map click events via useMapEvents.
 * When the user clicks on the map, the marker moves to the clicked position.
 */
export const DraggableMarker = ({ position, onPositionChange }: DraggableMarkerProps) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange([lat, lng]);
    },
  });

  return (
    <Marker position={position}>
      <Popup>
        <div className="flex flex-col items-center gap-1 p-1">
          <p className="text-xs font-medium text-secondary">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};
