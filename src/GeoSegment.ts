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

export class GeoRoute {
    segments: GeoSegment[] = [];

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
