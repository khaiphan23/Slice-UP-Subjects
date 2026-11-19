import { HandLandmarker, PoseLandmarker, FilesetResolver } from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/+esm';

const wasmUrl = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const modelUrl = 'https://storage.googleapis.com/mediapipe-models';

export async function createTrackingModels(createCanvas) {
  const files = await FilesetResolver.forVisionTasks(wasmUrl);
  const models = {
    hand: await HandLandmarker.createFromOptions(files, {
      canvas: createCanvas?.(),
      baseOptions: {
        modelAssetPath: modelUrl + '/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numHands: 2,
      minHandDetectionConfidence: .4,
      minHandPresenceConfidence: .4,
      minTrackingConfidence: .4
    }),
    pose: null
  };

  try {
    models.pose = await PoseLandmarker.createFromOptions(files, {
      canvas: createCanvas?.(),
      baseOptions: {
        modelAssetPath: modelUrl + '/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
        delegate: 'GPU'
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: .4,
      minPosePresenceConfidence: .4,
      minTrackingConfidence: .4
    });
  } catch (error) {
    console.warn('Pose tracking unavailable', error);
  }
  return models;
}

export function readTrackingFrame(models, frame, timestamp, includePose) {
  const hand = models.hand.detectForVideo(frame, timestamp);
  const result = { landmarks: hand.landmarks, handedness: hand.handedness };
  if (includePose) {
    result.pose = null;
    if (models.pose) {
      try {
        result.pose = models.pose.detectForVideo(frame, timestamp).landmarks[0] ?? null;
      } catch (error) {
        console.warn('Pose tracking stopped', error);
        models.pose.close();
        models.pose = null;
      }
    }
  }
  return result;
}
