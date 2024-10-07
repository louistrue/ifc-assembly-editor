import React, { useState, useEffect } from "react";
import { getBezierPath } from "reactflow";
import { FaTrash } from "react-icons/fa";

export default function EdgeWithButton({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [opacity, setOpacity] = useState(1);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    if (data?.isTemp) {
      const interval = setInterval(() => {
        setOpacity((prev) => (prev === 1 ? 0.5 : 1));
        setScale((prev) => (prev === 1 ? 1.2 : 1));
      }, 250);
      return () => clearInterval(interval);
    }
  }, [data?.isTemp]);

  const onEdgeButtonClick = (evt, id) => {
    evt.stopPropagation();
    if (typeof data?.removeEdge === "function") {
      data.removeEdge(id);
    } else {
      console.error("removeEdge function is not defined for this edge");
    }
  };

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <foreignObject
        width={40}
        height={40}
        x={labelX - 20}
        y={labelY - 20}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div className="edgebutton-wrapper">
          <button
            className="edgebutton"
            onClick={(event) => onEdgeButtonClick(event, id)}
            style={{
              opacity: data?.isTemp ? opacity : 1,
              transform: `scale(${data?.isTemp ? scale : 1})`,
              transition: "opacity 0.25s, transform 0.25s",
            }}
          >
            <FaTrash
              color={data?.isTemp ? "red" : "#888"}
              size={data?.isTemp ? 16 * scale : 16}
            />
          </button>
        </div>
      </foreignObject>
    </>
  );
}
