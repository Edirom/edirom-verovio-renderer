/**
 * Represents the EdiromVerovioRenderer custom element.
 * @class
 * @extends HTMLElement
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
    return ['zoom', 'height', 'width', 'pagenumber', 'meiurl', 'measurenumber', 'mdivname', "movementid", "pagewidth", "pageheight", "verovio-url", "verovio-options"];
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
  attributeChangedCallback(property, oldValue, newValue) {

    // handle property change
    this.set(property, newValue);
    console.debug("property ", property, " is changed from '", oldValue, "' to '", newValue, "'");
  }

  /**
   * Sets the value of a global property and triggers property update events.
   * @param {string} property - The name of the property to set.
   * @param {*} newPropertyValue - The new value to set for the property.
   */
  set(property, newPropertyValue) {

    /** set internal and html properties */
    this[property] = newPropertyValue;

    /** custom event for property update  */
    const event = new CustomEvent('communicate-' + property + '-update', {
      detail: { 
        element: this.tagName.toLowerCase(),
        property: property,
        value: newPropertyValue
      },
      bubbles: true
    });

    this.dispatchEvent(event);
    this.handlePropertyChange(property, newPropertyValue)

  }

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

      case 'height':
      case 'width':
        this[property] = parseInt(newPropertyValue);
        //this.debounce(, 50);
        this.updatePageDimensions();

        break;

      case 'meiurl':
        this.meiurl = newPropertyValue;
        this.fetchAndRenderMEI();
        break;
/*
      case 'measurenumber':
        this.gotoMeasure(newPropertyValue);
        break;
      
      case 'mdivname':
        this.mdivname = newPropertyValue;
        console.log("mdiv name is ", newPropertyValue)
        break;
      
      case 'movementid':
        this.movementid = newPropertyValue;
        console.log("movement id is setted ")
        this.fetchAndRenderMEI(newPropertyValue)
*/      
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

  gotoMeasure(measureNumber) {
    const measureId = this.getMeasureIdByNumber(measureNumber);

    if (measureId) {
      const page = this.tk.getPageWithElement(measureId);
      if (page) {
        this.pageNumber = page;
        this.renderSVG();
        console.log(`Navigated to measure ${measureNumber} on page ${page}`);
      } else {
        console.warn(`Page not found for measure ID: ${measureId}`);
      }
    } else {
      console.warn(`Measure with n="${measureNumber}" not found`);
    }
  }
  gotoMdiv(movementId) {

    console.log("movement id is ", movementId)
    const page = this.tk.getPageWithElement(movementId);
    console.log("page is ", page)

    if (page) {
      this.pageNumber = page;
      this.renderSVG();
      console.log(`Navigated to measure ${movementId} on page ${page}`);
    } else {
      console.warn(`Page not found for measure ID: ${movementId}`);
    }

  }


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


  getMeasureIdByNumber(nValue) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.meiData, "application/xml");

    let measures;

    if (this.mdivname) {
      // Find the <mdiv> with the label attribute
      const mdiv = xmlDoc.querySelector(`mdiv[xml:id="${this.mdivid}"]`);
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

  calculatePageNumber(type) {
    console.log("page number is ", this.pageNumber)
    this.pageNumber += type === "next" ? 1 : -1;
    this.pageNumber = Math.max(1, Math.min(this.pageNumber, this.totalPages));
    if (this.pageNumber <= this.totalPages) {
      this.renderSVG();
    }
  }

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