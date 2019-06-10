import {html, render} from './node_modules/lit-html/lit-html.js';

export class DetectorFaces extends HTMLElement {
    static get is(){
        return 'detector-faces'
    }

    constructor(){
        super();
        this.attachShadow({mode: 'open'});
        this.faceDetectionSupported = window.FaceDetector ? true : false;
        this.detector = this.faceDetectionSupported ? new FaceDetector({fastMode: true, maxDetectedFace: 3}) : undefined;
        this.faces = [];
        this.context = undefined;
        this.ratio = 0;
    }

    render(){
        return html`
        <style>
            :host {
                margin: 0 auto;
                height: 100%;
                background: rgb(51, 51, 58);
                color: #fff;
                user-select: none;
                overflow: hidden;
            }
            video{
                display: none;
            }
            canvas{
                background: rgb(51, 51, 58);
                width: 100vw;
                height: 100vh;
            }
            pre {
                position: absolute;
                top: 24px;
                left: 24px;
                white-space: pre-line;
                right: 24px;
                text-shadow: 0 0 black;
            }
            #mustache, #hat, #sunglasses {
                display: none;
            }
            .visible {
                transform: translateX(0) !important;
            }
        </style>
        <canvas id="canvas"></canvas>
        <video id="video" autoplay muted></video>
        <img id="mustache" src="./assets/mustache.png">
        <img id="sunglasses" src="./assets/dick.png">
        `;
    }

    async connectedCallback(){
        render(this.render(), this.shadowRoot);

        this.canvas = this.shadowRoot.querySelector('#canvas');
        this.video = this.shadowRoot.querySelector('#video');
        this.mustache = this.shadowRoot.querySelector('#mustache');
        this.sunglasses = this.shadowRoot.querySelector('#sunglasses');

        await this.getUserMedia();
    }

    async getUserMedia(){
        this.video.srcObject = await navigator.mediaDevices.getUserMedia({video:{facingMode: 'user', frameRate: 60}});

        await this.video.play();

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        if (this.canvas.width % 2 == 1) {
            this.canvas.width += 1;
        }

        this.context = this.canvas.getContext('2d');
        this.ratio = Math.max(this.canvas.width / this.video.videoWidth, this.canvas.height / this.video.videoHeight);
        
        if (this.faceDetectionSupported) {
            this.draw();
        } else {
            console.error(new Error("FaceDetector - Unsupported Version or Feature is not enabled"));
        }
    }

    drawAccesories(face){
        const boundingBox = face.boundingBox;

        this.context.drawImage(
            this.mustache,
            boundingBox.left,
            boundingBox.top + boundingBox.height * 3/4,
            boundingBox.width,
            boundingBox.height / 5
        );

        this.context.drawImage(
            this.sunglasses,
            boundingBox.left,
            boundingBox.top + boundingBox.height / 2 - this.sunglasses.height * boundingBox.width / this.sunglasses.width / 2,
            boundingBox.width,
            this.sunglasses.height * boundingBox.width / this.sunglasses.width
        );
    }

    async draw(){
        requestAnimationFrame(this.draw.bind(this));

        this.context.drawImage(this.video,
            (this.canvas.width - this.video.videoWidth * this.ratio) / 2,
            0,
            this.video.videoWidth * this.ratio,
            this.video.videoHeight * this.ratio
        );

        try {
            this.faces = await this.detector.detect(this.canvas);
        } catch (e) {
            console.error('Face detection failed:', e.message);
        }
        this.faces.forEach(face => this.drawAccesories(face));
    }
}

customElements.define(DetectorFaces.is, DetectorFaces);