import { ScaleControl, TileLayer } from "react-leaflet";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { LatLng, latLng } from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { Sidebar } from "./Sidebar";
import { Map } from "./Map";
import { callbacks_routes, callbacks_waypoint } from "./utils/callbacks";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { match } from "oxide.ts";

export function MyRouter() {
  return (
    <Routes>
      <Route path="*" element={<App />} />
    </Routes>
  );
}

function App() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initial_position = useMemo(
    () =>
      latLng(
        parseFloat(searchParams.get("lat") ?? "53.6"),
        parseFloat(searchParams.get("lng") ?? "10"),
      ),
    [],
  );
  const initial_zoom = useMemo(
    () => parseFloat(searchParams.get("zoom") ?? "13"),
    [],
  );

  const initial_waypoints = useMemo(() => {
    const wps_str = searchParams.get("waypoints") ?? "[]";
    const wps_proto: Waypoint[] = JSON.parse(wps_str);
    const wps = wps_proto.map((wp_proto) =>
      Object.assign(new Waypoint(), wp_proto),
    );
    return wps;
  }, []);

  const [waypoints, setWaypoints] = useState<Waypoint[]>(initial_waypoints);
  const [mapPos, setMapPos] = useState<LatLng>(initial_position);
  const [mapZoom, setMapZoom] = useState<number>(initial_zoom);
  const [routeData, setRouteData] = useState<GeoRoutes>(new GeoRoutes());

  useEffect(() => {
    setSearchParams((prev) => {
      let waypoint_json = JSON.stringify(waypoints);
      prev.set("waypoints", waypoint_json);
      prev.set("lat", `${mapPos.lat.toFixed(5)}`);
      prev.set("lng", `${mapPos.lng.toFixed(5)}`);
      prev.set("zoom", `${mapZoom}`);
      return prev;
    });
  }, [waypoints, mapPos, mapZoom]);

  const callback_map_pos = (pos: LatLng, zoom: number) => {
    // XXX: Using setSeatchParams here removes waypoints
    setMapPos(pos);
    setMapZoom(zoom);
  };

  const callback_add_waypoint = (pos: Waypoint) => {
    setWaypoints((prev) => {
      pos.set_number(prev.length);
      return [...prev, pos];
    });
  };

  const callback_waypoint_pos = (idx: number, pos: LatLng) => {
    setWaypoints((prev) => {
      const new_waypoints = [...prev];
      // XXX: just changing the coords won't work
      new_waypoints[idx] = Waypoint.from_latLng(pos, new_waypoints[idx].name);
      new_waypoints[idx].set_number(idx);
      return new_waypoints;
    });
  };

  const callback_waypoint_set = useCallback((idx: number, wp: Waypoint) => {
    setWaypoints((prev) => {
      // just in case
      wp.set_number(idx);
      prev[idx] = wp;
      return [...prev];
    });
  }, []);

  const callback_remove_waypoint = useCallback((idx: number) => {
    setWaypoints((prev) => {
      const new_waypoints = [...prev];
      new_waypoints.splice(idx, 1);
      for (let i = idx; i < new_waypoints.length; ++i) {
        new_waypoints[i].set_number(i);
      }
      return new_waypoints;
    });
  }, []);

  const callback_waypoint_order = useCallback((order: number[]) => {
    setWaypoints((prev) => {
      const new_waypoints = order.map((idx) => prev[idx]);
      for (let i = 0; i < new_waypoints.length; ++i) {
        new_waypoints[i].set_number(i);
      }
      return new_waypoints;
    });
  }, []);

  const callback_hover_waypoint = (index: number, active: boolean) => {
    if (active) {
      setWaypoints((prev) => {
        prev[index].highlight = true;
        return [...prev];
      });
    } else {
      setWaypoints((prev) => {
        prev[index].highlight = false;
        return [...prev];
      });
    }
  };

  const callbacks_waypoint: callbacks_waypoint = {
    set: callback_waypoint_set,
    delete: callback_remove_waypoint,
    set_pos: callback_waypoint_pos,
    add: callback_add_waypoint,
    hover: callback_hover_waypoint,
    change_order: callback_waypoint_order,
  };

  const callbacks_routes: callbacks_routes = {
    set: setRouteData,
  };

  useEffect(() => {
    routeData.update_routes(waypoints).then((res) => {
      match(res, {
        Ok: (_val) => {},
        Err: (error) => console.log(`Failed to calculate route ${error}`),
      });
      return setRouteData(routeData.clone());
    });
  }, [waypoints]);

  return (
    <div className="main">
      <Sidebar
        waypoints={waypoints}
        route={routeData}
        callbacks_waypoint={callbacks_waypoint}
        callbacks_routes={callbacks_routes}
      />
      <MapContainer
        center={initial_position}
        zoom={initial_zoom}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Map
          waypoints={waypoints}
          route_data={routeData}
          callbacks_waypoint={callbacks_waypoint}
          callback_map_pos={callback_map_pos}
        />
        <ScaleControl imperial={false} />
      </MapContainer>
    </div>
  );
}
