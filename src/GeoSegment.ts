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
            this.cost_per_km = parseIntOpt(message[4]).unwrapOr(0);
            this.cost_elev = parseIntOpt(message[5]).unwrapOr(0);
            this.cost_turn = parseIntOpt(message[6]).unwrapOr(0);
            this.cost_node = parseIntOpt(message[7]).unwrapOr(0);
            this.cost_init = parseIntOpt(message[8]).unwrapOr(0);
            this.way_tags = array_to_map(message[9]);
            this.node_tags = array_to_map(message[10]);
            this.cost_init = parseIntOpt(message[11]).unwrapOr(0);
            this.energy = parseIntOpt(message[12]).unwrapOr(0);
        }
    }

    get_way_type(): string {
        return this.way_tags.get("highway") ?? "unknown";
    }

    get_surface(): string {
        return this.way_tags.get("surface") ?? "unknown";
    }
}

export class GeoSegment {
    points: Position[] = [];
    message: BrouterMessage = new BrouterMessage(None);
    highlight: boolean = false;

    public static from_brouter(
        array: string[],
        remaining_points: Position[],
    ): GeoSegment {
        if (remaining_points.length == 0) {
            console.error("Got zero remaining points!");
        }
        const segment = new GeoSegment();

        segment.message = new BrouterMessage(Some(array));

        // remove elements until we have a match
        while (remaining_points.length > 0) {
            // no match
            if (
                remaining_points[0][0] !== segment.message.latitude &&
                remaining_points[0][1] !== segment.message.longitude
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

export class BrouterProfileList {
    profile_names: string[] = [];
    async load_list() {
        let response = await fetch("profiles/profiles.json");
        let list = await response.json();
        this.profile_names = list;
    }

    get_profile_names(): string[] {
        return this.profile_names;
    }

    async load_profile(name: string): Promise<BrouterProfile> {
        let response = await fetch(`profiles/${name}.brf`);
        let data = await response.text();

        let profile = new BrouterProfile();
        profile.name = name;
        profile.profile = data;
        return profile;
    }
}

export class BrouterProfile {
    name: string = "trekking";
    profile: string = "";
    is_updated: boolean = false;

    // TODO: implement caching
    async upload_profile(instance: InstanceInfo) {
        let url = `${instance.get_url()}/profile/${this.get_profile_name()}`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "text/plain;charset=UTF-8",
            },
            body: this.profile,
        });

        if (response.ok) {
            this.is_updated = true;
        } else {
            console.error("Failed to upload profile!");
            console.error(response);
        }
    }

    set_data(data: string) {
        this.profile = data;
        this.is_updated = false;
    }

    get_profile_name() {
        return `custom_${this.name}`;
    }
}

class InstanceInfo {
    host: string = "brouter.kokev.de";
    protocol: string = "https";
    path: string = "brouter";

    get_url(): string {
        return `${this.protocol}://${this.host}/${this.path}`;
    }
}

export class GeoRoutes {
    routes: GeoRoute[] = [];
    waypoints: Waypoint[] = [];
    instance: InstanceInfo = new InstanceInfo();
    profile: BrouterProfile = new BrouterProfile();

    clone(): GeoRoutes {
        const new_obj = new GeoRoutes();
        new_obj.routes = [...this.routes];
        new_obj.waypoints = [...this.waypoints];
        return new_obj;
    }

    async update_routes(
        waypoints: Waypoint[],
        profile: BrouterProfile,
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
                const old_profile = this.profile;
                if (
                    start === old_start &&
                    end === old_end &&
                    profile === old_profile
                ) {
                    // Don't update if we already have the route with the same profile
                    // TODO: consider different options
                    continue;
                }
                if (!profile.is_updated) {
                    profile.upload_profile(this.instance);
                }
                console.log(`Updating route with profile ${profile.name}`);
                const res = await fetch(
                    `${this.instance.get_url()}?lonlats=${start.lng()},${start.lat()}|${end.lng()},${end.lat()}&profile=${profile.get_profile_name()}&alternativeidx=0&format=geojson`,
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
        this.profile = profile;
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

    toJSON() {
        return {
            coords: {
                lat: parseFloat(this.coords.lat.toFixed(5)),
                lng: parseFloat(this.coords.lng.toFixed(5)),
            },
            name: this.name,
            wp_number: this.wp_number,
        };
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
