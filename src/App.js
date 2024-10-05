// src/App.js
import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider, // Add this import
  getBezierPath,
  MarkerType,
  updateEdge,
} from "reactflow";
import "reactflow/dist/style.css"; // Import ReactFlow styles
import "./App.css";
import {
  FaTools,
  FaList,
  FaThumbtack,
  FaTimes as RemoveIcon,
  FaLayerGroup,
} from "react-icons/fa"; // Add FaList import

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
      <Handle type="source" position={Position.Right} id="right" />
    </div>
  );
};

const PropertyNode = ({ data }) => {
  const [localLabel, setLocalLabel] = useState(data.label);
  const [localValue, setLocalValue] = useState(data.value || "");
  const [isEditing, setIsEditing] = useState(false);
  const [previousValues, setPreviousValues] = useState({});

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
    data.onChange(data.id, localLabel, data.selectedType, newValue);
  };

  const handleNameBlur = () => {
    data.onChange(data.id, localLabel, data.selectedType, localValue);
    setIsEditing(false);
  };

  const handleNameKeyDown = (event) => {
    if (event.key === "Enter") {
      data.onChange(data.id, localLabel, data.selectedType, localValue);
      setIsEditing(false);
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
      <Handle type="target" position={Position.Left} />
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
      <Handle type="source" position={Position.Right} />
    </div>
  );
};

