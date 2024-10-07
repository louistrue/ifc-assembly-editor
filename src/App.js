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
  MarkerType,
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
import CustomNode from "./components/CustomNode";
import PropertyNode from "./components/PropertyNode";
import PropertySetNode from "./components/PropertySetNode";
import EdgeWithButton from "./components/EdgeWithButton";
import CustomEdge from "./components/CustomEdge";
import {
  processIFCFile,
  getMaterialColor,
  base64ToArrayBuffer,
} from "./utils/ifcUtils";
import UploadPanel from "./components/UploadPanel";
import PropertyPanel from "./components/PropertyPanel";
import PropertySetPanel from "./components/PropertySetPanel";
import ExportButton from "./components/ExportButton";
import { exportIFC } from "./utils/ifcExporter";

const nodeTypes = {
  custom: CustomNode,
  property: PropertyNode,
  propertySet: PropertySetNode,
};

const edgeTypes = {
  custom: EdgeWithButton,
};

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

  // Ensure ifcElements is properly initialized
  const [ifcElements, setIfcElements] = useState([]);
  const [selectedElement, setSelectedElement] = useState(null);

  // Add this new state to store canvas states for each element
  const [elementCanvasStates, setElementCanvasStates] = useState({});

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
            ? {
                ...prop,
                name: newName,
                type: newType,
                value: newValue,
                values: {
                  ...prop.values,
                  [newType]: newValue,
                },
              }
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
        if (!edgeToRemove) return prevState;

        let updatedProperties = prevState.properties;

        // If it's a property-to-propertySet edge
        if (
          edgeToRemove.source.startsWith("property-") &&
          edgeToRemove.target.startsWith("propertyset-")
        ) {
          updatedProperties = prevState.properties.map((prop) =>
            prop.id === edgeToRemove.source
              ? { ...prop, propertySetId: null, isConnected: false }
              : prop
          );
        }

        return {
          ...prevState,
          edges: prevState.edges.filter((edge) => edge.id !== edgeId),
          properties: updatedProperties,
        };
      });
    },
    [updateAppState]
  );

  // Add this new state to track temporary edges
  const [tempEdges, setTempEdges] = useState([]);

  // Helper function to check if a property is already connected to a propertySet
  const isAlreadyConnected = useCallback(
    (sourceId) => {
      return appState.edges.some(
        (edge) =>
          edge.source === sourceId && edge.target.startsWith("propertyset-")
      );
    },
    [appState.edges]
  );

  const onConnect = useCallback(
    (params) => {
      const isLayerToPset =
        (params.source.startsWith("layer-") &&
          params.target.startsWith("propertyset-")) ||
        (params.source.startsWith("propertyset-") &&
          params.target.startsWith("layer-"));

      const isPropertyToPset =
        params.source.startsWith("property-") &&
        params.target.startsWith("propertyset-");

      if (
        isLayerToPset ||
        (isPropertyToPset && isAlreadyConnected(params.source))
      ) {
        // Create a temporary edge for the warning animation
        const tempEdge = {
          ...params,
          id: `temp-${params.source}-${params.target}`,
          type: "custom",
          animated: true,
          style: { stroke: "red" },
          data: { removeEdge, isTemp: true },
        };

        setTempEdges((prev) => [...prev, tempEdge]);

        // Remove the temporary edge after 3 seconds
        setTimeout(() => {
          setTempEdges((prev) =>
            prev.filter((edge) => edge.id !== tempEdge.id)
          );
        }, 3000);

        return; // Don't create the permanent connection
      }

      // For valid connections
      const newEdge = {
        ...params,
        type: "custom",
        animated: true,
        style: { stroke: "grey" },
        data: { removeEdge },
      };

      updateAppState((prevState) => {
        // If it's a property-to-propertySet connection, update the property's propertySetId
        if (isPropertyToPset) {
          const updatedProperties = prevState.properties.map((prop) =>
            prop.id === params.source
              ? { ...prop, propertySetId: params.target, isConnected: true }
              : prop
          );
          return {
            ...prevState,
            edges: addEdge(newEdge, prevState.edges),
            properties: updatedProperties,
          };
        }

        // For other valid connection types
        return {
          ...prevState,
          edges: addEdge(newEdge, prevState.edges),
        };
      });
    },
    [updateAppState, removeEdge, isAlreadyConnected]
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
      const elementsWithMultiLayers = await processIFCFile(file);
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
      if (element) {
        // Convert the base64 string back to ArrayBuffer
        const arrayBuffer = base64ToArrayBuffer(element.arrayBuffer);
        setSelectedElement({ ...element, arrayBuffer });

        // Save current canvas state before switching
        if (selectedElement || selectedElement === null) {
          const currentStateKey = selectedElement
            ? selectedElement.id
            : "example";
          setElementCanvasStates((prev) => ({
            ...prev,
            [currentStateKey]: {
              ...appState,
            },
          }));
        }

        // Load saved canvas state if it exists, otherwise initialize with empty state
        if (elementCanvasStates[element.id]) {
          updateAppState((prevState) => ({
            ...prevState,
            ...elementCanvasStates[element.id],
          }));
        } else {
          updateAppState((prevState) => ({
            ...prevState,
            layers: element.layers.map((layer, index) => ({
              ...layer,
              id: `layer-${element.id}-${index}`,
              yOffset: index * (parseInt(layer.thickness) + nodeHeightOffset),
            })),
            properties: [],
            propertySets: [],
            edges: [],
          }));
        }
      } else {
        // If null is passed (for "Example Buildup"), load the saved state or initial layers
        setSelectedElement(null);
        if (elementCanvasStates["example"]) {
          updateAppState((prevState) => ({
            ...prevState,
            ...elementCanvasStates["example"],
          }));
        } else {
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
                properties: [],
                propertySets: [],
                edges: [],
              }));
            });
        }
      }

      // Zoom to fit the new elements after a short delay
      setTimeout(() => {
        fitView({ padding: 0.2, includeHiddenNodes: false });
      }, 100);
    },
    [
      updateAppState,
      selectedElement,
      elementCanvasStates,
      appState,
      nodeHeightOffset,
      fitView,
    ]
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

  // Add this state variable inside the App component
  const [exportWorker, setExportWorker] = useState(null);

  // Add this useEffect hook to initialize the export worker
  useEffect(() => {
    const worker = new Worker(
      new URL("./workers/exportWorker.js", import.meta.url)
    );
    setExportWorker(worker);

    return () => {
      worker.terminate();
    };
  }, []);

  // Add this function inside the App component
  const handleExport = async () => {
    if (!exportWorker) {
      console.error("Export worker not initialized");
      alert("Export worker not initialized. Please try again.");
      return;
    }

    if (!selectedElement || !selectedElement.arrayBuffer) {
      console.error("No element selected or element has no arrayBuffer");
      alert("Please select an element to export.");
      return;
    }

    try {
      const exportedIFC = await exportIFC(
        exportWorker,
        selectedElement,
        appState.layers,
        appState.properties,
        appState.propertySets
      );

      if (!(exportedIFC instanceof ArrayBuffer)) {
        throw new Error("Exported IFC is not an ArrayBuffer");
      }

      // Create a Blob from the ArrayBuffer
      const blob = new Blob([exportedIFC], { type: "application/ifc" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "modified.ifc";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting IFC:", error);
      alert(`Error exporting IFC: ${error.message}`);
    }
  };

  return (
    <div style={{ height: "100vh", width: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={[...appState.edges, ...tempEdges]}
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
      >
        <Background />
        <Controls />

        <UploadPanel
          isFixed={isPanelFixed.upload}
          setIsFixed={(isFixed) => handlePanelFixChange("upload", isFixed)}
          onFileUpload={handleFileUpload}
          ifcElements={ifcElements}
          selectedElement={selectedElement}
          onElementSelect={handleElementSelect}
        />

        <PropertyPanel
          properties={appState.properties}
          addProperty={addProperty}
          updateProperty={handlePropertyTypeChange}
          deleteProperty={deleteProperty}
          isFixed={isPanelFixed.property}
          setIsFixed={(isFixed) => handlePanelFixChange("property", isFixed)}
        />

        <PropertySetPanel
          addPropertySet={addPropertySet}
          isFixed={isPanelFixed.propertySet}
          setIsFixed={(isFixed) => handlePanelFixChange("propertySet", isFixed)}
        />

        <ExportButton
          onExport={handleExport}
          disabled={!selectedElement || appState.layers.length === 0}
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
