/**
 * Custom Web Component for rendering MEI files using the Verovio toolkit.
 * 
 * <edirom-verovio-renderer> provides an interface to load, render, and interact with MEI music notation files
 * using the Verovio JavaScript toolkit. It supports dynamic attribute changes, zooming, page navigation,
 * and measure/movement navigation.
 * 
 * @class
 * @extends HTMLElement
 * 
 * @example
 * <edirom-verovio-renderer meiurl="path/to/file.mei"></edirom-verovio-renderer>
 * 
 * @attribute {string} meiurl - The URL of the MEI file to render.
 * @attribute {number} zoom - The zoom level (scale) for rendering.
 * @attribute {number} pagenumber - The current page number to display.
 * @attribute {number} height - The height of the rendered page.
 * @attribute {number} width - The width of the rendered page.
 * @attribute {string} verovio-url - The URL to the Verovio toolkit JS file.
 * @attribute {object|string} verovio-options - Options for Verovio rendering.
 * @attribute {string} elementid - The element id to navigate to.
 * @attribute {string} measurenumber - The measure number to navigate to.
 * @attribute {string} mdivname - The name/label of the movement division.
 * @attribute {string} movementid - The XML ID of the movement to display.
 * @attribute {number} pagewidth - The width of the rendered page in Verovio units.
 * @attribute {number} pageheight - The height of the rendered page in Verovio units.
 * 
 * @fires communicate-[property]-update - Fired when a property is updated via attribute change.
 * @fires page-info-update - Fired after rendering, with current page and total pages.
 */
class EdiromVerovioRenderer extends HTMLElement {
 
  /**
   * Creates an instance of EdiromVerovioRenderer.
   * @constructor
   */
  constructor() {
    super();

    /** attach shadow root with mode "open" */
    this.attachShadow({ mode: 'open' });

    /** global variables */
    this.tk = null;
    this.totalPages = 0;

    /** set global properties */
    this.veroviourl = this.getAttribute('verovio-url') || "https://www.verovio.org/javascript/5.3.2/verovio-toolkit-wasm.js";    
    this.options = this.getAttribute("verovio-options") || {
      breaks: "auto",
      scale: 20,
      spacingStaff: 7,
      pageHeight: 4500,
      pageWidth: 4500,
      footer: "none",
      header: "none",
    }; 

    this.meiurl = this.getAttribute('meiurl') || "";
    this.zoom = this.getAttribute("zoom") || 20;
    this.pageNumber = this.getAttribute("pagenumber") || 1;

    this.shadowRoot.innerHTML += `
      <style>
          #verovio-svg {
              margin-bottom: 30%; /* Adjust to ensure SVG content doesn't overlap with header */
              
          }
      </style>
      <div id="verovio-svg"></div>
      `;
  }

  
  /**
   * Lifecycle callback invoked when the custom element is added to the DOM.
   */
  connectedCallback() {

    console.log("Edirom Verovio Renderer added to page.")

    /** load the verovio library */
    import(this.veroviourl)
      .then((module) => {
        verovio.module.onRuntimeInitialized = () => {
          this.tk = new verovio.toolkit();
          console.log("Verovio version " + this.tk.getVersion() + " has been loaded!");

          /** set rendering options for verovio */
          this.tk.setOptions(this.options);

          /** fetch the mei file and render svg */
          this.fetchAndRenderMEI();
        };
      })
      .catch((err) => {
        console.error(err.message);
      });

    this.verovioElement = this;
  }

  /**
   * Returns the list of observed attributes for the EdiromVerovioRenderer custom element.
   * @static
   * @returns {Array<string>} The list of observed attributes.
   */
  static get observedAttributes() {
    return ['zoom', 'height', 'width', 'pagenumber', 'meiurl','elementid','measurenumber', 'backendurl', 'measurenumber', 'mdivname', 'movementid', 'veroviowidth', 'verovioheight', 'annotattion',  "pagewidth", "pageheight", "verovio-url", "verovio-options"];
  }

  /**
   * Invoked when the custom element is disconnected from the document's DOM.
   */
  disconnectedCallback() { }

