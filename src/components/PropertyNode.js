import React, { useState, useEffect, useCallback, useRef } from "react";
import { Handle, Position } from "reactflow";
import { getMaterialColor } from "../utils/ifcUtils";

const PropertyNode = ({ data }) => {
  const [name, setName] = useState(data.label);
  const [type, setType] = useState(data.selectedType);
  const [values, setValues] = useState({
    IfcText: "",
    IfcBoolean: false,
    IfcInteger: "",
    IfcReal: "",
    IfcLabel: "",
    IfcIdentifier: "",
    IfcClassification: "",
  });
  const valueInputRef = useRef(null);

  useEffect(() => {
    setName(data.label);
    setType(data.selectedType);
    setValues((prevValues) => ({
      ...prevValues,
      [data.selectedType]: data.value || prevValues[data.selectedType],
    }));
  }, [data.id, data.label, data.selectedType, data.value]);

  const handleNameChange = useCallback(
    (e) => {
      const newName = e.target.value;
      setName(newName);
      data.onChange(data.id, newName, type, values[type]);
    },
    [data, type, values]
  );

  const handleTypeChange = useCallback(
    (e) => {
      const newType = e.target.value;
      setType(newType);
      data.onChange(data.id, name, newType, values[newType]);
    },
    [data, name, values]
  );

  const handleValueChange = useCallback(
    (e) => {
      let newValue;
      switch (type) {
        case "IfcBoolean":
          newValue = e.target.checked;
          break;
        case "IfcInteger":
          newValue = e.target.value.replace(/[^0-9-]/g, "");
          break;
        case "IfcReal":
          newValue = e.target.value.replace(/[^0-9.-]/g, "");
          break;
        default:
          newValue = e.target.value;
          break;
      }
      setValues((prevValues) => ({
        ...prevValues,
        [type]: newValue,
      }));
    },
    [type]
  );

  const handleValueBlur = useCallback(() => {
    data.onChange(data.id, name, type, values[type]);
  }, [data, name, type, values]);

  const renderValueInput = () => {
    switch (type) {
      case "IfcBoolean":
        return (
          <input
            type="checkbox"
            checked={values.IfcBoolean}
            onChange={handleValueChange}
            onBlur={handleValueBlur}
            className="property-input boolean"
          />
        );
      case "IfcInteger":
        return (
          <input
            type="number"
            value={values.IfcInteger}
            onChange={handleValueChange}
            onBlur={handleValueBlur}
            className="property-input integer"
            step="1"
            ref={valueInputRef}
          />
        );
      case "IfcReal":
        return (
          <input
            type="number"
            value={values.IfcReal}
            onChange={handleValueChange}
            onBlur={handleValueBlur}
            className="property-input real"
            step="any"
            ref={valueInputRef}
          />
        );
      default:
        return (
          <input
            type="text"
            value={values[type]}
            onChange={handleValueChange}
            onBlur={handleValueBlur}
            className="property-input text"
            placeholder="Value"
            ref={valueInputRef}
          />
        );
    }
  };

  return (
    <div className="property-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
      <div className="property-content">
        <div className="property-row">
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            className="property-name-input"
            placeholder="Property Name"
          />
        </div>
        <div className="property-row">
          <select
            value={type}
            onChange={handleTypeChange}
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
        <div className="property-row">{renderValueInput()}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: "50%", transform: "translateY(-50%)" }}
      />
    </div>
  );
};

export default React.memo(PropertyNode);
