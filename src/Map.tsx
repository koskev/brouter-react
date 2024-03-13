import { CircleMarker, useMap } from "react-leaflet";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { useEffect, useMemo, useState } from "react";
import { NewMarkerDialog } from "./NewMarkerDialog";
import { Route } from "./Route";
import { WaypointMarker } from "./WaypointMarker";
import L, { LatLng, latLng } from "leaflet";
import { callbacks_waypoint, callback_map_pos } from "./utils/callbacks";
import { MultiLineString } from "geojson";
import * as turf from "@turf/turf";

export interface MapProperties {
  waypoints: Waypoint[];
  route_data: GeoRoutes;

  // callbacks
  callbacks_waypoint: callbacks_waypoint;
  callback_map_pos: callback_map_pos;
}

interface LineMarkerProps {
  lines: MultiLineString;
}

function LineMarker(props: LineMarkerProps) {
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
    return <CircleMarker center={lineMarkerPos} />;
  } else {
    return <></>;
  }
}

export function Map(props: MapProperties) {
  const map = useMap();
  const [newMarkerPos, setNewMarkerPos] = useState<LatLng | undefined>(
    undefined,
  );

  let all_lines = useMemo(() => {
    //let lines = multiLineString([[[]]]);
    let lines = {
      type: "MultiLineString",
      coordinates: [[[]]],
    } as MultiLineString;
    for (const route of props.route_data.routes) {
      for (const line of route.get_lang_lats()) {
        let points = line.map((p) => [p.lng, p.lat]);
        if (lines.coordinates[0]?.[0]?.length === 0) {
          lines.coordinates = [points];
        } else {
          lines.coordinates = lines.coordinates.concat([points]);
        }
      }
    }
    return lines;
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
    </div>
  );
}
