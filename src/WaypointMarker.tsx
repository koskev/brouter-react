import { useMemo, useRef } from "react";
import { Waypoint } from "./GeoSegment";
import { Marker, Popup } from "react-leaflet";
import L, { LatLng } from "leaflet";

export interface MarkerProperties {
  position: Waypoint;
  index: number;

  callback_waypoint_pos: (index: number, new_pos: LatLng) => void;
  remove_callback: (index: number) => void;
}

export function WaypointMarker(props: MarkerProperties) {
  // TODO: change any to actual type
  const markerRef = useRef<L.Marker>(null);
  const popupRef = useRef<L.Popup>(null);

  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker !== null) {
          props.callback_waypoint_pos(props.index, marker.getLatLng());
        }
      },
    }),
    [],
  );

  const handle_remove_button = (_e: React.MouseEvent<HTMLButtonElement>) => {
    props.remove_callback(props.index);
    if (popupRef.current !== null) {
      popupRef.current.close();
    }
  };

  const color = props.position.highlight ? "0000ff" : "fe4848";
  // from https://github.com/tomickigrzegorz/react-leaflet-examples/blob/main/src/pages/svg-markers-width-legends.js MIT
  const svgTemplate = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" class="marker">
    <path fill-opacity=".25" d="M16 32s1.427-9.585 3.761-12.025c4.595-4.805 8.685-.99 8.685-.99s4.044 3.964-.526 8.743C25.514 30.245 16 32 16 32z"/>
    <path fill="#${color}" stroke="#fff" d="M15.938 32S6 17.938 6 11.938C6 .125 15.938 0 15.938 0S26 .125 26 11.875C26 18.062 15.938 32 15.938 32zM16 6a4 4 0 100 8 4 4 0 000-8z"/>
    <text x="14" y="12.5" fill="black" stroke="none" font-size="8">${props.position.get_number() + 1}</text>
    </svg>`;

  let icon = new L.DivIcon({
    className: "test",
    html: svgTemplate,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [7, -16],
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
        <label>
          Lat: {props.position.lat()} Lng: {props.position.lng()}
        </label>
      </Popup>
    </Marker>
  );
}
