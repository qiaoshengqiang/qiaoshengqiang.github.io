import * as THREE from 'three';
import {
  TAU, clamp, damp, makeNumberTexture, glowTexture, radialTexture,
  makeCanvas, canvasTexture,
} from './utils.js';

export const LIVERIES = [
  { id: 'ion', name: 'ION', main: '#19e6ff', accent: '#ff4bd8' },
  { id: 'nova', name: 'NOVA', main: '#ff3cac', accent: '#7dfff1' },
  { id: 'solar', name: 'SOLAR', main: '#ffb13d', accent: '#ff4a36' },
  { id: 'spectre', name: 'SPECTRE', main: '#e7edff', accent: '#8d6bff' },
];

export const RIVALS = [
  { name: 'NOVA', number: 12, main: '#ff3cac', accent: '#8cffee', skill: 1.02 },
  { name: 'VEGA', number: 3, main: '#ffb13d', accent: '#ff5847', skill: 0.99 },
  { name: 'KITE', number: 21, main: '#a8ff3e', accent: '#defcff', skill: 0.97 },
  { name: 'ECHO', number: 88, main: '#8d6bff', accent: '#ff9ee8', skill: 1.0 },
];

const wheelRadius = 0.34;

function capsuleZ(radius, length) {
  const geo = new THREE.CapsuleGeometry(radius, length, 5, 14);
  geo.rotateX(Math.PI / 2);
  return geo;
}

// ExtrudeGeometry bakes flat per-face normals, which makes bevelled shapes
// read as faceted low-poly blocks. Weld vertices that share a position and
// average their normals so the hull curves shade as one smooth surface.
function smoothNormals(geometry, precision = 4) {
  const pos = geometry.attributes.position;
  const norm = geometry.attributes.normal;
  const buckets = new Map();
  const key = (i) => pos.getX(i).toFixed(precision)
    + ',' + pos.getY(i).toFixed(precision)
    + ',' + pos.getZ(i).toFixed(precision);
  for (let i = 0; i < norm.count; i++) {
    const k = key(i);
    let bucket = buckets.get(k);
    if (!bucket) {
      bucket = [];
      buckets.set(k, bucket);
    }
    bucket.push(i);
  }
  for (const bucket of buckets.values()) {
    if (bucket.length < 2) continue;
    let x = 0, y = 0, z = 0;
    for (const i of bucket) {
      x += norm.getX(i); y += norm.getY(i); z += norm.getZ(i);
    }
    const len = Math.hypot(x, y, z) || 1;
    x /= len; y /= len; z /= len;
    for (const i of bucket) norm.setXYZ(i, x, y, z);
  }
  norm.needsUpdate = true;
  return geometry;
}

function makeShadowTexture() {
  const c = makeCanvas(128, 128);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(0,0,0,.72)');
  g.addColorStop(0.55, 'rgba(0,0,0,.35)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return canvasTexture(c);
}

let _shadowTexture = null;
let _underglowTexture = null;

function buildWheel(mainMat, rimMat, tireMat) {
  const group = new THREE.Group();
  const spin = new THREE.Group();
  group.add(spin);

  // Low-profile tyre with properly rounded shoulders, lathed from a profile
  // curve instead of a straight cylinder so the carcass reads as rubber.
  const profile = [
    [0.205, 0.17], [0.285, 0.17], [0.318, 0.13], [0.334, 0.06],
    [0.34, 0.0], [0.334, -0.06], [0.318, -0.13], [0.285, -0.17], [0.205, -0.17],
  ].map(([r, w]) => new THREE.Vector2(r, w));
  const tireGeo = new THREE.LatheGeometry(profile, 26);
  tireGeo.rotateZ(Math.PI / 2);
  spin.add(new THREE.Mesh(tireGeo, tireMat));

  // Rim barrel + outer lip ring; slightly concave ET so the face sits deep.
  const barrelGeo = new THREE.CylinderGeometry(0.205, 0.205, 0.3, 22, 1, true);
  barrelGeo.rotateZ(Math.PI / 2);
  spin.add(new THREE.Mesh(barrelGeo, rimMat));
  for (const x of [-0.145, 0.145]) {
    const lip = new THREE.Mesh(new THREE.TorusGeometry(0.198, 0.016, 5, 22), rimMat);
    lip.rotation.y = Math.PI / 2;
    lip.position.x = x;
    spin.add(lip);
  }

  // Spokes: seven slim blades fanned around the axle, plus a small hub nut.
  const spokeGeo = new THREE.BoxGeometry(0.05, 0.27, 0.055);
  for (let i = 0; i < 7; i++) {
    const holder = new THREE.Group();
    holder.rotation.x = (i / 7) * TAU;
    for (const x of [-0.115, 0.115]) {
      const spoke = new THREE.Mesh(spokeGeo, rimMat);
      spoke.position.set(x, 0.155, 0);
      spoke.rotation.x = i % 2 ? 0.05 : -0.05;
      holder.add(spoke);
    }
    spin.add(holder);
  }
  const hubGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.36, 12);
  hubGeo.rotateZ(Math.PI / 2);
  spin.add(new THREE.Mesh(hubGeo, rimMat));

  // Glowing brake discs peeking through the spokes.
  for (const side of [-1, 1]) {
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(0.15, 16),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(mainMat).multiplyScalar(1.15),
        toneMapped: false, transparent: true, opacity: 0.85,
      })
    );
    disc.rotation.y = side * Math.PI / 2;
    disc.position.x = side * 0.148;
    spin.add(disc);
  }
  return { group, spin };
}

