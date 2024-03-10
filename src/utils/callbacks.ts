import { LatLng } from "leaflet";
import { GeoRoutes, Waypoint } from "../GeoSegment";

export type callback_map_pos = (pos: LatLng, zoom: number) => void;

export interface callbacks_waypoint {
  add: (pos: Waypoint) => void;
  set_pos: (idx: number, pos: LatLng) => void;
  delete: (idx: number) => void;
  set: (idx: number, wp: Waypoint) => void;
  hover: (index: number, active: boolean) => void;
  change_order: (order: number[]) => void;
}

export interface callbacks_routes {
  set: (routes: GeoRoutes) => void;
}
