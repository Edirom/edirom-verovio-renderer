class VerovioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.renderPlayer();
    }

    static get observedAttributes() {
        return ['pagewidth', 'pageheight',];
    }
    // attribute change
    attributeChangedCallback(property, oldValue, newValue) {
        // handle property change
        if (oldValue !== newValue) {
            this.setAttribute(property, newValue);
            this.rerenderPlayer(this.getAttribute('pagewidth'), this.getAttribute('pageheight'));
        } else {
            return;
        }
    }


    elementFromHTML(html) {
        const template = document.createElement('template');
        template.innerHTML = html.trim();
        return template.content.firstChild;
    }

    renderPlayer() {
        // Load jspdf asynchronously
        const loadPdf = document.createElement('script');
        loadPdf.src = "https://unpkg.com/jspdf@latest/dist/jspdf.umd.min.js";
        loadPdf.defer = true;
        this.shadowRoot.appendChild(loadPdf);


        // Load Verovio and MIDI.js asynchronously
        const loadVerovio = new Promise((resolve, reject) => {
            const verovioScript = document.createElement('script');
            verovioScript.src = "https://www.verovio.org/javascript/latest/verovio-toolkit-wasm.js";
            verovioScript.defer = true;
            verovioScript.onload = resolve;
            verovioScript.onerror = reject;
            this.shadowRoot.appendChild(verovioScript);
        });

        const loadMidi = new Promise((resolve, reject) => {
            const midiScript = document.createElement('script');
            midiScript.src = "https://www.midijs.net/lib/midi.js";
            midiScript.defer = true;
            midiScript.onload = resolve;
            midiScript.onerror = reject;
            this.shadowRoot.host.appendChild(midiScript);
        });


        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'verovio-css.css';
        link.defer = true;
        this.shadowRoot.appendChild(link);

        console.log("this is the shadow root", this.shadowRoot)

        const navDiv = document.createElement('div');
        navDiv.id = 'nav';
        navDiv.className = 'nav';
        this.shadowRoot.appendChild(navDiv);

        const contentDiv = document.createElement('div');
        contentDiv.id = 'content';
        contentDiv.className = 'content';
        this.shadowRoot.appendChild(contentDiv);


        // Create and append the play button
        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        playButton.id = 'playMIDI';
        this.shadowRoot.getElementById('nav').appendChild(playButton);

        // Create and append the stop button
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop';
        stopButton.id = 'stopMIDI';
        this.shadowRoot.getElementById('nav').appendChild(stopButton);

        // Create and append the stop button
        const nextButton = document.createElement('button');
        nextButton.textContent = 'next';
        nextButton.id = 'next';
        this.shadowRoot.getElementById('nav').appendChild(nextButton);

        // Create and append the stop button
        const previousButton = document.createElement('button');
        previousButton.textContent = 'previous';
        previousButton.id = 'previous';
        this.shadowRoot.getElementById('nav').appendChild(previousButton);

        // Create and append split view button
        const splitViewButton = document.createElement('button');
        splitViewButton.textContent = 'Split View';
        splitViewButton.id = 'splitView';
        this.shadowRoot.getElementById('nav').appendChild(splitViewButton);

        // Create and append the notation div
        const notationDiv = document.createElement('div');
        notationDiv.id = 'notation';
        this.shadowRoot.getElementById('content').appendChild(notationDiv);

        console.log("this is the shadwo root", this.shadowRoot)

        Promise.all([loadMidi, loadVerovio]).then(() => {
            // Both Verovio and MIDI.js are loaded
            verovio.module.onRuntimeInitialized = () => {
                if (typeof MIDIjs !== 'undefined') {
                    const tk = new verovio.toolkit();
                    console.log('Verovio and MIDI.js have loaded!', MIDIjs);

                    this.initPlayer(tk, MIDIjs);
                } else {
                    console.error('MIDIjs is not loaded yet');
                }
            };
        }).catch(error => {
            console.error('Error loading scripts:', error);
        });
    }

    async initPlayer(tk, MIDIjs) {
        console.log('Initializing player...');
        tk.setOptions({
            // pageHeight and pageWidth are swapped because the page is in landscape
            pageHeight: this.getAttribute('pagewidth'),
            pageWidth: this.getAttribute('pageheight'),
            scaleToPageSize: true,
            scale: 50,
            landscape: true,
        });

        let currentPage = 1;



        const playMIDIHandler = () => {
            let base64midi = tk.renderToMIDI();
            let midiString = 'data:audio/midi;base64,' + base64midi;
            console.log("this is midi play ", MIDIjs)
            MIDIjs.play(midiString);


            if (typeof MIDIjs !== 'undefined' && typeof MIDIjs.play === 'function') {
                MIDIjs.play(midiString);
            } else {
                console.error('MIDIjs.play is not available ', MIDIjs);
            }
        };

        const stopMIDIHandler = () => {
            if (typeof MIDIjs !== 'undefined' && typeof MIDIjs.stop === 'function') {
                MIDIjs.stop();
            } else {
                console.error('MIDIjs.stop is not available');
            }
        };

        const nextPageHandler = () => {
            if (currentPage < tk.getPageCount()) {
                currentPage++
                this.shadowRoot.getElementById("notation").innerHTML = tk.renderToSVG(currentPage);
            }
        };

        const previousPageHandler = () => {
            if (currentPage != 1) {
                currentPage--
                this.shadowRoot.getElementById("notation").innerHTML = tk.renderToSVG(currentPage);
            }

        };

        // Toggle split view
        const splitViewHandler = () => {
            if (this.shadowRoot.getElementById('facs-viewer') !== null) {
                console.log("removing the element");
                this.shadowRoot.getElementById('facs-viewer').remove();
                this.rerenderPlayer(this.getAttribute('pagewidth'), this.getAttribute('pageheight'));
            } else {
                const newElement = this.elementFromHTML(`
                    <div id="facs-viewer">
                        <slot/>
                    </div>
                `);
                this.shadowRoot.getElementById('content').appendChild(newElement);
                this.rerenderPlayer(this.getAttribute('pagewidth') / 2, this.getAttribute('pageheight'));
            }

        }

        const midiHightlightingHandler = function (event) {
            console.log("number of pages are ", tk.getPageCount())

            console.log('MIDI event:', event);
            // Remove the attribute 'playing' of all notes previously playing
            let playingNotes = this.shadowRoot.querySelectorAll('g.note.playing');
            for (let playingNote of playingNotes) playingNote.classList.remove("playing");

            // Get elements at a time in milliseconds (time from the player is in seconds)
            let currentElements = tk.getElementsAtTime(event.time * 1000);
            console.log(event)


            if (currentElements.page == 0) return;

            if (currentElements.page != currentPage) {
                this.currentPage = currentElements.page;
                this.shadowRoot.getElementById("notation").innerHTML = tk.renderToSVG(currentPage);

            }
            // Get all notes playing and set the class
            for (let note of currentElements.notes) {
                let noteElement = this.shadowRoot.getElementById(note);
                if (noteElement) noteElement.classList.add("playing");
            }
        }.bind(this);
        MIDIjs.player_callback = midiHightlightingHandler;
        this.shadowRoot.getElementById('playMIDI').addEventListener('click', playMIDIHandler);
        this.shadowRoot.getElementById('stopMIDI').addEventListener('click', stopMIDIHandler);
        this.shadowRoot.getElementById('next').addEventListener('click', nextPageHandler);
        this.shadowRoot.getElementById('previous').addEventListener('click', previousPageHandler);
        this.shadowRoot.getElementById('splitView').addEventListener('click', splitViewHandler);



        try {
            const response = await fetch("https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei");
            const meiXML = await response.text();
            tk.loadData(meiXML);
            let svg = tk.renderToSVG(1);
            this.shadowRoot.getElementById("notation").innerHTML = svg;
        } catch (error) {
            console.error('Error initializing player:', error);
        }
    }

    async rerenderPlayer(width, height) {
        const tk = new verovio.toolkit();
        tk.setOptions({
            // pageHeight and pageWidth are swapped because the page is in landscape
            pageHeight: width,
            pageWidth: height,
            scaleToPageSize: true,
            scale: 50,
            landscape: true,
        });

        try {
            const response = await fetch("https://www.verovio.org/examples/downloads/Schubert_Lindenbaum.mei");
            const meiXML = await response.text();
            tk.loadData(meiXML);
            let svg = tk.renderToSVG(1);
            this.shadowRoot.getElementById("notation").innerHTML = svg;
        } catch (error) {
            console.error('Error initializing player:', error);
        }

    }
}

customElements.define('verovio-player', VerovioPlayer);