// Shared hull silhouette: one smooth extruded side-profile is what separates
// a real car body from stacked primitives. Built once, reused by every car.
let _hullGeometry = null;
function hullGeometry() {
  if (_hullGeometry) return _hullGeometry;
  const shape = new THREE.Shape();
  // counter-clockwise in the (length, height) plane
  shape.moveTo(-2.14, 0.16);
  shape.lineTo(-1.2, 0.1);
  shape.quadraticCurveTo(0.1, 0.05, 1.6, 0.09);
  shape.lineTo(2.3, 0.12);
  shape.lineTo(2.42, 0.19);
  shape.quadraticCurveTo(2.66, 0.25, 2.44, 0.3);
  shape.quadraticCurveTo(2.15, 0.36, 1.6, 0.47);
  shape.quadraticCurveTo(1.05, 0.6, 0.35, 0.72);
  shape.quadraticCurveTo(-0.02, 0.81, -0.3, 0.63);
  shape.quadraticCurveTo(-0.62, 0.62, -1.4, 0.57);
  shape.quadraticCurveTo(-1.8, 0.6, -2.2, 0.52);
  shape.quadraticCurveTo(-2.44, 0.32, -2.14, 0.16);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 1.26, bevelEnabled: true,
    bevelThickness: 0.24, bevelSize: 0.15, bevelSegments: 7, curveSegments: 26,
  });
  geo.rotateY(-Math.PI / 2);
  geo.translate(0.63, 0, 0);
  smoothNormals(geo);
  geo.computeBoundingSphere();
  _hullGeometry = geo;
  return geo;
}

