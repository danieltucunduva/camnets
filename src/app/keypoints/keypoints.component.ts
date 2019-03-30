import {Component, OnInit, ViewChild} from '@angular/core';
import * as posenet from '@tensorflow-models/posenet';
import {OutputStride, Pose, PoseNet} from '@tensorflow-models/posenet';
import {FormControl, FormGroup, Validators} from '@angular/forms';

const keypointEdges = [
  ['leftShoulder', 'rightShoulder'],
  ['leftHip', 'rightHip'],
  ['leftElbow', 'leftShoulder'],
  ['leftElbow', 'leftWrist'],
  ['leftShoulder', 'leftHip'],
  ['leftHip', 'leftKnee'],
  ['leftKnee', 'leftAnkle'],
  ['rightElbow', 'rightShoulder'],
  ['rightElbow', 'rightWrist'],
  ['rightShoulder', 'rightHip'],
  ['rightHip', 'rightKnee'],
  ['rightKnee', 'rightAnkle']
];

@Component({
  selector: 'app-keypoints',
  templateUrl: './keypoints.component.html',
  styleUrls: ['./keypoints.component.css']
})
export class KeypointsComponent implements OnInit {

  public form = new FormGroup({
    'fpsControl': new FormControl('', [Validators.required, Validators.min(1), Validators.max(30)]),
    'poseConfidenceControl': new FormControl('', [Validators.required, Validators.min(0.1), Validators.max(1.0)]),
    'keypointConfidenceControl': new FormControl('', [Validators.required, Validators.min(0.1), Validators.max(1.0)])
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

  private net: PoseNet;
  private imageScaleFactor: number;
  private outputStride: OutputStride;

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

    this.form.controls.fpsControl.setValue(5);
    this.form.controls.poseConfidenceControl.setValue(0.4);
    this.form.controls.keypointConfidenceControl.setValue(0.5);

    this.imageScaleFactor = 0.5;
    this.outputStride = 8;

    this.loadPosenet().catch((reason => console.error(reason)));
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
    const stream = await browser.mediaDevices.getUserMedia(config);
    try {
      this.video.srcObject = stream;
    } catch (error) {
      this.video.src = window.URL.createObjectURL(stream);
    }
    this.video.play();
    this.videoStreamInterval = setInterval(this.streamInCanvas, 20);
    return Promise.resolve(true);
  }


  async loadPosenet() {
    this.buttonText = 'Loading neural network...';
    this.net = await posenet.load(1.01);
    this.neuralNetLoaded = true;
    this.buttonText = 'Start pose estimation';
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
    this.buttonText = 'Stop pose estimation';
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
    const poses: Pose[] = await this.net.estimateMultiplePoses(this.sketchCanvas, this.imageScaleFactor, false, this.outputStride).catch(reason => console.log(reason)) || [];
    const highConfidencePoses: Pose[] = [];
    poses.forEach((pose) => {
      if (pose.score >= this.form.controls.poseConfidenceControl.value) {
        highConfidencePoses.push(pose)
      }
    });
    this.drawWithHighConfidencePoses(highConfidencePoses);
    this.frames++;
    this.estimationLock = true;
  };


  drawWithHighConfidencePoses(highConfidencePoses: Pose[]) {
    highConfidencePoses.forEach((pose) => {
      pose.keypoints = pose.keypoints.filter((keypoint) => {
        return keypoint.score >= this.form.controls.keypointConfidenceControl.value;
      });
    });
    [this.canvas.width, this.canvas.height] = this.getCanvasDimensions();
    const canvasContext = this.canvas.getContext('2d');
    canvasContext.drawImage(this.video, 0, 0);
    this.drawOnCanvas(highConfidencePoses);
  }


  drawOnCanvas(highConfidencePoses: Pose[]) {
    const canvasContext = this.canvas.getContext('2d');
    canvasContext.fillStyle = 'red';
    highConfidencePoses.forEach((pose) => {
      const poseParts = [];
      pose.keypoints.forEach((keypoint) => {
        poseParts.push(keypoint.part);
        canvasContext.fillRect(keypoint.position.x, keypoint.position.y, 3, 3);
      });
      this.drawKeypointLines(poseParts, pose, canvasContext);
    });
  }


  drawKeypointLines(poseParts: string[], pose: Pose, canvasContext: CanvasRenderingContext2D) {
    keypointEdges.forEach((keypointEdge) => {
      if (poseParts.includes(keypointEdge[0]) && poseParts.includes(keypointEdge[1])) {
        const edgeStart = pose.keypoints.find(keypoint => keypoint.part === keypointEdge[0]);
        const edgeEnd = pose.keypoints.find(keypoint => keypoint.part === keypointEdge[1]);
        if (edgeStart && edgeEnd) {
          canvasContext.beginPath();
          canvasContext.moveTo(edgeStart.position.x, edgeStart.position.y);
          canvasContext.lineTo(edgeEnd.position.x, edgeEnd.position.y);
          canvasContext.strokeStyle = 'red';
          canvasContext.stroke();
        }
      }
    });
  }


  stopEstimation() {
    clearInterval(this.estimationInterval);
    this.videoStreamInterval = setInterval(this.streamInCanvas, 20);
    this.predicting = false;
    this.form.controls.fpsControl.enable();
    this.buttonText = 'Start pose estimation';
  }


  getCanvasDimensions() {
    let width = this.video.videoWidth;
    let height = this.video.videoHeight;
    return [width, height];
  }
}