  /**
   * Invoked when the custom element is moved to a new document.
   */
  adoptedCallback() { }

  /**
   * Invoked when one of the custom element's attributes is added, removed, or changed.
   * @param {string} property - The name of the attribute that was changed.
   * @param {*} oldValue - The previous value of the attribute.
   * @param {*} newValue - The new value of the attribute.
   */
  attributeChangedCallback(property, oldValue, newPropertyValue) {
    this.set(property, newPropertyValue);
  }

  /**
   * Sets the value of a global property and triggers property update events.
   * @param {string} property - The name of the property to set.
   * @param {*} newPropertyValue - The new value to set for the property.
   */
  set(property, newPropertyValue) {
    this[property] = newPropertyValue;
    const event = new CustomEvent('communicate-' + property + '-update', {
      detail: { 
        element: this.tagName.toLowerCase(),
        property: property,
        value: newPropertyValue
      },
      bubbles: true
    });

    this.dispatchEvent(event);
    this.handlePropertyChange(property, newPropertyValue);
  }
  /**
   * Handles property changes for the verovio rendering component.
   * @param {string} property - The name of the property being changed.
   * @param {any} newPropertyValue - The new value of the property.
   */
  handlePropertyChange(property, newPropertyValue) {

    switch (property) {
      case 'zoom':
        this.zoom = parseInt(newPropertyValue);
        this.options['scale'] = this.zoom;
        this.tk?.setOptions(this.options);
        this.renderSVG();
        break;

      case 'pagenumber':
        this.pageNumber = parseInt(newPropertyValue);
        this.renderSVG();
        break;

      case 'annotattion':
        break;

      case 'height':

      case 'width':
        this[property] = parseInt(newPropertyValue);
        this.updatePageDimensions();
        break;

      case 'meiurl':
        this.meiurl = newPropertyValue;
        this.fetchAndRenderMEI();
        break;

      case 'elementid':
        this.elementid = newPropertyValue;
        this.gotoElementId(newPropertyValue);
        break;

      case 'measurenumber':
        this.gotoMeasure(newPropertyValue);
        break;

      case 'mdivname':
        this.mdivname = newPropertyValue;
        this.gotoMdiv(newPropertyValue);
        break;

      case 'movementid':
        this.movementid = newPropertyValue;
        this.fetchAndRenderMEI();
        break;

      case 'veroviowidth':
        this.verovioWidth = newPropertyValue;
        this.setupOptions();
        this.chnageVerovioWidth(newPropertyValue);
        break;

      case 'verovioheight':
        this.verovioHeight = newPropertyValue;
        this.setupOptions();
        this.chnageVerovioHeight(newPropertyValue);
        break;

      case 'pagewidth':
        this.verovioWidth = parseInt(newPropertyValue);
        if(!isNaN(this.verovioWidth) && this.verovioWidth >= 100 && this.verovioWidth <= 100000) {
          this.options['pageWidth'] = this.verovioWidth;
          this.tk?.setOptions(this.options);
          this.tk?.loadData(this.meiData);
          this.renderSVG();
        }
        break;

      case 'pageheight':
        this.verovioHeight = parseInt(newPropertyValue);
        if(!isNaN(this.verovioHeight) && this.verovioHeight >= 100 && this.verovioHeight <= 60000) {
          this.options['pageHeight'] = this.verovioHeight;
          this.tk?.setOptions(this.options);
          this.tk?.loadData(this.meiData);
          this.renderSVG();
        }
        break;
    }
  }
  /** * Sets up the options for the Verovio toolkit based on the current properties.
   * This method initializes the options object with values from the component's properties,
   * ensuring that the toolkit is configured correctly for rendering.
   * @param {number} verovioWidth - The width to set for the Verovio toolkit options.
   * @returns {void}  
   */
  chnageVerovioHeight(verovioHeight) {
    let options = this.tk.getOptions();
    options.pageHeight = verovioHeight;
    this.tk.setOptions(options);
    this.renderSVG();
  }
  /** * Sets up the options for the Verovio toolkit based on the current properties.
   * This method initializes the options object with values from the component's properties,
   * ensuring that the toolkit is configured correctly for rendering.
   * @param {number} verovioWidth - The width to set for the Verovio toolkit options.
   * @returns {void}
   */
  chnageVerovioWidth(verovioWidth) {
    let options = this.tk.getOptions();
    options.pageWidth = verovioWidth;
    this.tk.setOptions(options);
    this.renderSVG();
  }
   /**
   * Navigates to the page containing the specified element ID, updates the current page number,
   * and re-renders the SVG. Logs the navigation action or warns if the element is not found.
   *
   * @param {string} elementId - The ID of the element to navigate to.
   */
  gotoElementId(elementId) {
    const page = this.tk.getPageWithElement(elementId);
    if (page) {
      this.pageNumber = page;
      this.renderSVG();
      console.log(`Navigated to element with ID ${elementId} on page ${page}`);
    } else {
      console.warn(`Page not found for element ID: ${elementId}`);
    }
  }

