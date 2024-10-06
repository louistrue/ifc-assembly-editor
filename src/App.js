import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  forwardRef,
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
  FaSpinner,
} from "react-icons/fa";

const pyodideWorker = new Worker(
  new URL("./pyodideWorker.js", import.meta.url)
);

async function loadIFC(arrayBuffer) {
  return new Promise((resolve, reject) => {
    pyodideWorker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
    };

    pyodideWorker.postMessage({ arrayBuffer });
  });
}

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

    useEffect(() => {
      if (!isCollapsed && panelRef.current) {
        const contentHeight = panelRef.current.scrollHeight;
        panelRef.current.style.height = `${contentHeight}px`;
      }
    }, [isCollapsed, properties]);

    useEffect(() => {
      if (editingPropertyId && inputRef.current) {
        inputRef.current.focus();
      }
    }, [editingPropertyId]);

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

    const handlePropertyNameKeyDown = (e) => {
      if (e.key === "Enter") {
        setEditingPropertyId(null);
      }
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
                    onKeyDown={handlePropertyNameKeyDown}
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

// Add this new component for PropertySet Panel
const PropertySetPanel = forwardRef(
  ({ addPropertySet, isFixed, setIsFixed }, ref) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isCollapsing, setIsCollapsing] = useState(false);
    const [newPropertySetName, setNewPropertySetName] = useState("");
    const panelRef = useRef(null);
    const timeoutRef = useRef(null);

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

    return (
      <Panel
        position="top-right"
        className={`propertyset-panel ${isCollapsed ? "collapsed" : ""} ${
          isCollapsing ? "collapsing" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={panelRef}
        style={{ right: "370px" }}
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
              <p>Add new PropertySets to structure properties.</p>
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
        {isCollapsed && (
          <div className="propertyset-tab">
            <FaLayerGroup size={20} />
            <span>PropertySets</span>
          </div>
        )}
      </Panel>
    );
  }
);

// Add this new component before the App component
const UploadPanel = forwardRef(
  (
    {
      isFixed,
      setIsFixed,
      onFileUpload,
      ifcElements,
      selectedElement,
      onElementSelect,
    },
    ref
  ) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isCollapsing, setIsCollapsing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const panelRef = useRef(null);
    const timeoutRef = useRef(null);

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

    const handleFileChange = async (event) => {
      const file = event.target.files[0];
      if (file) {
        setIsFixed(true); // Auto-pin the panel when upload starts
        setIsLoading(true); // Set loading state to true
        await onFileUpload(file);
        setIsLoading(false); // Set loading state to false when upload is complete
      }
    };

    const handleElementSelect = (e) => {
      const selectedId = parseInt(e.target.value);
      const element = ifcElements.find((el) => el.id === selectedId);
      onElementSelect(element);
      setIsFixed(false); // Unpin the panel after element is selected
    };

    return (
      <Panel
        position="top-left"
        className={`upload-panel ${isCollapsed ? "collapsed" : ""} ${
          isCollapsing ? "collapsing" : ""
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        ref={panelRef}
      >
        {!isCollapsed && (
          <div className="panel-content">
            <div className="panel-header">
              <h3>IFC Uploader</h3>
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
              <p>
                Upload an IFC file and select elements with multiple layers.
              </p>
              <input type="file" onChange={handleFileChange} accept=".ifc" />
              {isLoading && (
                <div className="loading-indicator">
                  <FaSpinner className="spinner" />
                  <span>Loading IFC file...</span>
                </div>
              )}
              {ifcElements.length > 0 ? (
                <select
                  value={selectedElement ? selectedElement.id : ""}
                  onChange={handleElementSelect}
                >
                  <option value="">Select element with multiple layers</option>
                  {ifcElements.map((element) => (
                    <option key={element.id} value={element.id}>
                      {element.name} ({element.type})
                    </option>
                  ))}
                </select>
              ) : (
                <p>No elements with multiple layers found</p>
              )}
            </div>
          </div>
        )}
        {isCollapsed && (
          <div className="panel-tab">
            <FaUpload size={20} />
            <span>Upload</span>
          </div>
        )}
      </Panel>
    );
  }
);

const App = () => {
  const [appState, setAppState] = useState({
    layers: [],
    properties: [],
    propertySets: [],
    edges: [],
  });
  const [isPanelFixed, setIsPanelFixed] = useState({
    upload: false,
    property: false,
    propertySet: false,
  });

  const [ifcElements, setIfcElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);

  const { fitView, getNodes, getViewport } = useReactFlow();

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

        // Check if the new node is in view before fitting
        setTimeout(() => {
          const nodes = getNodes();
          const viewport = getViewport();
          const newNode = nodes.find((node) => node.id === newPropertyId);
          if (newNode) {
            const isInView =
              newNode.position.x >= viewport.x &&
              newNode.position.x <= viewport.x + viewport.width &&
              newNode.position.y >= viewport.y &&
              newNode.position.y <= viewport.y + viewport.height;
            if (!isInView) {
              fitView({ padding: 0.2, includeHiddenNodes: false });
            }
          }
        }, 50);

        return newState;
      });
    },
    [updateAppState, fitView, getNodes, getViewport]
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

        // Check if the new node is in view before fitting
        setTimeout(() => {
          const nodes = getNodes();
          const viewport = getViewport();
          const newNode = nodes.find((node) => node.id === newPropertySetId);
          if (newNode) {
            const isInView =
              newNode.position.x >= viewport.x &&
              newNode.position.x <= viewport.x + viewport.width &&
              newNode.position.y >= viewport.y &&
              newNode.position.y <= viewport.y + viewport.height;
            if (!isInView) {
              fitView({ padding: 0.2, includeHiddenNodes: false });
            }
          }
        }, 50);

        return newState;
      });
    },
    [updateAppState, fitView, getNodes, getViewport]
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

  const handleFileUpload = useCallback(async (file) => {
    console.log("File upload started:", file);
    try {
      const arrayBuffer = await file.arrayBuffer();
      console.log("File converted to ArrayBuffer");
      const ifcData = await loadIFC(arrayBuffer);
      console.log("IFC data loaded:", ifcData);

      // Filter elements with multiple layers
      const elementsWithMultiLayers = ifcData.filter(
        (element) => element.layers && element.layers.length > 1
      );
      console.log("Elements with multiple layers:", elementsWithMultiLayers);
      setIfcElements(elementsWithMultiLayers);

      if (elementsWithMultiLayers.length === 0) {
        console.log("No elements with multiple layers found");
      }
    } catch (error) {
      console.error("Error processing IFC file:", error);
      // You might want to show an error message to the user here
    }
  }, []);

  const handleElementSelect = useCallback(
    (element) => {
      setSelectedElement(element);
      // Clear existing layers when a new element is selected
      updateAppState((prevState) => ({
        ...prevState,
        layers: [],
        properties: [],
        propertySets: [],
        edges: [],
      }));
    },
    [updateAppState]
  );

  const handlePanelFixChange = (panelName, isFixed) => {
    setIsPanelFixed((prev) => ({ ...prev, [panelName]: isFixed }));
  };

  // Update the nodes generation to include the selected IFC element layers
  const nodes = useMemo(() => {
    let currentYOffset = 0;
    const layerNodes = [];

    if (selectedElement) {
      selectedElement.layers.forEach((layer, index) => {
        const heightInPixels = layer.thickness * 1000; // Convert meters to millimeters
        const backgroundColor =
          layer.material && layer.material.color
            ? `rgb(${layer.material.color.red * 255}, ${
                layer.material.color.green * 255
              }, ${layer.material.color.blue * 255})`
            : getMaterialColor(
                layer.material ? layer.material.name : "Unknown"
              );

        layerNodes.push({
          id: `ifc-layer-${selectedElement.id}-${index}`,
          type: "custom",
          data: {
            label: `${layer.material ? layer.material.name : "Unknown"} (${
              layer.thickness * 1000
            }mm)`,
          },
          position: { x: 0, y: currentYOffset },
          style: {
            width: 1000,
            height: heightInPixels,
            backgroundColor: backgroundColor,
            border: "1px solid #ddd",
          },
          draggable: false,
        });
        currentYOffset += heightInPixels + nodeHeightOffset;
      });
    } else {
      appState.layers.forEach((layer) => {
        const heightInPixels = parseInt(layer.thickness);
        layerNodes.push({
          id: layer.id,
          type: "custom",
          data: { label: `${layer.material} (${layer.thickness}mm)` },
          position: { x: 0, y: currentYOffset },
          style: {
            width: 1000,
            height: heightInPixels,
            backgroundColor: getMaterialColor(layer.material),
            border: "1px solid #ddd",
          },
          draggable: true,
        });
        currentYOffset += heightInPixels + nodeHeightOffset;
      });
    }

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
        backgroundColor: prop.color || getPropertyNodeColor(prop.type),
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
      position: pset.position,
      draggable: true,
    }));

    return [...layerNodes, ...propertyNodes, ...propertySetNodes];
  }, [
    selectedElement,
    appState.layers,
    appState.properties,
    appState.propertySets,
    handlePropertyTypeChange,
    handlePropertySetNameChange,
    propertyNodeHeight,
    propertyNodeSpacing,
    propertyNodeWidth,
    deletePropertySet,
    nodeHeightOffset,
  ]);

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
        // Remove the onNodesChange prop to prevent fitting on all node changes
        nodesConnectable={true}
        edgesUpdatable={true}
        elementsSelectable={true}
        deleteKeyCode={["Backspace", "Delete"]}
      >
        <Background />
        <Controls />

        {/* Upload Panel */}
        <UploadPanel
          isFixed={isPanelFixed.upload}
          setIsFixed={(isFixed) => handlePanelFixChange("upload", isFixed)}
          onFileUpload={handleFileUpload}
          ifcElements={ifcElements}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
        />

        {/* Property Panel */}
        <PropertyPanel
          properties={appState.properties}
          addProperty={addProperty}
          updateProperty={handlePropertyTypeChange}
          deleteProperty={deleteProperty}
          isFixed={isPanelFixed.property}
          setIsFixed={(isFixed) => handlePanelFixChange("property", isFixed)}
        />

        {/* PropertySet Panel */}
        <PropertySetPanel
          addPropertySet={addPropertySet}
          isFixed={isPanelFixed.propertySet}
          setIsFixed={(isFixed) => handlePanelFixChange("propertySet", isFixed)}
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
