import { ScaleControl, TileLayer } from "react-leaflet";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { LatLng, latLng } from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BrouterProfile,
  BrouterProfileList,
  GeoRoutes,
  Waypoint,
} from "./GeoSegment";
import { Sidebar } from "./Sidebar";
import { Map } from "./Map";
import { callbacks_routes, callbacks_waypoint } from "./utils/callbacks";
import { Routes, Route, useSearchParams } from "react-router-dom";
import { match } from "oxide.ts";
import { compress, decompress } from "@zalari/string-compression-utils";

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

  const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
  const [mapPos, setMapPos] = useState<LatLng>(initial_position);
  const [mapZoom, setMapZoom] = useState<number>(initial_zoom);
  const [routeData, setRouteData] = useState<GeoRoutes>(new GeoRoutes());
  const [selectedProfile, setSelectedProfile] = useState<BrouterProfile>(
    new BrouterProfile(),
  );
  const [profiles, setProfiles] = useState<BrouterProfileList>(
    new BrouterProfileList(),
  );
  // Thank you react for not allowing async code :/
  const [loading, setLoading] = useState<boolean>(true);
  // Workaround for strict mode. Prevents duplicate api calls
  const [triggerLoad, setTriggerLoad] = useState<boolean>(false);

  useEffect(() => {
    setTriggerLoad(true);
  }, []);

  // Load profiles and set the default one to "trekking"
  useEffect(() => {
    const func = async () => {
      let new_list = new BrouterProfileList();
      await new_list.load_list();
      let profile;
      try {
        const profile_data = searchParams.get("profile") ?? "";
        const profile_str = await decompress(profile_data, "gzip");
        const profile_proto: BrouterProfile = JSON.parse(profile_str);
        profile = Object.assign(new BrouterProfile(), profile_proto);
      } catch {
        profile = await new_list.load_profile("trekking");
      }
      setProfiles(new_list);
      setSelectedProfile(profile);

      // waypoints

      const data = searchParams.get("waypoints") ?? "[]";
      let wps_str;
      try {
        wps_str = await decompress(data, "gzip");
      } catch {
        wps_str = data;
      }
      try {
        const wps_proto: Waypoint[] = JSON.parse(wps_str);
        const wps = wps_proto.map((wp_proto) =>
          Object.assign(new Waypoint(), wp_proto),
        );
        setWaypoints(wps);
      } catch {
        // Invalid data
        setWaypoints([]);
      }
      setLoading(false);
    };
    if (triggerLoad) {
      func();
    }
  }, [triggerLoad]);

  useEffect(() => {
    let func = async () => {
      let wps_compressed = await compress(JSON.stringify(waypoints), "gzip");
      let profile_compressed = await compress(
        JSON.stringify(selectedProfile),
        "gzip",
      );

      setSearchParams((prev) => {
        prev.set("waypoints", wps_compressed);

        prev.set("lat", `${mapPos.lat.toFixed(5)}`);
        prev.set("lng", `${mapPos.lng.toFixed(5)}`);
        prev.set("zoom", `${mapZoom}`);
        prev.set("profile", profile_compressed);
        return prev;
      });
    };
    if (!loading) {
      func();
    }
  }, [waypoints, mapPos, mapZoom, selectedProfile, loading]);

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
    set_profile: setSelectedProfile,
  };

  useEffect(() => {
    if (!loading) {
      routeData.update_routes(waypoints, selectedProfile).then((res) => {
        match(res, {
          Ok: (_val) => {},
          Err: (error) => console.log(`Failed to calculate route ${error}`),
        });
        return setRouteData(routeData.clone());
      });
    }
  }, [waypoints, selectedProfile, loading]);

  return (
    <div className="main">
      <Sidebar
        waypoints={waypoints}
        route={routeData}
        callbacks_waypoint={callbacks_waypoint}
        callbacks_routes={callbacks_routes}
        profile_list={profiles}
        selected_profile={selectedProfile}
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
