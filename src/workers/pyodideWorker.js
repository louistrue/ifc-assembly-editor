importScripts("https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js");

let pyodide;

async function initializePyodide() {
  pyodide = await loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.22.1/full/",
  });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(
    "https://ifcopenshell.github.io/wasm-preview/IfcOpenShell-0.7.0-py3-none-any.whl"
  );
}

async function processIFC(arrayBuffer) {
  if (!pyodide) {
    await initializePyodide();
  }

  const uint8Array = new Uint8Array(arrayBuffer);
  pyodide.globals.set("uint8Array", uint8Array);

  const result = await pyodide.runPythonAsync(`
    import ifcopenshell
    import io
    import tempfile
    import json
    import base64

    ifc_data = bytes(uint8Array)
    with tempfile.NamedTemporaryFile(suffix='.ifc', delete=False) as temp_file:
        temp_file.write(ifc_data)
        temp_file_path = temp_file.name

    ifc_file = ifcopenshell.open(temp_file_path)
    
    def get_material_info():
        materials = ifc_file.by_type("IfcMaterial")
        material_info = {}
        for material in materials:
            info = {"id": material.id(), "name": material.Name}
            
            # Try to get color information
            color_found = False
            for definition in ifc_file.get_inverse(material):
                if definition.is_a("IfcMaterialDefinitionRepresentation"):
                    for representation in definition.Representations:
                        for item in representation.Items:
                            if item.is_a("IfcStyledItem"):
                                for style in item.Styles:
                                    if style.is_a("IfcSurfaceStyle"):
                                        for render_style in style.Styles:
                                            if render_style.is_a("IfcSurfaceStyleRendering"):
                                                if render_style.SurfaceColour:
                                                    color = render_style.SurfaceColour
                                                    info["color"] = {
                                                        "red": color.Red,
                                                        "green": color.Green,
                                                        "blue": color.Blue
                                                    }
                                                    color_found = True
                                                    break
                        if color_found:
                            break
                    if color_found:
                        break
            material_info[material.id()] = info
        return material_info

    def get_elements_with_material_layersets():
        elements = []
        material_info = get_material_info()
        
        for element in ifc_file.by_type("IfcElement"):
            material_select = ifcopenshell.util.element.get_material(element)
            if material_select and material_select.is_a("IfcMaterialLayerSetUsage"):
                layerset = material_select.ForLayerSet
                element_info = {
                    "id": element.id(),
                    "type": element.is_a(),
                    "name": element.Name if hasattr(element, "Name") else "Unnamed",
                    "layers": [],
                    "arrayBuffer": base64.b64encode(ifc_data).decode('utf-8')  # Encode as base64 string
                }
                
                for layer in layerset.MaterialLayers:
                    layer_info = {
                        "thickness": float(layer.LayerThickness),
                        "material": None
                    }
                    if layer.Material:
                        material_id = layer.Material.id()
                        layer_info["material"] = material_info.get(material_id, {"id": material_id, "name": "Unknown"})
                    
                    element_info["layers"].append(layer_info)
                
                elements.append(element_info)
        
        return elements

    elements_with_layersets = get_elements_with_material_layersets()
    json.dumps(elements_with_layersets)
  `);

  return JSON.parse(result);
}

self.onmessage = async (event) => {
  const { arrayBuffer } = event.data;
  try {
    const result = await processIFC(arrayBuffer);
    self.postMessage({ result });
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
