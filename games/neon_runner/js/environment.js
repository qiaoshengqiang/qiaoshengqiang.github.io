/* ============================================================
   NEON RUNNER // environment: city, sky, bridges, signage
   ============================================================ */
(function (NR) {
  'use strict';

  const TAU = Math.PI * 2;
  const GROUND_Y = -0.45;
  const WATER_Y = -9.0;

  function buildEnvironment(scene, track) {
    const env = {
      group: new THREE.Group(),
      flicker: [],
      animated: [],
      startBulbs: [],
      startGlows: [],
      time: 0
    };
    env.group.name = 'CITY';
    scene.add(env.group);

    const rng = NR.mulberry32(90317);
    const rr = (a, b) => a + rng() * (b - a);
    const pick = arr => arr[(rng() * arr.length) | 0];
    const envMap = NR.envCube;
    const dummy = new THREE.Object3D();

    /* ---------------------------------------------------------
       SKY
       --------------------------------------------------------- */
    const skyGeo = new THREE.SphereGeometry(6000, 32, 18);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTime: { value: 0 } },
      vertexShader: `
        varying vec3 vDir;
        void main() {
          vDir = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: `
        varying vec3 vDir;
        uniform float uTime;
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        void main() {
          vec3 d = normalize(vDir);
          float h = d.y;
          vec3 top = vec3(0.006, 0.004, 0.028);
          vec3 mid = vec3(0.055, 0.02, 0.13);
          vec3 horizon = vec3(0.34, 0.045, 0.24);
          vec3 col = mix(horizon, mid, smoothstep(-0.02, 0.22, h));
          col = mix(col, top, smoothstep(0.14, 0.68, h));
          // city light dome
          float band = pow(max(0.0, 1.0 - abs(h) * 4.5), 7.0);
          col += vec3(0.52, 0.08, 0.30) * band * 0.55;
          // aurora ribbons
          float aur = sin(d.x * 4.0 + uTime * 0.05) * sin(d.z * 3.0 - uTime * 0.037);
          aur += 0.5 * sin(d.x * 9.0 - d.z * 5.0 + uTime * 0.02);
          col += vec3(0.05, 0.28, 0.38) * smoothstep(0.25, 0.95, aur) * smoothstep(0.0, 0.35, h) * 0.45;
          // stars
          vec2 suv = d.xz / (abs(d.y) + 0.35);
          float star = hash(floor(suv * 340.0));
          star = smoothstep(0.9965, 1.0, star) * smoothstep(0.06, 0.4, h);
          col += vec3(0.65, 0.9, 1.0) * star * (0.6 + 0.4 * sin(uTime * 1.7 + star * 80.0));
          // below horizon
          col = mix(col, vec3(0.015, 0.008, 0.025), smoothstep(0.0, -0.25, h));
          gl_FragColor = vec4(col, 1.0);
        }`
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.frustumCulled = false;
    env.group.add(sky);
    env.sky = sky;

    scene.background = new THREE.Color(0x06040e);
    scene.fog = new THREE.FogExp2(0x080512, 0.0014);

    // giant ringed planet
    const planetTex = (() => {
      const s = 1024, c = NR.makeCanvas(s, s), ctx = c.getContext('2d');
      ctx.clearRect(0, 0, s, s);
      ctx.save();
      ctx.translate(s / 2, s / 2);
      // halo
      let g = ctx.createRadialGradient(0, 0, s * .18, 0, 0, s * .5);
      g.addColorStop(0, 'rgba(255,45,149,.18)');
      g.addColorStop(.55, 'rgba(150,80,255,.10)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * .5, 0, TAU); ctx.fill();
      // rings
      ctx.strokeStyle = 'rgba(120,240,255,.28)'; ctx.lineWidth = 7;
      ctx.beginPath(); ctx.ellipse(0, 0, s * .38, s * .105, -.22, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,80,170,.20)'; ctx.lineWidth = 18;
      ctx.beginPath(); ctx.ellipse(0, 0, s * .425, s * .125, -.22, 0, TAU); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,240,255,.12)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, s * .46, s * .14, -.22, 0, TAU); ctx.stroke();
      // planet disc
      const R = s * .22;
      const pg = ctx.createLinearGradient(-R, -R, R, R);
      pg.addColorStop(0, '#30104e'); pg.addColorStop(.4, '#7b1c66');
      pg.addColorStop(.68, '#241142'); pg.addColorStop(1, '#0b0a22');
      ctx.fillStyle = pg; ctx.shadowColor = '#ff2d95'; ctx.shadowBlur = 60;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.fill();
      ctx.shadowBlur = 0;
      // bands
      ctx.save(); ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.clip();
      for (let i = 0; i < 18; i++) {
        const y = -R + i * R * .11;
        ctx.fillStyle = i % 3 === 0 ? 'rgba(255,90,180,.13)' : 'rgba(100,220,255,.06)';
        ctx.fillRect(-R, y, R * 2, R * .05);
      }
      ctx.fillStyle = 'rgba(10,6,24,.3)';
      ctx.beginPath(); ctx.arc(R * .35, -R * .3, R * 1.05, 0, TAU); ctx.fill();
      ctx.restore();
      // rim
      ctx.strokeStyle = 'rgba(160,245,255,.5)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(0, 0, R, 0, TAU); ctx.stroke();
      ctx.restore();
      const t = new THREE.CanvasTexture(c);
      t.encoding = THREE.sRGBEncoding;
      return t;
    })();
    const planetMat = new THREE.SpriteMaterial({
      map: planetTex, transparent: true, depthWrite: false, fog: false,
      blending: THREE.AdditiveBlending, toneMapped: false, opacity: .9
    });
    const planet = new THREE.Sprite(planetMat);
    planet.scale.set(1500, 1500, 1);
    planet.position.set(1100, 820, -2600);
    env.group.add(planet);
    env.planet = planet;

    /* ---------------------------------------------------------
       LIGHTS
       --------------------------------------------------------- */
    const hemi = new THREE.HemisphereLight(0x5b4aa8, 0x05050b, 1.05);
    scene.add(hemi);
    const moon = new THREE.DirectionalLight(0x9cc8ff, .5);
    moon.position.set(-380, 520, -260);
    scene.add(moon);
    const rim = new THREE.DirectionalLight(0xff3d8d, .18);
    rim.position.set(500, 120, 600);
    scene.add(rim);

    // a few local neon lights (keep count low for perf)
    function localLight(color, x, y, z, intensity, dist) {
      const l = new THREE.PointLight(color, intensity, dist, 1.8);
      l.position.set(x, y, z); scene.add(l); return l;
    }
    const startSample = track.samples[0];
    localLight(0x25dfff, startSample.pos.x, startSample.pos.y + 7, startSample.pos.z, 1.8, 70);
    const plazaZone = track.zoneRanges.find(z => z.sector.id === 'plaza');
    if (plazaZone) {
      const sm = track.samples[(plazaZone.startIdx + Math.floor((plazaZone.endIdx - plazaZone.startIdx) * .5)) % track.N];
      localLight(0xff2d95, sm.pos.x, sm.pos.y + 9, sm.pos.z, 1.7, 80);
    }
    const indZone = track.zoneRanges.find(z => z.sector.id === 'industrial');
    if (indZone) {
      const sm = track.samples[(indZone.startIdx + Math.floor((indZone.endIdx - indZone.startIdx) * .55)) % track.N];
      localLight(0xffb347, sm.pos.x, sm.pos.y + 6, sm.pos.z, 1.4, 55);
    }

    /* ---------------------------------------------------------
       GROUND with holes for tunnel + bridge abyss
       --------------------------------------------------------- */
    const halfWorld = 1700;
    const shape = new THREE.Shape();
    shape.moveTo(-halfWorld, -halfWorld);
    shape.lineTo(halfWorld, -halfWorld);
    shape.lineTo(halfWorld, halfWorld);
    shape.lineTo(-halfWorld, halfWorld);
    shape.lineTo(-halfWorld, -halfWorld);

    function addHole(samples, offset, step) {
      const pts = [];
      for (let i = 0; i < samples.length; i += step) {
        const sm = samples[i];
        pts.push([sm.pos.x + sm.right.x * offset, sm.pos.z + sm.right.z * offset]);
      }
      for (let i = samples.length - 1; i >= 0; i -= step) {
        const sm = samples[i];
        pts.push([sm.pos.x - sm.right.x * offset, sm.pos.z - sm.right.z * offset]);
      }
      const path = new THREE.Path();
      pts.forEach((p, i) => {
        const sx = p[0], sy = -p[1];
        if (i === 0) path.moveTo(sx, sy); else path.lineTo(sx, sy);
      });
      path.closePath();
      shape.holes.push(path);
    }
    const tunnelSamples = [];
    for (let i = track.portalEntry - 4; i <= track.portalExit + 4; i++) {
      tunnelSamples.push(track.samples[(i + track.N) % track.N]);
    }
    addHole(tunnelSamples, 13.2, 2);

    const bridgeZone = track.zoneRanges.find(z => z.sector.id === 'bridge');
    const bridgeSamples = [];
    if (bridgeZone) {
      for (let i = bridgeZone.startIdx; i < bridgeZone.endIdx; i++) bridgeSamples.push(track.samples[i]);
      addHole(bridgeSamples, 62, 3);
    }

    const groundTex = (() => {
      const s = 512, c = NR.makeCanvas(s, s), ctx = c.getContext('2d');
      ctx.fillStyle = '#080b13'; ctx.fillRect(0, 0, s, s);
      const rg = NR.mulberry32(713);
      // blocks
      for (let i = 0; i < 40; i++) {
        ctx.fillStyle = `rgba(30,38,58,${.08 + rg() * .14})`;
        ctx.fillRect(rg() * s, rg() * s, 10 + rg() * 90, 10 + rg() * 70);
      }
      // neon street lines at tile edges
      ctx.strokeStyle = 'rgba(37,237,255,.22)'; ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, s, s);
      ctx.strokeStyle = 'rgba(255,45,149,.12)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(s * .5, 0); ctx.lineTo(s * .5, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, s * .5); ctx.lineTo(s, s * .5); ctx.stroke();
      // grime
      for (let i = 0; i < 300; i++) {
        ctx.fillStyle = rg() > .5 ? 'rgba(120,160,200,.03)' : 'rgba(0,0,0,.25)';
        ctx.fillRect(rg() * s, rg() * s, 1 + rg() * 12, 1 + rg() * 4);
      }
      return NR.canvasTexture(c, { repeat: [.045, .045] });
    })();
    const groundMat = new THREE.MeshStandardMaterial({
      map: groundTex, color: 0x636b7d, roughness: .62, metalness: .38,
      envMap: envMap, envMapIntensity: .25
    });
    const groundGeo = new THREE.ShapeGeometry(shape, 4);
    groundGeo.rotateX(-Math.PI / 2);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = GROUND_Y;
    env.group.add(ground);
    env.ground = ground;

    // city street grid glows
    (() => {
      const positions = [], colors = [];
      const addLine = (x1, z1, x2, z2, color) => {
        const dx = x2 - x1, dz = z2 - z1;
        const len = Math.hypot(dx, dz);
        const nx = -dz / len * .18, nz = dx / len * .18;
        const y = GROUND_Y + .02;
        positions.push(
          x1 + nx, y, z1 + nz, x1 - nx, y, z1 - nz, x2 + nx, y, z2 + nz,
          x2 + nx, y, z2 + nz, x1 - nx, y, z1 - nz, x2 - nx, y, z2 - nz
        );
        const c = new THREE.Color(color);
        for (let i = 0; i < 6; i++) colors.push(c.r, c.g, c.b);
      };
      for (let x = -1540; x <= 1540; x += 140) addLine(x, -1540, x, 1540, x % 560 === 0 ? 0xff2d95 : 0x25edff);
      for (let z = -1540; z <= 1540; z += 140) addLine(-1540, z, 1540, z, z % 560 === 0 ? 0xff2d95 : 0x25edff);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      const m = new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: .22, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false
      });
      env.group.add(new THREE.Mesh(g, m));
    })();

    /* ---------------------------------------------------------
       WATER under the bridge
       --------------------------------------------------------- */
    if (bridgeZone) {
      let bx0 = Infinity, bx1 = -Infinity, bz0 = Infinity, bz1 = -Infinity;
      bridgeSamples.forEach(sm => {
        bx0 = Math.min(bx0, sm.pos.x); bx1 = Math.max(bx1, sm.pos.x);
        bz0 = Math.min(bz0, sm.pos.z); bz1 = Math.max(bz1, sm.pos.z);
      });
      const w = (bx1 - bx0) + 360, d = (bz1 - bz0) + 360;
      const wx = (bx0 + bx1) / 2, wz = (bz0 + bz1) / 2;
      const waterTex = (() => {
        const s = 512, c = NR.makeCanvas(s, s), ctx = c.getContext('2d');
        ctx.fillStyle = '#03060d'; ctx.fillRect(0, 0, s, s);
        const rw = NR.mulberry32(222);
        for (let i = 0; i < 90; i++) {
          ctx.strokeStyle = rw() > .45 ? 'rgba(37,237,255,.18)' : 'rgba(255,45,149,.12)';
          ctx.lineWidth = .6 + rw() * 1.6;
          ctx.beginPath();
          const y = rw() * s;
          ctx.moveTo(0, y);
          ctx.bezierCurveTo(s * .3, y + (rw() - .5) * 20, s * .7, y + (rw() - .5) * 20, s, y);
          ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(37,237,255,.12)'; ctx.lineWidth = 1;
        for (let x = 0; x < s; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, s); ctx.stroke(); }
        return NR.canvasTexture(c, { repeat: [22, 22] });
      })();
      const waterMat = new THREE.MeshStandardMaterial({
        map: waterTex, emissiveMap: waterTex, emissive: 0xffffff, emissiveIntensity: .65,
        color: 0x223347, metalness: .85, roughness: .19, envMap: envMap, envMapIntensity: 1
      });
      const water = new THREE.Mesh(new THREE.PlaneGeometry(w, d), waterMat);
      water.rotation.x = -Math.PI / 2;
      water.position.set(wx, WATER_Y, wz);
      env.group.add(water);
      env.water = water; env.waterTex = waterTex;
      // fog / mist under bridge
      const mistTex = NR.glowTexture();
      for (let i = 0; i < 6; i++) {
        const sp = new THREE.Sprite(new THREE.SpriteMaterial({
          map: mistTex, color: 0x2a6b8a, transparent: true, opacity: .08,
          blending: THREE.AdditiveBlending, depthWrite: false
        }));
        const t = i / 5;
        sp.position.set(bx0 + (bx1 - bx0) * t, WATER_Y + 3 + Math.sin(i) * 2, wz + Math.sin(i * 3) * 120);
        sp.scale.set(220, 90, 1);
        env.group.add(sp);
      }
    }

    /* ---------------------------------------------------------
       CITY BUILDINGS
       --------------------------------------------------------- */
    const trackPts = track.samples.filter((_, i) => i % 4 === 0).map(sm => [sm.pos.x, sm.pos.z]);
    const tunnelPts = tunnelSamples.filter((_, i) => i % 3 === 0).map(sm => [sm.pos.x, sm.pos.z]);
    const bridgePts = bridgeSamples.filter((_, i) => i % 3 === 0).map(sm => [sm.pos.x, sm.pos.z]);
    function minDist2(pts, x, z) {
      let best = Infinity;
      for (let i = 0; i < pts.length; i++) {
        const dx = x - pts[i][0], dz = z - pts[i][1];
        const d = dx * dx + dz * dz;
        if (d < best) best = d;
      }
      return best;
    }

    const winMats = [];
    for (let v = 0; v < 4; v++) {
      const tex = NR.windowTexture(v);
      winMats.push(new THREE.MeshStandardMaterial({
        map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 1.05,
        color: 0x545e78, roughness: .52, metalness: .36,
        envMap: envMap, envMapIntensity: .24
      }));
    }
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x10141d, roughness: .85, metalness: .25 });
    const buildings = [];
    const occupied = new Map();
    const cellSize = 44;
    function canPlace(x, z, r) {
      const cx = Math.floor(x / cellSize), cz = Math.floor(z / cellSize);
      for (let ax = -1; ax <= 1; ax++) for (let az = -1; az <= 1; az++) {
        const arr = occupied.get((cx + ax) + ',' + (cz + az));
        if (!arr) continue;
        for (const o of arr) {
          const dx = x - o.x, dz = z - o.z;
          if (Math.hypot(dx, dz) < r + o.r + 3) return false;
        }
      }
      return true;
    }
    function occupy(x, z, r) {
      const cx = Math.floor(x / cellSize), cz = Math.floor(z / cellSize);
      const k = cx + ',' + cz;
      if (!occupied.has(k)) occupied.set(k, []);
      occupied.get(k).push({ x, z, r });
    }

    const target = 640;
    let attempts = 0;
    while (buildings.length < target && attempts < 7000) {
      attempts++;
      // bias towards the circuit band
      const ang = rng() * TAU;
      const rad = 80 + Math.pow(rng(), .72) * 1050;
      const cx = 195, cz = 200;
      const x = cx + Math.cos(ang) * rad + (rng() - .5) * 120;
      const z = cz + Math.sin(ang) * rad + (rng() - .5) * 120;
      if (Math.abs(x) > 1560 || Math.abs(z) > 1560) continue;
      const w = rr(10, 32), d = rr(10, 32);
      const r = Math.max(w, d) * .7;
      if (minDist2(trackPts, x, z) < Math.pow(31 + r, 2)) continue;
      if (minDist2(tunnelPts, x, z) < Math.pow(38 + r, 2)) continue;
      if (bridgePts.length && minDist2(bridgePts, x, z) < Math.pow(72 + r, 2)) continue;
      if (!canPlace(x, z, r)) continue;
      occupy(x, z, r);
      let h = 12 + Math.pow(rng(), 1.8) * 130;
      if (rng() < .07) h += rr(70, 150);
      if (Math.hypot(x - cx, z - cz) > 900) h *= .8;
      const variant = (rng() * winMats.length) | 0;
      buildings.push({
        x, z, w, d, h, variant,
        rot: rng() < .25 ? rr(-.25, .25) : (rng() < .5 ? 0 : Math.PI / 2),
        r
      });
    }

    // split into variant instanced meshes
    const boxGeo = new THREE.BoxGeometry(1, 1, 1);
    boxGeo.translate(0, .5, 0);
    const roofGeo = new THREE.BoxGeometry(1, 1, 1);
    roofGeo.translate(0, .5, 0);
    for (let v = 0; v < winMats.length; v++) {
      const list = buildings.filter(b => b.variant === v);
      if (!list.length) continue;
      const mesh = new THREE.InstancedMesh(boxGeo, winMats[v], list.length);
      list.forEach((b, i) => {
        dummy.position.set(b.x, GROUND_Y, b.z);
        dummy.rotation.set(0, b.rot, 0);
        dummy.scale.set(b.w, b.h, b.d);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        const tint = .78 + rng() * .35;
        mesh.setColorAt(i, new THREE.Color(tint, tint * .95, tint * 1.05));
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      env.group.add(mesh);
    }
    // rooftop caps
    {
      const mesh = new THREE.InstancedMesh(roofGeo, roofMat, buildings.length);
      buildings.forEach((b, i) => {
        dummy.position.set(b.x, GROUND_Y + b.h, b.z);
        dummy.rotation.set(0, b.rot, 0);
        dummy.scale.set(b.w + .5, 1.2, b.d + .5);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.instanceMatrix.needsUpdate = true;
      mesh.frustumCulled = false;
      env.group.add(mesh);
    }
    // roof neon edges
    {
      const edgeGeo = new THREE.BoxGeometry(1, 1, 1);
      const colors = [0x25edff, 0xff2d95, 0x9a6bff, 0xffb347, 0x74ffb0];
      const list = buildings.filter(() => rng() < .5);
      const mesh = new THREE.InstancedMesh(edgeGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), list.length * 2);
      let idx = 0;
      list.forEach(b => {
        const c = new THREE.Color(colors[(rng() * colors.length) | 0]);
        for (const dir of [0, 1]) {
          dummy.position.set(b.x, GROUND_Y + b.h + 1.25, b.z);
          dummy.rotation.set(0, b.rot + (dir ? Math.PI / 2 : 0), 0);
          dummy.scale.set((dir ? b.d : b.w) + 1.2, .22, .35);
          dummy.updateMatrix();
          mesh.setMatrixAt(idx, dummy.matrix);
          mesh.setColorAt(idx, c);
          idx++;
        }
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.frustumCulled = false;
      env.group.add(mesh);
    }
    // antennas + red beacons
    {
      const tall = buildings.filter(b => b.h > 60 && rng() < .55);
      const antGeo = new THREE.BoxGeometry(.24, 1, .24);
      antGeo.translate(0, .5, 0);
      const ant = new THREE.InstancedMesh(antGeo,
        new THREE.MeshStandardMaterial({ color: 0x0c1018, roughness: .6, metalness: .7 }), tall.length);
      const beaconPositions = [], beaconColors = [];
      tall.forEach((b, i) => {
        const hh = 8 + rng() * 26;
        dummy.position.set(b.x + rr(-b.w * .2, b.w * .2), GROUND_Y + b.h + 1.2, b.z + rr(-b.d * .2, b.d * .2));
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, hh, 1);
        dummy.updateMatrix();
        ant.setMatrixAt(i, dummy.matrix);
        beaconPositions.push(dummy.position.x, dummy.position.y + hh, dummy.position.z);
        beaconColors.push(1, .12, .18);
      });
      ant.instanceMatrix.needsUpdate = true;
      ant.frustumCulled = false;
      env.group.add(ant);
      if (beaconPositions.length) {
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(beaconPositions, 3));
        g.setAttribute('color', new THREE.Float32BufferAttribute(beaconColors, 3));
        const p = new THREE.Points(g, new THREE.PointsMaterial({
          map: NR.glowTexture(), size: 4, vertexColors: true, transparent: true,
          blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
          toneMapped: false
        }));
        env.group.add(p);
      }
    }

    /* ---------------------------------------------------------
       SHARED HOLO SIGN TEXTURES
       --------------------------------------------------------- */
    const signMats = [];
    const signMatsV = [];
    const signColors = ['#25edff', '#ff2d95', '#9a6bff', '#ffb347', '#74ffb0', '#ff5ea8'];
    for (let i = 0; i < 12; i++) {
      const w = NR.SIGN_WORDS[(i * 3 + 1) % NR.SIGN_WORDS.length];
      const tex = NR.signTexture({
        text: w[0], sub: w[1],
        color: signColors[i % signColors.length],
        color2: signColors[(i + 2) % signColors.length]
      });
      signMats.push(new THREE.MeshBasicMaterial({
        map: tex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: .92
      }));
    }
    for (let i = 0; i < 6; i++) {
      const w = NR.SIGN_WORDS[(i * 4 + 5) % NR.SIGN_WORDS.length];
      const tex = NR.signTexture({
        text: w[0], sub: w[1], vertical: true,
        color: signColors[(i + 1) % signColors.length],
        color2: signColors[(i + 3) % signColors.length]
      });
      signMatsV.push(new THREE.MeshBasicMaterial({
        map: tex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: .92
      }));
    }
    // flicker all shared signs subtly
    signMats.concat(signMatsV).forEach((m, i) => {
      env.flicker.push({ mat: m, base: m.opacity, speed: .7 + (i % 5) * .21, phase: i * 1.7 });
    });

    // instanced sign collector
    const signBatches = signMats.map(() => []);
    const signBatchesV = signMatsV.map(() => []);
    function addSign(batch, matIndex, x, y, z, rotY, w, h) {
      const m = new THREE.Matrix4();
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, rotY, 0);
      dummy.scale.set(w, h, 1);
      dummy.updateMatrix();
      batch[matIndex].push(dummy.matrix.clone());
    }
    function buildSignBatches(batches, mats) {
      const geo = new THREE.PlaneGeometry(1, 1);
      batches.forEach((list, i) => {
        if (!list.length) return;
        const im = new THREE.InstancedMesh(geo, mats[i], list.length);
        list.forEach((m, j) => im.setMatrixAt(j, m));
        im.instanceMatrix.needsUpdate = true;
        im.frustumCulled = false;
        env.group.add(im);
      });
    }

    /* ---------------------------------------------------------
       BUILDING SIGNS
       --------------------------------------------------------- */
    const signBuildings = buildings
      .filter(b => b.h > 24)
      .map(b => ({ b, d: Math.sqrt(minDist2(trackPts, b.x, b.z)) }))
      .filter(o => o.d > 36 && o.d < 130)
      .sort((a, b) => a.d - b.d)
      .slice(0, 26);
    signBuildings.forEach(({ b }, i) => {
      let best = null, bd = Infinity;
      for (const p of trackPts) {
        const dx = p[0] - b.x, dz = p[1] - b.z;
        const d = dx * dx + dz * dz;
        if (d < bd) { bd = d; best = p; }
      }
      const nx = best[0] - b.x, nz = best[1] - b.z;
      const len = Math.hypot(nx, nz) || 1;
      const rot = Math.atan2(nx / len, nz / len);
      const off = Math.max(b.w, b.d) * .5 + .5;
      const sw = Math.min(b.w * .85, 16), sh = Math.min(sw * .35, 6);
      const y = GROUND_Y + Math.max(10, b.h * (.45 + (i % 3) * .12));
      addSign(signBatches, i % signMats.length,
        b.x + nx / len * off, y, b.z + nz / len * off, rot, sw, sh);
    });

    /* ---------------------------------------------------------
       SECTOR GATES
       --------------------------------------------------------- */
    const gateSectorColors = [0x25edff, 0x9a6bff, 0xff2d95, 0xffb347, 0x74ffb0, 0xff5ea8];
    track.zoneRanges.forEach((z, zi) => {
      if (zi === 0) return;
      const sm = track.samples[z.startIdx % track.N];
      const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
      const g = new THREE.Group();
      g.position.set(sm.pos.x, sm.pos.y, sm.pos.z);
      g.rotation.y = yaw;
      const col = new THREE.Color(gateSectorColors[zi]);
      const dark = new THREE.MeshStandardMaterial({ color: 0x121724, roughness: .55, metalness: .7, envMap: envMap });
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 10.5, 1.6), dark);
        pillar.position.set(side * 15.2, 5.1, 0);
        g.add(pillar);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(.12, 9.6, .12),
          new THREE.MeshBasicMaterial({ color: col, toneMapped: false }));
        strip.position.set(side * 15.2, 5.1, -.85);
        g.add(strip);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(31.5, 1.35, 1.8), dark);
      beam.position.set(0, 10.4, 0);
      g.add(beam);
      const beamGlow = new THREE.Mesh(new THREE.BoxGeometry(30, .1, .12),
        new THREE.MeshBasicMaterial({ color: col, toneMapped: false }));
      beamGlow.position.set(0, 9.65, -.92);
      g.add(beamGlow);
      const tex = NR.signTexture({
        text: z.sector.en, sub: z.sector.cn + ' // ' + String(zi + 1).padStart(2, '0'),
        color: '#' + col.getHexString(),
        color2: '#' + new THREE.Color(gateSectorColors[(zi + 2) % 6]).getHexString()
      });
      const sign = new THREE.Mesh(new THREE.PlaneGeometry(13, 4.6), new THREE.MeshBasicMaterial({
        map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide, toneMapped: false
      }));
      sign.position.set(0, 8.75, -1.0);
      sign.rotation.y = Math.PI;
      g.add(sign);
      env.flicker.push({ mat: sign.material, base: 1, speed: 1.7, phase: zi });
      // little beacons
      for (const side of [-1, 1]) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(.16, 8, 6),
          new THREE.MeshBasicMaterial({ color: col, toneMapped: false }));
        b.position.set(side * 15.2, 10.9, 0);
        g.add(b);
      }
      env.group.add(g);
    });

    /* ---------------------------------------------------------
       START GANTRY + LIGHTS
       --------------------------------------------------------- */
    {
      const sm = track.samples[2];
      const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
      const g = new THREE.Group();
      g.position.set(sm.pos.x, sm.pos.y, sm.pos.z);
      g.rotation.y = yaw;
      const dark = new THREE.MeshStandardMaterial({ color: 0x10141f, roughness: .45, metalness: .8, envMap: envMap });
      for (const side of [-1, 1]) {
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, 12.2, 2.2), dark);
        pillar.position.set(side * 14.2, 5.9, 0);
        g.add(pillar);
        const strip = new THREE.Mesh(new THREE.BoxGeometry(.16, 11.4, .16),
          new THREE.MeshBasicMaterial({ color: side < 0 ? 0x25edff : 0xff2d95, toneMapped: false }));
        strip.position.set(side * 14.2, 5.9, -1.12);
        g.add(strip);
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(30, 1.6, 2.4), dark);
      beam.position.set(0, 12.3, 0);
      g.add(beam);
      const bannerTex = NR.signTexture({
        text: 'NEON RUNNER', sub: '霓虹飞驰 // SECTOR 00 // NIGHT CIRCUIT',
        color: '#25edff', color2: '#ff2d95'
      });
      const banner = new THREE.Mesh(new THREE.PlaneGeometry(19, 7.6), new THREE.MeshBasicMaterial({
        map: bannerTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, toneMapped: false
      }));
      banner.position.set(0, 8.2, -1.35);
      banner.rotation.y = Math.PI;
      g.add(banner);
      env.flicker.push({ mat: banner.material, base: 1, speed: 1.3, phase: 2 });

      // start light tree
      const bar = new THREE.Mesh(new THREE.BoxGeometry(7.2, 1.3, 1.0), dark);
      bar.position.set(0, 4.4, -1.2);
      g.add(bar);
      for (let i = 0; i < 5; i++) {
        const mat = new THREE.MeshBasicMaterial({ color: 0x230a12, toneMapped: false });
        const bulb = new THREE.Mesh(new THREE.SphereGeometry(.4, 14, 10), mat);
        bulb.position.set((i - 2) * 1.25, 4.4, -1.85);
        g.add(bulb);
        const glowMat = new THREE.SpriteMaterial({
          map: NR.glowTexture(), color: 0xff2447, transparent: true, opacity: 0,
          blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
        });
        const glow = new THREE.Sprite(glowMat);
        glow.position.set((i - 2) * 1.25, 4.4, -2.15);
        glow.scale.set(4.4, 4.4, 1);
        g.add(glow);
        env.startBulbs.push({ mat, glowMat });
      }
      env.startLights = (on, green) => {
        env.startBulbs.forEach((b, i) => {
          if (green) {
            b.mat.color.setHex(0x2bff8a);
            b.glowMat.color.setHex(0x2bff8a);
            b.glowMat.opacity = .95;
          } else if (i < on) {
            b.mat.color.setHex(0xff2447);
            b.glowMat.color.setHex(0xff2447);
            b.glowMat.opacity = .85;
          } else {
            b.mat.color.setHex(0x230a12);
            b.glowMat.opacity = 0;
          }
        });
      };
      env.startLights(0, false);
      env.group.add(g);
      env.startGantry = g;
    }

    /* ---------------------------------------------------------
       STREET SHOPS / BILLBOARDS / LAMPS
       --------------------------------------------------------- */
    const groundZones = track.zoneRanges.filter(z => ['street', 'plaza', 'industrial'].includes(z.sector.id));
    const shopData = [];
    groundZones.forEach(z => {
      for (let i = z.startIdx + 10; i < z.endIdx - 8; i += 24) {
        const sm = track.samples[i];
        const side = (Math.floor(i / 24) % 2 === 0) ? -1 : 1;
        const lat = side * rr(23, 29);
        shopData.push({
          x: sm.pos.x + sm.right.x * lat,
          z: sm.pos.z + sm.right.z * lat,
          y: GROUND_Y,
          yaw: Math.atan2(sm.tangent.x, sm.tangent.z),
          w: rr(11, 17), h: rr(5.6, 9.5), d: rr(7, 11), side, sm
        });
      }
    });
    {
      const shopMat = new THREE.MeshStandardMaterial({
        map: NR.corrugatedTexture('#1c2130'), color: 0x7d879c,
        roughness: .62, metalness: .55, envMap: envMap, envMapIntensity: .25
      });
      const shopGeo = new THREE.BoxGeometry(1, 1, 1);
      shopGeo.translate(0, .5, 0);
      const shops = new THREE.InstancedMesh(shopGeo, shopMat, shopData.length);
      shopData.forEach((s, i) => {
        dummy.position.set(s.x, GROUND_Y, s.z);
        dummy.rotation.set(0, s.yaw, 0);
        dummy.scale.set(s.d, s.h, s.w);
        dummy.updateMatrix();
        shops.setMatrixAt(i, dummy.matrix);
        shops.setColorAt(i, new THREE.Color().setHSL(((i * .13) % 1), .2, .55 + (i % 3) * .06));
      });
      shops.instanceMatrix.needsUpdate = true;
      if (shops.instanceColor) shops.instanceColor.needsUpdate = true;
      shops.frustumCulled = false;
      env.group.add(shops);

      // storefront signs
      shopData.forEach((s, i) => {
        const off = s.d * .5 + .2;
        const sx = s.x - Math.sin(s.yaw) * 0 - s.side * Math.cos(s.yaw) * 0; // offset computed via right vector below
        const right = new THREE.Vector3(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
        // right vector matching track: (t.z, -t.x); with yaw: (cos, -sin)
        const px = s.x - s.side * right.x * off;
        const pz = s.z - s.side * right.z * off;
        const rot = s.yaw - s.side * Math.PI / 2;
        addSign(signBatches, i % signMats.length, px, GROUND_Y + s.h * .66, pz, rot, Math.min(s.w * .75, 10), Math.min(s.h * .42, 3.4));
      });

      // canopies
      const canGeo = new THREE.BoxGeometry(1, 1, 1);
      const canMat = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
      const cans = new THREE.InstancedMesh(canGeo, canMat, shopData.length);
      const canCols = [0x25edff, 0xff2d95, 0xffb347, 0x74ffb0, 0x9a6bff];
      shopData.forEach((s, i) => {
        const right = new THREE.Vector3(Math.cos(s.yaw), 0, -Math.sin(s.yaw));
        const off = s.d * .5 + .6;
        dummy.position.set(s.x - s.side * right.x * off, GROUND_Y + 3.9, s.z - s.side * right.z * off);
        dummy.rotation.set(0, s.yaw, 0);
        dummy.scale.set(1.2, .22, s.w * .8);
        dummy.updateMatrix();
        cans.setMatrixAt(i, dummy.matrix);
        cans.setColorAt(i, new THREE.Color(canCols[i % canCols.length]));
      });
      cans.instanceMatrix.needsUpdate = true;
      if (cans.instanceColor) cans.instanceColor.needsUpdate = true;
      cans.frustumCulled = false;
      env.group.add(cans);
    }

    // street lamps
    const lampHeads = [];
    const lampPoleMatrices = [], lampHeadMatrices = [];
    groundZones.forEach(z => {
      for (let i = z.startIdx + 16; i < z.endIdx - 10; i += 21) {
        const sm = track.samples[i];
        const side = (Math.floor(i / 21) % 2 === 0) ? -1 : 1;
        const lat = side * 13.9;
        const bx = sm.pos.x + sm.right.x * lat;
        const bz = sm.pos.z + sm.right.z * lat;
        const topY = sm.pos.y + 7.8;
        const h = topY - GROUND_Y;
        const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
        // pole
        dummy.position.set(bx, GROUND_Y, bz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(1, h, 1);
        dummy.updateMatrix();
        lampPoleMatrices.push(dummy.matrix.clone());
        // head over road
        const hx = bx - side * sm.right.x * 2.4;
        const hz = bz - side * sm.right.z * 2.4;
        dummy.position.set(hx, topY, hz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(.85, .18, .4);
        dummy.updateMatrix();
        lampHeadMatrices.push(dummy.matrix.clone());
        lampHeads.push({ x: hx, y: topY, z: hz, c: (i % 3 === 0) ? 0x25edff : (side > 0 ? 0xff2d95 : 0xffb347) });
      }
    });
    if (lampPoleMatrices.length) {
      const poleGeo = new THREE.CylinderGeometry(.12, .16, 1, 7);
      poleGeo.translate(0, .5, 0);
      const poles = new THREE.InstancedMesh(poleGeo,
        new THREE.MeshStandardMaterial({ color: 0x141a26, metalness: .8, roughness: .4 }), lampPoleMatrices.length);
      lampPoleMatrices.forEach((m, i) => poles.setMatrixAt(i, m));
      poles.instanceMatrix.needsUpdate = true;
      poles.frustumCulled = false;
      env.group.add(poles);
      const headGeo = new THREE.BoxGeometry(1, 1, 1);
      const heads = new THREE.InstancedMesh(headGeo,
        new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), lampHeadMatrices.length);
      lampHeadMatrices.forEach((m, i) => {
        heads.setMatrixAt(i, m);
        heads.setColorAt(i, new THREE.Color(lampHeads[i].c));
      });
      heads.instanceMatrix.needsUpdate = true;
      if (heads.instanceColor) heads.instanceColor.needsUpdate = true;
      heads.frustumCulled = false;
      env.group.add(heads);
      const pos = [], cols = [];
      lampHeads.forEach(l => {
        pos.push(l.x, l.y - .3, l.z);
        const c = new THREE.Color(l.c);
        cols.push(c.r, c.g, c.b);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({
        map: NR.glowTexture(), size: 7, vertexColors: true, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
        toneMapped: false
      }));
      env.group.add(pts);
    }

    // standalone billboards + support poles
    const billboardPoles = [];
    groundZones.forEach(z => {
      for (let i = z.startIdx + 22; i < z.endIdx - 14; i += 36) {
        const sm = track.samples[i];
        const side = (Math.floor(i / 36) % 2 === 0) ? 1 : -1;
        const lat = side * rr(25, 33);
        const x = sm.pos.x + sm.right.x * lat;
        const z = sm.pos.z + sm.right.z * lat;
        const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
        const rot = yaw - side * Math.PI / 2;
        const vertical = rng() < .35;
        const w = vertical ? rr(4.2, 5.6) : rr(9, 13);
        const h = vertical ? rr(9, 12) : w * rr(.45, .55);
        const y = sm.pos.y + (vertical ? 9.5 : 8.5);
        if (vertical) addSign(signBatchesV, (i / 36 | 0) % signMatsV.length, x, y, z, rot, w, h);
        else addSign(signBatches, (i / 36 | 0) % signMats.length, x, y, z, rot, w, h);
        // two support poles
        const bottom = y - h * .5;
        for (const k of [-1, 1]) {
          const ox = Math.cos(rot) * w * .3 * k;
          const oz = -Math.sin(rot) * w * .3 * k;
          billboardPoles.push({ x: x + ox, z: z + oz, bottom, top: bottom });
        }
      }
    });
    buildSignBatches(signBatches, signMats);
    buildSignBatches(signBatchesV, signMatsV);
    if (billboardPoles.length) {
      const g = new THREE.CylinderGeometry(.1, .13, 1, 6);
      g.translate(0, .5, 0);
      const im = new THREE.InstancedMesh(g,
        new THREE.MeshStandardMaterial({ color: 0x131824, metalness: .8, roughness: .4 }), billboardPoles.length);
      billboardPoles.forEach((p, i) => {
        dummy.position.set(p.x, GROUND_Y, p.z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.set(1, p.bottom - GROUND_Y, 1);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
      });
      im.instanceMatrix.needsUpdate = true;
      im.frustumCulled = false;
      env.group.add(im);
    }

    /* ---------------------------------------------------------
       BRIDGE PYLONS + SUPPORTS
       --------------------------------------------------------- */
    const supportMat = new THREE.MeshStandardMaterial({
      color: 0x2a2f3c, roughness: .65, metalness: .55, envMap: envMap, envMapIntensity: .2
    });
    const supportGeo = new THREE.BoxGeometry(1, 1, 1);
    supportGeo.translate(0, .5, 0);
    const supportMatrices = [];
    const beamMatrices = [];
    track.zoneRanges.forEach(z => {
      if (!['elevated', 'bridge'].includes(z.sector.id)) return;
      const baseY = z.sector.id === 'bridge' ? WATER_Y - 1 : GROUND_Y;
      for (let i = z.startIdx + 5; i < z.endIdx; i += 17) {
        const sm = track.samples[i];
        const deckBottom = sm.pos.y - 1.45;
        if (deckBottom - baseY < 1.2) continue;
        const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
        const h = deckBottom - baseY;
        for (const side of [-1, 1]) {
          dummy.position.set(sm.pos.x + sm.right.x * 7.4 * side, baseY, sm.pos.z + sm.right.z * 7.4 * side);
          dummy.rotation.set(0, yaw, 0);
          dummy.scale.set(2.3, h, 2.3);
          dummy.updateMatrix();
          supportMatrices.push(dummy.matrix.clone());
        }
        dummy.position.set(sm.pos.x, deckBottom - .65, sm.pos.z);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(19, .9, 2.2);
        dummy.updateMatrix();
        beamMatrices.push(dummy.matrix.clone());
      }
    });
    if (supportMatrices.length) {
      const col = new THREE.InstancedMesh(supportGeo, supportMat, supportMatrices.length);
      supportMatrices.forEach((m, i) => col.setMatrixAt(i, m));
      col.instanceMatrix.needsUpdate = true; col.frustumCulled = false;
      env.group.add(col);
      const beams = new THREE.InstancedMesh(supportGeo, supportMat, beamMatrices.length);
      beamMatrices.forEach((m, i) => beams.setMatrixAt(i, m));
      beams.instanceMatrix.needsUpdate = true; beams.frustumCulled = false;
      env.group.add(beams);
    }

    // cable-stayed bridge pylons
    const cableMatrices = [];
    const pylonLights = [];
    if (bridgeZone) {
      const count = bridgeZone.endIdx - bridgeZone.startIdx;
      [0.3, 0.7].forEach((frac, pi) => {
        const idx = bridgeZone.startIdx + Math.floor(count * frac);
        const sm = track.samples[idx];
        const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
        const h = 58;
        for (const side of [-1, 1]) {
          const px = sm.pos.x + sm.right.x * 16.5 * side;
          const pz = sm.pos.z + sm.right.z * 16.5 * side;
          const tower = new THREE.Mesh(new THREE.BoxGeometry(3.0, h, 3.0),
            new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: .55, metalness: .68, envMap: envMap }));
          tower.position.set(px, sm.pos.y - 5 + h / 2, pz);
          tower.rotation.y = yaw;
          env.group.add(tower);
          const strip = new THREE.Mesh(new THREE.BoxGeometry(.15, h - 8, .15),
            new THREE.MeshBasicMaterial({ color: pi === 0 ? 0x25edff : 0xff2d95, toneMapped: false }));
          strip.position.set(px - sm.right.x * side * 1.6, sm.pos.y - 5 + h / 2, pz - sm.right.z * side * 1.6);
          env.group.add(strip);
          // cables to deck anchors both ways
          for (let c = -5; c <= 5; c += 1) {
            if (c === 0) continue;
            const ai = NR.wrap(idx + c * 4, track.N);
            const anchor = track.samples[ai];
            const aLat = 11.0 * side;
            const ax = anchor.pos.x + anchor.right.x * aLat;
            const ay = anchor.pos.y + .8;
            const az = anchor.pos.z + anchor.right.z * aLat;
            const from = new THREE.Vector3(px, sm.pos.y - 5 + h - 3, pz);
            const to = new THREE.Vector3(ax, ay, az);
            const dir = new THREE.Vector3().subVectors(to, from);
            const len = dir.length();
            const mid = new THREE.Vector3().addVectors(from, to).multiplyScalar(.5);
            const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
            const m = new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, len, 1));
            cableMatrices.push(m);
          }
          pylonLights.push(new THREE.Vector3(px, sm.pos.y - 5 + h + 1.2, pz));
        }
        // crossbeam
        const cross = new THREE.Mesh(new THREE.BoxGeometry(33, 1.4, 2.2),
          new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: .55, metalness: .68 }));
        cross.position.set(sm.pos.x, sm.pos.y + 34, sm.pos.z);
        cross.rotation.y = yaw;
        env.group.add(cross);
      });
    }
    if (cableMatrices.length) {
      const g = new THREE.CylinderGeometry(.075, .075, 1, 4);
      const im = new THREE.InstancedMesh(g,
        new THREE.MeshBasicMaterial({ color: 0x9adfff, transparent: true, opacity: .55, toneMapped: false }), cableMatrices.length);
      cableMatrices.forEach((m, i) => im.setMatrixAt(i, m));
      im.instanceMatrix.needsUpdate = true; im.frustumCulled = false;
      env.group.add(im);
    }
    if (pylonLights.length) {
      const pos = [], cols = [];
      pylonLights.forEach((p, i) => {
        pos.push(p.x, p.y, p.z);
        cols.push(1, .12, .22);
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(cols, 3));
      env.group.add(new THREE.Points(g, new THREE.PointsMaterial({
        map: NR.glowTexture(), size: 8, vertexColors: true, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      })));
    }

    /* ---------------------------------------------------------
       INDUSTRIAL CONTAINERS + CRANES
       --------------------------------------------------------- */
    const indZone2 = track.zoneRanges.find(z => z.sector.id === 'industrial');
    if (indZone2) {
      const contMat = new THREE.MeshStandardMaterial({
        map: NR.corrugatedTexture('#2b3040'), color: 0x8a94aa,
        roughness: .58, metalness: .55, envMap: envMap
      });
      const conts = [];
      for (let i = indZone2.startIdx + 8; i < indZone2.endIdx - 6; i += 11) {
        const sm = track.samples[i];
        for (const side of [-1, 1]) {
          if (rng() < .45) continue;
          const lat = side * rr(20, 46);
          const x = sm.pos.x + sm.right.x * lat;
          const z = sm.pos.z + sm.right.z * lat;
          if (minDist2(tunnelPts, x, z) < 16 * 16) continue;
          const stack = 1 + (rng() < .35 ? 1 : 0);
          for (let s = 0; s < stack; s++) {
            conts.push({
              x, z, y: GROUND_Y + s * 2.65,
              rot: Math.atan2(sm.tangent.x, sm.tangent.z) + (rng() < .3 ? Math.PI / 2 : 0),
              w: rr(9, 13), h: 2.55, d: 2.5,
              c: [0xff5e5e, 0x25a0c0, 0xc07a25, 0x557a55, 0x6b5aa5][(rng() * 5) | 0]
            });
          }
        }
      }
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), contMat, conts.length);
      conts.forEach((c, i) => {
        dummy.position.set(c.x, c.y, c.z);
        dummy.rotation.set(0, c.rot, 0);
        dummy.scale.set(c.d, c.h, c.w);
        dummy.updateMatrix();
        im.setMatrixAt(i, dummy.matrix);
        im.setColorAt(i, new THREE.Color(c.c));
      });
      im.instanceMatrix.needsUpdate = true;
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
      im.frustumCulled = false;
      env.group.add(im);
      // two cranes
      const craneMat = new THREE.MeshStandardMaterial({ color: 0x2b303c, roughness: .55, metalness: .7 });
      [0.3, 0.72].forEach((f, ci) => {
        const idx = indZone2.startIdx + Math.floor((indZone2.endIdx - indZone2.startIdx) * f);
        const sm = track.samples[idx];
        const side = ci ? 1 : -1;
        const lat = side * 45;
        const x = sm.pos.x + sm.right.x * lat;
        const z = sm.pos.z + sm.right.z * lat;
        const yaw = Math.atan2(sm.tangent.x, sm.tangent.z);
        const g = new THREE.Group();
        g.position.set(x, GROUND_Y, z);
        g.rotation.y = yaw;
        const colGeo = new THREE.BoxGeometry(1.4, 30, 1.4);
        for (const sx of [-8, 8]) for (const sz of [-6, 6]) {
          const col = new THREE.Mesh(colGeo, craneMat);
          col.position.set(sx, 15, sz); g.add(col);
        }
        const top = new THREE.Mesh(new THREE.BoxGeometry(19, 1.2, 15), craneMat);
        top.position.set(0, 30, 0); g.add(top);
        const arm = new THREE.Mesh(new THREE.BoxGeometry(46, 1, 1.2), craneMat);
        arm.position.set(-8, 34, 0); g.add(arm);
        const armGlow = new THREE.Mesh(new THREE.BoxGeometry(44, .12, .14),
          new THREE.MeshBasicMaterial({ color: 0xffb347, toneMapped: false }));
        armGlow.position.set(-8, 33.4, 0); g.add(armGlow);
        env.group.add(g);
      });
    }

    /* ---------------------------------------------------------
       HOLOGRAMS
       --------------------------------------------------------- */
    const fishTex = NR.fishTexture();
    function makeFish(s, lat, height, scale) {
      const sm = track.samples[NR.wrap(Math.floor(s * track.N), track.N)];
      const g = new THREE.Group();
      const x = sm.pos.x + sm.right.x * lat;
      const z = sm.pos.z + sm.right.z * lat;
      g.position.set(x, sm.pos.y + height, z);
      const mat = new THREE.MeshBasicMaterial({
        map: fishTex, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, side: THREE.DoubleSide, toneMapped: false, opacity: .72
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(50, 25), mat);
      mesh.scale.setScalar(scale);
      g.add(mesh);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(30 * scale, .16, 6, 48),
        new THREE.MeshBasicMaterial({ color: 0x25edff, transparent: true, opacity: .5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      ring.rotation.x = Math.PI / 2;
      ring.position.y = -2;
      g.add(ring);
      g.userData = { mesh, baseY: g.position.y, seed: Math.random() * 10, ring };
      env.animated.push(g);
      env.group.add(g);
      return g;
    }
    const plazaZone2 = track.zoneRanges.find(z => z.sector.id === 'plaza');
    if (plazaZone2) {
      makeFish(plazaZone2.startS + (plazaZone2.endS - plazaZone2.startS) * .35, -30, 30, .9);
      makeFish(plazaZone2.startS + (plazaZone2.endS - plazaZone2.startS) * .7, 36, 35, .6);
    }
    // rotating holo globe
    if (plazaZone2) {
      const idx = plazaZone2.startIdx + Math.floor((plazaZone2.endIdx - plazaZone2.startIdx) * .55);
      const sm = track.samples[idx % track.N];
      const grp = new THREE.Group();
      grp.position.set(sm.pos.x + sm.right.x * 29, sm.pos.y + 27, sm.pos.z + sm.right.z * 29);
      const globe = new THREE.Mesh(new THREE.SphereGeometry(9, 18, 12),
        new THREE.MeshBasicMaterial({ color: 0x25edff, wireframe: true, transparent: true, opacity: .45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      grp.add(globe);
      const ring1 = new THREE.Mesh(new THREE.TorusGeometry(12, .14, 5, 64),
        new THREE.MeshBasicMaterial({ color: 0xff2d95, transparent: true, opacity: .6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
      ring1.rotation.x = 1.1; grp.add(ring1);
      const ring2 = ring1.clone(); ring2.rotation.set(1.9, .6, 0); ring2.scale.setScalar(1.16); grp.add(ring2);
      grp.userData = { globe, ring1, ring2 };
      env.group.add(grp);
      env.globe = grp;
    }

    // directional corner chevron boards
    {
      const geo = new THREE.PlaneGeometry(3.0, 4.4);
      const makeMat = dir => new THREE.MeshBasicMaterial({
        map: NR.chevronTexture('#ffb347', dir), transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false,
        side: THREE.DoubleSide, toneMapped: false
      });
      const mats = { '-1': makeMat(-1), '1': makeMat(1) };
      const lists = { '-1': [], '1': [] };
      for (let i = 30; i < track.N; i += 30) {
        const sm = track.samples[i];
        // Look a little further down the road so the sign reacts to the
        // corner's real direction, not to sampling noise.
        const ahead = track.samples[(i + 12) % track.N];
        const crossY = sm.tangent.z * ahead.tangent.x - sm.tangent.x * ahead.tangent.z;
        if (Math.abs(crossY) < .05) continue;
        const turn = crossY > 0 ? 1 : -1;      // +1 = left-hand corner
        const z = track.zoneRanges.find(r => r.startIdx <= i && i < r.endIdx);
        if (!z) continue;
        if (!['street', 'bridge', 'industrial', 'plaza'].includes(z.sector.id)) continue;
        // Put the board on the outside of the corner and point the arrows
        // into the turn (same direction the driver has to steer).
        const lat = -turn * 12.6;
        const x = sm.pos.x + sm.right.x * lat;
        const zz = sm.pos.z + sm.right.z * lat;
        const y = sm.pos.y + 2.35;
        const yaw = Math.atan2(sm.tangent.x, sm.tangent.z) + Math.PI;
        // Plane +X (texture dir +1) points to the driver's RIGHT, so a
        // left corner needs dir -1 and a right corner needs dir +1.
        lists[-turn].push({ x, y, z: zz, yaw });
      }
      for (const key of ['-1', '1']) {
        const list = lists[key];
        if (!list.length) continue;
        const im = new THREE.InstancedMesh(geo, mats[key], list.length);
        list.forEach((p, i) => {
          dummy.position.set(p.x, p.y, p.z);
          dummy.rotation.set(0, p.yaw, 0);
          dummy.scale.set(1, 1, 1);
          dummy.updateMatrix();
          im.setMatrixAt(i, dummy.matrix);
        });
        im.instanceMatrix.needsUpdate = true; im.frustumCulled = false;
        env.group.add(im);
      }
    }

    /* ---------------------------------------------------------
       DRONES
       --------------------------------------------------------- */
    const droneTex = NR.glowTexture();
    const drones = [];
    for (let i = 0; i < 7; i++) {
      const mat = new THREE.SpriteMaterial({
        map: droneTex, color: i % 2 ? 0x25edff : 0xff2d95, transparent: true,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: .8
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.set(3.4, 3.4, 1);
      env.group.add(sp);
      drones.push({
        sp, r: rr(80, 420), h: rr(30, 110), speed: rr(.05, .16) * (i % 2 ? 1 : -1),
        phase: rr(0, TAU), cx: 195 + rr(-200, 200), cz: 200 + rr(-200, 200)
      });
    }

    env.update = function (dt, time, camera) {
      env.time += dt;
      skyMat.uniforms.uTime.value = time;
      if (camera) sky.position.copy(camera.position);
      if (env.waterTex) {
        env.waterTex.offset.x += dt * .006;
        env.waterTex.offset.y += dt * .003;
      }
      // sign flicker
      for (const f of env.flicker) {
        let v = f.base * (.86 + .14 * Math.sin(time * f.speed + f.phase));
        if (Math.sin(time * .37 + f.phase * 9.0) > .996) v *= .25;
        f.mat.opacity = v;
      }
      // holograms
      for (const g of env.animated) {
        const u = g.userData;
        g.position.y = u.baseY + Math.sin(time * .7 + u.seed) * 1.6;
        u.mesh.rotation.y = Math.sin(time * .2 + u.seed) * .35;
        u.mesh.rotation.z = Math.sin(time * .45 + u.seed) * .06;
        u.ring.rotation.z += dt * .25;
        u.mesh.material.opacity = .62 + Math.sin(time * 2.3 + u.seed) * .08;
      }
      if (env.globe) {
        env.globe.userData.globe.rotation.y += dt * .18;
        env.globe.userData.ring1.rotation.z += dt * .22;
        env.globe.userData.ring2.rotation.z -= dt * .16;
      }
      drones.forEach(d => {
        const a = time * d.speed + d.phase;
        d.sp.position.set(d.cx + Math.cos(a) * d.r, d.h + Math.sin(time * .6 + d.phase) * 4, d.cz + Math.sin(a) * d.r);
      });
      // start bulbs pulse when idle? handled by game
      env.planet.material.opacity = .8 + Math.sin(time * .35) * .05;
    };

    env.setStartLights = env.startLights;
    env.setFog = (color, density) => { scene.fog = new THREE.FogExp2(color, density); };
    env.lights = { hemi, moon, rim };

    return env;
  }

  NR.buildEnvironment = buildEnvironment;
})(window.NR = window.NR || {});
