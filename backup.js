import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';

let model;
let total_meshes = 0;
let mesh_frame = 0;

const scene = new THREE.Scene();
//scene.add(new THREE.AxesHelper(20));
scene.background = new THREE.Color( 0xbfe3dd );

const camera = new THREE.PerspectiveCamera(
    70,
    window.innerWidth / window.innerHeight,
    1,
    1000
);
camera.position.set( 10, 5, 10 );

const renderer = new THREE.WebGLRenderer();
// renderer.physicallyCorrectLights = true //deprecated
renderer.useLegacyLights = false; //use this instead of setting physicallyCorrectLights=true property
renderer.shadowMap.enabled = true;
// renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const TexLoader = new THREE.TextureLoader();
const tex = TexLoader.load('images/skin.jpg')
tex.wrapS = THREE.RepeatWrapping
tex.wrapT = THREE.RepeatWrapping
tex.magFilter = THREE.NearestFilter

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
const loader = new GLTFLoader();
loader.load(
    'path/to/balls2.gltf',
    function (gltf) {
        model = gltf.scene;
        let i = 0;
        model.traverse(function (child) {
            if (child.isMesh) {
                i ++;
                if (i === 3) {
                    child.material.map = tex;
                    //child.material.transparent = true;
                    //child.material.color.setHex(0xffd700);
                }
                if (i > 7){
                    child.material.visible = false;
                    //child.material.color.setHex(0xffd700);
                }
            }
        });
        total_meshes = i /7;

        model.position.set( 0, 0, 0 );
        model.rotation.set( 3.2, 1, 1.5 );
		model.scale.set( 1, 1, 1 );
        scene.add(model);

        const ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );
        scene.add(ambientLight);
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        console.log(error);
    }
)

window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

const stats = new Stats();
document.body.appendChild(stats.dom);

let fps = 60;
let now;
let then = Date.now();
let interval = 1000/fps;
let delta;
function animate() {
    requestAnimationFrame(animate);
    try {
        now = Date.now();
        delta = now - then;
        if (delta > interval) {
            then = now - (delta % interval);
            /*mesh_frame ++;
            if (mesh_frame === total_meshes) mesh_frame = 0;

            let i = 0;
            model.traverse(function (child) {
                if (child.isMesh) {
                    child.material.visible = i >= (7 * mesh_frame) && i <= ((7 * mesh_frame) + 6);
                    i ++;
                }
            })*/

            controls.update();
            render();
            stats.update();
            //model.rotation.y += 0.1;
        }
    }
    catch(err){
        console.log(err);
    }
}

function render() {
    renderer.render(scene, camera);
}

animate();