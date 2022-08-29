// import { Color } from 'three';
// import { IfcViewerAPI } from 'web-ifc-viewer';

// const container = document.getElementById('viewer-container');
// const viewer = new IfcViewerAPI({ container, backgroundColor: new Color(0xffffff) });
// viewer.grid.setGrid();
// viewer.axes.setAxes();

// async function loadIfc(url) {
//     await viewer.IFC.setWasmPath("../");
//     const model = await viewer.IFC.loadIfcUrl(url);
//     viewer.shadowDropper.renderShadow(model.modelID);
// }

// loadIfc('./ifc/01.ifc');

import {
    Scene,
    PerspectiveCamera,
    GridHelper,
    AmbientLight, 
    AxisHelper, 
    WebGL1Renderer,
    MOUSE,
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
    MathUtils,
    Clock,
    
} from 'three';
import CameraControls from 'camera-controls';

// 1. Scene

const scene = new Scene();

const grid = new GridHelper();
grid.renderOrder = 1;
scene.add(grid);

const axis = new AxisHelper();
scene.add(axis);

// 2. Object


// 3. Camera

const canvas = document.getElementById('viewer-container');
const camera = new PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight);
scene.add(camera);

// 4. Render

const renderer = new WebGL1Renderer({canvas, alpha: true});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
renderer.setClearColor(0xffffff, 1);

// 5. Lights

const ambientLight = new AmbientLight(0x000000, 0.1);
scene.add(ambientLight);

// 6. Responsivity

window.addEventListener('resize', () => {
    camera.aspect = canvas.clientWidth / canvas.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
});

// 7. Controls

const subsetOfTHREE = {
    MOUSE,
    Vector2,
    Vector3,
    Vector4,
    Quaternion,
    Matrix4,
    Spherical,
    Box3,
    Sphere,
    Raycaster,
    MathUtils: {
        DEG2RAD: MathUtils.DEG2RAD,
        clamp: MathUtils.clamp
    }
};

CameraControls.install({THREE: subsetOfTHREE});
const clock = new Clock();
const cameraControls = new CameraControls(camera, canvas);
cameraControls.dollyToCursor = true;
cameraControls.setLookAt(10, 8, 10, 0, 0, 0);

// 8. Animation

function animate() {
    const delta = clock.getDelta();
    cameraControls.update(delta);

    renderer.render(scene, camera);

    requestAnimationFrame(animate);
};
animate();