# IFC Layer Editor

An open-source tool for editing and enhancing IFC (Industry Foundation Classes) files. Easily modify layer properties and export updated IFC models.

## Demo

https://github.com/louistrue/ifc-assembly-editor/assets/62306759/d884-4347-8a8d-894b721688af

## Live Application

You can access the live application here: [IFC Layer Editor](https://ifc-assembly-editor.vercel.app/)

## Features

1. **Upload IFC**: Upload your IFC file and view layers and properties.
2. **Edit Layers**: Modify existing properties or add new custom ones.
3. **Connect Properties**: Link properties to layers using an intuitive visual interface.
4. **Export**: Generate a new IFC file with your modifications.

### Prerequisites

- Node.js (version 12 or higher)
- npm (usually comes with Node.js)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/louistrue/ifc-assembly-editor.git
   ```
2. Navigate to the project directory:
   ```
   cd ifc-assembly-editor
   ```
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```

The application should now be running on [http://localhost:3000](http://localhost:3000).

## Usage

1. Upload an IFC file using the upload panel.
2. Edit layer properties or add new ones using the property panel.
3. Connect properties to layers by dragging connections between them.
4. Export the modified IFC file using the export button.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the [GNU Affero General Public License v3.0 (AGPL-3.0)](https://www.gnu.org/licenses/agpl-3.0.en.html).

## Links

- [Live Application](https://ifc-assembly-editor.vercel.app/)
- [GitHub Repository](https://github.com/louistrue/ifc-assembly-editor)
- [LT+ Website](https://www.lt.plus/)

## Acknowledgments

- [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) for IFC file processing
- [React Flow](https://reactflow.dev/) for the interactive node-based UI
