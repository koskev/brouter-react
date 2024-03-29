/**
 * @jest-environment jsdom
 */

import { GeoJsonObject } from "geojson";
import { GeoRoute } from "./GeoSegment";
import segment from "./segment.json";

test("brouter parse", () => {
  expect(true).toBe(true);
  const brouter_array = segment as GeoJsonObject;
  const geo_route = new GeoRoute(brouter_array);
  expect(geo_route.segments.length).toBe(2);
  expect(geo_route.segments[0].points.length).toBe(3);
  expect(geo_route.segments[0].message.elevation).toBe(15);
  expect(geo_route.segments[0].message.distance).toBe(65);
  expect(geo_route.segments[1].points.length).toBe(2);
  expect(geo_route.segments[1].points[0][0]).toBe(10.087361);
  expect(geo_route.segments[1].message.elevation).toBe(15);
  expect(geo_route.segments[1].message.distance).toBe(3);
});
