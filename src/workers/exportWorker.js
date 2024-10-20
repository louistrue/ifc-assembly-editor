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
    layers = json.loads(layers)
    properties = json.loads(properties)
    property_sets = json.loads(propertySets)

    with tempfile.NamedTemporaryFile(suffix='.ifc', delete=False) as temp_file:
        temp_file.write(ifc_data)
        temp_file_path = temp_file.name

    ifc_file = ifcopenshell.open(temp_file_path)

    def get_properties_for_layer(layer_id, properties):
        layer_properties = [prop for prop in properties if prop.get('layerId') == layer_id]
        print(f"Properties for layer {layer_id}: {layer_properties}")
        return layer_properties

    def add_material_properties_to_layer(ifc, layer, properties):
        material_props = ifc.create_entity("IfcMaterialProperties",
                                           Name="LayerProperties",
                                           Description=f"Material properties for {layer.Material.Name}")

        property_list = []
        for prop in properties:
            prop_name = prop['name']
            prop_value = prop['value']
            prop_type = prop['type']
            
            if prop_type == 'IfcText':
                value = ifc.create_entity("IfcText", prop_value)
            elif prop_type == 'IfcBoolean':
                value = ifc.create_entity("IfcBoolean", prop_value.lower() == 'true')
            elif prop_type == 'IfcInteger':
                value = ifc.create_entity("IfcInteger", int(prop_value))
            elif prop_type == 'IfcReal':
                value = ifc.create_entity("IfcReal", float(prop_value))
            else:
                value = ifc.create_entity("IfcLabel", prop_value)

            prop_entity = ifc.create_entity("IfcPropertySingleValue", 
                Name=prop_name, 
                NominalValue=value
            )
            property_list.append(prop_entity)

        material_props.Properties = property_list
        material_props.Material = layer.Material

    def process_material_layers():
        print("Processing all layers")
        print("Available layer sets in IFC file:")
        layer_sets = []
        for element in ifc_file.by_type("IfcElement"):
            material_select = ifcopenshell.util.element.get_material(element)
            if material_select and material_select.is_a("IfcMaterialLayerSetUsage"):
                layerset = material_select.ForLayerSet
                layer_names = [layer.Material.Name for layer in layerset.MaterialLayers]
                layer_sets.append((element.id(), layer_names))
                print(f"  - Element {element.id()}: {layer_names}")

        print("Layers from application:")
        for layer in layers:
            print(f"  Layer: {layer['material']['name']} (Element ID: {layer['elementId']})")

        for element_id, layer_set in layer_sets:
            matching_layers = [layer for layer in layers if layer['elementId'] == element_id]
            if matching_layers:
                print(f"Processing layers for element {element_id}")
                for app_layer in matching_layers:
                    ifc_layer_name = app_layer['material']['name']
                    # Find the corresponding IFC layer
                    ifc_layer = None
                    for element in ifc_file.by_type("IfcElement"):
                        if str(element.id()) == str(element_id):
                            material_select = ifcopenshell.util.element.get_material(element)
                            if material_select and material_select.is_a("IfcMaterialLayerSetUsage"):
                                layerset = material_select.ForLayerSet
                                for layer in layerset.MaterialLayers:
                                    if layer.Material.Name.lower() == ifc_layer_name.lower():
                                        ifc_layer = layer
                                        break
                            if ifc_layer:
                                break

                    if ifc_layer:
                        layer_properties = app_layer.get('properties', [])
                        if layer_properties:
                            print(f"Processing layer: {ifc_layer_name} (ID: {app_layer['id']}) with properties: {layer_properties}")
                            add_material_properties_to_layer(ifc_file, ifc_layer, layer_properties)
                        else:
                            print(f"No properties found for layer: {ifc_layer_name} (ID: {app_layer['id']})")
                    else:
                        print(f"No IFC layer found for material: {ifc_layer_name} (ID: {app_layer['id']})")
            else:
                print(f"No matching layers found for element {element_id}")

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
