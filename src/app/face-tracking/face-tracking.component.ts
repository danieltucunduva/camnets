import {Component, OnInit, ViewChild} from '@angular/core';
import {FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-face-tracking',
  templateUrl: './face-tracking.component.html',
  styleUrls: ['./face-tracking.component.css']
})
export class FaceTrackingComponent implements OnInit {

  public form = new FormGroup({
    'fpsControl': new FormControl('', [Validators.required, Validators.min(1), Validators.max(30)]),
    'faceConfidenceControl': new FormControl('', [Validators.required, Validators.min(0.1), Validators.max(1.0)]),
    'placeholder': new FormControl()
  });

  public neuralNetLoaded = false;
  public effectiveFPS = 0;
  public buttonText = '---';
  public predicting = false;
  public videoNgClass = 'show';

  @ViewChild('frame') frameRef: any;
  private frame: any;

  @ViewChild('canvasFrame') canvasFrameRef: any;
  private canvasFrame: any;

  @ViewChild('player') videoRef: any;
  private video: any;
  private videoStreamInterval: any;

  @ViewChild('canvas') canvasRef: any;
  private canvas: any;

  @ViewChild('sketchCanvas') sketchCanvasRef: any;
  private sketchCanvas: any;

  private net: any;

  private frames = 0;
  private estimationInterval: any;
  private estimationLock = true;

  constructor() {
  }

  private streamInCanvas = () => {
    if (!this.video.videoWidth || !this.video.videoHeight) {
      return;
    }
    [this.canvas.width, this.canvas.height] = this.getCanvasDimensions();
    this.videoNgClass = 'hide';
    this.canvas.getContext('2d').drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
    this.frames++;
    if (this.frame.hidden) {
      this.frame.hidden = false;
    }
  };

  async ngOnInit() {
    this.frame = this.frameRef.nativeElement;
    this.canvasFrame = this.canvasFrameRef.nativeElement;
    this.video = this.videoRef.nativeElement;
    this.canvas = this.canvasRef.nativeElement;
    this.sketchCanvas = this.sketchCanvasRef.nativeElement;

    this.form.controls.fpsControl.setValue(10);
    this.form.controls.faceConfidenceControl.setValue(0.4);

    this.loadYolo().catch((reason => console.error(reason)));
    this.startEffectiveFPS();
    this.startCamera().catch((reason => console.error(reason)));
  }


  startEffectiveFPS() {
    setInterval(() => {
      this.effectiveFPS = this.frames;
      this.frames = 0;
    }, 1000);
  }


  async startCamera() {
    const browser = <any>navigator;

    browser.getUserMedia = (browser.getUserMedia ||
      browser.webkitGetUserMedia ||
      browser.mozGetUserMedia ||
      browser.msGetUserMedia);

    const config = {video: true, audio: false};
    browser.mediaDevices.getUserMedia(config).then(stream => {
      try {
        this.video.srcObject = stream;
      } catch (error) {
        this.video.src = window.URL.createObjectURL(stream);
      }
      this.video.play();
      this.videoStreamInterval = setInterval(this.streamInCanvas, 20);
    });
    return Promise.resolve(true);
  }


  async loadYolo() {
    const config = {
      "withSeparableConvs": true,
      "iouThreshold": 0.4,
      "anchors": [
        { "x": 1.603231, "y": 2.094468 },
        { "x": 6.041143, "y": 7.080126 },
        { "x": 2.882459, "y": 3.518061 },
        { "x": 4.266906, "y": 5.178857 },
        { "x": 9.041765, "y": 10.66308 }
      ],
      "classes": ["face"],
      "meanRgb": [117.001, 114.697, 97.404]
    };
    this.buttonText = 'Loading neural network...';
    // @ts-ignore
    this.net = new yolo.TinyYolov2(config);
    await this.net.load(`assets/face_detection_model`);
    this.neuralNetLoaded = true;
    this.buttonText = 'Start face tracking';
  }


  toggleEstimation() {
    if (!this.predicting) {
      this.startEstimation();
    } else {
      this.stopEstimation();
    }
  }


  startEstimation() {
    this.predicting = true;
    this.form.controls.fpsControl.disable();
    clearInterval(this.videoStreamInterval);
    this.buttonText = 'Stop face tracking';
    const interval = Math.round(1000.0 / this.form.controls.fpsControl.value);
    this.estimationInterval = setInterval(this.estimatePoses, interval);
  }


  estimatePoses = async () => {
    if (!this.estimationLock) {
      return;
    }
    this.estimationLock = false;
    [this.sketchCanvas.width, this.sketchCanvas.height] = this.getCanvasDimensions();
    this.sketchCanvas.getContext('2d').drawImage(this.video, 0, 0);

    let faceConfidence = this.form.controls.faceConfidenceControl.value;
    if (faceConfidence === 1) {
      faceConfidence = 0.9999999
    }

    // must be divisible by 32
    let [width, height] = this.getCanvasDimensions();
    let inputSize = width > height ? height : width;
    inputSize -= inputSize % 32;

    const forwardParams = {
      inputSize: inputSize,
      scoreThreshold: faceConfidence
    };
    const faces = await this.net.detect(this.sketchCanvas, forwardParams);

    const drawOptions = {
      boxColor:'red',
      textColor: 'red',
      lineWidth: 3,
      fontSize: 0,
      fontStyle: 'Georgia',
      withScore: false,
      withClassName: false
    };
    // @ts-ignore
    yolo.drawDetection(this.sketchCanvas, faces, drawOptions);
    this.canvas.getContext('2d').drawImage(this.sketchCanvas, 0, 0);
    this.frames++;
    this.estimationLock = true;
  };


  stopEstimation() {
    clearInterval(this.estimationInterval);
    this.videoStreamInterval = setInterval(this.streamInCanvas, 20);
    this.predicting = false;
    this.form.controls.fpsControl.enable();
    this.buttonText = 'Start face tracking';
  }


  getCanvasDimensions() {
    let width = this.video.videoWidth;
    let height = this.video.videoHeight;
    return [width, height];
  }
}
