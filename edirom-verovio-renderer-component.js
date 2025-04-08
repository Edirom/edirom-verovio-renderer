class EdiromVerovioRenderer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.bodyElement = this.parentElement;
    this.verovioElement = this.bodyElement.parentElement;
    this.tk = "";
    this.options = "";
    this.zoom = 20;
    this.updatePageDimensions();
    this.pageNumber = 1
    this.totalPages = ""

    this.shadowRoot.innerHTML = `
      <style>
          #verovio-header {
              width: 100%;
              height: 20px;
              background-color: #d0cccc;
              bottom: 0;
              left: 0;
              position: sticky;
          }
          #verovio-svg {
              margin-top: 3%; /* Adjust to ensure SVG content doesn't overlap with header */
          }
      </style>

      <div id="verovio-svg">
      </div>
      <div id="verovio-header">
 
          <span id="page_info"></span>
    </body>`

  }
  connectedCallback() {
    this.renderVerovio();
    this.setupResizeObserver();

    const btnNext = document.getElementById("btn-next");
    const btnPrev = document.getElementById("btn-prev");
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
  
    if (btnNext) btnNext.addEventListener("click", () => this.calculatePageNumber("next"));
    if (btnPrev) btnPrev.addEventListener("click", () => this.calculatePageNumber("previous"));
    if (btnZoomIn) btnZoomIn.addEventListener("click", () => this.calculateZoom("zoomUp"));
    if (btnZoomOut) btnZoomOut.addEventListener("click", () => this.calculateZoom("zoomDown"));
   
  }

  static get observedAttributes() {
    return ['zoom', 'height', 'width', 'pagenumber', 'meiurl', 'measurenumber', 'mdivname'];
  }
  attributeChangedCallback(property, oldValue, newValue) {

    // handle property change
    this.set(property, newValue);
    console.log("property ", property , " is change from ", oldValue, " to ", newValue )

  }
  set(property, newPropertyValue) {


    // set internal and html properties  
    this[property] = newPropertyValue;
    // custom event for property update
    const event = new CustomEvent('communicate-' + property + '-update', {
      detail: { [property]: newPropertyValue },
      bubbles: true
    });
    this.dispatchEvent(event);
    this.handlePropertyChange(property, newPropertyValue) 
  }

  handlePropertyChange(property, newPropertyValue) {


  switch (property) {
    case 'zoom':
      this.zoom = parseInt(newPropertyValue);
      this.setupOptions();
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
      this.updatePageDimensions();
      this.setupOptions();
      this.tk?.setOptions(this.options);
      this.renderSVG();
      break;

    case 'meiurl':
      this.meiurl = newPropertyValue;
      this.fetchAndRenderMEI();
      break;

    case 'measurenumber':
      this.gotoMeasure(newPropertyValue);
      break;
    case 'mdivname':
      this.mdivname = newPropertyValue;
      console.log("mdiv name is ", newPropertyValue)
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
    if (this.height != null) {
      this.pageHeight = this.height * 100 / this.zoom;

    }
    else {
      this.pageHeight = this.verovioElement.clientHeight;
    }

    if (this.width != null) {
      this.pageWidth = this.width * 100 / this.zoom;
    }
    else {
      this.pageWidth = this.verovioElement.clientWidth;
    }

  }

  setupOptions() {
    console.log("this zoom is at setoptions", this.zoom)
    this.options = {
      pageHeight: this.pageHeight,
      pageWidth: this.pageWidth,
      scale: this.zoom,
      svgAdditionalAttribute: ["note@pname", "note@oct"]
    };
  }

  fetchAndRenderMEI() {
    console.log("this is page number ", this.pageNumber)

    fetch(this.meiurl)
      .then((response) => response.text())
      .then((mei) => {
        this.meiData = mei;
        this.tk.loadData(mei);
        this.renderSVG();
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
    this.totalPages = this.tk.getPageCount();

    this.pagenumber = parseInt(this.pagenumber)
    this.pageNumber = (this.pagenumber != null && this.pagenumber !== '' && this.pagenumber >= 1 && this.pagenumber <= this.totalPages) ? this.pagenumber : this.pageNumber;
    this.pagenumber = 0

    let svg = this.tk.renderToSVG(this.pageNumber);
    this.shadowRoot.getElementById("verovio-svg").innerHTML = svg;
    this.styleSVGElements();


    this.dispatchEvent(new CustomEvent('page-info-update', {
      detail: {
        pageNumber: this.pageNumber,
        totalPages: this.totalPages
      },
      bubbles: true
    }));
  }

  styleSVGElements() {
    let rests = this.shadowRoot.querySelectorAll('g.rest');
    for (let rest of rests) {
      rest.style.fill = "dodgerblue";
    }

    let c5s = this.shadowRoot.querySelectorAll('g[data-pname="c"][data-oct="5"]');
    for (let c5 of c5s) {
      c5.style.fill = "aqua";
    }

    let verses = this.shadowRoot.querySelectorAll('g.verse');
    for (let verse of verses) {
      let attr = this.tk.getElementAttr(verse.id);
      if (attr.n && attr.n > 1) verse.style.fill = "darkcyan";
    }
  }

  setupResizeObserver() {
    let resizeObserver = new ResizeObserver(() => {
      this.updatePageDimensions();
      this.setupOptions();
      this.tk.setOptions(this.options);
      this.fetchAndRenderMEI();
    });
    console.log("the screen i sresized")
    resizeObserver.observe(this.verovioElement);
  }

  renderVerovio() {
    const verovioScript = document.createElement('script');
    verovioScript.src = "https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js";
    verovioScript.defer = true;
    this.shadowRoot.appendChild(verovioScript);
    verovioScript.onload = () => {
      verovio.module.onRuntimeInitialized = async () => {
        this.tk = new verovio.toolkit();
        this.setupOptions();
        this.tk.setOptions(this.options);
        this.fetchAndRenderMEI();
        console.log("Verovio has loaded!");
      };
    };
  }
}

customElements.define('edirom-verovio-renderer', EdiromVerovioRenderer);
