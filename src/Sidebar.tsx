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
      <div> Waypoints </div>
      <DraggableList
        key={key}
        items={props.waypoints}
        callbacks_waypoint={props.callbacks_waypoint}
      />
      <div> Types </div>
      <WaySurfaces {...props} />
    </div>
  );
}

function WaySurfaces(props: SidebarProperties) {
  let surfaces: Map<string, number> = new Map();
  for (const route of props.route.routes) {
    for (const segment of route.segments) {
      let surface = segment.message.get_surface();
      let distance = segment.message.distance;
      const current_val = surfaces.get(surface) ?? 0;
      surfaces.set(surface, current_val + distance);
    }
  }
  console.log(surfaces);
  return null;
}
