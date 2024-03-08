import {
    FeatureCollection,
    GeoJsonObject,
    LineString,
    Position,
} from "geojson";
import { LatLng, latLng } from "leaflet";

export class GeoSegment {
    points: Position[] = [];
    elevation: number = 0;
    distance: number = 0;

    public static from_brouter(
        array: string[],
        remaining_points: Position[],
    ): GeoSegment {
        if (remaining_points.length == 0) {
            console.error("Got zero remaining points!");
        }
        let segment = new GeoSegment();

        let long = parseInt(array[1]) / 1e6;
        let lat = parseInt(array[0]) / 1e6;
        // remove elements until we have a match
        while (remaining_points.length > 0) {
            // no match
            if (
                remaining_points[0][0] !== lat &&
                remaining_points[0][1] !== long
            ) {
                let removed_element = remaining_points.splice(0, 1);
                segment.points.push(removed_element[0]);
            } else {
                // add last point on match but don't remove it
                segment.points.push(remaining_points[0]);
                break;
            }
        }
        segment.elevation = parseInt(array[2]);
        segment.distance = parseInt(array[3]);

        return segment;
    }
}

export class GeoRoutes {
    routes: GeoRoute[] = [];
    waypoints: Waypoint[] = [];

    clone(): GeoRoutes {
        let new_obj = new GeoRoutes();
        new_obj.routes = [...this.routes];
        new_obj.waypoints = [...this.waypoints];
        return new_obj;
    }

    async update_routes(waypoints: Waypoint[]): Promise<boolean> {
        if (waypoints.length >= 2) {
            // Consider removed waypoints. We can only have wp - 1 routes
            this.routes = this.routes.slice(0, waypoints.length - 1);
            for (let i = 1; i < waypoints.length; ++i) {
                let start = waypoints[i - 1];
                let end = waypoints[i];
                const old_start = this.waypoints[i - 1];
                const old_end = this.waypoints[i];
                if (start === old_start && end === old_end) {
                    // Don't update if we already have the route
                    // TODO: consider different options
                    continue;
                }
                let res = await fetch(
                    `https://brouter.kokev.de/brouter?lonlats=${start.lng()},${start.lat()}|${end.lng()},${end.lat()}&profile=trekking&alternativeidx=0&format=geojson`,
                );
                if (res.ok) {
                    let json = await res.json();
                    let geo_route = new GeoRoute(json);
                    this.routes[i - 1] = geo_route;
                } else {
                    // Error code
                    let text = await res.text();
                    console.error(
                        `Failed to calculate route. Response: ${text}`,
                    );
                    return false;
                }
            }
        } else {
            this.routes = [];
        }
        this.waypoints = waypoints;
        return false;
    }

    get_lang_lats(): LatLng[][] {
        return this.routes.flatMap((route) => route.get_lang_lats());
    }

    get_distance(): number {
        return this.routes.reduce(
            (acc, route) => acc + route.get_distance(),
            0,
        );
    }
}

export class Waypoint {
    coords: LatLng = latLng(0, 0);
    name: string = "undefined";
    wp_number: number = 0;
    highlight: boolean = false;

    static from_position(pos: Position, name: string): Waypoint {
        let wp = new Waypoint();
        wp.name = name;
        wp.coords = latLng(pos[1], pos[0]);
        return wp;
    }

    static from_latLng(pos: LatLng, name: string): Waypoint {
        let wp = new Waypoint();
        wp.name = name;
        wp.coords = pos;
        return wp;
    }

    latLng(): LatLng {
        return this.coords;
    }

    lat(): number {
        return this.coords.lat;
    }

    lng(): number {
        return this.coords.lng;
    }

    get_number(): number {
        return this.wp_number;
    }

    set_number(id: number) {
        this.wp_number = id;
    }
}

export class GeoRoute {
    segments: GeoSegment[] = [];

    get_start(): Position {
        return this.segments[0].points[0];
    }

    get_end(): Position {
        let end = this.segments.at(-1)?.points.at(-1);
        let val = end ?? [0, 0, 0];
        return val;
    }

    get_distance(): number {
        return this.segments.reduce((acc: number, val: GeoSegment) => {
            return acc + val.distance;
        }, 0);
    }

    get_lang_lats(): LatLng[][] {
        return this.segments.map((segment) => {
            return segment.points.map((point) => latLng(point[1], point[0]));
        });
    }

    constructor(geo: GeoJsonObject | undefined) {
        if (geo && geo.type === "FeatureCollection") {
            let collection = geo as FeatureCollection;
            for (let feature of collection.features) {
                if (
                    feature.properties?.messages &&
                    feature.geometry.type === "LineString"
                ) {
                    let positions_left = [
                        ...(feature.geometry as LineString).coordinates,
                    ];
                    let messages: string[][] = [...feature.properties.messages];
                    messages.splice(0, 1);
                    for (let message of messages) {
                        // &mut positions_left
                        let segment = GeoSegment.from_brouter(
                            message,
                            positions_left,
                        );
                        this.segments.push(segment);
                    }
                }
            }
        }
    }
}
