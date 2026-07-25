import { useMapEvents } from "react-leaflet";
import { Marker, Popup } from "react-leaflet";
import { MarkerPin01 } from "@untitledui/icons";

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
          <MarkerPin01 className="size-6 text-brand-600" />
          <p className="text-xs font-medium text-secondary">
            {position[0].toFixed(5)}, {position[1].toFixed(5)}
          </p>
        </div>
      </Popup>
    </Marker>
  );
};