const PropertySetNode = ({ data }) => {
  return (
    <div className="property-set-node">
      <Handle type="target" position={Position.Left} />
      <div className="property-set-content">
        <div className="property-set-name">{data.name}</div>
      </div>
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

const nodeTypes = {
  custom: CustomNode,
  property: PropertyNode,
  propertySet: PropertySetNode,
};

const edgeTypes = {
  default: EdgeWithButton,
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
        <h3>Property Launcher</h3>
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
        <p>Add, edit, or remove properties for your IFC.</p>
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
      style={{ right: "360px" }}
    >
      {!isCollapsed && (
        <>
          <div className="panel-header">
            <h3>PSet Launcher</h3>
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

const App = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true); // Sidebar collapse state
  const [properties, setProperties] = useState([]); // New state for properties
  const nodeHeightOffset = 5; // Offset for stacking the nodes
  const propertyNodeHeight = 100; // Increased height for property nodes
  const propertyNodeWidth = 300; // Increased width for property nodes
  const propertyNodeSpacing = 40; // Increased spacing between property nodes
  const [sidebarCollapseTimer, setSidebarCollapseTimer] = useState(null);
  const [isSidebarFixed, setIsSidebarFixed] = useState(false);
  const [isPropertyPanelFixed, setIsPropertyPanelFixed] = useState(false);
  const [isPropertySetPanelFixed, setIsPropertySetPanelFixed] = useState(false);

  // Add this line to get access to ReactFlow's utility functions
  const { fitView, getNodes, getViewport } = useReactFlow();

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
        return "#C7CEEA"; // Light blue color for IfcClassification
      default:
        return "#F0F0F0";
    }
  };

  const updateProperty = useCallback((index, name, type) => {
    setProperties((prevProperties) => {
      const updatedProperties = [...prevProperties];
      updatedProperties[index] = { name, type };
      return updatedProperties;
    });

    setNodes((prevNodes) => {
      const updatedNodes = prevNodes.map((node) => {
        if (node.id === `property-${index}`) {
          return {
            ...node,
            data: {
              ...node.data,
              label: name,
              selectedType: type,
            },
            style: {
              ...node.style,
              backgroundColor: getPropertyNodeColor(type),
            },
          };
        }
        return node;
      });
      return updatedNodes;
    });

    // Preserve connections
    setEdges((prevEdges) => {
      return prevEdges.map((edge) => {
        if (
          edge.source === `property-${index}` ||
          edge.target === `property-${index}`
        ) {
          return {
            ...edge,
            data: {
              ...edge.data,
              label: name,
            },
          };
        }
        return edge;
      });
    });
  }, []);

  // Add this function to preserve layer positions
  const preserveLayerPositions = useCallback(() => {
    setNodes((prevNodes) => {
      const materialNodes = prevNodes.filter((n) => n.type === "custom");
      const otherNodes = prevNodes.filter((n) => n.type !== "custom");

      const sortedMaterialNodes = materialNodes.sort(
        (a, b) => a.position.y - b.position.y
      );

      let yOffset = 0;
      const updatedMaterialNodes = sortedMaterialNodes.map((node) => {
        const updatedNode = { ...node };
        updatedNode.position = { x: 0, y: yOffset };
        yOffset += parseInt(node.style.height) + nodeHeightOffset;
        return updatedNode;
      });

      return [...updatedMaterialNodes, ...otherNodes];
    });
  }, [nodeHeightOffset]);

  // Modify the handlePropertyTypeChange function
  const handlePropertyTypeChange = useCallback(
    (nodeId, newName, newType, newValue) => {
      setNodes((prevNodes) =>
        prevNodes.map((node) =>
          node.id === nodeId
            ? {
                ...node,
                data: {
                  ...node.data,
                  label: newName,
                  selectedType: newType,
                  value: newValue,
                },
                style: {
                  ...node.style,
                  backgroundColor: getPropertyNodeColor(newType),
                },
              }
            : node
        )
      );

      // Update the properties state as well
      setProperties((prevProperties) =>
        prevProperties.map((prop, index) =>
          `property-${index}` === nodeId
            ? { name: newName, type: newType, value: newValue }
            : prop
        )
      );

      // Preserve connections
      setEdges((prevEdges) => {
        return prevEdges.map((edge) => {
          if (edge.source === nodeId || edge.target === nodeId) {
            return {
              ...edge,
              data: {
                ...edge.data,
                label: newName,
              },
            };
          }
          return edge;
        });
      });

      // Preserve layer positions
      preserveLayerPositions();
    },
    [preserveLayerPositions]
  );

  const generateNodes = useCallback(
    (data) => {
      const layerNodes = [];
      const propertyNodes = [];
      let yOffset = 0;

      data.forEach((layer, index) => {
        const layerHeight = parseInt(layer.thickness);

        const layerNode = {
          id: `layer-${layer.index}`,
          type: "custom",
          data: {
            label: `${layer.material} (${layer.thickness}mm)`,
            selectedType: "Type1", // Default selected type
          },
          position: { x: 0, y: yOffset },
          style: {
            width: 1000,
            height: layerHeight,
            backgroundColor: getMaterialColor(layer.material),
            border: "1px solid #ddd",
          },
          draggable: true, // Add this line
        };
        layerNodes.push(layerNode);

        yOffset += layerHeight + nodeHeightOffset;
      });

      // Add property nodes
      properties.forEach((prop, index) => {
        const propertyNode = {
          id: `property-${index}`,
          type: "property",
          data: {
            label: prop.name,
            selectedType: prop.type,
            onChange: handlePropertyTypeChange,
            id: `property-${index}`,
          },
          position: {
            x: 1250,
            y: index * (propertyNodeHeight + propertyNodeSpacing), // Increased spacing
          },
          style: {
            width: propertyNodeWidth,
            height: propertyNodeHeight,
            backgroundColor: getPropertyNodeColor(prop.type),
            border: "1px solid #ddd",
            borderRadius: "15px",
          },
          draggable: false,
        };
        propertyNodes.push(propertyNode);
      });

      return { nodes: [...layerNodes, ...propertyNodes], edges: [] };
    },
    [
      nodeHeightOffset,
      propertyNodeHeight,
      propertyNodeWidth,
      propertyNodeSpacing,
      handlePropertyTypeChange,
      properties,
    ]
  );

  // Update the sidebar collapse handlers
  const handleSidebarMouseEnter = () => {
    if (sidebarCollapseTimer) clearTimeout(sidebarCollapseTimer);
    setIsSidebarCollapsed(false);
  };

  const handleSidebarMouseLeave = () => {
    if (!isSidebarFixed) {
      const timer = setTimeout(() => setIsSidebarCollapsed(true), 400);
      setSidebarCollapseTimer(timer);
    }
  };

  // Load the JSON data and initialize nodes and edges
  useEffect(() => {
    fetch("/layers.json")
      .then((response) => response.json())
      .then((data) => {
        const generatedNodes = generateNodes(data);
        setNodes(generatedNodes.nodes);
        setEdges(generatedNodes.edges);
      });
  }, [
    generateNodes,
    setNodes,
    setEdges,
    updateProperty,
    handlePropertyTypeChange,
  ]);

  // Helper function to calculate the centroid (middle Y-position) of a node
  const getCentroid = (node) => {
    if (!node || !node.style || !node.position) return 0;
    const layerHeight = parseInt(node.style.height) || 0;
    return node.position.y + layerHeight / 2;
  };

  // Handle node dragging with swapping behavior based on centroid
  const handleNodeDrag = useCallback(
    (event, draggedNode) => {
      if (draggedNode.type !== "custom") return; // Only allow dragging of custom (layer) nodes

      setNodes((prevNodes) => {
        const materialNodes = prevNodes.filter((n) => n && n.type === "custom");
        const draggedNodeIndex = materialNodes.findIndex(
          (n) => n && n.id === draggedNode.id
        );

        if (draggedNodeIndex === -1) return prevNodes;

        const draggedNodeCentroid = getCentroid(draggedNode);

        let updatedNodes = [...materialNodes];

        if (draggedNodeIndex > 0) {
          const aboveNode = updatedNodes[draggedNodeIndex - 1];
          if (aboveNode) {
            const aboveNodeCentroid = getCentroid(aboveNode);

            if (draggedNodeCentroid < aboveNodeCentroid) {
              [
                updatedNodes[draggedNodeIndex - 1],
                updatedNodes[draggedNodeIndex],
              ] = [
                updatedNodes[draggedNodeIndex],
                updatedNodes[draggedNodeIndex - 1],
              ];
            }
          }
        }

        if (draggedNodeIndex < updatedNodes.length - 1) {
          const belowNode = updatedNodes[draggedNodeIndex + 1];
          if (belowNode) {
            const belowNodeCentroid = getCentroid(belowNode);

            if (draggedNodeCentroid > belowNodeCentroid) {
              [
                updatedNodes[draggedNodeIndex + 1],
                updatedNodes[draggedNodeIndex],
              ] = [
                updatedNodes[draggedNodeIndex],
                updatedNodes[draggedNodeIndex + 1],
              ];
            }
          }
        }

        // Update positions of material nodes
        let yOffset = 0;
        updatedNodes = updatedNodes
          .map((n) => {
            if (!n) return null; // Skip undefined nodes
            const updatedNode = { ...n };
            if (n.id === draggedNode.id) {
              updatedNode.position = draggedNode.position;
            } else {
              updatedNode.position = { ...n.position, y: yOffset };
            }
            yOffset += parseInt(n.style.height) + nodeHeightOffset;
            return updatedNode;
          })
          .filter(Boolean); // Remove any null entries

        // Preserve non-material nodes
        const nonMaterialNodes = prevNodes.filter(
          (n) => n && n.type !== "custom"
        );
        return [...updatedNodes, ...nonMaterialNodes];
      });
    },
    [nodeHeightOffset]
  );

  const handleNodeDragStop = useCallback(() => {
    setNodes((nodes) => {
      const materialNodes = nodes.filter((n) => n.type === "custom");
      const otherNodes = nodes.filter((n) => n.type !== "custom");

      let yOffset = 0;
      const updatedMaterialNodes = materialNodes
        .sort((a, b) => a.position.y - b.position.y)
        .map((n) => {
          const updatedNode = { ...n };
          updatedNode.position = { x: 0, y: yOffset };
          yOffset += parseInt(n.style.height) + nodeHeightOffset;
          return updatedNode;
        });

      return [...updatedMaterialNodes, ...otherNodes];
    });
  }, [nodeHeightOffset]);

  const removeEdge = useCallback(
    (edgeId) => {
      setEdges((eds) => eds.filter((edge) => edge.id !== edgeId));
    },
    [setEdges]
  );

  const isPropertyConnectedToPset = useCallback(
    (propertyNodeId) => {
      return edges.some(
        (edge) =>
          edge.source === propertyNodeId &&
          nodes.find((n) => n.id === edge.target)?.type === "propertySet"
      );
    },
    [edges, nodes]
  );

  const onConnect = useCallback(
    (params) => {
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (sourceNode && targetNode) {
        if (
          sourceNode.type === "property" &&
          targetNode.type === "propertySet"
        ) {
          // Check if the property is already connected to a PropertySet
          const isAlreadyConnected = edges.some(
            (edge) =>
              edge.source === params.source &&
              nodes.find((n) => n.id === edge.target)?.type === "propertySet"
          );

          if (!isAlreadyConnected) {
            setEdges((eds) =>
              addEdge(
                {
                  ...params,
                  type: "default",
                  animated: true,
                  style: { stroke: "#888", strokeWidth: 2 },
                  data: { setEdges, removeEdge },
                },
                eds
              )
            );
          } else {
            console.log("Property is already connected to a PropertySet");
            // Optionally, you can show a notification to the user here
          }
        } else if (
          sourceNode.type === "custom" &&
          targetNode.type === "property"
        ) {
          setEdges((eds) =>
            addEdge(
              {
                ...params,
                type: "default",
                animated: true,
                style: { stroke: "#888", strokeWidth: 2 },
                data: { setEdges, removeEdge },
              },
              eds
            )
          );
        }
      }
    },
    [nodes, edges, setEdges, removeEdge]
  );

  const handleIFCUpload = () => {
    // This is a placeholder function for IFC upload
    console.log("IFC upload button clicked");
    // You can add actual IFC upload logic here in the future
  };

  const addProperty = useCallback(
    (name, type) => {
      const newProperties = [...properties, { name, type }];
      setProperties(newProperties);

      // Calculate the position for the new property node
      const bottomRightX = window.innerWidth - 370; // Adjusted to account for the wider Property Panel
      const bottomRightY = window.innerHeight - 100; // Y position for the bottom of the screen, with some padding

      // Add new property node at the bottom
      const newPropertyNode = {
        id: `property-${properties.length}`,
        type: "property",
        data: {
          label: name,
          selectedType: type,
          onChange: handlePropertyTypeChange,
          id: `property-${properties.length}`,
        },
        position: {
          x: bottomRightX,
          y: bottomRightY - propertyNodeHeight,
        },
        style: {
          width: propertyNodeWidth,
          height: propertyNodeHeight,
          backgroundColor: getPropertyNodeColor(type),
          border: "1px solid #ddd",
          borderRadius: "15px",
        },
        draggable: false,
      };

      // Adjust positions of existing property nodes
      setNodes((nodes) => {
        const propertyNodes = nodes.filter((node) => node.type === "property");
        const updatedNodes = nodes.map((node) => {
          if (node.type === "property") {
            return {
              ...node,
              position: {
                x: node.position.x,
                y: node.position.y - propertyNodeHeight - propertyNodeSpacing, // Increased spacing
              },
            };
          }
          return node;
        });

        // Add the new node at the bottom
        return [...updatedNodes, newPropertyNode];
      });

      // Check if the new node is invisible, out of view, or hidden below the pane
      setTimeout(() => {
        const { x, y, zoom } = getViewport();
        const viewportBottom = -y / zoom + window.innerHeight / zoom;
        const viewportRight = -x / zoom + window.innerWidth / zoom;

        const nodeBottom = newPropertyNode.position.y + propertyNodeHeight;
        const nodeRight = newPropertyNode.position.x + propertyNodeWidth;

        const isInvisible =
          nodeBottom > viewportBottom || nodeRight > viewportRight;

        if (isInvisible) {
          const allNodes = getNodes();
          const nodesBounds = allNodes.reduce(
            (bounds, node) => {
              bounds.minX = Math.min(bounds.minX, node.position.x);
              bounds.minY = Math.min(bounds.minY, node.position.y);
              bounds.maxX = Math.max(
                bounds.maxX,
                node.position.x + (node.width || propertyNodeWidth)
              );
              bounds.maxY = Math.max(
                bounds.maxY,
                node.position.y + (node.height || propertyNodeHeight)
              );
              return bounds;
            },
            { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
          );

          // Add padding for panes
          nodesBounds.minX -= 250; // Account for sidebar width
          nodesBounds.maxX += 350; // Account for property panel width

          fitView({ padding: 0.2, bounds: nodesBounds });
        }
      }, 0);
    },
    [
      properties,
      setNodes,
      getViewport,
      getNodes,
      fitView,
      handlePropertyTypeChange,
      propertyNodeHeight,
      propertyNodeWidth,
      propertyNodeSpacing,
    ]
  );

  const propertyNodeRightEdge = 1550; // Assuming property nodes end at x=1550
  const psetNodeWidth = 200;
  const psetNodeHeight = 50;
  const psetNodeSpacing = 40; // Increased from 20 to 40
  const psetColumnSpacing = 40; // New constant for spacing between columns

  const getPropertySetNodeColor = () => {
    const colors = [
      "#FF6B6B",
      "#4ECDC4",
      "#45B7D1",
      "#FFA07A",
      "#98D8C8",
      "#F7DC6F",
      "#BB8FCE",
      "#82E0AA",
      "#F1948A",
      "#85C1E9",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const addPropertySet = useCallback(
    (name) => {
      const existingPsetNodes = nodes.filter((n) => n.type === "propertySet");
      const psetCount = existingPsetNodes.length;

      // Calculate position for the new node
      const baseX = propertyNodeRightEdge + 200; // Increased gap from property nodes
      const baseY = 50; // Starting Y position
      const columnHeight = 5; // Number of nodes per column
      const column = Math.floor(psetCount / columnHeight);
      const row = psetCount % columnHeight;

      const newPropertySetNode = {
        id: `property-set-${Date.now()}`,
        type: "propertySet",
        data: { name },
        position: {
          x: baseX + column * (psetNodeWidth + psetColumnSpacing),
          y: baseY + row * (psetNodeHeight + psetNodeSpacing),
        },
        style: {
          width: psetNodeWidth,
          height: psetNodeHeight,
          backgroundColor: getPropertySetNodeColor(),
          border: "none",
          borderRadius: "10px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontWeight: "bold",
          color: "#ffffff",
        },
        draggable: true,
      };

      setNodes((prevNodes) => [...prevNodes, newPropertySetNode]);

      // Check if the new node is out of view
      setTimeout(() => {
        const { x, y, zoom } = getViewport();
        const viewportRight = -x / zoom + window.innerWidth / zoom;
        const viewportBottom = -y / zoom + window.innerHeight / zoom;

        const nodeRight = newPropertySetNode.position.x + psetNodeWidth;
        const nodeBottom = newPropertySetNode.position.y + psetNodeHeight;

        if (nodeRight > viewportRight || nodeBottom > viewportBottom) {
          fitView({
            padding: 0.2,
            includeHiddenNodes: false,
            duration: 500,
          });
        }
      }, 50);
    },
    [nodes, setNodes, fitView, getViewport, propertyNodeRightEdge]
  );

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDrag={handleNodeDrag}
        onNodeDragStop={handleNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesConnectable={true}
        edgesUpdatable={true}
        elementsSelectable={true}
        deleteKeyCode={["Backspace", "Delete"]}
        onEdgeUpdate={(oldEdge, newConnection) => {
          // Prevent updating edges that connect property to PropertySet
          if (
            nodes.find((n) => n.id === oldEdge.source)?.type === "property" &&
            nodes.find((n) => n.id === oldEdge.target)?.type === "propertySet"
          ) {
            return;
          }
          setEdges((els) => updateEdge(oldEdge, newConnection, els));
        }}
        onEdgeUpdateStart={(_, edge) => {
          // Optionally, you can add logic here to prevent dragging certain edges
        }}
        onEdgeUpdateEnd={(_, edge) => {
          // Optionally, you can add logic here after an edge update ends
        }}
      >
        <Background />
        <Controls />

        {/* Updated Sidebar Panel */}
        <Panel
          position="left"
          className={`sidebar-panel ${
            isSidebarCollapsed && !isSidebarFixed ? "collapsed" : ""
          }`}
          onMouseEnter={handleSidebarMouseEnter}
          onMouseLeave={handleSidebarMouseLeave}
        >
          <div className="panel-header">
            <h2>Assembly Manager: </h2>
            <label className="fix-checkbox">
              <input
                type="checkbox"
                checked={isSidebarFixed}
                onChange={() => setIsSidebarFixed(!isSidebarFixed)}
              />
              <FaThumbtack size={16} />
            </label>
          </div>
          <div className="sidebar-content">
            <p>
              Extract all individual layers of construction elements, adjust
              them and add properties...
            </p>
            <button className="upload-button" onClick={handleIFCUpload}>
              Upload
            </button>
          </div>
          <div className="sidebar-tab">
            <FaTools size={20} />
            <span>IFC</span>
          </div>
        </Panel>

        {/* Property Panel */}
        <PropertyPanel
          properties={properties}
          addProperty={addProperty}
          updateProperty={updateProperty}
          deleteProperty={deleteProperty}
          isFixed={isPropertyPanelFixed}
          setIsFixed={setIsPropertyPanelFixed}
        />

        {/* New PropertySet Panel */}
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
