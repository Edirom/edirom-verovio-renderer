class VerovioAPIRenderer extends HTMLElement {
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
          <button id="next_btn">Next</button>
          <button id="previous_btn">Previous</button> 
          <button id="zoom_up">+</button>
          <button id="zoom_down">-</button> 
          <span id="page_info">${this.pageNumber} / ${this.totalPages}</span>
    </body>`

  }

  connectedCallback() {
      this.renderVerovio();
      this.setupResizeObserver();

      this.shadowRoot.getElementById("next_btn").addEventListener('click', () => this.calculatePageNumber('next'));
      this.shadowRoot.getElementById("previous_btn").addEventListener('click', () => this.calculatePageNumber('previous'));
      this.shadowRoot.getElementById("zoom_up").addEventListener('click', () => this.calculateZoom('zoomUp'));
      this.shadowRoot.getElementById("zoom_down").addEventListener('click', () => this.calculateZoom('zoomDown'));
  }

  static get observedAttributes() {
    return ['zoom', 'height', 'width', 'pagenumber', 'meiurl'];
  }
  attributeChangedCallback(property, oldValue, newValue) {

    // handle property change
    this.set(property, newValue);

  }
  set(property, newPropertyValue){


    // set internal and html properties  
    this[property] = newPropertyValue;
    // custom event for property update
    const event = new CustomEvent('communicate-'+property+'-update', {
        detail: { [property]: newPropertyValue },
        bubbles: true
    });
    this.dispatchEvent(event);
  }
  calculateZoom(type){
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
      if(this.height !=null){
        this.pageHeight =  this.height * 100 / this.zoom;
        console.log("this is the page hight is   ", this.pageHeight )

      }
      else{
        this.pageHeight = this.verovioElement.clientHeight;

        console.log("the new height is ", this.pageHeight )
      }
      
      if(this.width !=null){
        this.pageWidth =  this.width * 100 / this.zoom;
      }
      else{
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
              this.tk.loadData(mei);
              this.renderSVG();
          });
  }
  calculatePageNumber(type) {
    console.log("page number is ", this.pageNumber)
    this.pageNumber += type === "next" ? 1 : -1;
    this.pageNumber = Math.max(1, Math.min(this.pageNumber, this.totalPages));
    if(this.pageNumber <= this.totalPages) {
        this.renderSVG();
    }
}
  renderSVG() {
     this.totalPages = this.tk.getPageCount();

     this.pagenumber = parseInt(this.pagenumber)
     this.pageNumber = (this.pagenumber != null && this.pagenumber !== '' && this.pagenumber >= 1 && this.pagenumber <= this.totalPages) ? this.pagenumber : this.pageNumber;
     this.pagenumber = 0
     this.shadowRoot.getElementById("page_info").textContent = `${this.pageNumber} / ${this.totalPages}`;

      let svg = this.tk.renderToSVG(this.pageNumber);
      this.shadowRoot.getElementById("verovio-svg").innerHTML = svg;
      this.styleSVGElements();
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

customElements.define('verovio-api-renderer', VerovioAPIRenderer);
