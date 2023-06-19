import './style.css';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {VertexNormalsHelper} from 'three/examples/jsm/helpers/VertexNormalsHelper';
import Stats from 'three/examples/jsm/libs/stats.module';
import body_pose from './data/data.json';
import {distance, normalize, radians} from "three/nodes";
import {Quaternion} from "three";
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(20));
scene.background = new THREE.Color( 0xbfe3dd );

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.01,
    1000
);
camera.position.set( 0, 5, 10 );
camera.up.set(0, 1, 0);

const renderer = new THREE.WebGLRenderer();
// renderer.physicallyCorrectLights = true //deprecated
renderer.useLegacyLights = false; //use this instead of setting physicallyCorrectLights=true property
renderer.shadowMap.enabled = true;
// renderer.outputEncoding = THREE.sRGBEncoding
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

const TexLoader = new THREE.TextureLoader();
const tex = TexLoader.load('path/to/stacy/stacy.jpg');
tex.flipY = false;

const stacy_mtl = new THREE.MeshPhongMaterial({
    map: tex,
    color: 0xffffff
});
let model;
let line1;
let line2;
let mesh;
let rootBone;
let skeleton;

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
                o.material.visible = false;
            }
            if (o.isSkinnedMesh) {
                mesh = o;
            }
            if (o.isBone) {
                //console.log(o.name + ' --> ' + o.parent.name);
                console.log(o.name);
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
            else if (o.isBone && o.name === 'mixamorigRightHandIndex4') {
                model.right_hand_index_4 = o;
            }
            else if (o.isBone && o.name === 'mixamorigRightThumb4') {
                model.right_thumb_4 = o;
                model.right_thumb_4.removeFromParent();
                if (model.right_hand) {
                    model.right_thumb_4.attach(model.right_hand);
                    console.log("right_thumb_4 attached to right_hand");
                }
            }
            else if (o.isBone && o.name === 'mixamorigLeftThumb4') {
                model.left_thumb_4 = o;
                model.left_thumb_4.removeFromParent();
                if(model.left_hand) {
                    model.left_thumb_4.attach(model.right_hand);
                    console.log("left_thumb_4 attached to right_hand");
                }
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

        model.position.set( 0, -2, 0 );
		model.scale.set( 4, 4, 4 );
        //model.rotation.set( Math.PI, 0, 0 );
        scene.add(model);

        const ambientLight = new THREE.AmbientLight( 0xffffff, 0.8 );
        scene.add(ambientLight);

        skeleton = new THREE.SkeletonHelper(model);
        scene.add(skeleton);

        rootBone = skeleton.bones[0];

        //const helper_axes = new THREE.AxesHelper(80);
        //model.spine.add(helper_axes);

        /*const points1 = [];
        const points2 = [];
        const x_move = 0;
        for (let key in body_pose) {
            if (body_pose.hasOwnProperty(key)) {
                if (key === 'landmark12' || key === 'landmark14' || key === 'landmark16') {
                    points1.push(new THREE.Vector3(body_pose[key].x + x_move, -body_pose[key].y, -body_pose[key].z));
                }
                if (key === 'landmark11' || key === 'landmark13' || key === 'landmark15') {
                    points2.push(new THREE.Vector3(body_pose[key].x + x_move, -body_pose[key].y, -body_pose[key].z));
                }
                const dotGeometry = new THREE.BufferGeometry();
                dotGeometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array([body_pose[key].x + x_move, -body_pose[key].y, -body_pose[key].z]), 3));
                const dotMaterial = new THREE.PointsMaterial({ size: 0.05, color: 0x000000 });
                const dot = new THREE.Points(dotGeometry, dotMaterial);
                scene.add( dot );
            }
        }
        const material = new THREE.LineBasicMaterial( { color: 0xff0000 } );
        const geometry1 = new THREE.BufferGeometry().setFromPoints( points1 );
        line1 = new THREE.Line( geometry1, material );
        const geometry2 = new THREE.BufferGeometry().setFromPoints( points2 );
        line2 = new THREE.Line( geometry2, material );
        scene.add( line1, line2 );*/
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

let fps = 30;
let now;
let then = Date.now();
let interval = 1000/fps;
let delta;
let a = 0.1;
function animate() {
    requestAnimationFrame(animate);
    try {
        now = Date.now();
        delta = now - then;
        if (delta > interval) {
            then = now - (delta % interval);

            //setupPos();

            controls.update();
            render();
            stats.update();

            //console.log(a);
            a += 0.1;
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
    //model.right_up_leg.rotation.x += 0.1;
    poseAngles(model.left_arm);
    poseAngles(model.left_fore_arm);
    //poseAngles(model.left_hand);
    poseAngles(model.left_up_leg);
    poseAngles(model.left_leg);
    poseAngles(model.right_arm);
    poseAngles(model.right_fore_arm);
    //poseAngles(model.right_hand);
    poseAngles(model.right_up_leg);
    poseAngles(model.right_leg);
    //poseAngles(model.hips);
    poseAngles(model.neck);

}

function poseAngles(joint) {
    if (Object.keys(body_pose).length === 0) return;
    const pose_left_shoulder = new THREE.Vector3(body_pose.landmark11.x, -body_pose.landmark11.y, -body_pose.landmark11.z);
    const pose_right_shoulder = new THREE.Vector3(body_pose.landmark12.x, -body_pose.landmark12.y, -body_pose.landmark12.z);
    const pose_left_elbow = new THREE.Vector3(body_pose.landmark13.x, -body_pose.landmark13.y, -body_pose.landmark13.z);
    const pose_right_elbow = new THREE.Vector3(body_pose.landmark14.x, -body_pose.landmark14.y, -body_pose.landmark14.z);
    const pose_left_hand = new THREE.Vector3(body_pose.landmark15.x, -body_pose.landmark15.y, -body_pose.landmark15.z);
    const pose_right_hand = new THREE.Vector3(body_pose.landmark16.x, -body_pose.landmark16.y, -body_pose.landmark16.z);
    const pose_left_hand_thumb_4 = new THREE.Vector3(body_pose.landmark21.x, -body_pose.landmark21.y, -body_pose.landmark21.z);
    const pose_right_hand_thumb_4 = new THREE.Vector3(body_pose.landmark22.x, -body_pose.landmark22.y, -body_pose.landmark22.z);
    const pose_left_hip = new THREE.Vector3(body_pose.landmark23.x, -body_pose.landmark23.y, -body_pose.landmark23.z);
    const pose_right_hip = new THREE.Vector3(body_pose.landmark24.x, -body_pose.landmark24.y, -body_pose.landmark24.z);
    const pose_left_knee = new THREE.Vector3(body_pose.landmark25.x, -body_pose.landmark25.y, -body_pose.landmark25.z);
    const pose_right_knee = new THREE.Vector3(body_pose.landmark26.x, -body_pose.landmark26.y, -body_pose.landmark26.z);
    const pose_left_ankle = new THREE.Vector3(body_pose.landmark27.x, -body_pose.landmark27.y, -body_pose.landmark27.z);
    const pose_right_ankle = new THREE.Vector3(body_pose.landmark28.x, -body_pose.landmark28.y, -body_pose.landmark28.z);
    const pose_left_heel = new THREE.Vector3(body_pose.landmark29.x, -body_pose.landmark29.y, -body_pose.landmark29.z);
    const pose_right_heel = new THREE.Vector3(body_pose.landmark30.x, -body_pose.landmark30.y, -body_pose.landmark30.z);

    const pose_hips = ((new THREE.Vector3).copy(pose_left_hip)).add(pose_right_hip).multiplyScalar(0.5);
    const pose_spine_2 = ((new THREE.Vector3).copy(pose_right_shoulder)).add(pose_left_shoulder).multiplyScalar(0.5); //.multiplyScalar(0.728);

    let point_parent;
    let point_articulation;
    let point_child;
    let point_arm;

    if (joint === model.neck) {
        point_parent = pose_hips;
        point_articulation = pose_spine_2;
        point_arm = pose_right_elbow;

        const vec_parent = (new THREE.Vector3).subVectors(point_articulation, point_parent).multiplyScalar(0.375);
        const vec_bone = (new THREE.Vector3).subVectors(point_arm, point_articulation);

        let quat_pose_rot = new THREE.Quaternion();
        quat_pose_rot.setFromUnitVectors(vec_parent.normalize(), vec_bone.normalize());
        joint.quaternion.rotateTowards(quat_pose_rot, 0.05);

        //setJointAnglesFromVects(joint, vec_bone, vec_parent);
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
        point_child = pose_right_hand_thumb_4;
    }
    else if (joint === model.left_hand) {
        point_parent = pose_left_elbow;
        point_articulation = pose_left_hand;
        point_child = pose_left_hand_thumb_4;
    }
    else if (joint === model.left_up_leg) {
        point_parent = pose_hips;
        point_articulation = pose_left_hip;
        point_child = pose_left_knee;
    }
    else if (joint === model.right_up_leg) {
        point_parent = pose_hips;
        point_articulation = pose_right_hip;
        point_child = pose_right_knee;
    }
    else if (joint === model.left_leg) {
        point_parent = pose_left_hip;
        point_articulation = pose_left_knee;
        point_child = pose_left_ankle;
    }
    else if (joint === model.right_leg) {
        point_parent = pose_right_hip;
        point_articulation = pose_right_knee;
        point_child = pose_right_ankle;
    }
    //console.log(joint.name);
    //console.log(joint.children[0].name);

    const position1 = new THREE.Vector3();
    const position2 = new THREE.Vector3();
    joint.getWorldPosition(position1);
    joint.children[0].getWorldPosition(position2);

    const vec_parent = (new THREE.Vector3).subVectors(point_articulation, point_parent);
    const vec_bone = (new THREE.Vector3).subVectors(point_child, point_articulation);
    //const vec_bone = new THREE.Vector3(1,1,0);
    const vec_from = (new THREE.Vector3).subVectors(position2, position1);

    //const vec_bone_local = (new THREE.Vector3).subVectors(joint.clone().worldToLocal(point_child.clone()), new THREE.Vector3(0, 0, 0));
    //const vec_bone2_local = (new THREE.Vector3).subVectors(joint.children[0].position, joint.position);

    const helper_axes = new THREE.AxesHelper(80);
    //joint.children[0].add(helper_axes);

    const length = 1;
    const hex = 0xffff00;
    const arrowHelper = new THREE.ArrowHelper( vec_bone.clone().normalize(), position1, length, hex );
    //scene.add(arrowHelper);

    const length2 = 1;
    const hex2 = 0x0000ff;
    const arrowHelper2 = new THREE.ArrowHelper( vec_bone.clone().normalize(), new THREE.Vector3(), length2, hex2 );
    //scene.add(arrowHelper2);

    //console.log(vec_bone.normalize());
    //console.log(vec_bone2.normalize());

    //setJointAnglesFromVects(joint, vec_bone2, vec_bone);

    //console.log(vec_bc);
    //joint.position.set(joint.clone().worldToLocal(point_articulation.position));
    //joint.rotation.set(vec_bone_local.normalize().x, vec_bone_local.normalize().y, vec_bone_local.normalize().z, "XYZ");

    //let vec_bone_to_local = new THREE.Vector3();
    //vec_bone_to_local.copy(vec_bone).applyMatrix4(joint.matrixWorld);

    //let vec_bone_to_local = joint.parent.worldToLocal(vec_bone.clone().normalize()).clone().normalize();
    //const vec_bone_to_local = convertWorldToLocalDirection(vec_bone, joint);
    //const vec_bone_to_local = createLocalVectorWithSameDirectionBone(vec_bone, joint);
    //const vec_bone_to_local = createLocalVectorWithSameDirection(vec_bone, joint.parent);
    //const vec_bone_test = new THREE.Vector3(0,1,0);

    //const parent_rotation = joint.parent.rotation.clone();
    const pr = joint.parent.rotation.clone();
    if (joint === model.right_fore_arm || joint === model.left_fore_arm) {
        joint.parent.rotation.x = 0;
        joint.parent.rotation.y = 0;
        joint.parent.rotation.z = 0;
    }

    //joint.parent.parent.rotation.set(0,0,0);


    //const vec_bone_test = new THREE.Vector3(0, 1, 0);
    const vec_bone_to_local = createLocalVectorWithSameDirectionChild(vec_bone, joint.parent);

    //let vec_bone_from_local = createLocalVectorWithSameDirection(vec_bone2, joint.parent);
    //console.log(joint.rotation);

    //let vec_bone_from_local =  joint.parent.worldToLocal(vec_parent.clone().normalize());

    //let vec_bone_to_local = new THREE.Vector3(0, 1, 0); //to
    let vec_bone_from_local=  new THREE.Vector3(0, 1, 0); //from
    let quat_pose_rot = new THREE.Quaternion();
    quat_pose_rot.setFromUnitVectors(vec_bone_from_local.clone().normalize(), vec_bone_to_local.clone().normalize());
    //console.log(quat_pose_rot);
    //joint.quaternion.rotateTowards(quat_pose_rot, 2);
    //joint.applyQuaternion(quat_pose_rot);
    //joint.quaternion.multiply(quat_pose_rot);
    joint.quaternion.copy(quat_pose_rot);

    if (joint === model.right_fore_arm || joint === model.left_fore_arm) {
        joint.parent.rotation.x = pr.x;
        joint.parent.rotation.y = pr.y;
        joint.parent.rotation.z = pr.z;

        const q = joint.parent.quaternion.clone().invert();
        joint.applyQuaternion(q);
    }else if (joint === model.right_up_leg || joint === model.left_up_leg) {
        joint.children[0].rotation.y = joint.children[0].rotation.y + (Math.PI);
    }else if (joint === model.right_leg || joint === model.left_leg) {
        joint.children[0].rotation.z = joint.children[0].rotation.z - (Math.PI);
    }

    //joint.lookAt(vec_bone_to_local.clone().normalize());
    //model.lookAt(point_child);


    /*let vec_bone_xy = new THREE.Vector3(vec_bone_local.x, vec_bone_local.y, 0);
    let vec_bone2_xy = new THREE.Vector3(vec_bone2_local.x, vec_bone2_local.y, 0);
    let r_z = vec_bone_xy.angleTo(vec_bone2_xy);
    let orientation_z = vec_bone_local.x * vec_bone2_local.y - vec_bone_local.y * vec_bone2_local.x;
    if(orientation_z > 0) r_z = 2*Math.PI - r_z;
    //if (vec_bone_local.z < vec_bone2_local.z) r_z = 2*Math.PI - r_z;

    let vec_bone_yz = new THREE.Vector3(0, vec_bone_local.y, vec_bone_local.z);
    let vec_bone2_yz = new THREE.Vector3(0, vec_bone2_local.y, vec_bone2_local.z);
    let r_x = vec_bone_yz.angleTo(vec_bone2_yz);
    let orientation_x = vec_bone_local.y * vec_bone2_local.z - vec_bone_local.z * vec_bone2_local.y;
    if(orientation_x > 0) r_x = 2*Math.PI - r_x;
    //if (vec_bone_local.x < vec_bone2_local.x) r_x = 2*Math.PI - r_x;

    let vec_bone_xz = new THREE.Vector3(vec_bone_local.x, 0, vec_bone_local.z);
    let vec_bone2_xz = new THREE.Vector3(vec_bone2_local.x, 0, vec_bone2_local.z);
    let r_y = vec_bone_xz.angleTo(vec_bone2_xz);
    let orientation_y = vec_bone_local.x * vec_bone2_local.z - vec_bone_local.z * vec_bone2_local.x;
    if(orientation_y > 0) r_y = 2*Math.PI - r_y;
    //if (vec_bone_local.y < vec_bone2_local.y) r_y = 2*Math.PI;*/

    //console.log(r_x, r_y, r_z);
    //console.log(joint.rotation);

    //joint.rotation.set(joint.rotation.x - r_x, joint.rotation.y - r_y, joint.rotation.z - r_z,"XYZ");
    //joint.rotation.x = joint.rotation.x + r_x;
    //joint.rotation.y = joint.rotation.y + r_y;
    //joint.rotation.z = joint.rotation.z + r_z;

    //console.log(joint.rotation);

    //let quat_pose_rot = new THREE.Quaternion();
    //quat_pose_rot.setFromUnitVectors(vec_bone2.clone().normalize(), vec_bone.clone().normalize());
    //joint.quaternion.rotateTowards(joint.worldToLocal(quat_pose_rot.clone()), 0.05);
    //joint.lookAt(joint.clone().worldToLocal(vec_bone.clone()).normalize());
    //joint.lookAt(vec_bone.clone().normalize());
    //joint.position.set(0,0,0);
    //joint.rotation.set(0,0,0,"XYZ");

    //console.log(vec_bone);
    //console.log(vec_bone2);
}

function updateSkeletonPose(skeleton) {
    skeleton.bones.forEach((bone) => {
        bone.updateMatrixWorld();
    });
}

function convertWorldToLocalDirection(worldDirection, object) {
    const localDirection = worldDirection.clone();
    object.matrixWorld.extractRotation(object.matrix);
    localDirection.applyMatrix4(object.matrixWorld);
    return localDirection;
}

function createLocalVectorWithSameDirection(worldVector, object) {
    const localVector = new THREE.Vector3();
    const rotationQuaternion = object.quaternion.clone();
    rotationQuaternion.invert();
    //rotationQuaternion.conjugate();
    localVector.copy(worldVector);
    localVector.applyQuaternion(rotationQuaternion);
    return localVector;
}

function createLocalVectorWithSameDirectionChild(worldVector, object) {
    const localVector = new THREE.Vector3();
    localVector.copy(worldVector);

    let i = 1;
    let parentObject = object;
    while (parentObject !== null && i <= 100) {
        const rotationQuaternion = parentObject.quaternion.clone();
        rotationQuaternion.invert();
        localVector.applyQuaternion(rotationQuaternion);

        parentObject = parentObject.parent;
        i++;
    }

    // Apply the final rotation to the localVector
    //const rotationQuaternion = object.quaternion.clone();
    //rotationQuaternion.invert();
    //localVector.applyQuaternion(rotationQuaternion);
    return localVector;
}

function createLocalVectorWithSameDirectionBone(worldVector, bone) {
    const localVector = new THREE.Vector3();
    const parentInverseMatrixWorld = new THREE.Matrix4();
    // Traverse up the bone hierarchy and accumulate the inverse transformations
    while (bone.parent) {
        parentInverseMatrixWorld.multiplyMatrices(bone.parent.matrixWorld, parentInverseMatrixWorld);
        bone = bone.parent;
    }
    const inverseMatrix = new THREE.Matrix4();
    inverseMatrix.copy(parentInverseMatrixWorld).invert();

    localVector.copy(worldVector);
    localVector.applyMatrix4(inverseMatrix);
    return localVector;
}

function setJointAnglesFromVects(joint, vec_parent_world, vec_child_world) {
    const vec_child_local = joint.parent.clone().worldToLocal(vec_child_world.clone());
    const vec_parent_local = joint.parent.clone().worldToLocal(vec_parent_world.clone());
    let quat_pose_rot = new THREE.Quaternion();
    quat_pose_rot.setFromUnitVectors(vec_parent_local.clone().normalize(), vec_child_local.clone().normalize());
    joint.quaternion.rotateTowards(quat_pose_rot.clone(), 0.05);
    //console.log(vec_child_world.normalize(), vec_parent_world.normalize())
    //joint.lookAt(vec_child_world.normalize());
    //joint.applyQuaternion(quat_pose_rot);



    /*
    x: 1.2470393180847168
    y: 2.881052405276197
    z: -1.2039990425109863

    x: 1.5709125995635986
    y: 3.232404944744516
    z: -2.2919580936431885
     */

    /*let position = new THREE.Vector3(1.247, 2.881, -1.204);
    let direction = position.clone().normalize();
    let pitch = Math.asin(-direction.y)// + bone.offset
    let yaw = Math.atan2(direction.x, -direction.z); //Beware cos(pitch)==0, catch this exception!
    let roll = Math.PI;
    joint.rotation.set(roll, yaw, pitch);

    let position2 = new THREE.Vector3(1.571, 3.232, -2.292);
    let direction2 = position2.clone().normalize();
    let pitch2 = Math.asin(-direction2.y)// + bone.offset
    let yaw2 = Math.atan2(direction2.x, -direction2.z); //Beware cos(pitch)==0, catch this exception!
    let roll2 = Math.PI;
    model.right_fore_arm.rotation.set(roll2, yaw2, pitch2);*/
}

animate();

setTimeout(setupPos, 1000)