export function buildCar(options = {}) {
  const {
    main = '#19e6ff', accent = '#ff4bd8', number = 7,
    isPlayer = false, scale = 1,
  } = options;

  const root = new THREE.Group();
  root.name = isPlayer ? 'player-car' : 'rival-car';
  const body = new THREE.Group();
  body.rotation.order = 'YXZ';
  root.add(body);

  const paint = new THREE.MeshPhysicalMaterial({
    color: main, metalness: 0.46, roughness: 0.28,
    clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.7,
  });
  const paintDark = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(main).multiplyScalar(0.22), metalness: 0.5, roughness: 0.36,
    clearcoat: 0.9, clearcoatRoughness: 0.2, envMapIntensity: 1.2,
  });
  const carbon = new THREE.MeshStandardMaterial({
    color: 0x14161b, metalness: 0.52, roughness: 0.46, envMapIntensity: 1.05,
  });
  const dark = new THREE.MeshStandardMaterial({ color: 0x05090c, metalness: 0.35, roughness: 0.62 });
  const accentMat = new THREE.MeshBasicMaterial({
    color: new THREE.Color(accent).multiplyScalar(1.45), toneMapped: false,
  });
  const headlightMat = new THREE.MeshBasicMaterial({ color: '#efffff', toneMapped: false });
  const tailMat = new THREE.MeshBasicMaterial({ color: '#ff2e22', toneMapped: false });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x07131f, metalness: 0.6, roughness: 0.06, transparent: true, opacity: 0.86,
    clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 2.6, side: THREE.DoubleSide,
  });
  const tireMat = new THREE.MeshStandardMaterial({ color: 0x070a0d, roughness: 0.94, metalness: 0.06 });
  const rimMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(accent).multiplyScalar(0.55), roughness: 0.26, metalness: 0.98 });

  const chassis = new THREE.Mesh(capsuleZ(0.42, 2.55), paint);
  chassis.scale.set(1.34, 0.58, 1.0);
  chassis.position.set(0, 0.5, 0.08);
  body.add(chassis);

  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.25, 4), paint);
  nose.geometry.rotateY(Math.PI / 4);
  nose.geometry.rotateX(Math.PI / 2);
  nose.scale.set(1.25, 0.48, 0.7);
  nose.position.set(0, 0.43, 1.66);
  body.add(nose);

  const spine = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.035, 2.0), accentMat);
  spine.position.set(0, 0.78, -0.06);
  body.add(spine);

  const cockpit = new THREE.Mesh(
    new THREE.SphereGeometry(0.46, 18, 12, 0, TAU, 0, Math.PI / 2),
    glass
  );
  cockpit.scale.set(1.07, 0.68, 1.55);
  cockpit.position.set(0, 0.68, 0.18);
  body.add(cockpit);

  const cockpitRim = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.025, 4, 20, Math.PI), accentMat);
  cockpitRim.rotation.x = -Math.PI / 2;
  cockpitRim.rotation.z = Math.PI;
  cockpitRim.position.set(0, 0.71, 0.47);
  cockpitRim.scale.set(1.07, 1.5, 1);
  body.add(cockpitRim);

  for (const side of [-1, 1]) {
    const pod = new THREE.Mesh(capsuleZ(0.2, 1.55), paintDark);
    pod.scale.set(1, 0.65, 1.2);
    pod.position.set(side * 0.8, 0.38, -0.12);
    body.add(pod);
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.04, 1.25), accentMat);
    strip.position.set(side * 0.99, 0.42, -0.18);
    body.add(strip);
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.24, 0.5), accentMat);
    fin.position.set(side * 1.0, 0.48, -1.0);
    fin.rotation.z = side * -0.2;
    body.add(fin);
  }

  const frontWing = new THREE.Mesh(new THREE.BoxGeometry(1.98, 0.065, 0.45), paintDark);
  frontWing.position.set(0, 0.2, 1.77);
  body.add(frontWing);
  const frontLip = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.035, 0.08), accentMat);
  frontLip.position.set(0, 0.19, 1.97);
  body.add(frontLip);
  for (const side of [-1, 1]) {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.22, 0.46), paint);
    endplate.position.set(side * 0.995, 0.28, 1.78);
    body.add(endplate);
    const canard = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.035, 0.18), paintDark);
    canard.position.set(side * 0.8, 0.3, 1.5);
    canard.rotation.z = side * -0.25;
    body.add(canard);
  }

  const wing = new THREE.Mesh(new THREE.BoxGeometry(2.02, 0.075, 0.5), paintDark);
  wing.position.set(0, 1.02, -1.46);
  body.add(wing);
  const wingNeon = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.025, 0.06), accentMat);
  wingNeon.position.set(0, 1.06, -1.7);
  body.add(wingNeon);
  for (const side of [-1, 1]) {
    const endplate = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.38, 0.56), paint);
    endplate.position.set(side * 0.995, 0.88, -1.48);
    body.add(endplate);
    const support = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.46, 0.1), dark);
    support.position.set(side * 0.58, 0.76, -1.42);
    body.add(support);
  }
  const tailFin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.33, 0.6), paint);
  tailFin.position.set(0, 0.86, -1.35);
  tailFin.rotation.x = -0.15;
  body.add(tailFin);

  const diffuser = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.15, 0.45), dark);
  diffuser.position.set(0, 0.2, -1.63);
  body.add(diffuser);

  const tailBar = new THREE.Mesh(new THREE.BoxGeometry(1.34, 0.055, 0.035), tailMat);
  tailBar.position.set(0, 0.58, -1.72);
  body.add(tailBar);

  for (const side of [-1, 1]) {
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.035), headlightMat);
    head.position.set(side * 0.47, 0.53, 1.82);
    head.rotation.x = -0.15;
    body.add(head);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glowTexture(), color: '#bffcff', transparent: true, opacity: 0.5,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
    }));
    glow.scale.set(0.65, 0.4, 1);
    glow.position.set(side * 0.47, 0.53, 1.86);
    body.add(glow);
  }
  const tailGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: '#ff3a2e', transparent: true, opacity: 0.55,
    blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
  }));
  tailGlow.scale.set(1.6, 0.5, 1);
  tailGlow.position.set(0, 0.58, -1.76);
  body.add(tailGlow);

  for (const side of [-1, 1]) {
    const exhaust = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.115, 0.22, 8),
      new THREE.MeshStandardMaterial({ color: 0x2f353a, metalness: 0.95, roughness: 0.2 })
    );
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(side * 0.34, 0.36, -1.78);
    body.add(exhaust);
    const exhaustGlow = new THREE.Mesh(new THREE.CircleGeometry(0.08, 10), accentMat);
    exhaustGlow.position.set(side * 0.34, 0.36, -1.895);
    exhaustGlow.rotation.y = Math.PI;
    body.add(exhaustGlow);
  }

  const wheels = [];
  const steering = [];
  for (const side of [-1, 1]) {
    for (const front of [1, -1]) {
      const pivot = new THREE.Group();
      pivot.position.set(side * 0.89, 0.34, front * 1.14);
      const wheel = buildWheel(accent, rimMat, tireMat);
      pivot.add(wheel.group);
      body.add(pivot);
      wheels.push(wheel.spin);
      if (front === 1) steering.push(pivot);
    }
  }

  const numberTex = makeNumberTexture(number, accent);
  const numberPlate = new THREE.Mesh(
    new THREE.PlaneGeometry(0.72, 0.72),
    new THREE.MeshBasicMaterial({ map: numberTex, transparent: true, depthWrite: false, toneMapped: false })
  );
  numberPlate.geometry.rotateX(-Math.PI / 2);
  numberPlate.geometry.rotateY(Math.PI);
  numberPlate.position.set(0, 0.79, 0.96);
  body.add(numberPlate);

  if (_shadowTexture == null) {
    _shadowTexture = makeShadowTexture();
    _shadowTexture.userData.shared = true;
  }
  if (_underglowTexture == null) {
    _underglowTexture = radialTexture('rgba(255,255,255,.85)', 'rgba(255,255,255,0)', 256);
    _underglowTexture.userData.shared = true;
  }
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.25, 4.9),
    new THREE.MeshBasicMaterial({
      map: _shadowTexture, transparent: true, opacity: 0.7,
      depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2,
    })
  );
  shadow.geometry.rotateX(-Math.PI / 2);
  shadow.position.y = 0.035;
  shadow.renderOrder = 2;
  root.add(shadow);

  const underglow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.1, 5.6),
    new THREE.MeshBasicMaterial({
      map: _underglowTexture, color: accent, transparent: true, opacity: 0.32,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false,
      polygonOffset: true, polygonOffsetFactor: -1,
    })
  );
  underglow.geometry.rotateX(-Math.PI / 2);
  underglow.position.y = 0.045;
  underglow.renderOrder = 3;
  root.add(underglow);

  root.userData = {
    body,
    wheels,
    steering,
    accentMat,
    tailMat,
    underglow,
    shadow,
    numberPlate,
    wheelSpin: 0,
    steerVisual: 0,
    roll: 0,
    pitch: 0,
    paint,
    paintDark,
    rimMat,
    isPlayer,
  };
  root.scale.setScalar(scale);
  return root;
}

