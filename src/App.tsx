import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { LatLng, latLng } from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJsonObject } from "geojson";
import { Route } from "./Route";
import { GeoRoute } from "./GeoSegment";

interface NewMarkerDialogProperties {
  position: LatLng;
  confirm_callback: (pos: LatLng) => void;
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
    <Popup position={props.position} ref={popupRef}>
      <button onClick={handle_button}> Add Waypoint </button>
    </Popup>
  );
}

interface MarkerProperties {
  position: LatLng;
  index: number;
  position_changed_callback: (index: number, new_pos: LatLng) => void;
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
          props.position_changed_callback(props.index, marker.getLatLng());
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
      position={props.position}
      draggable={true}
      ref={markerRef}
      eventHandlers={markerEvents}
    >
      <Popup ref={popupRef}>
        <button onClick={handle_remove_button}> Remove Waypoint </button>
        <label>
          {" "}
          Lat: {props.position.lat} Lng: {props.position.lng}{" "}
        </label>
      </Popup>
    </Marker>
  );
}

interface MapProperties {
  waypoints: LatLng[];
  route_data: GeoRoute | undefined;

  // callbacks
  callback_add_waypoint: (pos: LatLng) => void;
  callback_set_waypoint: (idx: number, pos: LatLng) => void;
  callback_delete_waypoint: (idx: number) => void;
}

function Map(props: MapProperties) {
  const map = useMap();
  const [newMarkerPos, setNewMarkerPos] = useState<LatLng | undefined>(
    undefined,
  );

  useEffect(() => {
    map.scrollWheelZoom.enable();

    map.on("click", (e) => {
      let pos = e.latlng;
      setNewMarkerPos(pos);
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
  waypoints: LatLng[];
  route: GeoRoute | undefined;
}

function Sidebar(props: SidebarProperties) {
  // NEED unwrap_or....
  const distance = props.route ? props.route.get_distance() : 0;
  return (
    <div>
      <label> Total Distance: {distance} </label>
    </div>
  );
}

function App() {
  const position = latLng(53.6, 10);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [routeData, setRouteData] = useState<GeoRoute | undefined>(undefined);

  const callback_add_waypoint = (pos: LatLng) => {
    setWaypoints((prev) => [...prev, pos]);
  };

  const callback_set_waypoint = (idx: number, pos: LatLng) => {
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
      let coords_str = waypoints
        .map((pos) => `${pos.lng},${pos.lat}`)
        .join("|");
      fetch(
        `https://brouter.kokev.de/brouter?lonlats=${coords_str}&profile=trekking&alternativeidx=0&format=geojson`,
      )
        .then((e) => {
          if (e.ok) {
            e.json()
              .then((data) => {
                let geo_route = new GeoRoute(data);
                setRouteData((_prev) => geo_route);
              })
              .catch((e) => {
                console.error(
                  `Failed to parse response from server with error ${e}`,
                );
                console.error(e);
              });
          } else {
            // Error code
            e.text().then((text) => {
              console.error(`Failed to calculate route. Response: ${text}`);
            });
          }
        })
        .catch((e) => {
          console.error(`Failed to fetch route from brouter api: ${e}`);
        });
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
