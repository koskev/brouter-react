import { Form, InputGroup } from "react-bootstrap";
import { Waypoint } from "./GeoSegment";
import { callbacks_waypoint } from "./utils/callbacks";

export interface WaypointEntryProperties {
  waypoint: Waypoint;
  callbacks_waypoint: callbacks_waypoint;
}

export function WaypointEntry(props: WaypointEntryProperties) {
  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    const wp = props.waypoint;
    wp.name = e.target.value;
    props.callbacks_waypoint.set(wp.get_number(), wp);
  };
  return (
    <InputGroup className="mb-3">
      <InputGroup.Text id="basic-addon1">
        {props.waypoint.get_number()}
      </InputGroup.Text>
      <Form.Control
        placeholder="Waypoint name"
        value={props.waypoint.name}
        aria-describedby="basic-addon1"
        onChange={handle_change}
      />
    </InputGroup>
  );
}
