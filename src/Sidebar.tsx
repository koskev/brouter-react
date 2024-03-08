import { GeoRoutes, Waypoint } from "./GeoSegment";

export interface SidebarProperties {
  waypoints: Waypoint[];
  route: GeoRoutes;
}

export function Sidebar(props: SidebarProperties) {
  // NEED unwrap_or....
  const distance = props.route ? props.route.get_distance() : 0;
  return (
    <div>
      <label> Total Distance: {distance} </label>
      {props.waypoints.map((wp) => (
        <div>
          <label> Waypoint: {wp.name} </label>
        </div>
      ))}
    </div>
  );
}