const _basis = new THREE.Matrix4();
const _forward = new THREE.Vector3();
const _up = new THREE.Vector3();
const _slipQuat = new THREE.Quaternion();
const _localUp = new THREE.Vector3(0, 1, 0);

export function updateCarVisual(car, track, u, s, data, dt, elapsed) {
  const {
    steer = 0, latVel = 0, latAccel = 0, speed = 0,
    throttle = 0, brake = 0, drifting = false,
  } = data;
  const sm = track.sample(u, s);
  car.position.copy(sm.position).addScaledVector(sm.up, 0.015);
  _basis.makeBasis(sm.lateral, sm.up, sm.forward);
  car.quaternion.setFromRotationMatrix(_basis);

  // The car points along its actual velocity, so a slide visibly angles the
  // nose toward the outside of the corner instead of feeling glued to rails.
  const speedAbs = Math.abs(speed);
  const slip = speedAbs > 0.8
    ? clamp(Math.atan2(latVel, Math.max(7.5, speedAbs)), -0.62, 0.62)
    : 0;
  if (Math.abs(slip) > 0.0004) {
    _slipQuat.setFromAxisAngle(_localUp, slip);
    car.quaternion.multiply(_slipQuat);
  }

  const ud = car.userData;
  const speedFactor = clamp(speedAbs / 54, 0, 1);

  ud.steerVisual = damp(ud.steerVisual, steer, 10, dt);
  const yawTarget = -ud.steerVisual * (drifting ? 0.4 : 0.2);
  const rollTarget = (
    -ud.steerVisual * 0.12 + clamp(latAccel * 0.0022, -0.13, 0.13)
  ) * (0.35 + speedFactor * 0.65);
  const pitchTarget = (brake > 0 ? 0.04 : throttle > 0 ? -0.024 : 0) * speedFactor;

  ud.roll = damp(ud.roll, rollTarget, 5.5, dt);
  ud.pitch = damp(ud.pitch, pitchTarget, 6, dt);
  ud.body.rotation.set(ud.pitch, yawTarget, ud.roll);
  ud.body.position.y = Math.sin(elapsed * 19 + u * 13) * 0.0035 * speedFactor;

  ud.wheelSpin += (speed * dt) / wheelRadius;
  for (const wheel of ud.wheels) wheel.rotation.x = ud.wheelSpin;
  for (const pivot of ud.steering) pivot.rotation.y = -ud.steerVisual * 0.38;

  ud.underglow.material.opacity = 0.22 + speedFactor * 0.22 + (drifting ? 0.08 : 0);
  ud.tailMat.color.setRGB(1, 0.16, 0.12).multiplyScalar(brake > 0 ? 4.5 : 1.6);
  ud.forward = sm.forward;
  ud.up = sm.up;
  ud.lateral = sm.lateral;
  ud.metric = sm.metric;
  ud.slip = slip;
  return sm;
}

