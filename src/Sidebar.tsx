import { DraggableList } from "./DraggableList";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { callbacks_waypoint } from "./utils/callbacks";

export interface SidebarProperties {
  waypoints: Waypoint[];
  route: GeoRoutes;

  callbacks_waypoint: callbacks_waypoint;
}

export function Sidebar(props: SidebarProperties) {
  // NEED unwrap_or....
  const distance = props.route ? props.route.get_distance() : 0;

  // XXX: We need the key to force a remount of the component. Otherwise spring is weird when the props order changes
  const key = props.waypoints.map((wp) => `${wp.lng()}${wp.lat()}`).join("");
  return (
    <div>
      <label> Total Distance: {(distance / 1000.0).toFixed(2)}km </label>
      <DraggableList
        key={key}
        items={props.waypoints}
        callbacks_waypoint={props.callbacks_waypoint}
      />
    </div>
  );
}
