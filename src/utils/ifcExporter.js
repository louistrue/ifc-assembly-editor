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

    // Ensure all data is properly stringified
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
