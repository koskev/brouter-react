import { Polyline, Popup } from "react-leaflet";
import { GeoRoutes } from "./GeoSegment";
import { latLng } from "leaflet";

export interface RouteProperties {
    data: GeoRoutes;
}

export function Route(props: RouteProperties) {
    let a = props.data.routes.flatMap((route) => {
        return route.segments.map((segment) => {
            let line = segment.points.map((point) =>
                latLng(point[1], point[0]),
            );
            const color = segment.highlight ? "red" : "blue";
            return (
                <Polyline
                    pathOptions={{ color: color }}
                    positions={line}
                    opacity={1}
                    weight={2}
                >
                    <Popup> {line.length} </Popup>
                </Polyline>
            );
        });
    });

    return <div>{a}</div>;
}
