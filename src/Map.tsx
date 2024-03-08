import { useMap } from "react-leaflet";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { useEffect, useState } from "react";
import { NewMarkerDialog } from "./NewMarkerDialog";
import { Route } from "./Route";
import { WaypointMarker } from "./WaypointMarker";
import { LatLng } from "leaflet";

export interface MapProperties {
  waypoints: Waypoint[];
  route_data: GeoRoutes;

  // callbacks
  callback_add_waypoint: (pos: Waypoint) => void;
  callback_set_waypoint: (idx: number, pos: Waypoint) => void;
  callback_delete_waypoint: (idx: number) => void;
}

export function Map(props: MapProperties) {
  const map = useMap();
  const [newMarkerPos, setNewMarkerPos] = useState<LatLng | undefined>(
    undefined,
  );

  useEffect(() => {
    map.scrollWheelZoom.enable();

    map.on("click", (e) => {
      let pos = e.latlng;
      setNewMarkerPos(pos);
    });
    return () => {
      map.off("click");
    };
  }, []);

  return (
    <div>
      {newMarkerPos ? (
        <NewMarkerDialog
          position={newMarkerPos}
          confirm_callback={props.callback_add_waypoint}
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
            callback_waypoint_pos={props.callback_set_waypoint}
            remove_callback={props.callback_delete_waypoint}
          />
        );
      })}
    </div>
  );
}
