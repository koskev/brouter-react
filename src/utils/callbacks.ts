import { LatLng } from "leaflet";
import { Waypoint } from "../GeoSegment";

export interface callbacks_waypoint {
  add: (pos: Waypoint) => void;
  set_pos: (idx: number, pos: LatLng) => void;
  delete: (idx: number) => void;
  set: (idx: number, wp: Waypoint) => void;
  hover: (index: number, active: boolean) => void;
  change_order: (order: number[]) => void;
}
