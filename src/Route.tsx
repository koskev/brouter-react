import { GeoJsonObject } from "geojson";
import { GeoJSON, Polyline, Popup, useMapEvents } from "react-leaflet";
import { GeoRoute } from "./GeoSegment";
import { useMemo, useState } from "react";

export interface RouteProperties {
    data: GeoRoute;
}

export function Route(props: RouteProperties) {
    // XXX: need to have a unique key each time to force a rerender
    let lines = props.data.get_lang_lats();

    const [color, setColor] = useState("blue");

    return (
        <div>
            {lines.map((line) => {
                return (
                    <Polyline
                        color={color}
                        positions={line}
                        opacity={1}
                        weight={2}
                    >
                        <Popup> {line.length} </Popup>
                    </Polyline>
                );
            })}
        </div>
    );
}
