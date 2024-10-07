import React, { useState, useEffect } from "react";
import { Handle, Position } from "reactflow";

const PropertyNode = ({ data }) => {
  const [localLabel, setLocalLabel] = useState(data.label);
  const [localValue, setLocalValue] = useState(data.value || "");
  const [isEditing, setIsEditing] = useState(false);
  const [previousValues, setPreviousValues] = useState({});

  useEffect(() => {
    setLocalLabel(data.label);
    setLocalValue(data.value || "");
  }, [data.label, data.value]);

  const handleNameChange = (event) => {
    setLocalLabel(event.target.value);
  };

  const handleValueChange = (event) => {
    let newValue = event.target.value;
    if (data.selectedType === "IfcBoolean") {
      newValue = event.target.checked;
    } else if (data.selectedType === "IfcInteger") {
      newValue = parseInt(newValue, 10);
    } else if (data.selectedType === "IfcReal") {
      newValue = parseFloat(newValue);
    }
    setLocalValue(newValue);
  };

  const handleNameBlur = () => {
    data.onChange(data.id, localLabel, data.selectedType, localValue);
    setIsEditing(false);
  };

  const handleNameKeyDown = (event) => {
    if (event.key === "Enter") {
      handleNameBlur();
    }
  };

  const handleSelectChange = (event) => {
    const newType = event.target.value;
    let newValue;

    setPreviousValues((prev) => ({ ...prev, [data.selectedType]: localValue }));

    if (previousValues[newType] !== undefined) {
      newValue = previousValues[newType];
    } else {
      switch (newType) {
        case "IfcBoolean":
          newValue = false;
          break;
        case "IfcInteger":
          newValue = 0;
          break;
        case "IfcReal":
          newValue = 0.0;
          break;
        default:
          newValue = "";
      }
    }

    setLocalValue(newValue);
    data.onChange(data.id, localLabel, newType, newValue);
  };

  const renderValueInput = () => {
    switch (data.selectedType) {
      case "IfcBoolean":
        return (
          <label className="switch">
            <input
              type="checkbox"
              checked={localValue}
              onChange={handleValueChange}
            />
            <span className="slider round"></span>
          </label>
        );
      case "IfcInteger":
        return (
          <input
            type="number"
            value={localValue}
            onChange={handleValueChange}
            className="property-input number"
          />
        );
      case "IfcReal":
        return (
          <input
            type="number"
            value={localValue}
            onChange={handleValueChange}
            className="property-input number"
          />
        );
      default:
        return (
          <input
            type="text"
            value={localValue}
            onChange={handleValueChange}
            className="property-input text"
          />
        );
    }
  };

  return (
    <div className="property-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: "12px",
          height: "12px",
        }}
      />
      <div className="property-content">
        <div className="property-header">
          {isEditing ? (
            <input
              type="text"
              value={localLabel}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              onKeyDown={handleNameKeyDown}
              autoFocus
              className="property-name-input"
            />
          ) : (
            <div className="property-name" onClick={() => setIsEditing(true)}>
              {localLabel}
            </div>
          )}
          <select
            onChange={handleSelectChange}
            value={data.selectedType}
            className="property-type-select"
          >
            <option value="IfcText">IfcText</option>
            <option value="IfcBoolean">IfcBoolean</option>
            <option value="IfcInteger">IfcInteger</option>
            <option value="IfcReal">IfcReal</option>
            <option value="IfcLabel">IfcLabel</option>
            <option value="IfcIdentifier">IfcIdentifier</option>
            <option value="IfcClassification">IfcClassification</option>
          </select>
        </div>
        <div className="property-value">{renderValueInput()}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: "12px",
          height: "12px",
        }}
      />
    </div>
  );
};

export default PropertyNode;
