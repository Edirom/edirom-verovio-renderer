![GitHub License](https://img.shields.io/github/license/Edirom/edirom-verovio-renderer) 

# Edirom Verovio Renderer Component

A lightweight web component that renders MEI (Music Encoding Initiative) files as SVG using the [Verovio library](https://www.verovio.org/index.xhtml). Designed for integration with [Edirom Online](http://www.edirom.de), it can also be used as a standalone component in any web application. No compilation or build process required.

**Note:** This repository contains the core JavaScript component. For demonstrations and examples, see the [Edirom Web Components Demonstrator](https://github.com/Edirom/edirom-web-components-demonstrator).

## Features

- **MEI Rendering**: Full support for MEI file rendering via Verovio toolkit
- **Page Navigation**: Navigate through multi-page scores
- **Zoom Control**: Adjustable zoom levels (10-100%)
- **Break Control**: Configurable page and system break modes (`auto`, `none`, `line`, `smart`, `encoded`)
- **Element Navigation**: Jump to specific measures, movements, or XML elements
- **Multi-Movement Support**: Navigate between movements (mdiv sections)
- **Customizable Options**: Full access to Verovio rendering options
- **Dynamic Updates**: Reactive attribute-based API
- **Event System**: Custom events for state changes and page updates

## License

- **edirom-verovio-renderer**: GPL-3.0
- **Verovio library**: LGPL-3.0, GPL-3.0


## Installation & Usage

### 1. Clone the Repository
```bash
git clone https://github.com/Edirom/edirom-verovio-renderer.git
cd edirom-verovio-renderer
```

### 2. Include in Your HTML

```html
<!DOCTYPE html>
<html>
<head>
    <title>MEI Viewer</title>
    <script type="module" src="path/to/edirom-verovio-renderer-component.js"></script>
</head>
<body>
    <edirom-verovio-renderer
        meiurl="https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei"
        zoom="40">
    </edirom-verovio-renderer>
</body>
</html>
```

### 3. Customize via Attributes

The component uses HTML attributes for configuration. Change attributes programmatically to control the component:

```javascript
const renderer = document.querySelector('edirom-verovio-renderer');

// Navigate to page 2
renderer.setAttribute('pagenumber', '2');

// Jump to measure 10
renderer.setAttribute('measurenumber', '10');

// Adjust zoom
renderer.setAttribute('zoom', '60');

// Change break mode (auto, none, line, smart, or encoded)
renderer.setAttribute('verovio-breaks', 'encoded');

// Update Verovio options dynamically
renderer.setAttribute('verovio-options', JSON.stringify({
  spacingStaff: 10,
  breaks: 'smart'
}));
``` 

## API Reference

### Attributes

All attributes are strings. The component automatically converts values to the appropriate type.

#### Core Rendering Attributes

| Attribute | Type | Description | Default |
|-----------|------|-------------|---------|
| `meiurl` | String | URL to the MEI file to render | `"https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei"` |

| `zoom` | Number | Zoom level / Verovio scale (10-100) | `20` |
| `pagenumber` | Number | Current page to display | `1` |

#### Navigation Attributes

| Attribute | Type | Description | Example |
|-----------|------|-------------|---------|
| `measurenumber` | Number/String | Navigate to a specific measure by its `@n` attribute | `"10"` |
| `elementid` | String | Navigate to any element by its `@xml:id` | `"note-123"` |
| `movementid` | String | Navigate to a movement by its `@xml:id` | `"movement-02"` |
| `mdivname` | String | Navigate to an mdiv by its `@label` attribute | `"First Movement"` |

#### Verovio Configuration

| Attribute | Type | Description | Default |
|-----------|------|-------------|---------|
| `verovio-breaks` | String | Control page and system breaks: `auto`, `none`, `line`, `smart`, `encoded` | `"auto"` |
| `verovio-url` | String | URL to Verovio toolkit JavaScript file | `"https://www.verovio.org/javascript/5.3.2/verovio-toolkit-wasm.js"` |
| `verovio-options` | Object/String | Verovio toolkit options (JSON string or object) - dynamically updates rendering | See below |
| `pagewidth` | Number | Page width in Verovio units (100-100000) | Calculated from `width` and `zoom` |
| `pageheight` | Number | Page height in Verovio units (100-60000) | Calculated from `height` and `zoom` |

**Break Mode Reference:**
- `auto` - Default mode. Respects page dimensions and automatically calculates optimal page/system breaks
- `none` - Single continuous system; page width adjusts automatically to fit all content
- `line` - Text-wrap style line breaks without forced page breaks
- `smart` - Intelligent break placement based on musical structure and phrases
- `encoded` - Respects explicit `<pb/>` (page break) and `<sb/>` (system break) markers in the MEI file

**Note:** The `verovio-breaks` attribute directly controls Verovio's `breaks` option. You can also set it via `verovio-options`, but using the dedicated `verovio-breaks` attribute is recommended for clarity.

#### Default Verovio Options

```javascript
{
  breaks: "auto",           // Controlled via verovio-breaks attribute
  scale: 20,
  spacingStaff: 7,
  pageHeight: 4500,
  pageWidth: 4500,
  footer: "none",
  header: "none"
}
```

### Events

The component dispatches custom events for state changes and updates.

#### `page-info-update`

Fired after rendering with current page information.

```javascript
renderer.addEventListener('page-info-update', (event) => {
  console.log(`Page ${event.detail.pageNumber} of ${event.detail.totalPages}`);
});
```

### Methods

While the component is primarily controlled via attributes, you can also access these methods:

```javascript
const renderer = document.querySelector('edirom-verovio-renderer');

// Navigate to next/previous page
renderer.calculatePageNumber('next');
renderer.calculatePageNumber('previous');

// Zoom in/out
renderer.calculateZoom('zoomUp');   // +10%
renderer.calculateZoom('zoomDown'); // -10%

// Navigate to specific element
renderer.gotoElementId('measure-042');
renderer.gotoMeasure(15);
renderer.gotoMdiv('Allegro');
```

## Browser Compatibility

- Modern browsers with ES6 module support
- Chrome/Edge 61+
- Firefox 60+
- Safari 11+

## Development

### Running Locally

```bash
# Clone the repository
git clone https://github.com/Edirom/edirom-verovio-renderer.git
cd edirom-verovio-renderer 

# Start a local server (Python example)
python3 -m http.server 8080

# Open in browser
# http://localhost:8080/demo-interactive-api.html
```

## Contributing

Contributions are welcome! Please read our [Code of Conduct](CODE_OF_CONDUCT.md) first.


## Citation


See [CITATION.cff](CITATION.cff) for more details.

## Links

- [Edirom Online](http://www.edirom.de)
- [Verovio Documentation](https://www.verovio.org/index.xhtml)
- [MEI (Music Encoding Initiative)](https://music-encoding.org/)
- [Edirom Web Components Demonstrator](https://github.com/Edirom/edirom-web-components-demonstrator)

## Support

For issues and feature requests, please use the [GitHub issue tracker](https://github.com/Edirom/edirom-verovio-renderer/issues).

## License

GPL-3.0 License - see [LICENSE](LICENSE) file for details.

---

**Developed by** [The Edirom Project](http://www.edirom.de) • **Powered by** [Verovio](https://www.verovio.org/)

