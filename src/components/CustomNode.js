import React from "react";
import { Handle, Position } from "reactflow";

const CustomNode = ({ data }) => {
  return (
    <div
      className="drag-handle"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
      }}
    >
      {data.label}
      <Handle
        type="source"
        position={Position.Right}
        style={{ width: "12px", height: "12px" }}
      />
    </div>
  );
};

export default CustomNode;
