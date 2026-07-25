import { useState, useEffect } from "react";
import { DialogProps } from "react-aria-components";
import { Dialog, DialogTrigger, Modal, ModalOverlay } from "@/components/application/modals/modal";
import { Button } from "@/components/base/buttons/button";
import { MapContainer, TileLayer, useMapEvents, useMap, Marker } from "react-leaflet";
import { MarkerPin01 } from "@untitledui/icons";
import "leaflet/dist/leaflet.css";

interface DraggableMarkerProps {
  position: [number, number];
  onPositionChange: (position: [number, number]) => void;
}

const DraggableMarker = ({ position, onPositionChange }: DraggableMarkerProps) => {
  useMapEvents({
    click: (e) => {
      const { lat, lng } = e.latlng;
      onPositionChange([lat, lng]);
    },
  });

  return (
    <Marker position={position}>
      <MarkerPin01 className="size-6 text-brand-600" />
    </Marker>
  );
};

interface MapCenterOnUpdateProps {
  position: [number, number];
}

const MapCenterOnUpdate = ({ position }: MapCenterOnUpdateProps) => {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
};

interface LocationMapModalProps extends DialogProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback invoked when user confirms location selection */
  onConfirm: (coords: { latitude: number; longitude: number }) => void;
  /** Initial coordinates to display (from saved location), or null for default */
  initialCoordinates: { latitude: number; longitude: number } | null;
  /** Whether the confirm button should be disabled during API call */
  isSubmitting: boolean;
}

const bogota_coords = { latitude: 4.6097, longitude: -74.0817 };

export function LocationMapModal({
  isOpen,
  onClose,
  onConfirm,
  initialCoordinates,
  isSubmitting,
}: LocationMapModalProps) {
  const [position, setPosition] = useState<[number, number]>(() => {
    if (initialCoordinates) {
      return [initialCoordinates.latitude, initialCoordinates.longitude];
    }
    return [bogota_coords.latitude, bogota_coords.longitude];
  });

  useEffect(() => {
    // Update position when initial coordinates change
    if (initialCoordinates) {
      setPosition([initialCoordinates.latitude, initialCoordinates.longitude]);
    } else {
      setPosition([bogota_coords.latitude, bogota_coords.longitude]);
    }
  }, [initialCoordinates]);

  const handleConfirm = () => {
    onConfirm({ latitude: position[0], longitude: position[1] });
  };

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog>
        <ModalOverlay>
          <Modal>
            <div className="flex h-[80vh] flex-col max-sm:overflow-y-auto max-sm:rounded-xl bg-white">
              {/* Header */}
              <div className="flex items-center justify-between border-b px-4 py-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="size-10 rounded-full text-secondary hover:bg-primary_hover"
                >
                  <svg
                    className="size-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <h3 className="text-lg font-semibold text-primary">Seleccionar ubicación</h3>
                <div className="size-10" />
              </div>

              {/* Map Container */}
              <div className="relative flex-1">
                <MapContainer
                  center={position}
                  zoom={13}
                  className="absolute inset-0 h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <DraggableMarker position={position} onPositionChange={setPosition} />
                  <MapCenterOnUpdate position={position} />
                </MapContainer>
              </div>

              {/* Footer */}
              <div className="border-t px-4 py-4">
                <Button
                  type="button"
                  color="primary"
                  size="xl"
                  className="w-full"
                  onClick={handleConfirm}
                  isLoading={isSubmitting}
                  showTextWhileLoading
                  isDisabled={isSubmitting}
                >
                  Confirmar ubicación
                </Button>
              </div>
            </div>
          </Modal>
        </ModalOverlay>
      </Dialog>
    </DialogTrigger>
  );
}
