class VerovioPlayer extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.renderPlayer();
    }

    renderPlayer() {



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
              

        // Create and append the play button
        const playButton = document.createElement('button');
        playButton.textContent = 'Play';
        playButton.id = 'playMIDI';
        this.shadowRoot.appendChild(playButton);

        // Create and append the stop button
        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop';
        stopButton.id = 'stopMIDI';
        this.shadowRoot.appendChild(stopButton);

        // Create and append the stop button
        const dwnButton = document.createElement('button');
        dwnButton.textContent = 'PDF';
        dwnButton.id = 'downloadPdf';
        this.shadowRoot.appendChild(dwnButton);

        // Create and append the notation div
        const notationDiv = document.createElement('div');
        notationDiv.id = 'notation';
        this.shadowRoot.appendChild(notationDiv);

  

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
            pageWidth: document.body.clientWidth,
            pageHeight: 1000,
            scaleToPageSize: true,
            landscape: true,
        });

        let currentPage = 1;

  

        const playMIDIHandler = () => {
            let base64midi = tk.renderToMIDI();
            let midiString = 'data:audio/midi;base64,' + base64midi;
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

        const downloadHandler = () => {


        };
        

        const midiHightlightingHandler = function (event) {
            console.log("number of pages are " ,tk.getPageCount())

            console.log('MIDI event:', event); 
            // Remove the attribute 'playing' of all notes previously playing
            let playingNotes = this.shadowRoot.querySelectorAll('g.note.playing');
            for (let playingNote of playingNotes) playingNote.classList.remove("playing");

            // Get elements at a time in milliseconds (time from the player is in seconds)
            let currentElements = tk.getElementsAtTime(event.time * 1000);

            if (currentElements.page == 0) return;

            if (currentElements.page != currentPage) {
                currentPage = currentElements.page;
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
        this.shadowRoot.getElementById('downloadPdf').addEventListener('click', downloadHandler);


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
