import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { latLng } from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Route } from "./Route";
import { GeoRoutes, Waypoint } from "./GeoSegment";

interface NewMarkerDialogProperties {
  position: Waypoint;
  confirm_callback: (pos: Waypoint) => void;
}

function NewMarkerDialog(props: NewMarkerDialogProperties) {
  const popupRef = useRef<any>(null);

  const handle_button = (_event: React.MouseEvent<HTMLButtonElement>) => {
    props.confirm_callback(props.position);
    if (popupRef.current !== null) {
      popupRef.current._closeButton.click();
    }
  };

  return (
    <Popup position={props.position.latLng()} ref={popupRef}>
      <button onClick={handle_button}> Add Waypoint </button>
    </Popup>
  );
}

interface MarkerProperties {
  position: Waypoint;
  index: number;
  position_changed_callback: (index: number, new_pos: Waypoint) => void;
  remove_callback: (index: number) => void;
}

function WaypointMarker(props: MarkerProperties) {
  // TODO: change any to actual type
  const markerRef = useRef<any>(null);
  const popupRef = useRef<any>(null);

  const markerEvents = useMemo(
    () => ({
      dragend() {
        const marker = markerRef.current;
        if (marker !== null) {
          props.position_changed_callback(
            props.index,
            Waypoint.from_latLng(marker.getLatLng()),
          );
        }
      },
    }),
    [],
  );

  const handle_remove_button = (_e: React.MouseEvent<HTMLButtonElement>) => {
    props.remove_callback(props.index);
    if (popupRef.current !== null) {
      popupRef.current._closeButton.click();
    }
  };

  return (
    <Marker
      position={props.position.latLng()}
      draggable={true}
      ref={markerRef}
      eventHandlers={markerEvents}
    >
      <Popup ref={popupRef}>
        <button onClick={handle_remove_button}> Remove Waypoint </button>
        <label>
          Lat: {props.position.lat()} Lng: {props.position.lng()}
        </label>
      </Popup>
    </Marker>
  );
}

interface MapProperties {
  waypoints: Waypoint[];
  route_data: GeoRoutes;

  // callbacks
  callback_add_waypoint: (pos: Waypoint) => void;
  callback_set_waypoint: (idx: number, pos: Waypoint) => void;
  callback_delete_waypoint: (idx: number) => void;
}

function Map(props: MapProperties) {
  const map = useMap();
  const [newMarkerPos, setNewMarkerPos] = useState<Waypoint | undefined>(
    undefined,
  );

  useEffect(() => {
    map.scrollWheelZoom.enable();

    map.on("click", (e) => {
      let pos = e.latlng;
      setNewMarkerPos(Waypoint.from_latLng(pos));
    });
    return () => {
      map.off("click");
    };
  }, []);

  return (
    <div>
      {newMarkerPos ? (
        <NewMarkerDialog
          position={newMarkerPos}
          confirm_callback={props.callback_add_waypoint}
        />
      ) : (
        <></>
      )}
      {props.route_data ? <Route data={props.route_data} /> : <></>}
      {props.waypoints.map((waypoint, idx) => {
        return (
          <WaypointMarker
            index={idx}
            position={waypoint}
            position_changed_callback={props.callback_set_waypoint}
            remove_callback={props.callback_delete_waypoint}
          />
        );
      })}
    </div>
  );
}

interface SidebarProperties {
  waypoints: Waypoint[];
  route: GeoRoutes;
}

function Sidebar(props: SidebarProperties) {
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

  // TODO: change so that each segment is calculated separately as they are independent
  // TODO: only calculate changed waypoint segments
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
