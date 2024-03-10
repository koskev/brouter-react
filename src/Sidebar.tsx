import { Bar } from "react-chartjs-2";
import { DraggableList } from "./DraggableList";
import { GeoRoutes, Waypoint } from "./GeoSegment";
import { callbacks_waypoint } from "./utils/callbacks";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import stc from "string-to-color";

export interface SidebarProperties {
  waypoints: Waypoint[];
  route: GeoRoutes;

  callbacks_waypoint: callbacks_waypoint;
}

export function Sidebar(props: SidebarProperties) {
  // NEED unwrap_or....
  const distance = props.route ? props.route.get_distance() : 0;

  // XXX: We need the key to force a remount of the component. Otherwise spring is weird when the props order changes
  const key = props.waypoints.map((wp) => `${wp.lng()}${wp.lat()}`).join("");
  return (
    <div>
      <label> Total Distance: {(distance / 1000.0).toFixed(2)}km </label>
      <div> Waypoints </div>
      <DraggableList
        key={key}
        items={props.waypoints}
        callbacks_waypoint={props.callbacks_waypoint}
      />
      <div> Types </div>
      <WaySurfaces {...props} />
    </div>
  );
}

function WaySurfaces(props: SidebarProperties) {
  let surfaces: Map<string, number> = new Map();
  let types: Map<string, number> = new Map();

  for (const route of props.route.routes) {
    for (const segment of route.segments) {
      let surface = segment.message.get_surface();
      let type = segment.message.get_way_type();
      let distance = segment.message.distance;
      const current_val = surfaces.get(surface) ?? 0;
      surfaces.set(surface, current_val + distance);

      const current_type_val = types.get(type) ?? 0;
      types.set(type, current_type_val + distance);
    }
  }

  ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
  );

  Tooltip.positioners.mouse = function (_elements: any, eventPosition: any) {
    return {
      x: eventPosition.x,
      y: eventPosition.y,
    };
  };

  const options = {
    indexAxis: "y" as const,
    plugins: {
      title: {
        display: false,
        text: "Chart.js Bar Chart - Stacked",
      },
      legend: {
        display: false,
      },
      tooltip: {
        position: "mouse",
      },
    },
    responsive: true,
    scales: {
      x: {
        display: false,
        stacked: true,
      },
      y: {
        display: false,
        stacked: true,
      },
    },
  };

  const labels = ["Surface", "Type"];

  const fill_array = (val: any, idx: number, len: number) => {
    let arr = Array(len).fill(0);
    arr[idx] = val;
    return arr;
  };

  const get_dataset_array = (
    map: Map<string, number>,
    idx: number,
    len: number,
  ) => {
    return Array.from(map)
      .sort(([_, a], [__, b]) => {
        return b - a;
      })
      .map(([val, distance]) => {
        return {
          label: val,
          data: fill_array(distance, idx, len),
          backgroundColor: stc(val),
        };
      });
  };

  let datasets = get_dataset_array(types, 0, 2);
  datasets = datasets.concat(get_dataset_array(surfaces, 1, 2));

  const data = {
    labels,
    datasets: datasets,
  };

  //return null;
  return <Bar options={options} data={data} />;
}
