import React, { useState, useEffect, useRef } from "react";
import { Handle, Position } from "reactflow";

const PropertySetNode = ({ data }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localName, setLocalName] = useState(data.name);
  const [localColor, setLocalColor] = useState(data.color);
  const inputRef = useRef(null);
  const colorRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = () => {
    setIsEditing(true);
  };

  const handleNameChange = (event) => {
    setLocalName(event.target.value);
  };

  const handleColorChange = (event) => {
    const newColor = event.target.value;
    setLocalColor(newColor);
    data.onChange(data.id, localName, newColor);
  };

  const handleBlur = () => {
    if (localName.trim() !== "") {
      data.onChange(data.id, localName, localColor);
    } else {
      setLocalName(data.name);
      setLocalColor(data.color);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleBlur();
    } else if (event.key === "Escape") {
      setLocalName(data.name);
      setLocalColor(data.color);
      setIsEditing(false);
    }
  };

  const openColorPicker = (event) => {
    event.stopPropagation();
    colorRef.current.click();
  };

  const handleDelete = (event) => {
    event.stopPropagation();
    data.onDelete(data.id);
  };

  return (
    <div
      className={`property-set-node ${isEditing ? "editing" : ""}`}
      onDoubleClick={handleDoubleClick}
      style={{ backgroundColor: localColor }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ width: "12px", height: "12px" }}
      />
      <div className="property-set-content">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={localName}
            onChange={handleNameChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="property-set-name-input"
          />
        ) : (
          <div className="property-set-name">{localName}</div>
        )}
      </div>
      <div className="property-set-color-container">
        <input
          ref={colorRef}
          type="color"
          value={localColor}
          onChange={handleColorChange}
          className="property-set-color-input"
        />
        <div
          className="property-set-color-dot"
          style={{ backgroundColor: localColor }}
          onClick={openColorPicker}
        ></div>
      </div>
      {isEditing && (
        <button className="delete-button" onClick={handleDelete}>
          ×
        </button>
      )}
    </div>
  );
};

export default PropertySetNode;