export class PlayerCar {
  constructor(track, livery, startGrid) {
    this.track = track;
    this.livery = livery;
    this.mesh = buildCar({ main: livery.main, accent: livery.accent, number: 7, isPlayer: true });
    this.u = 0;
    this.s = 0;
    this.speed = 0;
    this.lateralVel = 0;
    this.latAccel = 0;
    this.steerInput = 0;
    this.nitro = 62;
    this.usingNitro = false;
    this.drifting = false;
    this.steerVisual = 0;
    this.throttle = 0;
    this.brake = 0;
    this.wallCooldown = 0;
    this.collisionCooldown = 0;
    this.padKick = 0;
    this.finished = false;
    this.finishTime = 0;
    this.lap = 1;
    this.lastU = 0;
    this.reset(startGrid);
  }

  reset(grid) {
    this.u = grid.u;
    this.s = grid.s;
    this.speed = 0;
    this.lateralVel = 0;
    this.latAccel = 0;
    this.steerInput = 0;
    this.nitro = 62;
    this.usingNitro = false;
    this.drifting = false;
    this.steerVisual = 0;
    this.throttle = 0;
    this.brake = 0;
    this.wallCooldown = 0;
    this.collisionCooldown = 0;
    this.padKick = 0;
    this.finished = false;
    this.finishTime = 0;
    this.lap = 1;
    this.lastU = this.u;
    updateCarVisual(this.mesh, this.track, this.u, this.s, {}, 0, 0);
  }

  applyPadBoost() {
    this.nitro = Math.min(100, this.nitro + 24);
    this.speed = Math.min(this.speed + 6.5, 78);
    this.padKick = 1.15;
  }

  bump(intensity = 1) {
    this.speed *= clamp(1 - 0.12 * intensity, 0.7, 0.98);
    this.collisionCooldown = 0.5;
  }

