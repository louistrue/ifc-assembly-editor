import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import "./App.css";
import {
  FaList,
  FaThumbtack,
  FaTimes as RemoveIcon,
  FaLayerGroup,
  FaUpload,
} from "react-icons/fa";

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

const PropertyNode = ({ data }) => {
  const [localLabel, setLocalLabel] = useState(data.label);
  const [localValue, setLocalValue] = useState(data.value || "");
  const [isEditing, setIsEditing] = useState(false);
  const [previousValues, setPreviousValues] = useState({});

  // Use useEffect to update local state when props change
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

const EdgeWithButton = ({
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
}) => {
  const edgePath = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeCenterX = (sourceX + targetX) / 2;
  const edgeCenterY = (sourceY + targetY) / 2;

  const onEdgeClick = (evt, id) => {
    evt.stopPropagation();
    if (data && data.removeEdge) {
      data.removeEdge(id);
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
        width={20}
        height={20}
        x={edgeCenterX - 10}
        y={edgeCenterY - 10}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div>
          <RemoveIcon onClick={(event) => onEdgeClick(event, id)} />
        </div>
      </foreignObject>
    </>
  );
};

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
  animated,
}) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const edgeCenterX = (sourceX + targetX) / 2;
  const edgeCenterY = (sourceY + targetY) / 2;

  const onEdgeClick = (evt, id) => {
    evt.stopPropagation();
    if (data && data.removeEdge) {
      data.removeEdge(id);
    }
  };

  return (
    <>
      <path
        id={id}
        style={{
          ...style,
          strokeWidth: 2,
          stroke: "#888",
          fill: "none",
          strokeDasharray: animated ? "5,5" : "none",
        }}
        className={`react-flow__edge-path ${animated ? "animated" : ""}`}
        d={edgePath}
      />
      <foreignObject
        width={20}
        height={20}
        x={edgeCenterX - 10}
        y={edgeCenterY - 10}
        className="edgebutton-foreignobject"
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div>
          <RemoveIcon
            onClick={(event) => onEdgeClick(event, id)}
            style={{ color: "red", cursor: "pointer" }}
          />
        </div>
      </foreignObject>
    </>
  );
};

const nodeTypes = {
  custom: CustomNode,
  property: PropertyNode,
  propertySet: PropertySetNode,
};

const edgeTypes = {
  default: EdgeWithButton,
  custom: CustomEdge,
};

