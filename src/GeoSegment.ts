import {
    FeatureCollection,
    GeoJsonObject,
    LineString,
    Position,
} from "geojson";
import { LatLng, latLng } from "leaflet";
import { Err, None, Ok, Option, Result, Some } from "oxide.ts";

function parseIntOpt(str: string): Option<number> {
    try {
        return Some(parseInt(str));
    } catch {
        return None;
    }
}

function array_to_map(input: string): Map<string, string> {
    const pairs = input.split(" ");
    let map = new Map();

    // WHY can't we just use a map function? FUCK YOU TS!
    for (const pair of pairs) {
        const [key, val] = pair.split("=");
        if (key && val) map.set(key, val);
    }
    return map;
}

class BrouterMessage {
    longitude: number = 0;
    latitude: number = 0;
    elevation: number = 0;
    distance: number = 0;
    cost_per_km: number = 0;
    cost_elev: number = 0;
    cost_turn: number = 0;
    cost_node: number = 0;
    cost_init: number = 0;
    way_tags: Map<string, string> = new Map();
    node_tags: Map<string, string> = new Map();
    time: number = 0;
    energy: number = 0;

    // TODO: actually match with the first message sent
    constructor(message_opt: Option<string[]>) {
        if (message_opt.isSome()) {
            let message = message_opt.unwrap();
            this.latitude = parseIntOpt(message[0]).unwrapOr(0) / 1e6;
            this.longitude = parseIntOpt(message[1]).unwrapOr(0) / 1e6;
            this.elevation = parseIntOpt(message[2]).unwrapOr(0);
            this.distance = parseIntOpt(message[3]).unwrapOr(0);
            this.cost_per_km = parseIntOpt(message[5]).unwrapOr(0);
            this.cost_elev = parseIntOpt(message[6]).unwrapOr(0);
            this.cost_turn = parseIntOpt(message[7]).unwrapOr(0);
            this.cost_node = parseIntOpt(message[8]).unwrapOr(0);
            this.cost_init = parseIntOpt(message[9]).unwrapOr(0);
            this.way_tags = array_to_map(message[10]);
            this.node_tags = array_to_map(message[11]);
            this.cost_init = parseIntOpt(message[12]).unwrapOr(0);
            this.energy = parseIntOpt(message[11]).unwrapOr(0);
        }
    }
}

export class GeoSegment {
    points: Position[] = [];

    message: BrouterMessage = new BrouterMessage(None);

    public static from_brouter(
        array: string[],
        remaining_points: Position[],
    ): GeoSegment {
        if (remaining_points.length == 0) {
            console.error("Got zero remaining points!");
        }
        const segment = new GeoSegment();

        const message = new BrouterMessage(Some(array));

        // remove elements until we have a match
        while (remaining_points.length > 0) {
            // no match
            if (
                remaining_points[0][0] !== message.latitude &&
                remaining_points[0][1] !== message.longitude
            ) {
                const removed_element = remaining_points.splice(0, 1);
                segment.points.push(removed_element[0]);
            } else {
                // add last point on match but don't remove it
                segment.points.push(remaining_points[0]);
                break;
            }
        }

        return segment;
    }
}

export class GeoRoutes {
    routes: GeoRoute[] = [];
    waypoints: Waypoint[] = [];

    clone(): GeoRoutes {
        const new_obj = new GeoRoutes();
        new_obj.routes = [...this.routes];
        new_obj.waypoints = [...this.waypoints];
        return new_obj;
    }

    async update_routes(
        waypoints: Waypoint[],
    ): Promise<Result<number[], string>> {
        let updated_routes = [];
        if (waypoints.length >= 2) {
            // Consider removed waypoints. We can only have wp - 1 routes
            this.routes = this.routes.slice(0, waypoints.length - 1);
            for (let i = 1; i < waypoints.length; ++i) {
                const start = waypoints[i - 1];
                const end = waypoints[i];
                const old_start = this.waypoints[i - 1];
                const old_end = this.waypoints[i];
                if (start === old_start && end === old_end) {
                    // Don't update if we already have the route
                    // TODO: consider different options
                    continue;
                }
                const res = await fetch(
                    `https://brouter.kokev.de/brouter?lonlats=${start.lng()},${start.lat()}|${end.lng()},${end.lat()}&profile=trekking&alternativeidx=0&format=geojson`,
                );
                if (res.ok) {
                    const json = await res.json();
                    const geo_route = new GeoRoute(json);
                    this.routes[i - 1] = geo_route;
                    updated_routes.push(i - 1);
                } else {
                    // Error code
                    const text = await res.text();
                    console.error(
                        `Failed to calculate route. Response: ${text}`,
                    );
                    return Err(text);
                }
            }
        } else {
            this.routes = [];
        }
        this.waypoints = waypoints;
        return Ok(updated_routes);
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
        const wp = new Waypoint();
        wp.name = name;
        wp.coords = latLng(pos[1], pos[0]);
        return wp;
    }

    static from_latLng(pos: LatLng, name: string): Waypoint {
        const wp = new Waypoint();
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
        const end = this.segments.at(-1)?.points.at(-1);
        const val = end ?? [0, 0, 0];
        return val;
    }

    get_distance(): number {
        return this.segments.reduce((acc: number, val: GeoSegment) => {
            return acc + val.message.distance;
        }, 0);
    }

    get_lang_lats(): LatLng[][] {
        return this.segments.map((segment) => {
            return segment.points.map((point) => latLng(point[1], point[0]));
        });
    }

    constructor(geo: GeoJsonObject | undefined) {
        if (geo && geo.type === "FeatureCollection") {
            const collection = geo as FeatureCollection;
            for (const feature of collection.features) {
                if (
                    feature.properties?.messages &&
                    feature.geometry.type === "LineString"
                ) {
                    const positions_left = [
                        ...(feature.geometry as LineString).coordinates,
                    ];
                    const messages: string[][] = [
                        ...feature.properties.messages,
                    ];
                    messages.splice(0, 1);
                    for (const message of messages) {
                        // &mut positions_left
                        const segment = GeoSegment.from_brouter(
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
