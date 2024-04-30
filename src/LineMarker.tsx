import { MultiLineString } from "geojson";
import { useEffect, useState } from "react";
import { CircleMarker, useMap } from "react-leaflet";
import * as turf from "@turf/turf";
import { LatLng, latLng } from "leaflet";

interface LineMarkerProps {
  lines: MultiLineString;
}

export function LineMarker(props: LineMarkerProps) {
  const map = useMap();
  const [lineMarkerPos, setLineMarkerPos] = useState<LatLng | undefined>(
    undefined,
  );

  // XXX: if this is part of the map, we cause a bunch of rerenders and moving the waypoints won't work
  useEffect(() => {
    map.on("mousemove", (e) => {
      let pt = turf.nearestPointOnLine(
        props.lines,
        turf.point([e.latlng.lng, e.latlng.lat]),
        {
          units: "degrees",
        },
      );
      let distance_km = turf.radiansToLength(pt.properties.dist, "degrees");
      if (distance_km < 0.1) {
        setLineMarkerPos(
          latLng(pt.geometry.coordinates[1], pt.geometry.coordinates[0]),
        );
      } else {
        setLineMarkerPos(undefined);
      }
    });
    return () => {
      map.off("mousemove");
    };
  }, [props]);
  if (lineMarkerPos) {
    return <CircleMarker center={lineMarkerPos} radius={10} />;
  } else {
    return <></>;
  }
}
