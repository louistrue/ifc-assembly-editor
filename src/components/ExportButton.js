import React, { useState } from "react";
import { FaFileExport } from "react-icons/fa";

const ExportButton = ({ onExport, disabled }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    await onExport();
    setIsExporting(false);
  };

  return (
    <button
      className="export-button"
      onClick={handleExport}
      disabled={disabled || isExporting}
    >
      {isExporting ? (
        <span>Exporting...</span>
      ) : (
        <>
          <FaFileExport />
          <span>Export IFC</span>
        </>
      )}
    </button>
  );
};

export default ExportButton;
