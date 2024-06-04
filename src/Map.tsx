import { useMap } from "react-leaflet";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { useEffect, useMemo, useState } from "react";
import { NewMarkerDialog } from "./NewMarkerDialog";
import { Route } from "./Route";
import { WaypointMarker } from "./WaypointMarker";
import L, { LatLng } from "leaflet";
import { callbacks_waypoint, callback_map_pos } from "./utils/callbacks";
import { LineMarker } from "./LineMarker";
import { LineDistanceMarker } from "./LineDistanceMarker";
import * as turf from "@turf/turf";

export interface MapProperties {
  waypoints: Waypoint[];
  route_data: GeoRoutes;

  // callbacks
  callbacks_waypoint: callbacks_waypoint;
  callback_map_pos: callback_map_pos;
}

export function Map(props: MapProperties) {
  const map = useMap();
  const [newMarkerPos, setNewMarkerPos] = useState<LatLng | undefined>(
    undefined,
  );

  let all_lines = useMemo(() => {
    let segments: number[][][] = [];
    let lines: number[][] = [];
    for (const route of props.route_data.routes) {
      for (const line of route.get_lang_lats()) {
        line.forEach((p) => lines.push([p.lng, p.lat]));
      }
    }
    segments.push(lines);
    let multi_line = turf.multiLineString(segments);

    return multi_line.geometry;
  }, [props]);

  useEffect(() => {
    map.scrollWheelZoom.enable();

    map.on("click", (e) => {
      const pos = e.latlng;
      setNewMarkerPos(pos);
    });

    map.on("moveend zoomend", (_e) => {
      props.callback_map_pos(map.getCenter(), map.getZoom());
    });

    // one of the few uses: https://github.com/stadtnavi/stadtnavi-widget/blob/7d3c76ff3678a2a64ce2b23a6a61a425966cec78/src/location-selector.js#L46
    // also has addr lookup. maybe another feature I want
    const photonControlOptions = {
      //resultsHandler: result_handler,
      position: "topleft",
      submitDelay: 200,
      feedbackEmail: null,
      lang: "de",
      //onSelected: TODO
      // formatResult: TODO?
    };

    const search = L.control.photon(photonControlOptions);
    map.addControl(search);

    return () => {
      map.off("click moveend zoomed");
      map.removeControl(search);
    };
  }, []);

  return (
    <div>
      {newMarkerPos ? (
        <NewMarkerDialog
          position={newMarkerPos}
          confirm_callback={props.callbacks_waypoint.add}
        />
      ) : (
        <></>
      )}
      {props.route_data ? <Route data={props.route_data} /> : <></>}
      {props.waypoints.map((waypoint, idx) => {
        return (
          <WaypointMarker
            index={idx}
            position={waypoint}
            callbacks_waypoint={props.callbacks_waypoint}
          />
        );
      })}
      <LineMarker lines={all_lines} />
      <LineDistanceMarker lines={all_lines} />
    </div>
  );
}
