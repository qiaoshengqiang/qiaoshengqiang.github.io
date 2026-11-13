/* ============================================================
   NEON RUNNER // effects: particles, rain, skidmarks, speed lines
   ============================================================ */
(function (NR) {
  'use strict';

  const TAU = Math.PI * 2;

  function ParticlePool(scene, opts) {
    opts = opts || {};
    const n = opts.count || 200;
    const additive = opts.additive !== false;
    const positions = new Float32Array(n * 3);
    const colors = new Float32Array(n * 3);
    const sizes = new Float32Array(n);
    const alphas = new Float32Array(n);
    const vel = new Float32Array(n * 3);
    const life = new Float32Array(n);
    const maxLife = new Float32Array(n);
    const drag = new Float32Array(n);
    const gravity = new Float32Array(n);
    const baseSize = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      positions[i * 3 + 1] = -9999;
      alphas[i] = 0;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1));
    geo.setDrawRange(0, n);
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, depthTest: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { uOpacity: { value: opts.opacity == null ? 1 : opts.opacity } },
      vertexShader: `
        attribute vec3 aColor;
        attribute float aSize;
        attribute float aAlpha;
        varying vec3 vColor;
        varying float vAlpha;
        void main() {
          vColor = aColor;
          vAlpha = aAlpha;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (210.0 / max(0.5, -mv.z));
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uOpacity;
        void main() {
          vec2 p = gl_PointCoord - vec2(0.5);
          float d = length(p);
          if (d > 0.5) discard;
          float a = smoothstep(0.5, 0.02, d);
          gl_FragColor = vec4(vColor, a * vAlpha * uOpacity);
        }`
    });
    const points = new THREE.Points(geo, mat);
    points.frustumCulled = false;
    points.renderOrder = 5;
    scene.add(points);
    let cursor = 0;

    function spawn(x, y, z, vx, vy, vz, r, g, b, size, lifeSec, grav, dragK) {
      const i = cursor;
      cursor = (cursor + 1) % n;
      positions[i * 3] = x; positions[i * 3 + 1] = y; positions[i * 3 + 2] = z;
      vel[i * 3] = vx; vel[i * 3 + 1] = vy; vel[i * 3 + 2] = vz;
      colors[i * 3] = r; colors[i * 3 + 1] = g; colors[i * 3 + 2] = b;
      baseSize[i] = size; sizes[i] = size;
      life[i] = lifeSec; maxLife[i] = lifeSec;
      alphas[i] = 1;
      gravity[i] = grav == null ? 0 : grav;
      drag[i] = dragK == null ? 0 : dragK;
    }

    function update(dt) {
      for (let i = 0; i < n; i++) {
        if (life[i] <= 0) {
          if (alphas[i] !== 0) alphas[i] = 0;
          continue;
        }
        life[i] -= dt;
        if (life[i] <= 0) { alphas[i] = 0; positions[i * 3 + 1] = -9999; continue; }
        const t = life[i] / maxLife[i];
        const k = Math.max(0, 1 - drag[i] * dt);
        vel[i * 3] *= k; vel[i * 3 + 2] *= k;
        vel[i * 3 + 1] = vel[i * 3 + 1] * k + gravity[i] * dt;
        positions[i * 3] += vel[i * 3] * dt;
        positions[i * 3 + 1] += vel[i * 3 + 1] * dt;
        positions[i * 3 + 2] += vel[i * 3 + 2] * dt;
        alphas[i] = t * t;
        sizes[i] = baseSize[i] * (.7 + .5 * (1 - t));
      }
      geo.attributes.position.needsUpdate = true;
      geo.attributes.aColor.needsUpdate = true;
      geo.attributes.aSize.needsUpdate = true;
      geo.attributes.aAlpha.needsUpdate = true;
    }

    return { spawn, update, points, mat, count: n };
  }

  function buildEffects(scene, camera, track) {
    const fx = {
      time: 0,
      trauma: 0,
      hitFlash: 0,
      driftAccum: 0,
      dustAccum: 0,
      boostAccum: 0,
      skidCursor: 0
    };

    const sparks = ParticlePool(scene, { count: 360, additive: true, opacity: 1 });
    const smoke = ParticlePool(scene, { count: 260, additive: false, opacity: .34 });
    const glowDust = ParticlePool(scene, { count: 160, additive: true, opacity: .55 });

    /* ---------- rain ---------- */
    const rainCount = NR.LOW_POWER ? 320 : 700;
    const rainPositions = new Float32Array(rainCount * 6);
    const rainDrops = [];
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.LineBasicMaterial({
      color: 0x9fe8ff, transparent: true, opacity: .24,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const rain = new THREE.LineSegments(rainGeo, rainMat);
    rain.frustumCulled = false;
    scene.add(rain);
    for (let i = 0; i < rainCount; i++) {
      rainDrops.push({
        x: NR.rand(-42, 42), y: NR.rand(-8, 34), z: NR.rand(-46, 20),
        len: NR.rand(1.2, 4.6), speed: NR.rand(38, 62)
      });
    }
    function updateRain(dt) {
      const cx = camera.position.x, cy = camera.position.y, cz = camera.position.z;
      for (let i = 0; i < rainCount; i++) {
        const d = rainDrops[i];
        d.y -= d.speed * dt;
        d.x -= 5 * dt;
        if (d.y < -10) { d.y = 32 + Math.random() * 12; d.x = NR.rand(-42, 42); d.z = NR.rand(-46, 20); }
        if (d.x < -46) d.x += 92;
        const o = i * 6;
        rainPositions[o] = cx + d.x;
        rainPositions[o + 1] = cy + d.y;
        rainPositions[o + 2] = cz + d.z;
        rainPositions[o + 3] = cx + d.x + .18;
        rainPositions[o + 4] = cy + d.y - d.len;
        rainPositions[o + 5] = cz + d.z + .06;
      }
      rainGeo.attributes.position.needsUpdate = true;
    }

    /* ---------- camera-space speed lines ---------- */
    const lineCount = NR.LOW_POWER ? 40 : 90;
    const linePositions = new Float32Array(lineCount * 6);
    const lineData = [];
    for (let i = 0; i < lineCount; i++) {
      lineData.push({
        x: NR.rand(-28, 28), y: NR.rand(-15, 15), z: NR.rand(-80, -2),
        len: NR.rand(3, 14), speedK: NR.rand(.6, 1.4)
      });
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xbdf6ff, transparent: true, opacity: 0,
      blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
    });
    const speedLines = new THREE.LineSegments(lineGeo, lineMat);
    speedLines.frustumCulled = false;
    speedLines.renderOrder = 8;
    camera.add(speedLines);
    function updateSpeedLines(dt, speed, boosting) {
      const sp = Math.abs(speed);
      const vis = NR.smoothstep(24, 78, sp) * .45 + (boosting ? .32 : 0);
      lineMat.opacity = vis;
      if (vis <= .01) return;
      for (let i = 0; i < lineCount; i++) {
        const d = lineData[i];
        d.z += (sp * 1.6 * d.speedK + 12) * dt;
        if (d.z > 3) {
          d.z = -85 - Math.random() * 30;
          d.x = NR.rand(-30, 30); d.y = NR.rand(-16, 16);
        }
        const o = i * 6;
        linePositions[o] = d.x; linePositions[o + 1] = d.y; linePositions[o + 2] = d.z;
        linePositions[o + 3] = d.x; linePositions[o + 4] = d.y; linePositions[o + 5] = d.z - d.len;
      }
      lineGeo.attributes.position.needsUpdate = true;
    }

    /* ---------- skid marks ---------- */
    const SKID_MAX = 700;
    const skidPositions = new Float32Array(SKID_MAX * 4 * 3);
    const skidIndices = [];
    for (let i = 0; i < SKID_MAX; i++) {
      const b = i * 4;
      skidIndices.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
    const skidGeo = new THREE.BufferGeometry();
    skidGeo.setAttribute('position', new THREE.BufferAttribute(skidPositions, 3));
    skidGeo.setIndex(skidIndices);
    const skidMat = new THREE.MeshBasicMaterial({
      color: 0x03050a, transparent: true, opacity: .52, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide
    });
    const skids = new THREE.Mesh(skidGeo, skidMat);
    skids.frustumCulled = false;
    skids.renderOrder = 1;
    scene.add(skids);
    let skidCursor = 0;
    const lastSkid = [null, null];
    function addSkidSegment(from, to, width) {
      if (!from || !to) return;
      const dx = to.x - from.x, dz = to.z - from.z;
      const len = Math.hypot(dx, dz);
      if (len < .05) return;
      const nx = -dz / len * width * .5, nz = dx / len * width * .5;
      const i = skidCursor;
      skidCursor = (skidCursor + 1) % SKID_MAX;
      const o = i * 12;
      skidPositions[o] = from.x + nx; skidPositions[o + 1] = from.y; skidPositions[o + 2] = from.z + nz;
      skidPositions[o + 3] = from.x - nx; skidPositions[o + 4] = from.y; skidPositions[o + 5] = from.z - nz;
      skidPositions[o + 6] = to.x + nx; skidPositions[o + 7] = to.y; skidPositions[o + 8] = to.z + nz;
      skidPositions[o + 9] = to.x - nx; skidPositions[o + 10] = to.y; skidPositions[o + 11] = to.z - nz;
      skidGeo.attributes.position.needsUpdate = true;
    }

    /* ---------- API ---------- */
    const v = new THREE.Vector3();
    const v2 = new THREE.Vector3();

    fx.spawnImpact = function (pos, normal, strength) {
      const n = NR.clamp(Math.round(18 + strength * 30), 10, 70);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * TAU, b = Math.random() * Math.PI;
        const sp = NR.rand(2, 8) * (0.6 + strength);
        const vx = Math.cos(a) * Math.sin(b) * sp + (normal ? normal.x * 2 : 0);
        const vy = Math.abs(Math.cos(b)) * sp * .8 + 1;
        const vz = Math.sin(a) * Math.sin(b) * sp + (normal ? normal.z * 2 : 0);
        const warm = Math.random() < .5;
        sparks.spawn(pos.x, pos.y, pos.z, vx, vy, vz,
          warm ? 1 : .4, warm ? .55 : .9, warm ? .15 : 1, NR.rand(.25, .7), NR.rand(.25, .7), -14, .6);
      }
      // impact glow
      for (let i = 0; i < 10; i++) {
        sparks.spawn(pos.x, pos.y + .2, pos.z, NR.rand(-1, 1), NR.rand(0, 2), NR.rand(-1, 1),
          .6, .95, 1, NR.rand(1.2, 3), NR.rand(.2, .45), 0, 1);
      }
      fx.trauma = Math.min(1, fx.trauma + strength * .9);
      fx.hitFlash = Math.min(1, fx.hitFlash + strength * .7);
    };

    fx.impactSparks = fx.spawnImpact;

    fx.emitBoost = function (car, dt) {
      if (!car) return;
      fx.boostAccum += dt;
      if (fx.boostAccum < .022) return;
      fx.boostAccum = 0;
      for (const side of [-1, 1]) {
        v.set(side * .38, .48, -2.1);
        car.body.localToWorld(v);
        const c = Math.random() < .35;
        sparks.spawn(v.x, v.y, v.z,
          NR.rand(-.6, .6) - car.group.position.x * 0, NR.rand(.2, 1.2),
          NR.rand(-.6, .6), c ? .5 : .3, c ? .9 : .7, 1,
          NR.rand(.4, 1.1), NR.rand(.15, .35), 1.5, 2);
      }
    };

    fx.emitDrift = function (car, speed, dt, handbrake) {
      if (!car) return;
      const rear = [car.wheels[2], car.wheels[3]];
      const ratio = NR.clamp(Math.abs(speed) / 40, 0, 1);
      // skid marks
      fx.driftAccum += dt;
      if (fx.driftAccum > .02 && Math.abs(speed) > 6) {
        fx.driftAccum = 0;
        rear.forEach((w, i) => {
          w.steer.getWorldPosition(v2);
          const cur = { x: v2.x, y: v2.y - .34 + .045, z: v2.z };
          addSkidSegment(lastSkid[i], cur, handbrake ? .2 : .15);
          lastSkid[i] = cur;
        });
      }
      // smoke
      if (Math.abs(speed) > 10 && ratio > .15) {
        for (const w of rear) {
          w.steer.getWorldPosition(v2);
          const count = NR.LOW_POWER ? 1 : 2;
          for (let i = 0; i < count; i++) {
            smoke.spawn(v2.x + NR.rand(-.2, .2), v2.y - .2, v2.z + NR.rand(-.2, .2),
              NR.rand(-1.2, 1.2), NR.rand(.4, 1.8), NR.rand(-1.2, 1.2),
              .55, .62, .72, NR.rand(2.2, 4.8), NR.rand(.6, 1.4), .5, .9);
          }
        }
      }
    };

    fx.startBurnout = function (car) {
      if (!car) return;
      for (const w of [car.wheels[2], car.wheels[3]]) {
        w.steer.getWorldPosition(v2);
        for (let i = 0; i < 5; i++) {
          smoke.spawn(v2.x, v2.y - .25, v2.z,
            NR.rand(-1.5, 1.5), NR.rand(.3, 2), NR.rand(-1.5, 1.5),
            .7, .75, .85, NR.rand(3, 6), NR.rand(.8, 1.6), .4, .8);
        }
      }
    };

    fx.update = function (dt, time, car, speed, state) {
      fx.time += dt;
      fx.trauma = Math.max(0, fx.trauma - dt * 1.4);
      fx.hitFlash = Math.max(0, fx.hitFlash - dt * 2.2);
      sparks.update(dt);
      smoke.update(dt);
      glowDust.update(dt);
      updateRain(dt);
      updateSpeedLines(dt, speed, state && state.boosting);

      if (state && state.drifting && car) fx.emitDrift(car, speed, dt, state.handbrake);
      else { lastSkid[0] = lastSkid[1] = null; }
      if (state && state.boosting && car) fx.emitBoost(car, dt);

      // ambient floating dust around camera
      fx.dustAccum += dt;
      if (fx.dustAccum > .11) {
        fx.dustAccum = 0;
        const a = Math.random() * TAU, r = NR.rand(4, 34);
        const c = Math.random() < .5;
        glowDust.spawn(
          camera.position.x + Math.cos(a) * r,
          camera.position.y + NR.rand(-4, 8),
          camera.position.z + Math.sin(a) * r,
          NR.rand(-.3, .3), NR.rand(-.25, .5), NR.rand(-.3, .3),
          c ? .1 : .55, c ? .7 : .15, c ? 1 : .6,
          NR.rand(.18, .5), NR.rand(1.2, 3.4), 0, .25
        );
      }
    };

    fx.getShake = function (time) {
      if (fx.trauma <= 0) return { x: 0, y: 0, roll: 0 };
      const t = fx.trauma * fx.trauma;
      return {
        x: Math.sin(time * 47.3) * .32 * t,
        y: Math.sin(time * 53.7 + 1.3) * .22 * t,
        roll: Math.sin(time * 39.1 + .7) * .018 * t
      };
    };

    fx.rain = rain;
    fx.speedLines = speedLines;
    fx.setQuality = function (low) {
      rain.visible = !low;
      rainMat.opacity = low ? .18 : .24;
      lineMat.opacity = 0;
      smoke.points.visible = !low;
    };

    return fx;
  }

  NR.buildEffects = buildEffects;
})(window.NR = window.NR || {});
