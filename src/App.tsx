import { ScaleControl, TileLayer } from "react-leaflet";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { LatLng, latLng } from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { Sidebar } from "./Sidebar";
import { Map } from "./Map";

function App() {
  const position = latLng(53.6, 10);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeData, setRouteData] = useState<GeoRoutes>(new GeoRoutes());

  const callback_add_waypoint = (pos: Waypoint) => {
    setWaypoints((prev) => {
      pos.set_number(prev.length);
      return [...prev, pos];
    });
  };

  const callback_waypoint_pos = (idx: number, pos: LatLng) => {
    setWaypoints((prev) => {
      let new_waypoints = [...prev];
      // XXX: just changing the coords won't work
      new_waypoints[idx] = Waypoint.from_latLng(pos, new_waypoints[idx].name);
      new_waypoints[idx].set_number(idx);
      return new_waypoints;
    });
  };

  const callback_remove_waypoint = useCallback((idx: number) => {
    setWaypoints((prev) => {
      let new_waypoints = [...prev];
      new_waypoints.splice(idx, 1);
      for (let i = idx; i < new_waypoints.length; ++i) {
        new_waypoints[i].set_number(i);
      }
      return new_waypoints;
    });
  }, []);

  const callback_waypoint_order = useCallback((order: number[]) => {
    setWaypoints((prev) => {
      let new_waypoints = order.map((idx) => prev[idx]);
      for (let i = 0; i < new_waypoints.length; ++i) {
        new_waypoints[i].set_number(i);
      }
      return new_waypoints;
    });
  }, []);

  useEffect(() => {
    routeData
      .update_routes(waypoints)
      .then((_) => setRouteData(routeData.clone()));
  }, [waypoints]);

  return (
    <div className="main">
      <Sidebar
        waypoints={waypoints}
        route={routeData}
        callback_update_wp_order={callback_waypoint_order}
      />
      <MapContainer center={position} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Map
          waypoints={waypoints}
          route_data={routeData}
          callback_add_waypoint={callback_add_waypoint}
          callback_waypoint_pos={callback_waypoint_pos}
          callback_delete_waypoint={callback_remove_waypoint}
        />
        <ScaleControl imperial={false} />
      </MapContainer>
    </div>
  );
}

export default App;