const PropertyPanel = ({
  properties,
  addProperty,
  updateProperty,
  deleteProperty,
  isFixed,
  setIsFixed,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [newPropertyName, setNewPropertyName] = useState("");
  const [newPropertyType, setNewPropertyType] = useState("IfcText");
  const panelRef = useRef(null);

  useEffect(() => {
    if (!isCollapsed && panelRef.current) {
      const contentHeight = panelRef.current.scrollHeight;
      panelRef.current.style.height = `${contentHeight}px`;
    }
  }, [isCollapsed, properties]);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (!isFixed) {
      setTimeout(() => setIsCollapsed(true), 400);
    }
  };

  return (
    <Panel
      position="right"
      className={`property-panel ${isCollapsed && !isFixed ? "collapsed" : ""}`}
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
      <div className="property-content">
        <p>Add, edit, or remove properties from your IFC layers.</p>
        {properties.map((prop, index) => (
          <div key={index} className="property-item">
            <input
              type="text"
              value={prop.name}
              onChange={(e) =>
                updateProperty(`property-${index}`, e.target.value, prop.type)
              }
              placeholder="Property name"
            />
            <select
              value={prop.type}
              onChange={(e) => updateProperty(index, prop.name, e.target.value)}
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
              onClick={() => deleteProperty(index)}
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
      <div className="property-tab">
        <FaList size={20} />
        <span>Properties</span>
      </div>
    </Panel>
  );
};

// Add this new component for PropertySet Panel
const PropertySetPanel = ({ addPropertySet, isFixed, setIsFixed }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [newPropertySetName, setNewPropertySetName] = useState("");
  const panelRef = useRef(null);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (!isFixed) {
      setTimeout(() => setIsCollapsed(true), 400);
    }
  };

  return (
    <Panel
      position="top-right"
      className={`propertyset-panel ${
        isCollapsed && !isFixed ? "collapsed" : ""
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={panelRef}
      style={{ right: "400px" }} // Moved more to the left
    >
      {!isCollapsed && (
        <>
          <div className="panel-header">
            <h3>PSet Launcher:</h3>
            <label className="fix-checkbox">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={() => setIsFixed(!isFixed)}
              />
              <FaThumbtack size={16} />
            </label>
          </div>
          <div className="propertyset-content">
            <p>Add new PropertySets to structure properties in your IFC.</p>
            <div className="add-propertyset">
              <input
                type="text"
                value={newPropertySetName}
                onChange={(e) => setNewPropertySetName(e.target.value)}
                placeholder="New PropertySet name"
              />
              <button
                onClick={() => {
                  if (newPropertySetName) {
                    addPropertySet(newPropertySetName);
                    setNewPropertySetName("");
                  }
                }}
              >
                Add PropertySet
              </button>
            </div>
          </div>
        </>
      )}
      <div className="propertyset-tab">
        <FaLayerGroup size={20} />
        <span>PropertySets</span>
      </div>
    </Panel>
  );
};

// Add this new component before the App component
const UploadPanel = ({ isFixed, setIsFixed }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const panelRef = useRef(null);

  const handleMouseEnter = () => {
    setIsCollapsed(false);
  };

  const handleMouseLeave = () => {
    if (!isFixed) {
      setTimeout(() => setIsCollapsed(true), 400);
    }
  };

  const handleUpload = () => {
    // Implement your upload logic here
    console.log("Upload button clicked");
  };

  return (
    <Panel
      position="top-left"
      className={`upload-panel ${isCollapsed && !isFixed ? "collapsed" : ""}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      ref={panelRef}
    >
      {!isCollapsed && (
        <>
          <div className="panel-header">
            <h3>Upload IFC:</h3>
            <label className="fix-checkbox">
              <input
                type="checkbox"
                checked={isFixed}
                onChange={() => setIsFixed(!isFixed)}
              />
              <FaThumbtack size={16} />
            </label>
          </div>
          <div className="upload-content">
            <button className="upload-button" onClick={handleUpload}>
              <FaUpload size={16} style={{ marginRight: "8px" }} />
              Upload IFC File
            </button>
          </div>
        </>
      )}
      <div className="upload-tab">
        <FaUpload size={20} />
        <span>Upload</span>
      </div>
    </Panel>
  );
};

const App = () => {
  const [appState, setAppState] = useState({
    layers: [],
    properties: [],
    propertySets: [],
    edges: [],
  });
  const [isPropertyPanelFixed, setIsPropertyPanelFixed] = useState(false);
  const [isPropertySetPanelFixed, setIsPropertySetPanelFixed] = useState(false);
  const [isUploadPanelFixed, setIsUploadPanelFixed] = useState(false);

  const { fitView } = useReactFlow();

  const nodeHeightOffset = 5;
  const propertyNodeHeight = 100;
  const propertyNodeWidth = 300;
  const propertyNodeSpacing = 40;

  const updateAppState = useCallback((updater) => {
    setAppState((prevState) => {
      const newState = updater(prevState);
      return newState;
    });
  }, []);

  const handlePropertyTypeChange = useCallback(
    (nodeId, newName, newType, newValue) => {
      updateAppState((prevState) => {
        const updatedProperties = prevState.properties.map((prop) =>
          prop.id === nodeId
            ? { ...prop, name: newName, type: newType, value: newValue }
            : prop
        );
        return { ...prevState, properties: updatedProperties };
      });
    },
    [updateAppState]
  );

  const addProperty = useCallback(
    (name, type) => {
      const newPropertyId = `property-${Date.now()}`;
      updateAppState((prevState) => {
        const newProperty = { id: newPropertyId, name, type, value: "" };
        const newState = {
          ...prevState,
          properties: [...prevState.properties, newProperty],
        };

        // Use setTimeout to ensure the node is added before we try to fit the view
        setTimeout(() => {
          fitView({ padding: 0.2, includeHiddenNodes: false });
        }, 50);

        return newState;
      });
    },
    [updateAppState, fitView]
  );

  const deleteProperty = useCallback(
    (id) => {
      updateAppState((prevState) => ({
        ...prevState,
        properties: prevState.properties.filter((prop) => prop.id !== id),
        edges: prevState.edges.filter(
          (edge) => edge.source !== id && edge.target !== id
        ),
      }));
    },
    [updateAppState]
  );

  const getPropertySetNodeColor = () => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#6A0572",
      "#F7DC6F",
      "#BB8FCE",
      "#2ECC71",
      "#E74C3C",
      "#3498DB",
      "#9B59B6",
      "#F39C12",
      "#1ABC9C",
      "#34495E",
      "#16A085",
      "#27AE60",
      "#2980B9",
      "#8E44AD",
      "#F1C40F",
      "#E67E22",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addPropertySet = useCallback(
    (name) => {
      const newPropertySetId = `propertyset-${Date.now()}`;
      updateAppState((prevState) => {
        const newState = {
          ...prevState,
          propertySets: [
            ...prevState.propertySets,
            {
              id: newPropertySetId,
              name,
              color: getPropertySetNodeColor(),
              position: { x: 1800, y: prevState.propertySets.length * 100 },
            },
          ],
        };

        // Use setTimeout to ensure the node is added before we try to fit the view
        setTimeout(() => {
          fitView({ padding: 0.2, includeHiddenNodes: false });
        }, 50);

        return newState;
      });
    },
    [updateAppState, fitView]
  );

  const removeEdge = useCallback(
    (edgeId) => {
      updateAppState((prevState) => {
        const edgeToRemove = prevState.edges.find((edge) => edge.id === edgeId);
        if (
          edgeToRemove &&
          edgeToRemove.source.startsWith("property-") &&
          edgeToRemove.target.startsWith("propertyset-")
        ) {
          const updatedProperties = prevState.properties.map((prop) =>
            prop.id === edgeToRemove.source
              ? { ...prop, propertySetId: null, isConnected: false }
              : prop
          );
          return {
            ...prevState,
            edges: prevState.edges.filter((edge) => edge.id !== edgeId),
            properties: updatedProperties,
          };
        }
        // For other edge types (including property-to-layer), just remove the edge
        return {
          ...prevState,
          edges: prevState.edges.filter((edge) => edge.id !== edgeId),
        };
      });
    },
    [updateAppState]
  );

  const onConnect = useCallback(
    (params) => {
      // Prevent direct connections between material (layer) nodes and property set nodes
      if (
        (params.source.startsWith("layer-") &&
          params.target.startsWith("propertyset-")) ||
        (params.source.startsWith("propertyset-") &&
          params.target.startsWith("layer-"))
      ) {
        return; // Don't create the connection
      }

      const newEdge = {
        ...params,
        type: "custom",
        animated: true,
        style: { stroke: "grey" },
        data: { removeEdge },
      };

      // Allow connections from layer nodes to property nodes
      if (
        params.source.startsWith("layer-") &&
        params.target.startsWith("property-")
      ) {
        updateAppState((prevState) => ({
          ...prevState,
          edges: addEdge(newEdge, prevState.edges),
        }));
      } else if (params.source.startsWith("property-")) {
        if (params.target.startsWith("propertyset-")) {
          // Property to PropertySet connection
          updateAppState((prevState) => {
            const isAlreadyConnected = prevState.edges.some(
              (edge) =>
                edge.source === params.source &&
                edge.target.startsWith("propertyset-")
            );

            if (isAlreadyConnected) {
              return prevState;
            }

            const updatedProperties = prevState.properties.map((prop) =>
              prop.id === params.source ? { ...prop, isConnected: true } : prop
            );

            return {
              ...prevState,
              edges: addEdge(newEdge, prevState.edges),
              properties: updatedProperties,
            };
          });
        } else {
          // Property to any other node type (including layers)
          updateAppState((prevState) => ({
            ...prevState,
            edges: addEdge(newEdge, prevState.edges),
          }));
        }
      } else {
        // Any other connection type
        updateAppState((prevState) => ({
          ...prevState,
          edges: addEdge(newEdge, prevState.edges),
        }));
      }
    },
    [updateAppState, removeEdge]
  );

  const handlePropertySetNameChange = useCallback(
    (nodeId, newName, newColor) => {
      updateAppState((prevState) => ({
        ...prevState,
        propertySets: prevState.propertySets.map((pset) =>
          pset.id === nodeId
            ? { ...pset, name: newName, color: newColor }
            : pset
        ),
      }));
    },
    [updateAppState]
  );

  const deletePropertySet = useCallback(
    (id) => {
      updateAppState((prevState) => ({
        ...prevState,
        propertySets: prevState.propertySets.filter((pset) => pset.id !== id),
        edges: prevState.edges.filter(
          (edge) => edge.target !== id && edge.source !== id
        ),
      }));
    },
    [updateAppState]
  );

  const handleNodeDrag = useCallback(
    (event, draggedNode) => {
      if (draggedNode.type !== "custom") return; // Only allow dragging of custom (layer) nodes

      updateAppState((prevState) => {
        const layers = prevState.layers.slice();
        const draggedLayerIndex = layers.findIndex(
          (layer) => layer.id === draggedNode.id
        );

        if (draggedLayerIndex === -1) return prevState;

        const draggedLayer = layers[draggedLayerIndex];
        const draggedNodeCentroid =
          draggedNode.position.y + parseInt(draggedLayer.thickness) / 2;

        let newIndex = draggedLayerIndex;
        let totalHeight = 0;

        for (let i = 0; i < layers.length; i++) {
          const layerHeight = parseInt(layers[i].thickness);
          const layerMidpoint = totalHeight + layerHeight / 2;

          if (i !== draggedLayerIndex) {
            if (
              (draggedLayerIndex < i && draggedNodeCentroid > layerMidpoint) ||
              (draggedLayerIndex > i && draggedNodeCentroid < layerMidpoint)
            ) {
              newIndex = i;
              break;
            }
          }

          totalHeight += layerHeight + nodeHeightOffset;
        }

        if (newIndex !== draggedLayerIndex) {
          // Move the dragged layer
          layers.splice(draggedLayerIndex, 1);
          layers.splice(newIndex, 0, draggedLayer);

          // Update layer positions
          let yOffset = 0;
          layers.forEach((layer, index) => {
            layer.yOffset = yOffset;
            yOffset += parseInt(layer.thickness) + nodeHeightOffset;
          });
        }

        return { ...prevState, layers };
      });
    },
    [updateAppState, nodeHeightOffset]
  );

  const handleNodeDragStop = useCallback(
    (event, node) => {
      if (node.type === "propertySet") {
        updateAppState((prevState) => ({
          ...prevState,
          propertySets: prevState.propertySets.map((pset) =>
            pset.id === node.id ? { ...pset, position: node.position } : pset
          ),
        }));
      }
    },
    [updateAppState]
  );

  // Move utility functions here, before they are used
  const getMaterialColor = (material) => {
    switch (material) {
      case "Concrete":
        return "#bfbfbf";
      case "Insulation":
        return "#f0e68c";
      case "Wood":
        return "#deb887";
      case "Steel":
        return "#708090";
      case "Glass":
        return "#add8e6";
      case "Gypsum":
        return "#f5f5f5";
      case "Aluminum":
        return "#a9a9a9";
      case "Brick":
        return "#d2691e";
      default:
        return "#ffffff"; // Default color for unknown materials
    }
  };

  const getPropertyNodeColor = (type) => {
    switch (type) {
      case "IfcText":
        return "#FFB3BA";
      case "IfcBoolean":
        return "#BAFFC9";
      case "IfcInteger":
        return "#BAE1FF";
      case "IfcReal":
        return "#FFFFBA";
      case "IfcLabel":
        return "#FFD9BA";
      case "IfcIdentifier":
        return "#E6BAFF";
      case "IfcClassification":
        return "#C7CEEA";
      default:
        return "#F0F0F0";
    }
  };

  // Load initial data
  useEffect(() => {
    fetch("/layers.json")
      .then((response) => response.json())
      .then((data) => {
        let yOffset = 0;
        const layersWithIds = data.map((layer) => {
          const newLayer = {
            ...layer,
            id: `layer-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            yOffset: yOffset,
          };
          yOffset += parseInt(layer.thickness) + nodeHeightOffset;
          return newLayer;
        });
        updateAppState((prevState) => ({
          ...prevState,
          layers: layersWithIds,
        }));
      });
  }, [updateAppState, nodeHeightOffset]);

  // Generate nodes from appState
  const nodes = useMemo(() => {
    const layerNodes = appState.layers.map((layer) => ({
      id: layer.id,
      type: "custom",
      data: { label: `${layer.material} (${layer.thickness}mm)` },
      position: { x: 0, y: layer.yOffset },
      style: {
        width: 1000,
        height: parseInt(layer.thickness),
        backgroundColor: getMaterialColor(layer.material),
        border: "1px solid #ddd",
      },
      draggable: true,
    }));

    const propertyNodes = appState.properties.map((prop, index) => ({
      id: prop.id,
      type: "property",
      data: {
        label: prop.name,
        selectedType: prop.type,
        onChange: handlePropertyTypeChange,
        id: prop.id,
        value: prop.value,
      },
      position: {
        x: 1250,
        y: index * (propertyNodeHeight + propertyNodeSpacing),
      },
      style: {
        width: propertyNodeWidth,
        height: propertyNodeHeight,
        backgroundColor: prop.color || getPropertyNodeColor(prop.type), // Use existing color or generate new one
        border: "1px solid #ddd",
        borderRadius: "15px",
      },
      draggable: false,
    }));

    const propertySetNodes = appState.propertySets.map((pset) => ({
      id: pset.id,
      type: "propertySet",
      data: {
        id: pset.id,
        name: pset.name,
        onChange: handlePropertySetNameChange,
        onDelete: deletePropertySet,
        color: pset.color,
      },
      position: pset.position, // Use the stored position
      draggable: true,
    }));

    return [...layerNodes, ...propertyNodes, ...propertySetNodes];
  }, [
    appState.layers,
    appState.properties,
    appState.propertySets,
    handlePropertyTypeChange,
    handlePropertySetNameChange,
    propertyNodeHeight,
    propertyNodeSpacing,
    propertyNodeWidth,
    deletePropertySet,
  ]);

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={appState.edges}
        onConnect={onConnect}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesConnectable={true}
        edgesUpdatable={true}
        elementsSelectable={true}
        deleteKeyCode={["Backspace", "Delete"]}
        onNodesChange={(changes) => {
          // Handle node position changes here if needed
        }}
      >
        <Background />
        <Controls />

        {/* Upload Panel */}
        <UploadPanel
          isFixed={isUploadPanelFixed}
          setIsFixed={setIsUploadPanelFixed}
        />

        {/* Property Panel */}
        <PropertyPanel
          properties={appState.properties}
          addProperty={addProperty}
          updateProperty={handlePropertyTypeChange}
          deleteProperty={deleteProperty}
          isFixed={isPropertyPanelFixed}
          setIsFixed={setIsPropertyPanelFixed}
        />

        {/* PropertySet Panel */}
        <PropertySetPanel
          addPropertySet={addPropertySet}
          isFixed={isPropertySetPanelFixed}
          setIsFixed={setIsPropertySetPanelFixed}
        />
      </ReactFlow>
    </div>
  );
};

// New wrapper component
const AppWrapper = () => (
  <ReactFlowProvider>
    <App />
  </ReactFlowProvider>
);

export default AppWrapper;
