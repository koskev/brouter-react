import { useRef } from "react";
import { Popup } from "react-leaflet";
import { Waypoint } from "./GeoSegment";
import { LatLng } from "leaflet";

export interface NewMarkerDialogProperties {
  position: LatLng;
  confirm_callback: (pos: Waypoint) => void;
}

export function NewMarkerDialog(props: NewMarkerDialogProperties) {
  const popupRef = useRef<L.Popup>(null);

  const handle_button = (_event: React.MouseEvent<HTMLButtonElement>) => {
    let wp = Waypoint.from_latLng(props.position, "New Waypoint");
    props.confirm_callback(wp);
    if (popupRef.current !== null) {
      popupRef.current.close();
    }
  };

  return (
    <Popup position={props.position} ref={popupRef}>
      <button onClick={handle_button}> Add Waypoint </button>
    </Popup>
  );
}
