import React, { useState, useRef, useEffect } from "react";
import { Panel } from "reactflow";
import { FaUpload, FaSpinner, FaThumbtack } from "react-icons/fa";
import { processIFCFile } from "../utils/ifcUtils";

const UploadPanel = ({
  isFixed,
  setIsFixed,
  onFileUpload,
  ifcElements,
  selectedElement,
  onElementSelect,
}) => {
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
    const selectedId = e.target.value;
    if (selectedId === "") {
      // If "Example Buildup" is selected
      onElementSelect(null);
    } else {
      const selectedId = parseInt(e.target.value);
      const element = ifcElements.find((el) => el.id === selectedId);
      onElementSelect(element);
    }
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
            <p>Upload an IFC file and select elements with multiple layers.</p>
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
                <option value="">Example Buildup</option>
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
};

export default UploadPanel;
