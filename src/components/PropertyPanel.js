import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Panel } from "reactflow";
import { FaList, FaThumbtack } from "react-icons/fa";
import { getMaterialColor } from "../utils/ifcUtils";

const PropertyPanel = forwardRef(
  (
    {
      properties,
      addProperty,
      updateProperty,
      deleteProperty,
      isFixed,
      setIsFixed,
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isCollapsing, setIsCollapsing] = useState(false);
    const [newPropertyName, setNewPropertyName] = useState("");
    const [newPropertyType, setNewPropertyType] = useState("IfcText");
    const [editingPropertyId, setEditingPropertyId] = useState(null);
    const panelRef = useRef(null);
    const timeoutRef = useRef(null);
    const inputRef = useRef(null);

    const handleMouseEnter = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsCollapsed(false);
      setIsCollapsing(false);
    };

    const handleMouseLeave = () => {
      if (!isFixed) {
        setIsCollapsing(true);
        timeoutRef.current = setTimeout(() => {
          setIsCollapsed(true);
          setIsCollapsing(false);
        }, 3000);
      }
    };

    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    const handlePropertyNameClick = (propertyId) => {
      setEditingPropertyId(propertyId);
    };

    const handlePropertyNameChange = (e, propertyId) => {
      const newName = e.target.value;
      updateProperty(
        propertyId,
        newName,
        properties.find((p) => p.id === propertyId).type
      );
    };

    const handlePropertyNameBlur = () => {
      setEditingPropertyId(null);
    };

    return (
      <Panel
        position="right"
        className={`property-panel ${isCollapsed ? "collapsed" : ""} ${
          isCollapsing ? "collapsing" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={panelRef}
      >
        <div className="panel-header">
          <h3>Property Launcher:</h3>
          <label className="fix-checkbox">
            <input
              type="checkbox"
              checked={isFixed}
              onChange={() => setIsFixed(!isFixed)}
            />
            <FaThumbtack size={16} />
          </label>
        </div>
        {!isCollapsed && (
          <div className="property-content">
            <p>Add, edit, or remove properties from your IFC layers.</p>
            {properties.map((prop) => (
              <div key={prop.id} className="property-item">
                {editingPropertyId === prop.id ? (
                  <input
                    ref={inputRef}
                    type="text"
                    value={prop.name}
                    onChange={(e) => handlePropertyNameChange(e, prop.id)}
                    onBlur={handlePropertyNameBlur}
                  />
                ) : (
                  <div onClick={() => handlePropertyNameClick(prop.id)}>
                    {prop.name}
                  </div>
                )}
                <select
                  value={prop.type}
                  onChange={(e) =>
                    updateProperty(prop.id, prop.name, e.target.value)
                  }
                  title="Select property type"
                >
                  <option value="IfcText">IfcText</option>
                  <option value="IfcBoolean">IfcBoolean</option>
                  <option value="IfcInteger">IfcInteger</option>
                  <option value="IfcReal">IfcReal</option>
                  <option value="IfcLabel">IfcLabel</option>
                  <option value="IfcIdentifier">IfcIdentifier</option>
                  <option value="IfcClassification">IfcClassification</option>
                </select>
                <button
                  onClick={() => deleteProperty(prop.id)}
                  title="Delete property"
                >
                  X
                </button>
              </div>
            ))}
            <div className="add-property">
              <input
                type="text"
                value={newPropertyName}
                onChange={(e) => setNewPropertyName(e.target.value)}
                placeholder="New property name"
              />
              <select
                value={newPropertyType}
                onChange={(e) => setNewPropertyType(e.target.value)}
                title="Select new property type"
              >
                <option value="IfcText">IfcText</option>
                <option value="IfcBoolean">IfcBoolean</option>
                <option value="IfcInteger">IfcInteger</option>
                <option value="IfcReal">IfcReal</option>
                <option value="IfcLabel">IfcLabel</option>
                <option value="IfcIdentifier">IfcIdentifier</option>
                <option value="IfcClassification">IfcClassification</option>
              </select>
              <button
                className="add-button"
                onClick={() => {
                  if (newPropertyName) {
                    addProperty(newPropertyName, newPropertyType);
                    setNewPropertyName("");
                    setNewPropertyType("IfcText");
                  }
                }}
                title="Add new property"
              >
                Add Property
              </button>
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="property-tab">
            <FaList size={20} />
            <span>Properties</span>
          </div>
        )}
      </Panel>
    );
  }
);

export default PropertyPanel;