  update(dt, input, raceActive, elapsed) {
    const tr = this.track;
    this.usingNitro = raceActive && input.nitro && this.nitro > 0.5 && input.throttle > 0.05 && this.speed > 7;
    if (this.usingNitro) {
      this.nitro = Math.max(0, this.nitro - 32 * dt);
    } else {
      const rate = (input.drift && this.speed > 15 ? 9 : 4.2) * (raceActive ? 1 : 0);
      this.nitro = Math.min(100, this.nitro + rate * dt);
    }
    this.drifting = raceActive && input.drift && this.speed > 13 && input.throttle > 0.1;
    this.throttle = raceActive ? input.throttle : 0;
    this.brake = raceActive ? input.brake : 0;
    const steer = raceActive ? input.steer : 0;

    const maxSpeed = 54 * (this.usingNitro ? 1.36 : 1);
    const accelBase = this.usingNitro ? 38 : 27;
    const throttle = this.throttle;
    const brake = this.brake;

    if (throttle > 0.02) {
      const accel = accelBase * throttle * (1 - clamp(Math.max(0, this.speed) / (maxSpeed + 8), 0, 0.86));
      this.speed += accel * dt;
    }
    if (brake > 0.02) {
      if (this.speed > 0.4) this.speed -= 56 * brake * dt;
      else this.speed -= 17 * brake * dt;
    }
    if (throttle < 0.02 && brake < 0.02) {
      this.speed -= (1.3 + Math.abs(this.speed) * 0.035) * dt * (this.speed > 0 ? 1 : -1);
      if (Math.abs(this.speed) < 0.3) this.speed = 0;
    }
    if (this.speed > maxSpeed + this.padKick * 9) {
      this.speed = damp(this.speed, maxSpeed, 1.2, dt);
    }
    this.speed = clamp(this.speed, -9, 80);
    this.padKick = Math.max(0, this.padKick - dt * 0.85);

    const speedAbs = Math.abs(this.speed);
    const speedFactor = clamp(speedAbs / 54, 0, 1.3);
    const sm = tr.sample(this.u, this.s);
    const metric = Math.max(1, sm.metric);
    const curvature = tr.curvatureAt(this.u, this.s);

    // Steering is a lateral force, not a position target. The curved surface
    // pushes the car toward the outside of every bend, so holding a line
    // through a corner always costs steering input and, in the tight ones,
    // speed. Drift deliberately trades lateral grip for rotation.
    this.steerInput = damp(this.steerInput, steer, this.drifting ? 15 : 11, dt);
    const steerForce = 49
      * clamp(speedAbs / 7, 0, 1)
      * (this.drifting ? 1.12 : 1)
      * (1 - clamp(speedAbs / 240, 0, 0.1));
    const centerAccel = -curvature * this.speed * speedAbs * 0.82;
    const grip = this.drifting ? 1.85 : 4.2;
    this.latAccel = centerAccel - this.steerInput * steerForce - this.lateralVel * grip;
    this.lateralVel = clamp(this.lateralVel + this.latAccel * dt, -20, 20);
    this.s += this.lateralVel * dt;
    this.speed -= Math.abs(this.lateralVel) * (this.drifting ? 0.04 : 0.062) * dt;

    this.lastU = this.u;
    if (raceActive) this.u += (this.speed * dt) / metric;

    let wallImpact = 0;
    const limit = tr.limitAt(this.u);
    if (Math.abs(this.s) > limit) {
      const sign = Math.sign(this.s);
      this.s = sign * limit;
      wallImpact = Math.abs(this.lateralVel);
      this.lateralVel = -sign * Math.min(5, Math.abs(this.lateralVel) * 0.3 + 1.15);
      if (this.wallCooldown <= 0) {
        this.speed *= clamp(1 - wallImpact * 0.02, 0.6, 0.98);
        this.wallCooldown = 0.26;
      }
    }

    const island = tr.islandHalfAt(this.u);
    if (island > 0.1 && Math.abs(this.s) < island) {
      const side = this.s > 0.001 ? 1
        : this.s < -0.001 ? -1
          : (this.lateralVel >= 0 ? 1 : -1);
      this.s = side * (island + 0.02);
      wallImpact = Math.max(wallImpact, Math.abs(this.lateralVel) + 1.5);
      this.lateralVel = side * Math.min(4, Math.abs(this.lateralVel) * 0.24 + 1.1);
      if (this.wallCooldown <= 0) {
        this.speed *= 0.82;
        this.wallCooldown = 0.3;
      }
    }

    this.wallCooldown = Math.max(0, this.wallCooldown - dt);
    this.collisionCooldown = Math.max(0, this.collisionCooldown - dt);

    updateCarVisual(this.mesh, tr, this.u, this.s, {
      steer: this.steerInput, latVel: this.lateralVel, latAccel: this.latAccel,
      speed: this.speed, throttle: this.throttle, brake: this.brake,
      drifting: this.drifting,
    }, dt, elapsed);

    return {
      wallImpact, speedFactor, speed: this.speed, u: this.u, s: this.s,
      curvature, lateralVel: this.lateralVel,
    };
  }

