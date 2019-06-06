import {html, render} from './node_modules/lit-html/lit-html.js';

export class DetectorFaces extends HTMLElement {
    static get is(){
        return 'detector-faces'
    }

    constructor(){
        super();
        this.attachShadow({mode: 'open'});
        this.detector = new FaceDetector({fastMode: true, maxDetectedFace: 3});
        this.isDetectingFace = false;
        this.faces = [];
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
        <video id="video" autoplay muted></video>
        <canvas id="canvas"></canvas>
        <img id="mustache" src="./assets/mustache.png">
        <img id="sunglasses" src="./assets/dick.png">
        `;
    }

    async connectedCallback(){
        render(this.render(), this.shadowRoot);

        this.video = this.shadowRoot.querySelector('#video');
        this.canvas = this.shadowRoot.querySelector('#canvas');
        this.mustache = this.shadowRoot.querySelector('#mustache');
        this.sunglasses = this.shadowRoot.querySelector('#sunglasses');

        await this.getUserMedia();
    }

    async getUserMedia(){
        this.video.srcObject = await navigator.mediaDevices.getUserMedia({video:{facingUser: true, frameRate: 60}});

        await this.video.play();

        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.context = this.canvas.getContext('2d');
        this.ratio = Math.max(this.canvas.width / this.video.videoWidth, this.canvas.height / this.video.videoHeight);

        this.draw();
    }

    draw(){
        this.context.drawImage(this.video,
            (this.canvas.width - this.video.videoWidth * this.ratio) / 2,
            0,
            this.video.videoWidth * this.ratio,
            this.video.videoHeight * this.ratio
        );

        if(!this.isDetectingFace){
            this.isDetectingFace = true;
            this.detector.detect(this.canvas).then((faceArray) => {
                this.faces = faceArray;
                this.isDetectingFace = false;
            });
        }

        if(this.faces.length){

            this.faces.forEach((detectedFace) => {
                const face = detectedFace.boundingBox;

                this.context.drawImage(
                    this.mustache,
                    face.left,
                    face.top + face.height * 3/4,
                    face.width,
                    face.height / 5
                );

                this.context.drawImage(
                    this.sunglasses,
                    face.left,
                    face.top + face.height / 2 - this.sunglasses.height * face.width / this.sunglasses.width / 2,
                    face.width,
                    this.sunglasses.height * face.width / this.sunglasses.width
                );
            })
        }

        requestAnimationFrame(this.draw.bind(this));
    }
}

customElements.define(DetectorFaces.is, DetectorFaces);