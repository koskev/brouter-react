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

  return (
    <div>
      <label> Total Distance: {(distance / 1000.0).toFixed(2)}km </label>
      {props.waypoints.map((wp) => (
        <div>
          <label>
            Waypoint: {wp.name} {wp.id()}
          </label>
        </div>
      ))}
      <DraggableList
        items={props.waypoints.map((wp) => `${wp.name}-${wp.id()}`)}
        callback_order_change={props.callback_update_wp_order}
      />
    </div>
  );
}
