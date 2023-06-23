import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'three/examples/jsm/libs/stats.module';
import body_pose from './data/data.json';
import {GUI} from "three/addons/libs/lil-gui.module.min.js";

let scene, camera, renderer, controls, stats;
let model, skeleton, settings;
let frame = 0;
let fps = 4;
let now;
let then = Date.now();
let interval = 1000/fps;
let delta;
let pause = false;
let camera_rotate = true;

init();

function createPanel() {
	const panel = new GUI( { width: 210 } );

    const folder1 = panel.addFolder( 'Visibility' );
    const folder2 = panel.addFolder( 'Pausing/Stepping' );
    const folder3 = panel.addFolder( 'General Speed' );

    settings = {
        'show model': true,
        'show skeleton': false,
	'rotate camera': true,
        'pause/continue': pauseContinue,
        'make single step': toSingleStepMode,
        'modify time scale': 1.0
    };

    folder1.add( settings, 'show model' ).onChange( showModel );
    folder1.add( settings, 'show skeleton' ).onChange( showSkeleton );
    folder1.add( settings, 'rotate camera' ).onChange( rotateCamera );
    folder2.add( settings, 'pause/continue' );
    folder2.add( settings, 'make single step' );
    folder3.add( settings, 'modify time scale', 0.0, 1.5, 0.01 ).onChange( modifyTimeScale );
    folder1.open();
    folder2.open();
    folder3.open();
}

function rotateCamera() {
    camera_rotate = !camera_rotate;
}

function pauseContinue() {
    pause = !pause;
}

function toSingleStepMode() {
    if (!pause) pause = !pause;
    frame ++;
    if (frame > Object.keys(body_pose.result).length - 1) frame = 0;
}

function showModel(visibility) {
    model.visible = visibility;
}

function showSkeleton(visibility) {
    skeleton.visible = visibility;
}

function modifyTimeScale(speed) {
    fps = 4 * speed;
}

function init(){
    scene = new THREE.Scene();
    //scene.add(new THREE.AxesHelper(20));
    scene.background = new THREE.Color( 0xa0a0a0 );
    scene.fog = new THREE.Fog( 0xa0a0a0, 10, 50 );

    const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d );
    hemiLight.position.set( 0, 30, 0 );
    scene.add( hemiLight );

    const dirLight = new THREE.DirectionalLight( 0xffffff );
    dirLight.position.set( 4, 5, 6 );
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 5;
    dirLight.shadow.camera.bottom = -5;
    dirLight.shadow.camera.left = -5;
    dirLight.shadow.camera.right = 5;
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 40;
    scene.add( dirLight );

    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 100, 100 ), new THREE.MeshPhongMaterial( { color: 0xcbcbcb, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    const grid = new THREE.GridHelper( 200, 40, 0x000000, 0x000000 );
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add( grid );

    camera = new THREE.PerspectiveCamera(
        65,
        window.innerWidth / window.innerHeight,
        1,
        1000
    );
    camera.position.set( 0, 1.5, 3 );
    camera.lookAt(0, 1, 0);
    //scene.add( new THREE.CameraHelper( dirLight.shadow.camera ) );

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.shadowMap.enabled = true;
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 1, 0);

    const TexLoader = new THREE.TextureLoader();
    const tex = TexLoader.load('path/to/stacy/stacy.jpg');
    tex.flipY = false;

    const stacy_mtl = new THREE.MeshPhongMaterial({
        map: tex,
        color: 0xffffff
    });

    const loader = new GLTFLoader();
    loader.load(
        'path/to/stacy/stacy_lightweight.glb',
        gltf => {
            model = gltf.scene;
            model.traverse(o => {
                if (o.isMesh) {
                    o.castShadow = true;
                    o.receiveShadow = true;
                    o.material = stacy_mtl;
                    //o.material.visible = false;
                }
                if (o.isBone) {
                    //console.log(o.name + ' --> ' + o.parent.name);
                    //console.log(o.name);
                    o.scale.set(1 , 1, 1);
                }
                if (o.isBone && o.name === 'mixamorigNeck') {
                    model.neck = o;
                }
                else if (o.isBone && o.name === 'mixamorigHead') {
                    model.head = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightShoulder') {
                    model.right_shoulder = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftShoulder') {
                    model.left_shoulder = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightArm') {
                    model.right_arm = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightForeArm') {
                    model.right_fore_arm = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftArm') {
                    model.left_arm = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftForeArm') {
                    model.left_fore_arm = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightHand') {
                    model.right_hand = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftHand') {
                    model.left_hand = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightHandIndex1') {
                    model.right_hand_index1 = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftHandIndex1') {
                    model.left_hand_index1 = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightHandIndex4') {
                    model.right_hand_index_4 = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightHandThumb4') {
                    model.right_thumb_4 = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftHandThumb4') {
                    model.left_thumb_4 = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightLeg') {
                    model.right_leg = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftLeg') {
                    model.left_leg = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightFoot') {
                    model.right_foot = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftFoot') {
                    model.left_foot = o;
                }
                else if (o.isBone && o.name === 'mixamorigRightUpLeg') {
                    model.right_up_leg = o;
                }
                else if (o.isBone && o.name === 'mixamorigLeftUpLeg') {
                    model.left_up_leg = o;
                }
                else if (o.isBone && o.name === 'mixamorigSpine1') {
                    model.spine_1 = o;
                }
                else if (o.isBone && o.name === 'mixamorigSpine2') {
                    model.spine_2 = o;
                }
                else if (o.isBone && o.name === 'mixamorigSpine') {
                    model.spine = o;
                }
                else if (o.isBone && o.name === 'mixamorigHips') {
                    model.hips = o;
                }
            });

            model.position.set( 0, 0, 0 );
            model.scale.set( 1, 0.9, 1 );
            scene.add(model);

            skeleton = new THREE.SkeletonHelper(model);
            skeleton.visible = false;
            scene.add(skeleton);

            createPanel();
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
        },
        (error) => {
            console.log(error);
        }
    )

    stats = new Stats();
    document.body.appendChild(stats.dom);
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    render();
}

