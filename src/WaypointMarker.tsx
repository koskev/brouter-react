import { useMemo, useRef } from "react";
import { Waypoint } from "./GeoSegment";
import { Marker, Popup } from "react-leaflet";

export interface MarkerProperties {
  position: Waypoint;
  index: number;
  position_changed_callback: (index: number, new_pos: Waypoint) => void;
  remove_callback: (index: number) => void;
}

export function WaypointMarker(props: MarkerProperties) {
  // TODO: change any to actual type
  const markerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);

  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker !== null) {
          props.position_changed_callback(
            props.index,
            Waypoint.from_latLng(marker.getLatLng()),
          );
        }
      },
    }),
    [],
  );

  const handle_remove_button = (_e: React.MouseEvent<HTMLButtonElement>) => {
    props.remove_callback(props.index);
    if (popupRef.current !== null) {
      popupRef.current._closeButton.click();
    }
  };

  return (
    <Marker
      position={props.position.latLng()}
      draggable={true}
      ref={markerRef}
      eventHandlers={markerEvents}
    >
      <Popup ref={popupRef}>
        <button onClick={handle_remove_button}> Remove Waypoint </button>
        <label>
          Lat: {props.position.lat()} Lng: {props.position.lng()}
        </label>
      </Popup>
    </Marker>
  );
}