  /**
   * Navigates to the measure with the specified measure number.
   * If the measure exists, scrolls to its corresponding element and logs the navigation.
   * If not found, logs a warning to the console.
   *
   * @param {number|string} measureNumber - The number of the measure to navigate to.
   */
  gotoMeasure(measureNumber) {
    const measureId = this.getMeasureIdByNumber(measureNumber);

    if (measureId) {
      this.gotoElementId(measureId);
      console.log(`Navigated to measure with n="${measureNumber}" (ID: ${measureId})`);
    } else {
      console.warn(`Measure with n="${measureNumber}" not found`);
    }
  }

 /**
   * Navigates to a specific movement (mdiv) in the document based on the provided movement label.
   *
   * @param {string} movementLabel - The label or number identifying the movement to navigate to.
   */
  gotoMdiv(movementLabel) {
    const mdivid = this.getMeasureIdByNumber(movementLabel);

    if (mdivid) {
      this.gotoElementId(mdivid);
      console.log(`Navigated to movement with n="${movementLabel}" (ID: ${mdivid})`);
    } else {
      console.warn(`Movement with n="${movementLabel}" not found`);
    }
  }

  /**
   * Retrieves the XML ID of a <measure> element by its "n" attribute value.
   *
   * If a specific <mdiv> label is set in `this.mdivname`, the search is limited to that <mdiv>.
   * Otherwise, the search is performed across all <measure> elements in the MEI document.
   *
   * @param {number|string} nValue - The value of the "n" attribute to match in <measure> elements.
   * @returns {string|null} The "xml:id" attribute of the matching <measure>, or null if not found.
   */
  getMeasureIdByNumber(nValue) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.meiData, "application/xml");

    let measures;

    if (this.mdivname) {
      // Find the <mdiv> with the label attribute
      const mdiv = xmlDoc.querySelector(`mdiv[label="${this.mdivname}"]`);
      if (!mdiv) {
        console.warn(`No <mdiv> found with label="${this.mdivname}"`);
        return null;
      }

      // Only search within this mdiv
      measures = mdiv.querySelectorAll("measure");
    } else {
      // No mdiv specified, search all measures in the document
      measures = xmlDoc.querySelectorAll("measure");
    }

    // Look for a measure with matching n value
    for (let measure of measures) {
      if (measure.getAttribute("n") === nValue.toString()) {
        return measure.getAttribute("xml:id"); // Verovio needs this
      }
    }

    console.warn(`No <measure n="${nValue}"> found ${this.mdivname ? `in <mdiv label="${this.mdivname}">` : "in the MEI file"}`);
    return null;
  }
  
  /**
   * Adjusts the zoom level of the renderer component.
   * 
   * Increases or decreases the zoom value by 10 based on the provided type ("zoomUp" or "zoomDown").
   * Ensures the zoom stays within the range of 10 to 100.
   * Updates the rendering options and re-renders the SVG with the new zoom value.
   * 
   * @param {string} type - The type of zoom operation ("zoomUp" to increase, "zoomDown" to decrease).
   */
  calculateZoom(type) {
    this.zoom = parseInt(this.zoom)
    this.zoom += type === "zoomUp" ? 10 : -10;
    this.zoom = Math.max(10, Math.min(this.zoom, 100));
    if (this.zoom <= 100) {
      // Get the current options
      let options = this.tk.getOptions();
      // Update the zoom value
      options.scale = this.zoom;
      // Set the updated options
      this.tk.setOptions(options);
      // Re-render the SVG with the updated options
      this.renderSVG();
    }
    console.log("zoom is ", this.zoom);
    console.log("after assignement zoom is ", this.zoom)
  }

  
  /**
   * Updates the page dimensions based on the current height, width, and zoom level.
   * Calculates and sets the pageHeight and pageWidth properties, updates the options object,
   * and triggers reloading and rendering of the MEI data.
   * Uses a debounced approach to avoid excessive updates.
   */
  updatePageDimensions() {
    
    var timeout;
	  var context = this;
	  var later = function() {
		  timeout = null;
      console.log("Update page dimensions");

      context.pageHeight = (context.height != null ? parseInt(context.height.toString().replaceAll("px", "")) * 100 / context.zoom : context.verovioElement?.clientHeight);
      context.pageWidth = (context.width != null ? parseInt(context.width.toString().replaceAll("px", "")) * 100 / context.zoom : context.verovioElement?.clientWidth);

      context.options['pageHeight'] = parseInt(context.pageHeight);
      context.options['pageWidth'] = parseInt(context.pageWidth);
      context.tk?.setOptions(context.options);

      context.tk?.loadData(context.meiData);
      context.renderSVG();
	  };

	  clearTimeout(timeout);
	  timeout = setTimeout(later, 100);
  }

  /**
   * Fetches MEI data from an URL (optionally including a movement ID),
   * loads the MEI data into the toolkit, and renders the SVG.
   * Handles errors that may occur during the fetch operation.
   */
  fetchAndRenderMEI() {

    let url;

    if (this.movementid) {
      url = this.meiurl + "&movementId=" + this.movementid;
    } else {
      url = this.meiurl;
    }

    fetch(url)
     .then((response) => response.text())
      .then((mei) => {
        this.meiData = mei;
        this.tk.loadData(mei); // Load MEI
        this.renderSVG();      // Render
      })
      .catch((error) => {
        console.error("Error fetching MEI:", error);
      });
  }

  /**
   * Updates the current page number based on the navigation type ("next" or "previous"),
   * ensuring it stays within the valid range [1, totalPages]. Triggers SVG rendering if the new page is valid.
   *
   * @param {string} type - The navigation type, either "next" to increment or "previous" to decrement the page number.
   */
  calculatePageNumber(type) {
      console.log("page number is ", this.pageNumber)
      this.pageNumber += type === "next" ? 1 : -1;
      this.pageNumber = Math.max(1, Math.min(this.pageNumber, this.totalPages));
      if (this.pageNumber <= this.totalPages) {
        this.renderSVG();
      }
    }

  /**
   * Renders the current page as SVG using the Verovio toolkit and updates the component's shadow DOM.
   * Ensures the current page number is valid, updates the SVG content, and dispatches a 'page-info-update' event
   * with the current page number and total number of pages.
   *
   * @fires CustomEvent#page-info-update - Dispatched after rendering, contains the current page number and total pages.
   */
  renderSVG() {
    this.totalPages = this.tk?.getPageCount();
    this.pageNumber = (!isNaN(this.pageNumber) && !isNaN(this.totalPages) && this.pageNumber >= 1 && this.pagenumber <= this.totalPages) ? this.pageNumber : 1;

    let svg = this.tk?.renderToSVG(this.pageNumber);
    this.shadowRoot.getElementById("verovio-svg").innerHTML = svg;

    this.dispatchEvent(new CustomEvent('page-info-update', {
      detail: {
        pageNumber: this.pageNumber,
        totalPages: this.totalPages
      },
      bubbles: true
    }));
  }
}

/** Define the custom element */
customElements.define('edirom-verovio-renderer', EdiromVerovioRenderer);
