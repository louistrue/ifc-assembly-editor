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

async function processIFC(arrayBuffer, layers, properties, propertySets) {
  if (!pyodide) {
    await initializePyodide();
  }

  const uint8Array = new Uint8Array(arrayBuffer);
  pyodide.globals.set("uint8Array", uint8Array);
  pyodide.globals.set("layers", layers);
  pyodide.globals.set("properties", properties);
  pyodide.globals.set("propertySets", propertySets);

  const result = await pyodide.runPythonAsync(`
    import ifcopenshell
    import ifcopenshell.util.element
    import io
    import tempfile
    import json

    ifc_data = bytes(uint8Array)
    with tempfile.NamedTemporaryFile(suffix='.ifc', delete=False) as temp_file:
        temp_file.write(ifc_data)
        temp_file_path = temp_file.name

    ifc_file = ifcopenshell.open(temp_file_path)

    def add_material_properties_to_layer(ifc, layer, property_set_name, properties):
        material_props = ifc.create_entity("IfcMaterialProperties",
                                           Name=property_set_name,
                                           Description=f"Material properties for {layer.Material.Name}")

        property_list = []
        for prop_name, prop_value in properties.items():
            prop = ifc.create_entity("IfcPropertySingleValue", 
                Name=prop_name, 
                NominalValue=ifc.create_entity("IfcText", prop_value)
            )
            property_list.append(prop)

        material_props.Properties = property_list
        material_props.Material = layer.Material

    def process_material_layers():
        processed_materials = {}
        
        for element in ifc_file.by_type("IfcElement"):
            material_select = ifcopenshell.util.element.get_material(element)
            if material_select and material_select.is_a("IfcMaterialLayerSetUsage"):
                layerset = material_select.ForLayerSet
                
                for layer in layerset.MaterialLayers:
                    material_name = layer.Material.Name
                    
                    if material_name not in processed_materials:
                        # Add test properties to the layer
                        add_material_properties_to_layer(
                            ifc_file,
                            layer,
                            "LayerProperties",
                            {
                                "DummyProperty": "This is a test property",
                                "ThermalConductivity": "1.25",
                                "Density": "2400 kg/m3"
                            }
                        )
                        processed_materials[material_name] = True
        
        return "Processing complete"

    process_material_layers()
    
    # Save the modified IFC file
    with tempfile.NamedTemporaryFile(suffix='.ifc', delete=False) as out_file:
        ifc_file.write(out_file.name)
        with open(out_file.name, 'rb') as f:
            modified_ifc_data = f.read()
    
    modified_ifc_data
  `);

  return new Uint8Array(result.toJs().buffer);
}

self.onmessage = async (event) => {
  const { arrayBuffer, layers, properties, propertySets } = event.data;
  try {
    const result = await processIFC(
      arrayBuffer,
      layers,
      properties,
      propertySets
    );
    self.postMessage({ result: result.buffer }, [result.buffer]);
  } catch (error) {
    self.postMessage({ error: error.message });
  }
};
