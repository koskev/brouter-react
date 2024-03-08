import { DraggableList } from "./DraggableList";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { callback_waypoint_set } from "./utils/callbacks";

export interface SidebarProperties {
  waypoints: Waypoint[];
  route: GeoRoutes;

  callback_update_wp_order: (order: number[]) => void;
  callback_hover_waypoint: (index: number, active: boolean) => void;
  callback_waypoint_set: callback_waypoint_set;
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
        callback_order_change={props.callback_update_wp_order}
        callback_hover_waypoint={props.callback_hover_waypoint}
        callback_waypoint_set={props.callback_waypoint_set}
      />
    </div>
  );
}
