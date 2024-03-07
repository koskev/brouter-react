/**
 * @jest-environment jsdom
 */

import { GeoJsonObject } from "geojson";
import { GeoRoute } from "./GeoSegment";
import segment from "./segment.json";

test("brouter parse", () => {
  expect(true).toBe(true);
  let brouter_array = segment as GeoJsonObject;
  let geo_route = new GeoRoute(brouter_array);
  expect(geo_route.segments.length).toBe(2);
  expect(geo_route.segments[0].points.length).toBe(3);
  expect(geo_route.segments[0].elevation).toBe(15);
  expect(geo_route.segments[0].distance).toBe(65);
  expect(geo_route.segments[1].points.length).toBe(2);
  expect(geo_route.segments[1].points[0][0]).toBe(10.087361);
  expect(geo_route.segments[1].elevation).toBe(15);
  expect(geo_route.segments[1].distance).toBe(3);
});
