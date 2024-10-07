// Create a Web Worker for Pyodide
const pyodideWorker = new Worker(
  new URL("../pyodideWorker.js", import.meta.url)
);

// Function to load IFC file
export async function loadIFC(arrayBuffer) {
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

// Function to handle file upload
export async function processIFCFile(file) {
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

    return elementsWithMultiLayers;
  } catch (error) {
    console.error("Error processing IFC file:", error);
    throw error;
  }
}

// Function to get material color
export function getMaterialColor(material) {
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
}
