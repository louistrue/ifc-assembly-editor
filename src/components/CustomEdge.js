import React from "react";
import { getBezierPath, EdgeText } from "reactflow";

const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <path
        id={id}
        style={style}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      <EdgeText
        x={labelX}
        y={labelY}
        label={data?.label || ""}
        labelStyle={data?.labelStyle}
        labelShowBg={data?.labelShowBg}
        labelBgStyle={data?.labelBgStyle}
        labelBgPadding={data?.labelBgPadding}
        labelBgBorderRadius={data?.labelBgBorderRadius}
      />
    </>
  );
};

export default CustomEdge;
