import { GeoJsonObject } from "geojson";
import { GeoJSON } from "react-leaflet";

export interface RouteProperties {
    data: GeoJsonObject;
}

export function Route(props: RouteProperties) {
    // XXX: need to have a unique key each time to force a rerender
    return <GeoJSON key={JSON.stringify(props.data)} data={props.data} />;
}
