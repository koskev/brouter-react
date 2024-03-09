import { Polyline, Popup } from "react-leaflet";
import { GeoRoutes } from "./GeoSegment";
import { useState } from "react";

export interface RouteProperties {
    data: GeoRoutes;
}

export function Route(props: RouteProperties) {
    const lines = props.data.get_lang_lats();

    const [color, _setColor] = useState("blue");

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
