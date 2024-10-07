import React, { useState, useRef, useEffect, forwardRef } from "react";
import { Panel } from "reactflow";
import { FaLayerGroup, FaThumbtack } from "react-icons/fa";

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

export default PropertySetPanel;
