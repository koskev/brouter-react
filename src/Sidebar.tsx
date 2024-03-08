import { DraggableList } from "./DraggableList";
import { GeoRoutes, Waypoint } from "./GeoSegment";

export interface SidebarProperties {
  waypoints: Waypoint[];
  route: GeoRoutes;
  callback_update_wp_order: (order: number[]) => void;
}

export function Sidebar(props: SidebarProperties) {
  // NEED unwrap_or....
  const distance = props.route ? props.route.get_distance() : 0;

  // XXX: We need the key to force a remount of the component. Otherwise spring is weird when the props order changes
  return (
    <div>
      <label> Total Distance: {(distance / 1000.0).toFixed(2)}km </label>
      <DraggableList
        key={props.waypoints.map((wp) => `${wp.name}`).join("")}
        items={props.waypoints.map((wp) => `${wp.name}`)}
        callback_order_change={props.callback_update_wp_order}
      />
    </div>
  );
}
