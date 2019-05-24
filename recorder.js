import {html, render} from '../node_modules/lit-html/lit-html.js';

export class RecorderFaces extends HTMLElement {
    static get is(){
        return 'recorder-faces'
    }

    constructor(){
        super();
        this.attachShadow({mode: 'open'});

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
            }
            .bottomBar, #recorder {
                position: absolute;
                bottom: 0;
                right: 0;
                left: 0;
                height: 128px;
                background-color: rgba(51, 51, 58, 0.3);
            }
            .recording .bottomBar {
               opacity: 0;
            }
            #recordButton {
                will-change: transform, background;
                transition: transform .1s ease-out;
                position: absolute;
                bottom: 24px;
                right: 0;
                text-align: center;
                left: 0;
                width: 10px;
                margin: auto;
                background: rgb(0, 193, 233);
                line-height: 64px;
                border-radius: 50%;
                box-shadow: 0 0 2px 0 rgb(51, 51, 58);
                height: 10px;
                border: 36px solid rgb(2, 104, 125)
            }
            #recordButton.recording {
                background: red;
                border-color: red;
            }
            #preview {
                transform: translateX(120px);
                will-change: transform;
                transition: .1s transform ease-in;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
            }
            #previewVideo {
                width: 92px;
                position: absolute;
                bottom: 72px;
                right: 24px;
                display: block;
                border: 2px solid #F44336;
                background: black;
                border-bottom: 0;
            }
            #shareButton {
                position: absolute;
                bottom: 70px;
                right: 24px;
                text-align: center;
                width: 96px;
                background: #F44336;
                line-height: 48px;
                font-family: Roboto;
                font-weight: bold;
                cursor: default;
                will-change: transform;
                transition: .1s transform ease-in;
            }
            #shareButton[data-url] {
                transform: translateY(46px);
            }
            .visible {
                transform: translateX(0) !important;
            }
        </style>
        <div class="bottomBar"></div>
        <div id="recordButton"></div>
        <div id="preview">
            <video id="previewVideo" autoplay muted loop></video>
            <div id="shareButton">Share</div>
        </div>
        `;
    }

    async connectedCallback(){
        render(this.render(), this.shadowRoot);

        this.recordButton = this.shadowRoot.querySelector('#recordButton');
        this.preview = this.shadowRoot.querySelector('#preview');
        this.previewVideo = this.shadowRoot.querySelector('#previewVideo');
        this.shareButton = this.shadowRoot.querySelector('#shareButton');

        this.chunks = [];

        this.recordButton.addEventListener('click', () => {
            this.toggleRecording();
        });

        this.shareButton.addEventListener('click', () => {
            let videoUrl = this.shareButton.dataset.url;
            navigator
                .share({
                    title: 'Dickglasses Faces',
                    text: 'Dickglasses Faces sharing video',
                    url: videoUrl
                       })
                .catch(error => { console.log(error)});

        });
    }

    toggleRecording(){
        const isRecording = this.recordButton.classList.toggle('recording');

        if(isRecording){
            this.startRecording();
        } else {
            this.stopRecording();
        }
    }

    startRecording(){
        const stream = this.canvas.captureStream();
        this.recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp8'});
        this.recorder.addEventListener('dataavailable', event => {
            this.chunks.push(event.data);
        });
        this.recorder.addEventListener('error', event => {
            console.error('Error', event);
        });
        this.recorder.addEventListener('stop', async event => {
            const blob = new Blob(this.chunks, { type: 'video/webm' });
            this.previewVideo.src = URL.createObjectURL(blob);
            await this.previewVideo.play();
            this.preview.classList.add('visible');
            this.uploadVideo(blob);
        });
        this.recorder.start(10);
    }

    stopRecording() {
        if(this.recorder && this.recorder.status != 'inactive'){
            this.recorder.stop();
        }
    }

    async uploadVideo(blob){
        const url = new URL('https://www.googleapis.com/upload/storage/v1/b/webm-mustache/o');
        url.searchParams.append('uploadType', 'media');
        url.searchParams.append('name', new Date().toISOString() + '.webm');

        // Upload video to google cloud storage.
        const response = await fetch(url, {
            method: 'POST',
            body: blob,
            headers: new Headers({
                'Authorization': 'Bearer ya29.GqQBEge22c-624F-J866jjE0as8IWVWhTAOJfOxUzcF9Ppi5DMmHu8E4Ar6_hEhzD5rxcXNvGl7oAs1ugOwcd4ScqmId24fYPYFvxGRqj-VSsMz2CJqH5fwxNicnvRhvFEv51XP6NNZWuN6096kOat6nntnYe44b7Cx240gPehl57kF5XgGd2BhlRqUOLA2kLa1FaA0CQAQgLYicOti-XBcaJS74X_4',
                'Content-type': 'video/webm',
                'Content-Length': blob.length
            })
        });
        const data = await response.json();
        this.shareButton.dataset.url = `https://storage.googleapis.com/${data.bucket}/${data.name}`;
    }
}

customElements.define(RecorderFaces.is, RecorderFaces);