import { useMemo, useRef } from "react";
import { Waypoint } from "./GeoSegment";
import { Marker, Popup } from "react-leaflet";
import L, { LatLng } from "leaflet";
import { callbacks_waypoint } from "./utils/callbacks";
import marker_svg_string from "./marker.svg?raw";

export interface MarkerProperties {
  position: Waypoint;
  index: number;

  callbacks_waypoint: callbacks_waypoint;
}

export function WaypointMarker(props: MarkerProperties) {
  const markerRef = useRef<L.Marker>(null);
  const popupRef = useRef<L.Popup>(null);

  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker !== null) {
          props.callbacks_waypoint.set_pos(props.index, marker.getLatLng());
        }
      },
    }),
    [],
  );

  const handle_remove_button = (_e: React.MouseEvent<HTMLButtonElement>) => {
    props.callbacks_waypoint.delete(props.index);
    if (popupRef.current !== null) {
      popupRef.current.close();
    }
  };

  const color = props.position.highlight ? "#0000ff" : "#fe4848";

  let svg_element = new DOMParser().parseFromString(
    marker_svg_string,
    "image/svg+xml",
  );

  let text_element = svg_element.getElementById("marker_text");
  if (text_element) {
    text_element.innerHTML = `${props.position.get_number() + 1}`;
  }

  let svg_html = svg_element.activeElement as HTMLElement;

  let marker_paths = svg_element.getElementById("marker_paths");
  if (marker_paths) {
    marker_paths.style.setProperty("--fill-color", color);
  }

  let icon = new L.DivIcon({
    className: "test",
    html: svg_html,
    iconSize: [20, 70],
    iconAnchor: [20, 70],
    popupAnchor: [0, -40],
  });

  return (
    <Marker
      position={props.position.latLng()}
      draggable={true}
      ref={markerRef}
      eventHandlers={markerEvents}
      icon={icon}
    >
      <Popup ref={popupRef}>
        <button onClick={handle_remove_button}> Remove Waypoint </button>
        <div>Lat: {props.position.lat()}</div>
        <div> Lng: {props.position.lng()}</div>
      </Popup>
    </Marker>
  );
}