  get forward() {
    _forward.set(0, 0, 1).applyQuaternion(this.mesh.quaternion);
    return _forward;
  }

  get up() {
    _up.set(0, 1, 0).applyQuaternion(this.mesh.quaternion);
    return _up;
  }
}

export class RivalCar {
  constructor(track, config, startGrid, aiSkill) {
    this.track = track;
    this.config = config;
    this.mesh = buildCar({ main: config.main, accent: config.accent, number: config.number });
    this.u = startGrid.u;
    this.s = startGrid.s;
    this.speed = 0;
    this.lateralVel = 0;
    this.latAccel = 0;
    this.steerInput = 0;
    this.baseSkill = aiSkill;
    this.targetS = startGrid.s;
    this.lanePhase = config.number * 0.7 + Math.random() * 1.5;
    this.steerVisual = 0;
    this.branchChoice = new Map();
    this.activeBranchSide = 1;
    this.reaction = 0.18 + Math.random() * 0.5;
    this.finished = false;
    this.finishTime = 0;
    this.lap = 1;
    this.lastU = this.u;
    this.lastS = this.s;
    updateCarVisual(this.mesh, track, this.u, this.s, {}, 0, 0);
  }

  reset(grid) {
    this.u = grid.u;
    this.s = grid.s;
    this.speed = 0;
    this.lateralVel = 0;
    this.latAccel = 0;
    this.steerInput = 0;
    this.targetS = grid.s;
    this.branchChoice.clear();
    this.activeBranchSide = grid.s >= 0 ? 1 : -1;
    this.finished = false;
    this.finishTime = 0;
    this.lap = 1;
    this.lastU = this.u;
    this.lastS = this.s;
    updateCarVisual(this.mesh, this.track, this.u, this.s, {}, 0, 0);
  }