const offset = new THREE.Vector3();
const distance = 3;

function animate() {
    interval = 1000 / fps;
    requestAnimationFrame(animate);
    try {
        now = Date.now();
        delta = now - then;
        if (delta > interval) {
            then = now - (delta % interval);

            setupPos();

	    if (camera_rotate) {
                offset.x = distance * Math.sin(now * 0.0005);
                offset.z = distance * Math.cos(now * 0.0005);

                camera.position.copy(model.position).add(offset);
                camera.position.y = 1.5;
                camera.lookAt(model.position);
            }

            controls.update();
            render();
            stats.update();
        }
    }
    catch(err){
        console.log(err);
    }
}

function render() {
    renderer.render(scene, camera);
}

function setupPos() {
    poseAngles(model.hips, frame);
    poseAngles(model.spine_2, frame);
    poseAngles(model.neck, frame);
    poseAngles(model.left_shoulder, frame);
    poseAngles(model.right_shoulder, frame);
    poseAngles(model.left_arm, frame);
    poseAngles(model.left_fore_arm, frame);
    poseAngles(model.left_hand, frame);
    poseAngles(model.left_up_leg, frame);
    poseAngles(model.left_leg, frame);
    //poseAngles(model.left_foot, frame);
    poseAngles(model.right_arm, frame);
    poseAngles(model.right_fore_arm, frame);
    poseAngles(model.right_hand, frame);
    poseAngles(model.right_up_leg, frame);
    poseAngles(model.right_leg, frame);
    //poseAngles(model.right_foot, frame);
    poseAngles(model.head, frame);

    if (!pause) frame++;
    if (frame > Object.keys(body_pose.result).length - 1) frame = 0;
}

