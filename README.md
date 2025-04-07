![GitHub License](https://img.shields.io/github/license/Edirom/edirom-verovio-renderer) 

# Edirom Verovio Renderer Component

This web component renders and append svg rendring of MEI file using verovio library. It is intended to be used in tbe Edirom Online, but can also be (re-)used in other web applications. No compilation or building is necessary to use the web component. 
The component uses (https://www.verovio.org/index.xhtml) library. 
Note: This repository only contains the bare JavaScript-based component, there is a separate [demo suite](https://github.com/Edirom/edirom-web-components-demonstrator) for web components developed in the Edirom Online Reloaded project, where the component can be seen and tested.


## License

The edirom-verovio-renderer.js comes with the license GPL-3.0. 

The imported verovio library comes with the license  LGPL-3.0, GPL-3.0.


## How to use this web component

1. Clone the repository into a directory of your choice
2. Include the path to the web component's JavaScript file into the `<head>` an HTML page
```html
<script src="path/to/edirom-verovio-renderer.js"></script>
```
3. Include a custom element (this is specified and can be processed by the component) into the `<body>` of the HTML page. The attributes of the custom element are used as parameters at initialization of the component and changing them (manually or programmatically) can control the components state and behaviour during runtime. The state changes of the web component are communicated outwards via custom events (called 'communicate-{change-type}-update'). The component/document that instantiates the web component (its parent) can listen (via event listeners which have to be implemented individually) and react to the communicated state changes if necessary. The separation of inward communication (via custom element's attributes) and outward communication (via custom events) is esp. necessary to handle frequently populated information like currentTime of the audio player and avoid interference between reading and writing info about the component's state.
```html
<edirom-verovio-renderer width="" height="" zoom="" pagenumber="" meiurl=""></edirom-verovio-renderer>
```


### Parameters

_Note: All attribute values are strings internally, the data type information below indicates the necessary format of the attribute value._

The verovio parameters mentioned below are based on the available [Verovio library](https://www.verovio.org/index.xhtml). 


| Parameter | Data type | Description                              | Default |
|-----------|------------|------------------------------------------|---------|
| width     | integer    | The width of the svg.              |  "200"   | 
| height    | integer    | The height of the the rendered svg.      |  "700"       |
| zoom      | integer    | The zoom level for rendered svg.           |   "20"      |
| meiurl    | string     | URL for the source MEI.|       "https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei" |

