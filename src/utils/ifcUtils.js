const pyodideWorker = new Worker(
  new URL("../workers/pyodideWorker.js", import.meta.url)
);

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

export async function processIFCFile(file) {
  console.log("File upload started:", file);
  try {
    const arrayBuffer = await file.arrayBuffer();
    console.log("File converted to ArrayBuffer");
    const ifcData = await loadIFC(arrayBuffer);
    console.log("IFC data loaded:", ifcData);

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
      return "#ffffff";
  }
}

export function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function exportIFC(
  worker,
  element,
  layersWithProperties,
  properties,
  propertySets
) {
  return new Promise((resolve, reject) => {
    worker.onmessage = (event) => {
      if (event.data.error) {
        reject(new Error(event.data.error));
      } else {
        resolve(event.data.result);
      }
    };

    let arrayBuffer;
    if (element.arrayBuffer instanceof ArrayBuffer) {
      arrayBuffer = element.arrayBuffer.slice(0);
    } else if (typeof element.arrayBuffer === "string") {
      const binaryString = atob(
        element.arrayBuffer.replace(/[^A-Za-z0-9+/=]/g, "")
      );
      arrayBuffer = new ArrayBuffer(binaryString.length);
      const uint8Array = new Uint8Array(arrayBuffer);
      for (let i = 0; i < binaryString.length; i++) {
        uint8Array[i] = binaryString.charCodeAt(i);
      }
    } else {
      reject(new Error("Invalid arrayBuffer format"));
      return;
    }

    console.log(
      "Layers with properties before sending to worker:",
      layersWithProperties
    );

    const stringifiedLayers = JSON.stringify(layersWithProperties);
    const stringifiedProperties = JSON.stringify(properties);
    const stringifiedPropertySets = JSON.stringify(propertySets);

    worker.postMessage(
      {
        arrayBuffer: arrayBuffer,
        layers: stringifiedLayers,
        properties: stringifiedProperties,
        propertySets: stringifiedPropertySets,
      },
      [arrayBuffer]
    );
  });
}