function poseAngles(joint, frame_num) {
    if (Object.keys(body_pose.result[frame_num]).length === 0) return;

    if (body_pose.result[frame_num].landmark31.y < body_pose.result[frame_num].landmark23.y || body_pose.result[frame_num].landmark32.y < body_pose.result[frame_num].landmark24.y) {
        if (joint === model.hips) {
            frame++;
            if (frame > Object.keys(body_pose.result).length - 1) frame = 0;
            return;
        }else{
            return;
        }
    }
	
    const pose_left_shoulder = new THREE.Vector3(body_pose.result[frame_num].landmark11.x, -body_pose.result[frame_num].landmark11.y, -body_pose.result[frame_num].landmark11.z);
    const pose_right_shoulder = new THREE.Vector3(body_pose.result[frame_num].landmark12.x, -body_pose.result[frame_num].landmark12.y, -body_pose.result[frame_num].landmark12.z);
    const pose_left_elbow = new THREE.Vector3(body_pose.result[frame_num].landmark13.x, -body_pose.result[frame_num].landmark13.y, -body_pose.result[frame_num].landmark13.z);
    const pose_right_elbow = new THREE.Vector3(body_pose.result[frame_num].landmark14.x, -body_pose.result[frame_num].landmark14.y, -body_pose.result[frame_num].landmark14.z);
    const pose_left_hand = new THREE.Vector3(body_pose.result[frame_num].landmark15.x, -body_pose.result[frame_num].landmark15.y, -body_pose.result[frame_num].landmark15.z);
    const pose_right_hand = new THREE.Vector3(body_pose.result[frame_num].landmark16.x, -body_pose.result[frame_num].landmark16.y, -body_pose.result[frame_num].landmark16.z);
    const pose_left_hand_index_1 = new THREE.Vector3(body_pose.result[frame_num].landmark19.x, -body_pose.result[frame_num].landmark19.y, -body_pose.result[frame_num].landmark19.z);
    const pose_right_hand_index_1 = new THREE.Vector3(body_pose.result[frame_num].landmark20.x, -body_pose.result[frame_num].landmark20.y, -body_pose.result[frame_num].landmark20.z);
    const pose_left_hip = new THREE.Vector3(body_pose.result[frame_num].landmark23.x, -body_pose.result[frame_num].landmark23.y, -body_pose.result[frame_num].landmark23.z);
    const pose_right_hip = new THREE.Vector3(body_pose.result[frame_num].landmark24.x, -body_pose.result[frame_num].landmark24.y, -body_pose.result[frame_num].landmark24.z);
    const pose_left_knee = new THREE.Vector3(body_pose.result[frame_num].landmark25.x, -body_pose.result[frame_num].landmark25.y, -body_pose.result[frame_num].landmark25.z);
    const pose_right_knee = new THREE.Vector3(body_pose.result[frame_num].landmark26.x, -body_pose.result[frame_num].landmark26.y, -body_pose.result[frame_num].landmark26.z);
    const pose_left_ankle = new THREE.Vector3(body_pose.result[frame_num].landmark27.x, -body_pose.result[frame_num].landmark27.y, -body_pose.result[frame_num].landmark27.z);
    const pose_right_ankle = new THREE.Vector3(body_pose.result[frame_num].landmark28.x, -body_pose.result[frame_num].landmark28.y, -body_pose.result[frame_num].landmark28.z);
    const pose_left_heel = new THREE.Vector3(body_pose.result[frame_num].landmark29.x, -body_pose.result[frame_num].landmark29.y, -body_pose.result[frame_num].landmark29.z);
    const pose_right_heel = new THREE.Vector3(body_pose.result[frame_num].landmark30.x, -body_pose.result[frame_num].landmark30.y, -body_pose.result[frame_num].landmark30.z);
    const pose_left_foot_index = new THREE.Vector3(body_pose.result[frame_num].landmark31.x, -body_pose.result[frame_num].landmark31.y, -body_pose.result[frame_num].landmark31.z);
    const pose_right_foot_index = new THREE.Vector3(body_pose.result[frame_num].landmark32.x, -body_pose.result[frame_num].landmark32.y, -body_pose.result[frame_num].landmark32.z);
    const pose_left_ear = new THREE.Vector3(body_pose.result[frame_num].landmark7.x, -body_pose.result[frame_num].landmark7.y, -body_pose.result[frame_num].landmark7.z);
    const pose_right_ear = new THREE.Vector3(body_pose.result[frame_num].landmark8.x, -body_pose.result[frame_num].landmark8.y, -body_pose.result[frame_num].landmark8.z);

    const pose_middle_head = ((new THREE.Vector3).copy(pose_left_ear)).add(pose_right_ear).multiplyScalar(0.5);
    const pose_hips = ((new THREE.Vector3).copy(pose_left_hip)).add(pose_right_hip).multiplyScalar(0.5);
    const pose_spine_2 = ((new THREE.Vector3).copy(pose_right_shoulder)).add(pose_left_shoulder).multiplyScalar(0.5); //.multiplyScalar(0.728);

    let point_parent;
    let point_articulation;
    let point_child;

    if (joint === model.spine_2) {
        const vec_bone = (new THREE.Vector3).subVectors(pose_spine_2, pose_hips);

        joint.parent.parent.rotation.x = 0;
        if (pose_spine_2.z > pose_hips.z) {
            joint.parent.parent.rotation.x = vec_bone.angleTo(new THREE.Vector3(0, 1, 0));
        }else{
            joint.parent.parent.rotation.x = -vec_bone.angleTo(new THREE.Vector3(0, 1, 0));
        }

        const helper_axes = new THREE.AxesHelper(80);
        //joint.parent.parent.add(helper_axes);

        return;
    }else if (joint === model.left_shoulder) {
        const vec_bone = (new THREE.Vector3).subVectors(pose_left_shoulder, pose_spine_2);

        if (pose_spine_2.y > pose_left_shoulder.y) {
            joint.rotation.x = -(Math.PI * 2 - vec_bone.angleTo(new THREE.Vector3(0, 1, 0)));
        }else{
            joint.rotation.x = vec_bone.angleTo(new THREE.Vector3(0, 1, 0));
        }

        const helper_axes = new THREE.AxesHelper(80);
        //joint.add(helper_axes);

        return;
    }else if (joint === model.right_shoulder) {
        const vec_bone = (new THREE.Vector3).subVectors(pose_right_shoulder, pose_spine_2);

        if (pose_spine_2.y > pose_right_shoulder.y) {
            joint.rotation.x = vec_bone.angleTo(new THREE.Vector3(0, 1, 0));
        }else{
            joint.rotation.x = -(Math.PI * 2 - vec_bone.angleTo(new THREE.Vector3(0, 1, 0)));
        }

        const helper_axes = new THREE.AxesHelper(80);
        //joint.add(helper_axes);

        return;
    }else if (joint === model.neck) {
        const vec_spine = (new THREE.Vector3).subVectors(pose_spine_2, pose_hips);
        const vec_neck = (new THREE.Vector3).subVectors(pose_middle_head, pose_spine_2);

        if (pose_middle_head.z > pose_spine_2.z) {
            joint.rotation.x = -vec_neck.angleTo(vec_spine);
        }else{
            joint.rotation.x = vec_neck.angleTo(vec_spine);
        }

        const helper_axes = new THREE.AxesHelper(80);
        //joint.add(helper_axes);

        return;
    }
    else if (joint === model.right_arm) {
        point_parent = pose_spine_2;
        point_articulation = pose_right_shoulder;
        point_child = pose_right_elbow;
    }
    else if (joint === model.left_arm) {
        point_parent = pose_spine_2;
        point_articulation = pose_left_shoulder;
        point_child = pose_left_elbow;
    }
    else if (joint === model.right_fore_arm) {
        point_parent = pose_right_shoulder;
        point_articulation = pose_right_elbow;
        point_child = pose_right_hand;
    }
    else if (joint === model.left_fore_arm) {
        point_parent = pose_left_shoulder;
        point_articulation = pose_left_elbow;
        point_child = pose_left_hand;
    }
    else if (joint === model.right_hand) {
        point_parent = pose_right_elbow;
        point_articulation = pose_right_hand;
        point_child = pose_right_hand_index_1;
    }
    else if (joint === model.left_hand) {
        point_parent = pose_left_elbow;
        point_articulation = pose_left_hand;
        point_child = pose_left_hand_index_1;
    }
    else if (joint === model.left_up_leg) {
	if (model.hips.rotation.y > 1 || model.hips.rotation.y < -1) return;
	    
        point_parent = pose_hips;
        point_articulation = pose_left_hip;
        point_child = pose_left_knee;
    }
    else if (joint === model.right_up_leg) {
	if (model.hips.rotation.y > 1 || model.hips.rotation.y < -1) return;
	    
        point_parent = pose_hips;
        point_articulation = pose_right_hip;
        point_child = pose_right_knee;
    }
    else if (joint === model.left_leg) {
	if (model.hips.rotation.y > 1 || model.hips.rotation.y < -1) return;
	    
        point_parent = pose_left_hip;
        point_articulation = pose_left_knee;
        point_child = pose_left_ankle;
    }
    else if (joint === model.right_leg) {
	if (model.hips.rotation.y > 1 || model.hips.rotation.y < -1) return;
	    
        point_parent = pose_right_hip;
        point_articulation = pose_right_knee;
        point_child = pose_right_ankle;
    }
    else if (joint === model.left_foot) {
        point_parent = pose_left_ankle;
        point_articulation = pose_left_heel;
        point_child = pose_left_foot_index;

        return;
    }
    else if (joint === model.right_foot) {
        point_parent = pose_right_ankle;
        point_articulation = pose_right_heel;
        point_child = pose_right_foot_index;

        return;
    }
    else if (joint === model.head) {
        point_articulation = pose_right_ear;
        point_child = pose_left_ear;

        const position1 = new THREE.Vector3();
        joint.getWorldPosition(position1);

        const vec_bone1 = (new THREE.Vector3).subVectors(point_articulation, point_child);
        const vec_bone2 = (new THREE.Vector3).subVectors(point_child, point_articulation);

        const length = 1;
        const hex = 0xffff00;
        const arrowHelper = new THREE.ArrowHelper( vec_bone1.clone().normalize(), position1, length, hex );
        //scene.add(arrowHelper);

        const length2 = 1;
        const hex2 = 0x0000ff;
        const arrowHelper2 = new THREE.ArrowHelper( vec_bone2.clone().normalize(), position1, length2, hex2 );
        //scene.add(arrowHelper2);

        joint.rotation.y = 0;
        if (pose_left_ear.z > pose_right_ear.z) {
            joint.rotation.y = -vec_bone2.angleTo(new THREE.Vector3(1, 0, 0)) - model.hips.rotation.y;
        }else{
            joint.rotation.y = vec_bone2.angleTo(new THREE.Vector3(1, 0, 0)) - model.hips.rotation.y;
        }

        return;
    }
    else if (joint === model.hips) {
        point_parent = pose_hips;
        point_articulation = pose_right_hip;
        point_child = pose_left_hip;

        const position1 = new THREE.Vector3();
        joint.getWorldPosition(position1);

        const vec_bone1 = (new THREE.Vector3).subVectors(point_articulation, point_parent);
        const vec_bone2 = (new THREE.Vector3).subVectors(point_child, point_parent);

        const length = 1;
        const hex = 0xffff00;
        const arrowHelper = new THREE.ArrowHelper( vec_bone1.clone().normalize(), position1, length, hex );
        //scene.add(arrowHelper);

        const length2 = 1;
        const hex2 = 0x0000ff;
        const arrowHelper2 = new THREE.ArrowHelper( vec_bone2.clone().normalize(), position1, length2, hex2 );
        //scene.add(arrowHelper2);

        const helper_axes = new THREE.AxesHelper(80);
        //joint.add(helper_axes);

        joint.rotation.y = 0;
        if (pose_left_hip.z > pose_right_hip.z) {
            joint.rotation.y = -vec_bone2.angleTo(new THREE.Vector3(1, 0, 0));
        }else{
            joint.rotation.y = vec_bone2.angleTo(new THREE.Vector3(1, 0, 0));
        }

        return;
    }

    const position1 = new THREE.Vector3();
    const position2 = new THREE.Vector3();
    joint.getWorldPosition(position1);
    if (joint.children.length > 0) {
        joint.children[0].getWorldPosition(position2);
    }else{
        joint.getWorldPosition(position2);
    }

    const vec_bone = (new THREE.Vector3).subVectors(point_child, point_articulation);
    const vec_from = (new THREE.Vector3).subVectors(position2, position1);

    const helper_axes = new THREE.AxesHelper(80);
    //joint.parent.add(helper_axes);

    const length = 1;
    const hex = 0xffff00;
    const arrowHelper = new THREE.ArrowHelper( vec_bone.clone().normalize(), position1, length, hex );
    //scene.add(arrowHelper);

    const length2 = 1;
    const hex2 = 0x0000ff;
    const arrowHelper2 = new THREE.ArrowHelper( vec_from.clone().normalize(), position1, length2, hex2 );
    //scene.add(arrowHelper2);

    const pr = joint.parent.rotation.clone();
    const ppr = joint.parent.parent.rotation.clone();
    const pppr = joint.parent.parent.parent.rotation.clone();

    if (joint === model.right_fore_arm || joint === model.left_fore_arm || joint === model.right_up_leg || joint === model.left_up_leg) {
        joint.parent.rotation.y = 0;
        joint.parent.rotation.z = 0;
        joint.parent.rotation.x = 0;
    }
    if (joint === model.right_hand || joint === model.left_hand || joint === model.right_leg || joint === model.left_leg) {
        joint.parent.rotation.x = 0;
        joint.parent.rotation.y = 0;
        joint.parent.rotation.z = 0;

        joint.parent.parent.rotation.x = 0;
        joint.parent.parent.rotation.y = 0;
        joint.parent.parent.rotation.z = 0;
    }
    if (joint === model.right_foot || joint === model.left_foot){
        joint.parent.rotation.x = 0;
        joint.parent.rotation.y = 0;
        joint.parent.rotation.z = 0;

        joint.parent.parent.rotation.x = 0;
        joint.parent.parent.rotation.y = 0;
        joint.parent.parent.rotation.z = 0;

        joint.parent.parent.parent.rotation.x = 0;
        joint.parent.parent.parent.rotation.y = 0;
        joint.parent.parent.parent.rotation.z = 0;
    }
    //const vec_bone_test = new THREE.Vector3(0, 1, 0);
    const vec_bone_to_local = createLocalVectorWithSameDirectionChild(vec_bone, joint.parent);
    //const vec_bone_from_local = createLocalVectorWithSameDirectionChild(vec_from, joint.parent);

    let vec_bone_from_local;
    if (joint === model.right_foot || joint === model.left_foot || joint === model.right_up_leg || joint === model.left_up_leg || joint === model.right_leg || joint === model.left_leg) {
        vec_bone_from_local = new THREE.Vector3(0, -1, 0); //from
    }else{
        vec_bone_from_local = new THREE.Vector3(0, 1, 0); //from
    }

    const quat_pose_rot = new THREE.Quaternion();
    quat_pose_rot.setFromUnitVectors(vec_bone_from_local.clone().normalize(), vec_bone_to_local.clone().normalize());
    joint.quaternion.copy(quat_pose_rot);

    if (joint === model.right_fore_arm || joint === model.left_fore_arm || joint === model.right_up_leg || joint === model.left_up_leg) {
        joint.parent.rotation.x = pr.x;
        joint.parent.rotation.y = pr.y;
        joint.parent.rotation.z = pr.z;
        const q = joint.parent.quaternion.clone().invert();
        joint.applyQuaternion(q);
    }
    if (joint === model.right_hand || joint === model.left_hand || joint === model.right_leg || joint === model.left_leg) {
        joint.parent.parent.rotation.x = ppr.x;
        joint.parent.parent.rotation.y = ppr.y;
        joint.parent.parent.rotation.z = ppr.z;
        const q = joint.parent.parent.quaternion.clone().invert();
        joint.parent.applyQuaternion(q);

        joint.parent.rotation.x = pr.x;
        joint.parent.rotation.y = pr.y;
        joint.parent.rotation.z = pr.z;
        const q2 = joint.parent.quaternion.clone().invert();
        joint.applyQuaternion(q);
        joint.applyQuaternion(q2);
    }
    if (joint === model.right_foot || joint === model.left_foot) {
        joint.parent.parent.parent.rotation.x = pppr.x;
        joint.parent.parent.parent.rotation.y = pppr.y;
        joint.parent.parent.parent.rotation.z = pppr.z;
        const q3 = joint.parent.parent.parent.quaternion.clone().invert();
        joint.parent.parent.applyQuaternion(q3);

        joint.parent.parent.rotation.x = ppr.x;
        joint.parent.parent.rotation.y = ppr.y;
        joint.parent.parent.rotation.z = ppr.z;
        const q2 = joint.parent.parent.quaternion.clone().invert();
        joint.parent.applyQuaternion(q3);
        joint.parent.applyQuaternion(q2);

        joint.parent.rotation.x = pr.x;
        joint.parent.rotation.y = pr.y;
        joint.parent.rotation.z = pr.z;
        const q = joint.parent.quaternion.clone().invert();
        joint.applyQuaternion(q3);
        joint.applyQuaternion(q2);
        joint.applyQuaternion(q);
    }

    if (joint === model.left_up_leg || joint === model.right_up_leg || joint === model.right_leg || joint === model.left_leg) {
        joint.rotation.z = joint.rotation.z + (Math.PI);
    }
    if (joint === model.right_foot || joint === model.left_foot) {
        joint.rotation.z = joint.rotation.z + (Math.PI);
        //joint.rotation.y = joint.rotation.y + (Math.PI);
    }
    //model.lookAt(point_child);
}

function createLocalVectorWithSameDirectionChild(worldVector, object) {
    const localVector = new THREE.Vector3();
    localVector.copy(worldVector.clone().normalize());

    let i = 1;
    let parentObject = object;
    while (parentObject !== null && i <= 100) {
        const rotationQuaternion = parentObject.quaternion.clone();
        rotationQuaternion.invert();
        localVector.applyQuaternion(rotationQuaternion);

        parentObject = parentObject.parent;
        i++;
    }

    return localVector.clone().normalize();
}

animate();
