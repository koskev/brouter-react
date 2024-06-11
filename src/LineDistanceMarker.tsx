import { LineString, MultiLineString } from "geojson";
import { useMemo } from "react";
import marker_svg_string from "./distance_marker.svg?raw";
import * as turf from "@turf/turf";
import { latLng } from "leaflet";
import { Marker } from "react-leaflet";

export function LineDistanceMarker({ lines }: { lines: MultiLineString }) {
  const line_string = {
    type: "LineString",
    coordinates: lines.coordinates.flat(),
  } as LineString;
  // TODO: Somehow the type is wrong? Works though
  // @ts-ignore
  const total_len = turf.length(line_string);
  let positions = useMemo(() => {
    let pos = [];
    try {
      for (let curr_len = 10; curr_len < total_len; curr_len += 10) {
        pos.push(turf.along(line_string, curr_len));
      }
    } catch (e) {}
    return pos;
  }, [lines]);

  let icons = positions.map((pos, idx) => {
    const svg_element = new DOMParser().parseFromString(
      marker_svg_string,
      "image/svg+xml",
    );
    const text_element = svg_element.getElementById("marker_text");
    if (text_element) {
      text_element.innerHTML = `${10 + idx * 10}`;
    }

    const svg_html = svg_element.activeElement as HTMLElement;

    const color = "#00ff00";
    const marker_paths = svg_element.getElementById("marker_paths");
    if (marker_paths) {
      marker_paths.style.setProperty("--fill-color", color);
    }

    const icon_size = 28.529;
    const icon = new L.DivIcon({
      className: "distance_marker",
      html: svg_html,
      iconSize: [icon_size, icon_size],
      iconAnchor: [icon_size / 2, icon_size / 2],
    });

    let lat_lng = latLng(
      pos.geometry.coordinates[1],
      pos.geometry.coordinates[0],
    );

    return <Marker position={lat_lng} draggable={false} icon={icon}></Marker>;
  });

  return <>{icons}</>;
}
