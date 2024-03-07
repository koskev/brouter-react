import { Marker, Popup, TileLayer, useMap } from "react-leaflet";
import { GeoJSON } from "react-leaflet/GeoJSON";
import "./App.css";
import { MapContainer } from "react-leaflet/MapContainer";
import { LatLng, LatLngExpression, Map, latLng } from "leaflet";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GeoJsonObject } from "geojson";

interface RouteProperties {
  data: GeoJsonObject;
}

function Route(props: RouteProperties) {
  // XXX: need to have a unique key each time to force a rerender
  return <GeoJSON key={JSON.stringify(props.data)} data={props.data} />;
}

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
          console.log(marker.getLatLng());
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
      </Popup>
    </Marker>
  );
}

interface MapProperties {
  waypoints: LatLng[];

  // callbacks
  callback_add_waypoint: (pos: LatLng) => void;
}

function Map(props: MapProperties) {
  const map = useMap();
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);
  const [routeData, setRouteData] = useState<GeoJsonObject | undefined>();
  const [newMarkerPos, setNewMarkerPos] = useState<LatLng | undefined>(
    undefined,
  );

  const add_waypoint = useCallback((pos: LatLng) => {
    setWaypoints((prev) => {
      return [...prev, pos];
    });
  }, []);

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
          console.log(e);
          if (e.ok) {
            e.json()
              .then((data) => {
                console.log(data);
                setRouteData((_prev) => data);
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
              console.log(`Failed to calculate route. Response: ${text}`);
            });
          }
        })
        .catch((e) => {
          console.error(`Failed to fetch route from brouter api: ${e}`);
        });
    }
  }, [waypoints]);

  const dragged_callback = useCallback((idx: number, pos: LatLng) => {
    setWaypoints((prev) => {
      // Need to copy due to react stuff
      let new_waypoints = [...prev];
      new_waypoints[idx] = pos;
      return new_waypoints;
    });
  }, []);

  const remove_callback = useCallback((idx: number) => {
    setWaypoints((prev) => {
      let new_waypoints = [...prev];
      new_waypoints.splice(idx, 1);
      return new_waypoints;
    });
  }, []);

  const new_marker_callback = (pos: LatLng) => add_waypoint(pos);

  return (
    <div>
      {newMarkerPos ? (
        <NewMarkerDialog
          position={newMarkerPos}
          confirm_callback={new_marker_callback}
        />
      ) : (
        <></>
      )}
      {routeData ? <Route data={routeData} /> : <></>}
      {waypoints.map((waypoint, idx) => {
        return (
          <WaypointMarker
            index={idx}
            position={waypoint}
            position_changed_callback={dragged_callback}
            remove_callback={remove_callback}
          />
        );
      })}
    </div>
  );
}

function Sidebar() {
  return (
    <div>
      <label> Hallo </label>
    </div>
  );
}

function App() {
  const position = latLng(53.6, 10);

  return (
    <div>
      <MapContainer center={position} zoom={13} scrollWheelZoom={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Map />
      </MapContainer>
      <Sidebar />
    </div>
  );
}

export default App;
