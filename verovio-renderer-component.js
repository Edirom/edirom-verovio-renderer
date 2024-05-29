class VerovioAPIRenderer extends HTMLElement {
  constructor() {
      super();
      this.attachShadow({ mode: 'open' });
  }
  static get observedAttributes() {
    return ['mei-url'];
}

  connectedCallback() {
      this.renderVerovio();
  }
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
}

attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'mei-url') {
        this.meiUrl = newValue;
        this.renderPlayer();
    }
}
  renderVerovio() {
      const verovioScript = document.createElement('script');
      verovioScript.src = "https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js";
      verovioScript.defer = true;

      // Set onload handler before appending to capture the load event correctly
      verovioScript.onload = () => {
          verovio.module.onRuntimeInitialized = async () => {
              const tk = new verovio.toolkit();
              console.log("Verovio has loaded!");

              try {
                  const meiXML = await this.fetchMEIXML();
                  const svg = tk.renderData(meiXML, {});
                  const parser = new DOMParser();
                  const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
                  const svgElement = svgDoc.documentElement;
                  this.shadowRoot.appendChild(svgElement);
                  return svgElement;
              } catch (error) {
                  console.error('Error rendering Verovio:', error);
              }
          };
      };

      this.shadowRoot.appendChild(verovioScript);

      // Add CSS animation for playing note
      const style = document.createElement('style');
      style.textContent = `
        g.note {
          color: red;
        }
      `;
      this.shadowRoot.appendChild(style);
  }

  async fetchMEIXML() {
      try {
          const response = await fetch("https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei");
          const meiXML = await response.text();
          return meiXML;
      } catch (error) {
          console.error('Error fetching MEI XML:', error);
          throw error;
      }
  }
}

customElements.define('verovio-api-renderer', VerovioAPIRenderer);
