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
          ${this.pageNumber} / ${this.totalPages}
      </div>
    </body>`

  }

  connectedCallback() {
      this.renderVerovio();
      this.setupResizeObserver();

      this.shadowRoot.getElementById("next_btn").addEventListener('click', () => this.calculatePageNumber('next'));
      this.shadowRoot.getElementById("previous_btn").addEventListener('click', () => this.calculatePageNumber('previous'));
  }

  updatePageDimensions() {
      this.pageHeight = this.verovioElement.clientHeight * 100 / this.zoom;
      this.pageWidth = this.verovioElement.clientWidth * 100 / this.zoom;
  }

  setupOptions() {
      this.options = {
          pageHeight: this.pageHeight,
          pageWidth: this.pageWidth,
          scale: this.zoom,
          svgAdditionalAttribute: ["note@pname", "note@oct"]
      };
  }

  fetchAndRenderMEI() {
      fetch('https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei')
          .then((response) => response.text())
          .then((mei) => {
              this.tk.loadData(mei);
              this.renderSVG();
          });
  }
  calculatePageNumber(type) {
    this.pageNumber += type === "next" ? 1 : -1;
    this.pageNumber = Math.max(1, Math.min(this.pageNumber, this.totalPages));
    if(this.pageNumber <= this.totalPages) {
        this.renderSVG();
    }
}



  renderSVG() {
      this.totalPages = this.tk.getPageCount();
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
