class EdiromVerovioRenderer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.tk = "";
    this.options = "";
    this.zoom = 20;
    this.pageNumber = 1;
    this.totalPages = "";

    this.shadowRoot.innerHTML = `
      <style>
        #verovio-svg {
          margin-bottom: 30%;
        }
      </style>
      <div id="verovio-svg"></div>
      <div id="verovio-header">
        <span id="page_info"></span>
      </div>`;
  }

  connectedCallback() {
    this.renderVerovio();
    this.setupResizeObserver();
    this.bodyElement = this.parentElement;
    this.verovioElement = this.bodyElement.parentElement;
    this.updatePageDimensions();
  }

  static get observedAttributes() {
    return ['zoom', 'height', 'width', 'pagenumber', 'meiurl','backendurl', 'measurenumber', 'mdivname', 'movementid', 'veroviowidth', 'verovioheight', 'annotattion'];
  }

  attributeChangedCallback(property, oldValue, newValue) {
    this.set(property, newValue);
  }

  set(property, newValue) {
    this[property] = newValue;
    const event = new CustomEvent('communicate-' + property + '-update', {
      detail: { [property]: newValue },
      bubbles: true
    });
    this.dispatchEvent(event);
    this.handlePropertyChange(property, newValue);
  }

  handlePropertyChange(property, newValue) {
    switch (property) {
      case 'zoom':
        this.zoom = parseInt(newValue);
        this.setupOptions();
        this.tk?.setOptions(this.options);
        this.renderSVG();
        break;
      case 'pagenumber':
        this.pageNumber = parseInt(newValue);
        this.renderSVG();
        break;
      case 'annotattion':
        break;
      case 'height':
      case 'width':
        this[property] = parseInt(newValue);
        this.updatePageDimensions();
        this.setupOptions();
        this.tk?.setOptions(this.options);
        this.renderSVG();
        break;
      case 'meiurl':
        this.meiurl = newValue;
        this.fetchAndRenderMEI();
        break;
      case 'measurenumber':
        this.gotoMeasure(newValue);
        break;
      case 'mdivname':
        this.mdivname = newValue;
        break;
      case 'movementid':
        this.movementid = newValue;
        this.fetchAndRenderMEI(newValue);
        break;
      case 'veroviowidth':
        this.verovioWidth = newValue;
        this.setupOptions();
        this.chnageVerovioWidth(newValue);
        break;
      case 'verovioheight':
        this.verovioHeight = newValue;
        this.setupOptions();
        this.chnageVerovioHeight(newValue);
        break;
    }
  }

  chnageVerovioHeight(verovioHeight) {
    let options = this.tk.getOptions();
    options.pageHeight = verovioHeight;
    this.tk.setOptions(options);
    this.renderSVG();
  }

  chnageVerovioWidth(verovioWidth) {
    let options = this.tk.getOptions();
    options.pageWidth = verovioWidth;
    this.tk.setOptions(options);
    this.renderSVG();
  }

  gotoMeasure(measureNumber) {
    const measureId = this.getMeasureIdByNumber(measureNumber);
    if (measureId) {
      const page = this.tk.getPageWithElement(measureId);
      if (page) {
        this.pageNumber = page;
        this.renderSVG();
      }
    }
  }

  gotoMdiv(movementId) {
    const page = this.tk.getPageWithElement(movementId);
    if (page) {
      this.pageNumber = page;
      this.renderSVG();
    }
  }

  getMeasureIdByNumber(nValue) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.meiData, "application/xml");
    let measures = this.mdivname ? xmlDoc.querySelector(`mdiv[label="${this.mdivname}"]`)?.querySelectorAll("measure") : xmlDoc.querySelectorAll("measure");
    for (let measure of measures) {
      if (measure.getAttribute("n") === nValue.toString()) {
        return measure.getAttribute("xml:id");
      }
    }
    return null;
  }

  calculateZoom(type) {
    this.zoom = parseInt(this.zoom);
    this.zoom += type === "zoomUp" ? 10 : -10;
    this.zoom = Math.max(10, Math.min(this.zoom, 100));
    if (this.zoom <= 100) {
      let options = this.tk.getOptions();
      options.scale = this.zoom;
      this.tk.setOptions(options);
      this.renderSVG();
    }
  }

  updatePageDimensions() {
    this.pageHeight = this.height != null ? this.height * 100 / this.zoom : this.verovioElement.clientHeight;
    this.pageWidth = this.width != null ? this.width * 100 / this.zoom : this.verovioElement.clientWidth;
  }

  setupOptions() {
    this.options = {
      breaks: "auto",
      scale: 40,
      spacingStaff: 7,
      pageHeight: 4500,
      pageWidth: 4500,
      svgAdditionalAttribute: ["note@pname", "note@oct"],
      footer: "none",
      header: "none",
      svgHtml5: true,
      svgBoundingBoxes: true
    };
  }

  fetchAndRenderMEI() {
    let url = this.movementid ? this.meiurl + "&movementId=" + this.movementid : this.meiurl;
    fetch(url)
      .then((response) => response.text())
      .then((mei) => {
        this.meiData = mei;
        this.pageNumber = 1;
        this.tk.loadData(mei);
        this.renderSVG();
      })
      .catch((error) => console.error("Error fetching MEI:", error));
  }

  calculatePageNumber(type) {
    this.pageNumber += type === "next" ? 1 : -1;
    this.pageNumber = Math.max(1, Math.min(this.pageNumber, this.totalPages));
    if (this.pageNumber <= this.totalPages) this.renderSVG();
  }

  renderSVG() {
    this.totalPages = this.tk.getPageCount();
    this.pagenumber = parseInt(this.pagenumber);
    this.pageNumber = (this.pagenumber && this.pagenumber >= 1 && this.pagenumber <= this.totalPages) ? this.pagenumber : this.pageNumber;
    this.pagenumber = 0;
    let svg = this.tk.renderToSVG(this.pageNumber);
    this.shadowRoot.getElementById("verovio-svg").innerHTML = svg;
    this.renderAnnotations();
    this.dispatchEvent(new CustomEvent('page-info-update', {
      detail: { pageNumber: this.pageNumber, totalPages: this.totalPages },
      bubbles: true
    }));
  }

  renderAnnotations() {
    const output = this.shadowRoot.getElementById("verovio-svg");
    const measures = output.querySelectorAll(".measure");

    // Dynamically assign colors to annotation categories by parsing <category> elements from meiData
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(this.meiData, "application/xml");
    const categoryElements = xmlDoc.querySelectorAll("category");

    const categoryColors = {};
    let colorIndex = 0;
    const colorPalette = [
      "#FF9800", "#3F51B5", "#E91E63", "#009688",
      "#9C27B0", "#F44336", "#4CAF50", "#03A9F4",
      "#795548", "#673AB7", "#CDDC39", "#00BCD4"
    ];

    categoryElements.forEach((cat) => {
      const id = `#${cat.getAttribute("xml:id")}`;
      categoryColors[id] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
    });

    const getCategoryColor = (type) => {
      const match = type.split(" ").find(cls => categoryColors[cls]);
      return match ? categoryColors[match] : "#FF5722"; // fallback color
    };

    measures.forEach((measure) => {
      const annotations = measure.querySelectorAll(".annot.editorialComment:not(.bounding-box), .annot.annotRef:not(.bounding-box)");

      annotations.forEach((annot, index) => {
        const staff = measure.querySelector(".staff path");
        if (!staff) return;
        const bbox = staff.getBBox();
        const annotId = annot.getAttribute("data-id");
        const type = annot.getAttribute("class") || "";

        const xmlns = "http://www.w3.org/2000/svg";
        const annotIcon = document.createElementNS(xmlns, "rect");

        annotIcon.setAttribute("data-id", annotId);
        annotIcon.setAttribute("class", `annotIcon ${type}`);
        annotIcon.setAttribute("x", bbox.x + 100 + (index * 450));
        annotIcon.setAttribute("y", bbox.y - 700);
        annotIcon.setAttribute("width", 350);
        annotIcon.setAttribute("height", 250);
        annotIcon.setAttribute("stroke", "black");
        annotIcon.setAttribute("stroke-width", "2");

        // Dynamic fill color based on category from MEI category list
        annotIcon.setAttribute("fill", getCategoryColor(type));

        measure.appendChild(annotIcon);

        annotIcon.addEventListener("click", () => {
          parent.loadLink(this.uri + "#" + annotId);
        });

        Tipped.create(annotIcon, {
          ajax: {
            url: this.appBasePath + 'data/xql/getAnnotation.xql',
            type: 'post',
            data: {
              uri: this.uri + '#' + annotId,
              target: 'tip',
              edition: this.edition
            }
          },
          target: 'mouse',
          hideDelay: 1000,
          skin: 'gray',
          containment: {
            selector: '#verovio-svg',
            padding: 0
          }
        });
      });
    });
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
      };
    };
  }
}

customElements.define('edirom-verovio-renderer', EdiromVerovioRenderer);
