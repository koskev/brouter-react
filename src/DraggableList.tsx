// Derived from https://github.com/pmndrs/react-spring/tree/main/demo/src/sandboxes/draggable-list/src
// MIT-License

import { useSprings, animated } from "@react-spring/web";
import { useDrag, useHover } from "react-use-gesture";
import clamp from "lodash.clamp";
import swap from "lodash-move";

import styles from "./styles.module.css";
import { useRef } from "react";
import { Form, InputGroup } from "react-bootstrap";
import { Waypoint } from "./GeoSegment";
import { callback_waypoint_set } from "./utils/callbacks";

const height = 50;
const fn =
  (order: number[], active = false, originalIndex = 0, curIndex = 0, y = 0) =>
  (index: number) =>
    active && index === originalIndex
      ? {
          y: curIndex * height + y,
          scale: 1.1,
          zIndex: 1,
          shadow: 15,
          immediate: (key: string) => key === "y" || key === "zIndex",
        }
      : {
          y: order.indexOf(index) * height,
          scale: 1,
          zIndex: 0,
          shadow: 1,
          immediate: false,
        };

export interface DraggableListProps {
  items: Waypoint[];
  callback_order_change: (new_order: number[]) => void;
  callback_hover_waypoint: (index: number, active: boolean) => void;
  callback_waypoint_set: (index: number, waypoint: Waypoint) => void;
}

export function DraggableList(props: DraggableListProps) {
  const order = useRef(props.items.map((_, index) => index)); // Store indicies as a local ref, this represents the item order
  // XXX: somehow this is needed
  order.current = props.items.map((_, index) => index);
  const [springs, api] = useSprings(props.items.length, fn(order.current)); // Create springs, each corresponds to an item, controlling its transform, scale, etc.
  const bind = useDrag(
    ({ args: [originalIndex], active, movement: [, y] }) => {
      const curIndex = order.current.indexOf(originalIndex);
      const curRow = clamp(
        Math.round((curIndex * height + y) / height),
        0,
        props.items.length - 1,
      );
      const newOrder = swap(order.current, curIndex, curRow);
      api.start(fn(newOrder, active, originalIndex, curIndex, y)); // Feed springs new style data, they'll animate the view without causing a single render
      if (!active) {
        if (order.current !== newOrder) {
          props.callback_order_change(newOrder);
        }
        order.current = newOrder;
      }
    },
    { preventDefault: true }, // Prevent default to prevent issue with text selecetion after drag
  );
  const hover_bind = useHover(({ args: [index], active }) => {
    api.start(fn(order.current, active, index, index));
    props.callback_hover_waypoint(index, active);
  }, {});

  return (
    <div
      className={styles.content}
      style={{ height: props.items.length * height }}
    >
      {springs.map(({ zIndex, shadow, y, scale }, i) => (
        <animated.div
          {...bind(i)}
          {...hover_bind(i)}
          key={i}
          style={{
            zIndex,
            boxShadow: shadow.to(
              (s) => `rgba(0, 0, 0, 0.15) 0px ${s}px ${2 * s}px 0px`,
            ),
            y,
            scale,
          }}
        >
          <DraggableEntry
            waypoint={props.items[i]}
            callback_waypoint_set={props.callback_waypoint_set}
          />
        </animated.div>
      ))}
    </div>
  );
}

interface DraggableEntryProperties {
  waypoint: Waypoint;
  callback_waypoint_set: callback_waypoint_set;
}

function DraggableEntry(props: DraggableEntryProperties) {
  const handle_change = (e: React.ChangeEvent<HTMLInputElement>) => {
    let wp = props.waypoint;
    wp.name = e.target.value;
    props.callback_waypoint_set(wp.get_number(), wp);
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
