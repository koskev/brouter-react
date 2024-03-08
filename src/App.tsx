import { TileLayer } from "react-leaflet";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { latLng } from "leaflet";
import { useCallback, useEffect, useState } from "react";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { Sidebar } from "./Sidebar";
import { Map } from "./Map";

function App() {
  const position = latLng(53.6, 10);
  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [routeData, setRouteData] = useState<GeoRoutes>(new GeoRoutes());

  const callback_add_waypoint = (pos: Waypoint) => {
    setWaypoints((prev) => [...prev, pos]);
  };

  const callback_set_waypoint = (idx: number, pos: Waypoint) => {
    setWaypoints((prev) => {
      let new_waypoints = [...prev];
      new_waypoints[idx] = pos;
      return new_waypoints;
    });
  };

  const callback_remove_waypoint = useCallback((idx: number) => {
    setWaypoints((prev) => {
      let new_waypoints = [...prev];
      new_waypoints.splice(idx, 1);
      return new_waypoints;
    });
  }, []);

  useEffect(() => {
    if (waypoints.length >= 2) {
      routeData
        .update_routes(waypoints)
        .then((_) => setRouteData(routeData.clone()));
    }
  }, [waypoints]);

  return (
    <div>
      <MapContainer center={position} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Map
          waypoints={waypoints}
          route_data={routeData}
          callback_add_waypoint={callback_add_waypoint}
          callback_set_waypoint={callback_set_waypoint}
          callback_delete_waypoint={callback_remove_waypoint}
        />
      </MapContainer>
      <Sidebar waypoints={waypoints} route={routeData} />
    </div>
  );
}

export default App;
