export async function exportIFC(
  worker,
  selectedElement,
  layers,
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
    if (selectedElement.arrayBuffer instanceof ArrayBuffer) {
      // Create a copy of the ArrayBuffer
      arrayBuffer = selectedElement.arrayBuffer.slice(0);
    } else if (typeof selectedElement.arrayBuffer === "string") {
      // Convert base64 string to ArrayBuffer
      const binaryString = atob(
        selectedElement.arrayBuffer.replace(/[^A-Za-z0-9+/=]/g, "")
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

    worker.postMessage(
      {
        arrayBuffer: arrayBuffer,
        layers: JSON.stringify(layers),
        properties: JSON.stringify(properties),
        propertySets: JSON.stringify(propertySets),
      },
      [arrayBuffer]
    );
  });
}