  update(dt, raceTime, player, difficulty, raceActive, elapsed) {
    const tr = this.track;
    if (!raceActive || raceTime < this.reaction) {
      updateCarVisual(this.mesh, tr, this.u, this.s, { speed: 0 }, dt, elapsed);
      return;
    }

    const difficultyMul = difficulty === 0 ? 0.9 : difficulty === 2 ? 1.09 : 1.0;
    const gripBase = (tr.config.aiGrip || 40) * (difficulty === 0 ? 0.9 : difficulty === 2 ? 1.14 : 1);
    const baseLimit = tr.halfWidth - 1.3;
    const sm = tr.sample(this.u, this.s);
    const metric = Math.max(1, sm.metric);

    // Corner-speed planning: scan far enough ahead that the AI brakes before
    // the tight stuff instead of arriving sideways. Each sample contributes a
    // maximum entry speed from the available grip and braking distance.
    let allowed = 999;
    const horizon = 0.18 + Math.min(0.9, Math.max(0, this.speed) * 0.015);
    for (let i = 0; i <= 8; i++) {
      const du = (i / 8) * horizon;
      const k = Math.abs(tr.curvatureAt(this.u + du, this.s));
      const radius = k > 0.00001 ? 1 / k : 9999;
      const cornerSpeed = Math.sqrt(gripBase * radius);
      const distance = du * metric;
      allowed = Math.min(allowed, Math.sqrt(cornerSpeed * cornerSpeed + 2 * 22 * distance));
    }

    const base = tr.config.aiBase * this.baseSkill * this.config.skill;
    const rubber = clamp((player.u - this.u) * 5.2, -3.0, 4.6)
      * (difficulty === 2 ? 1.1 : difficulty === 0 ? 0.7 : 0.95);
    const target = Math.min(base * difficultyMul + rubber, allowed + 2.2)
      + Math.sin(elapsed * 0.9 + this.lanePhase) * 0.8;
    const targetSpeed = this.finished ? target * 0.62 : target;
    this.speed = damp(this.speed, targetSpeed, targetSpeed < this.speed ? 2.1 : 1.05, dt);

    // Lane choice: weave, avoid the player, and commit to one side of a fork
    // early enough to clear the median. The commit starts well before the
    // tarmac widens; waiting until the island appears forces a high-speed car
    // to scrape the median because cornering grip is already spent.
    let laneTarget = Math.sin(this.u * 1.15 + this.lanePhase) * baseLimit * 0.24;
    let laneDamp = 2.4;
    const du = player.u - this.u;
    if (du > 0.006 && du < 0.085 && Math.abs(player.s - this.s) < 3.4) {
      laneTarget = player.s > 0 ? -baseLimit * 0.52 : baseLimit * 0.52;
      laneDamp = 3.2;
    }

    const ahead = tr.branchInfoAt(this.u, 1.15);
    if (ahead) {
      const key = ahead.u.toFixed(3);
      if (!this.branchChoice.has(key)) {
        const boostSide = ahead.padSide || 1;
        const wantsBoost = Math.random() < (difficulty === 2 ? 0.82 : difficulty === 1 ? 0.58 : 0.38);
        this.branchChoice.set(key, wantsBoost ? boostSide : -boostSide);
      }
      let branchSide = this.branchChoice.get(key);
      // Once the median is physically between us and the chosen lane, accept
      // the side we are already on instead of fighting the barrier all the
      // way through the fork.
      if (ahead.island > 0.12 && Math.abs(this.s) > ahead.island + 0.06) {
        const currentSide = this.s >= 0 ? 1 : -1;
        if (currentSide !== branchSide) {
          branchSide = currentSide;
          this.branchChoice.set(key, currentSide);
        }
      }
      if (ahead.delta < ahead.len * 0.5 + 0.8 || ahead.weight > 0.01) {
        this.activeBranchSide = branchSide;
        laneTarget = ahead.weight > 0.01
          ? tr.laneCenterAt(this.u, branchSide)
          : branchSide * Math.max(tr.limitAt(this.u) * 0.62, Math.abs(tr.laneCenterAt(this.u, branchSide)));
        laneDamp = 4.6;
      }
    }

    const laneLimit = tr.limitAt(this.u);
    laneTarget = clamp(laneTarget, -laneLimit + 0.8, laneLimit - 0.8);
    this.targetS = damp(this.targetS, laneTarget, laneDamp, dt);

    const curvature = tr.curvatureAt(this.u, this.s);
    const centerAccel = -curvature * this.speed * Math.abs(this.speed) * 0.82;
    const desiredVel = clamp((this.targetS - this.s) * 2.7, -10, 10);
    const steerForce = 49 * clamp(this.speed / 7, 0, 1) * 0.96;
    const needed = (desiredVel - this.lateralVel) * 4.2 - centerAccel;
    const steer = clamp(-needed / Math.max(12, steerForce), -1, 1);
    this.steerInput = damp(this.steerInput, steer, 12, dt);
    this.latAccel = centerAccel - this.steerInput * steerForce - this.lateralVel * 4.5;
    this.lateralVel = clamp(this.lateralVel + this.latAccel * dt, -16, 16);
    const prevS = this.s;
    this.s += this.lateralVel * dt;
    this.speed -= Math.abs(this.lateralVel) * 0.045 * dt;

    this.lastU = this.u;
    if (raceActive) this.u += (this.speed * dt) / metric;
    this.lastS = prevS;

    const limit = tr.limitAt(this.u);
    if (Math.abs(this.s) > limit) {
      const sign = Math.sign(this.s);
      this.s = sign * limit;
      this.lateralVel = -sign * Math.min(4, Math.abs(this.lateralVel) * 0.22 + 0.8);
      this.speed *= 0.92;
    }
    const island = tr.islandHalfAt(this.u);
    if (island > 0.1 && Math.abs(this.s) < island) {
      const side = this.s >= 0 ? 1 : -1;
      this.activeBranchSide = side;
      if (ahead) this.branchChoice.set(ahead.u.toFixed(3), side);
      this.s = side * (island + 0.06);
      this.lateralVel = side * Math.min(3, Math.abs(this.lateralVel) * 0.22 + 0.7);
      this.speed *= 0.94;
    }

    if (!this.finished && this.u >= TAU * 3) {
      this.finished = true;
      this.finishTime = raceTime;
    }

    updateCarVisual(this.mesh, tr, this.u, this.s, {
      steer: this.steerInput, latVel: this.lateralVel, latAccel: this.latAccel,
      speed: this.speed, throttle: 1, brake: targetSpeed < this.speed - 2 ? 0.6 : 0,
      drifting: Math.abs(this.lateralVel) > 5.5 && this.speed > 20,
    }, dt, elapsed);
  }
}
