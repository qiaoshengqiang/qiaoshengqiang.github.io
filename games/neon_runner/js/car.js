/* ============================================================
   NEON RUNNER // car: procedural low-poly cyber racer
   ------------------------------------------------------------
   The body is built from many small parts and merged per material,
   so the extra detail (fenders, wing, diffuser, cockpit, lights)
   costs only a handful of draw calls per car.
   ============================================================ */
(function (NR) {
  'use strict';

  const TAU = Math.PI * 2;
  const cache = { ready: false };

  function extrudedProfile(points, width, bevel) {
    const shape = new THREE.Shape();
    points.forEach((p, i) => {
      if (i === 0) shape.moveTo(p[0], p[1]); else shape.lineTo(p[0], p[1]);
    });
    shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: width, bevelEnabled: true, bevelSize: bevel || .025,
      bevelThickness: bevel || .025, bevelSegments: 2, steps: 1, curveSegments: 1
    });
    geo.rotateY(-Math.PI / 2);
    geo.translate(width / 2, 0, 0);
    geo.computeVertexNormals();
    return geo;
  }

  function mat4(x, y, z, rx, ry, rz, sx, sy, sz) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0));
    m.compose(
      new THREE.Vector3(x || 0, y || 0, z || 0), q,
      new THREE.Vector3(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz)
    );
    return m;
  }

  function mergeTransformed(parts) {
    if (!parts || !parts.length) return null;
    let total = 0;
    const geos = [];
    for (const p of parts) {
      let g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
      g.applyMatrix4(p.matrix);
      geos.push(g);
      total += g.attributes.position.count;
    }
    const pos = new Float32Array(total * 3);
    const nor = new Float32Array(total * 3);
    const uv = new Float32Array(total * 2);
    let o = 0;
    for (const g of geos) {
      pos.set(g.attributes.position.array, o * 3);
      if (g.attributes.normal) nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += g.attributes.position.count;
      g.dispose();
    }
    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    merged.computeBoundingSphere();
    return merged;
  }

  function buildStaticBody() {
    const parts = { body: [], dark: [], glass: [], accent: [], accent2: [], head: [], tail: [] };
    const add = (key, geo, x, y, z, rx, ry, rz, sx, sy, sz) => {
      parts[key].push({ geo, matrix: mat4(x, y, z, rx, ry, rz, sx, sy, sz) });
    };
    const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);

    // ---- main wedge hull ------------------------------------------------
    const hull = extrudedProfile([
      [-2.10, .30], [2.10, .30], [2.18, .40], [2.02, .50], [1.62, .58],
      [1.05, .66], [.30, .73], [-.58, .77], [-1.08, .79], [-1.55, .83],
      [-1.98, .80], [-2.12, .66], [-2.16, .46], [-2.10, .36]
    ], 1.80, .045);
    add('body', hull, 0, 0, 0);

    // ---- greenhouse -----------------------------------------------------
    const cabin = extrudedProfile([
      [-1.12, .75], [.78, .72], [.34, 1.10], [-.62, 1.12], [-1.06, .92]
    ], 1.40, .02);
    add('glass', cabin, 0, 0, 0);
    add('dark', B(1.24, .04, .80), 0, 1.135, -.18);
    add('dark', B(.40, .085, .34), 0, 1.19, -.55);          // roof scoop
    add('accent2', B(.28, .015, .16), 0, 1.232, -.63);      // scoop mouth
    add('dark', B(.035, .16, .55), 0, 1.20, -.97);          // shark fin
    add('dark', B(.045, .40, .055), -.63, .93, .52, -.86);  // A-pillar L
    add('dark', B(.045, .40, .055), .63, .93, .52, -.86);   // A-pillar R

    // ---- muscular fenders ----------------------------------------------
    const fender = new THREE.SphereGeometry(1, 14, 10);
    add('body', fender, -.84, .52, 1.31, 0, 0, 0, .23, .30, .62);
    add('body', fender, .84, .52, 1.31, 0, 0, 0, .23, .30, .62);
    add('body', fender, -.85, .53, -1.31, 0, 0, 0, .24, .32, .68);
    add('body', fender, .85, .53, -1.31, 0, 0, 0, .24, .32, .68);

    // ---- hood / nose ----------------------------------------------------
    add('body', B(.64, .05, .85), 0, .620, 1.32, .12);
    add('dark', B(.22, .015, .16), -.44, .661, 1.24, .12);
    add('dark', B(.22, .015, .16), .44, .661, 1.24, .12);
    add('dark', B(.22, .015, .16), -.44, .637, 1.44, .12);
    add('dark', B(.22, .015, .16), .44, .637, 1.44, .12);
    add('dark', B(1.18, .15, .05), 0, .40, 2.17);           // nose intake
    add('dark', B(2.04, .05, .50), 0, .275, 2.03);          // splitter
    add('accent', B(1.86, .02, .06), 0, .302, 2.28);        // splitter lip
    add('dark', B(.40, .025, .20), -.95, .40, 1.95, 0, 0, .10);
    add('dark', B(.40, .025, .20), .95, .40, 1.95, 0, 0, -.10);

    // ---- sills / side intakes / livery ---------------------------------
    add('dark', B(.09, .14, 2.35), -.885, .275, 0);
    add('dark', B(.09, .14, 2.35), .885, .275, 0);
    add('dark', B(.045, .20, .58), -.902, .615, -.82);
    add('dark', B(.045, .20, .58), .902, .615, -.82);
    add('accent', B(.02, .025, .58), -.928, .726, -.82);
    add('accent', B(.02, .025, .58), .928, .726, -.82);
    add('accent', B(.02, .035, 2.15), -.908, .46, .06);
    add('accent2', B(.02, .035, 2.15), .908, .46, .06);
    add('accent2', B(.02, .02, 1.62), -.908, .705, -.30);
    add('accent', B(.02, .02, 1.62), .908, .705, -.30);
    // center racing stripe over hood / roof
    add('accent2', B(.055, .012, .75), 0, .698, .675, .125);
    add('accent2', B(.055, .012, .85), 0, .606, 1.475, .153);
    add('accent', B(.06, .012, .92), 0, 1.158, -.20);

    // ---- rear deck / wing / diffuser -----------------------------------
    add('dark', B(1.92, .05, .46), 0, 1.02, -1.93, -.10);
    add('dark', B(1.62, .035, .22), 0, 1.115, -2.02, -.18);
    add('dark', B(.035, .28, .58), -.97, 1.02, -1.96);
    add('dark', B(.035, .28, .58), .97, 1.02, -1.96);
    add('dark', B(.055, .40, .10), -.60, .79, -1.86, .10);
    add('dark', B(.055, .40, .10), .60, .79, -1.86, .10);
    add('accent2', B(1.72, .02, .03), 0, 1.005, -2.145);
    add('dark', B(1.58, .10, .46), 0, .285, -2.0, .16);     // diffuser
    for (let i = 0; i < 5; i++) {
      add('dark', B(.03, .20, .34), -.56 + i * .28, .245, -2.03, .16);
    }
    add('dark', B(1.20, .24, .04), 0, .545, -2.17);         // rear grille
    // exhaust tips + inner glow
    for (const side of [-1, 1]) {
      add('dark', new THREE.CylinderGeometry(.075, .075, .20, 10), side * .42, .405, -2.16, Math.PI / 2);
      add('accent2', new THREE.CylinderGeometry(.052, .052, .016, 8), side * .42, .405, -2.255, Math.PI / 2);
    }

    // ---- mirrors --------------------------------------------------------
    for (const side of [-1, 1]) {
      add('dark', B(.24, .028, .05), side * .97, .79, .50);
      add('dark', B(.17, .075, .20), side * 1.07, .80, .46);
      add('accent', B(.02, .055, .16), side * 1.157, .80, .46);
    }

    // ---- headlights -----------------------------------------------------
    for (const side of [-1, 1]) {
      add('head', B(.42, .055, .05), side * .52, .455, 2.12, .56, 0, side * .10);
      add('head', B(.03, .16, .045), side * .74, .455, 2.115, .56);
      add('head', B(.16, .03, .04), side * .46, .405, 2.17, .30);
    }

    // ---- taillights -----------------------------------------------------
    add('tail', B(1.60, .055, .05), 0, .725, -2.09);
    add('tail', B(.055, .22, .05), -.80, .635, -2.145);
    add('tail', B(.055, .22, .05), .80, .635, -2.145);
    add('accent2', B(1.50, .025, .03), 0, .47, -2.17);
    add('accent2', B(.09, .07, .04), 0, .44, -2.165);       // rain light

    // ---- cockpit --------------------------------------------------------
    add('dark', B(1.22, .10, .26), 0, .80, .48);            // dash
    for (const side of [-1, 1]) {
      add('dark', B(.32, .09, .42), side * .30, .72, -.30);
      add('dark', B(.34, .42, .09), side * .30, .91, -.52, -.12);
      add('dark', B(.20, .12, .08), side * .30, 1.105, -.55);
    }
    add('accent2', new THREE.SphereGeometry(.135, 10, 8), -.30, .985, -.34);
    add('accent', new THREE.TorusGeometry(.12, .018, 6, 14), -.30, .855, .22, 0, 0, 0, 1, 1, 1);

    const out = {};
    for (const k in parts) out[k] = mergeTransformed(parts[k]);
    return out;
  }

  function buildWheelGeometries() {
    const tire = new THREE.CylinderGeometry(.37, .37, .30, 22, 1);
    tire.rotateZ(Math.PI / 2);

    const rimParts = [];
    const barrel = new THREE.CylinderGeometry(.235, .235, .305, 18, 1);
    rimParts.push({ geo: barrel, matrix: mat4(0, 0, 0, 0, 0, Math.PI / 2) });
    const hub = new THREE.CylinderGeometry(.07, .07, .315, 10);
    rimParts.push({ geo: hub, matrix: mat4(0, 0, 0, 0, 0, Math.PI / 2) });
    for (let i = 0; i < 5; i++) {
      const spoke = new THREE.BoxGeometry(.06, .36, .075);
      const m = new THREE.Matrix4()
        .makeRotationX(i * TAU / 5)
        .multiply(new THREE.Matrix4().makeTranslation(0, .10, 0));
      rimParts.push({ geo: spoke, matrix: m });
    }
    const ring = new THREE.TorusGeometry(.208, .014, 5, 22);
    rimParts.push({ geo: ring, matrix: mat4(0, 0, 0, 0, Math.PI / 2, 0) });
    const rim = mergeTransformed(rimParts);

    const disc = new THREE.CylinderGeometry(.19, .19, .025, 16);
    disc.rotateZ(Math.PI / 2);
    const caliper = new THREE.BoxGeometry(.055, .14, .16);

    return { tire, rim, disc, caliper };
  }

  function makeNumberTexture(number) {
    const c = NR.makeCanvas(256, 256), ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 256, 256);
    ctx.beginPath(); ctx.arc(128, 128, 108, 0, TAU);
    ctx.fillStyle = 'rgba(4,8,17,.72)'; ctx.fill();
    ctx.strokeStyle = '#25edff'; ctx.lineWidth = 8;
    ctx.shadowColor = '#25edff'; ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 22; ctx.fillStyle = '#efffff';
    ctx.font = '900 118px "Arial Black","Hiragino Sans","PingFang SC",sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(number).padStart(2, '0'), 128, 124);
    ctx.shadowBlur = 8; ctx.fillStyle = '#ff2d95';
    ctx.font = '700 21px "SFMono-Regular",Menlo,monospace';
    ctx.fillText('NEON RUNNER', 128, 214);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    return t;
  }

  function makePlateMaterial(number) {
    const c = NR.makeCanvas(256, 64), ctx = c.getContext('2d');
    ctx.fillStyle = '#060912'; ctx.fillRect(0, 0, 256, 64);
    ctx.strokeStyle = '#ff2d95'; ctx.lineWidth = 3; ctx.strokeRect(3, 3, 250, 58);
    ctx.font = '700 25px "SFMono-Regular",Menlo,monospace';
    ctx.fillStyle = '#7ff7ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('NR-2087 // ' + String(number).padStart(2, '0'), 128, 33);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return new THREE.MeshBasicMaterial({ map: t, toneMapped: false });
  }

  function initAssets() {
    if (cache.ready) return;
    cache.ready = true;
    cache.static = buildStaticBody();
    cache.wheels = buildWheelGeometries();
    cache.numbers = {};
    cache.plates = {};

    // shadow / glow textures
    cache.shadowTex = (() => {
      const c = NR.makeCanvas(256, 256), ctx = c.getContext('2d');
      const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 126);
      g.addColorStop(0, 'rgba(0,0,0,.75)');
      g.addColorStop(.5, 'rgba(0,0,0,.45)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.ellipse(128, 128, 92, 124, 0, 0, TAU); ctx.fill();
      const t = new THREE.CanvasTexture(c); t.encoding = THREE.sRGBEncoding; return t;
    })();
  }

  function createWheels(tilt, tireMat, rimMat, brakeMat, accentMat) {
    const wheels = [];
    const positions = [
      [-.96, .37, 1.34, true], [.96, .37, 1.34, true],
      [-.98, .37, -1.34, false], [.98, .37, -1.34, false]
    ];
    for (const [x, y, z, front] of positions) {
      const steer = new THREE.Group();
      steer.position.set(x, y, z);
      const spin = new THREE.Group();
      steer.add(spin);
      spin.add(new THREE.Mesh(cache.wheels.tire, tireMat));
      spin.add(new THREE.Mesh(cache.wheels.rim, rimMat));
      const disc = new THREE.Mesh(cache.wheels.disc, brakeMat);
      spin.add(disc);
      // A real caliper does not rotate with the wheel.
      const caliper = new THREE.Mesh(cache.wheels.caliper, accentMat);
      caliper.position.set(x > 0 ? .075 : -.075, .11, -.115);
      steer.add(caliper);
      tilt.add(steer);
      wheels.push({ steer, spin, front });
    }
    return wheels;
  }

  function createCar(opts) {
    opts = opts || {};
    initAssets();
    const isPlayer = !!opts.player;
    const envMap = NR.envCube;
    const color = opts.color != null ? opts.color : 0x4b0b42;
    const accent = opts.accent != null ? opts.accent : 0x25edff;
    const accent2 = opts.accent2 != null ? opts.accent2 : 0xff2d95;
    const number = opts.number != null ? opts.number : 7;

    const group = new THREE.Group();
    const tilt = new THREE.Group();
    group.add(tilt);

    const bodyMat = new THREE.MeshStandardMaterial({
      color, metalness: .86, roughness: .26, envMap: envMap, envMapIntensity: 1.2
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x10151f, metalness: .82, roughness: .42, envMap: envMap, envMapIntensity: .55
    });
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x07131c, metalness: .95, roughness: .07, envMap: envMap,
      envMapIntensity: 1.4, transparent: true, opacity: .58, depthWrite: false
    });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x07080b, roughness: .92, metalness: .05 });
    const rimMat = new THREE.MeshStandardMaterial({
      color: 0x222833, metalness: 1, roughness: .18, envMap: envMap,
      emissive: accent, emissiveIntensity: .55
    });
    const brakeMat = new THREE.MeshStandardMaterial({
      color: 0x2a0b10, metalness: .85, roughness: .35,
      emissive: 0x6a0008, emissiveIntensity: .35
    });
    const accentMat = new THREE.MeshBasicMaterial({ color: accent, toneMapped: false });
    const accent2Mat = new THREE.MeshBasicMaterial({ color: accent2, toneMapped: false });
    const headMat = new THREE.MeshBasicMaterial({ color: 0xe8ffff, toneMapped: false });
    const tailMat = new THREE.MeshBasicMaterial({ color: 0xff2d55, toneMapped: false });

    const body = new THREE.Group();
    tilt.add(body);

    // merged static shell, one mesh per material
    const staticMats = {
      body: bodyMat, dark: darkMat, glass: glassMat,
      accent: accentMat, accent2: accent2Mat, head: headMat, tail: tailMat
    };
    for (const key in staticMats) {
      if (!cache.static[key]) continue;
      const mesh = new THREE.Mesh(cache.static[key], staticMats[key]);
      mesh.frustumCulled = false;
      body.add(mesh);
    }

    // door number roundels
    if (!cache.numbers[number]) cache.numbers[number] = makeNumberTexture(number);
    const numMat = new THREE.MeshBasicMaterial({
      map: cache.numbers[number], transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, toneMapped: false
    });
    for (const side of [-1, 1]) {
      const decal = new THREE.Mesh(new THREE.PlaneGeometry(.56, .56), numMat);
      decal.position.set(side * .915, .555, .10);
      decal.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2;
      body.add(decal);
    }

    // plate
    if (!cache.plates[number]) cache.plates[number] = makePlateMaterial(number);
    const plate = new THREE.Mesh(new THREE.PlaneGeometry(.64, .16), cache.plates[number]);
    plate.position.set(0, .405, -2.175);
    plate.rotation.y = Math.PI;
    body.add(plate);

    const wheels = createWheels(tilt, tireMat, rimMat, brakeMat, accent2Mat);

    // underglow
    const underglow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.9, 5.5),
      new THREE.MeshBasicMaterial({
        map: NR.glowTexture(), color: isPlayer ? 0xff2d95 : accent,
        transparent: true, opacity: .38, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false
      })
    );
    underglow.rotation.x = -Math.PI / 2;
    underglow.position.y = .04;
    tilt.add(underglow);

    // nitro flames
    let nitroMats = [];
    if (isPlayer) {
      const nitroGeo = new THREE.ConeGeometry(.17, .95, 8, 1, true);
      nitroGeo.rotateX(-Math.PI / 2);
      nitroGeo.translate(0, 0, -.475);
      for (const side of [-1, 1]) {
        const mat = new THREE.MeshBasicMaterial({
          color: 0x9dfbff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending,
          depthWrite: false, side: THREE.DoubleSide, toneMapped: false
        });
        const flame = new THREE.Mesh(nitroGeo, mat);
        flame.position.set(side * .42, .405, -2.22);
        flame.scale.set(.62, .62, 1.15);
        body.add(flame);
        nitroMats.push(mat);
      }
      const haloMat = new THREE.SpriteMaterial({
        map: NR.glowTexture(), color: 0x74eaff, transparent: true, opacity: 0,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      });
      const halo = new THREE.Sprite(haloMat);
      halo.position.set(0, .42, -2.55);
      halo.scale.set(4.2, 2.5, 1);
      body.add(halo);
      nitroMats.push(haloMat);
    }

    // contact shadow
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(3.1, 5.7),
      new THREE.MeshBasicMaterial({
        map: cache.shadowTex, color: 0x000000, transparent: true, opacity: .72,
        depthWrite: false
      })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = .012;
    group.add(shadow);

    // headlight spot (player only)
    let spot = null, spotTarget = null;
    if (isPlayer) {
      spot = new THREE.SpotLight(0xbfefff, 2.4, 60, .52, .62, 1.45);
      spot.position.set(0, .74, 1.9);
      spotTarget = new THREE.Object3D();
      spotTarget.position.set(0, .05, 28);
      body.add(spot);
      body.add(spotTarget);
      spot.target = spotTarget;
    }

    const car = {
      group, tilt, body, wheels, isPlayer,
      wheelSpin: 0,
      lean: 0,
      pitch: 0,
      spot,
      underglow,
      accentMat, accent2Mat, tailMat, brakeMat,
      nitroMats,
      dimensions: { halfWidth: 1.0, halfLength: 2.2, wheelRadius: .37 },
      setNitro(on) { car._nitro = on; },
      update(dt, speed, steerInput, throttle, brake, boosting, drifting) {
        const spin = speed / .37 * dt;
        for (const w of wheels) {
          w.spin.rotation.x += spin;
          if (w.front) w.steer.rotation.y = NR.damp(w.steer.rotation.y, steerInput * .44, 14, dt);
        }
        // body lean and pitch
        const speedK = NR.clamp(Math.abs(speed) / 34, 0, 1);
        const targetLean = -steerInput * .05 * speedK;
        const targetPitch = NR.clamp(-throttle * .018 + brake * .028, -.04, .04);
        car.lean = NR.damp(car.lean, targetLean, 10, dt);
        car.pitch = NR.damp(car.pitch, targetPitch, 8, dt);
        body.rotation.z = car.lean;
        body.rotation.x = car.pitch + Math.sin(performance.now() * .02) * .0015 * speedK;
        body.position.y = Math.sin(performance.now() * .017) * .004 * speedK;
        // boost flames
        const nitro = boosting ? 1 : 0;
        car._nitroVis = NR.damp(car._nitroVis || 0, nitro, 8, dt);
        nitroMats.forEach((m, i) => {
          m.opacity = car._nitroVis * (i === 2 ? .55 : .9);
        });
        // brake lights / discs
        tailMat.color.setHex(brake > .1 ? 0xff7080 : 0xff2038);
        brakeMat.emissiveIntensity = .35 + brake * 2.2;
        underglow.material.opacity = .3 + car._nitroVis * .3 + (drifting ? .12 : 0);
        underglow.material.color.setHex(drifting ? 0x25edff : (isPlayer ? 0xff2d95 : accent));
        // headlight pulse
        if (spot) spot.intensity = 2.3 + Math.sin(performance.now() * .004) * .14;
      }
    };
    car._nitroVis = 0;
    return car;
  }

  // Simple obstacle / barrier model factory
  NR.createObstacle = function (type, color) {
    const g = new THREE.Group();
    const dark = new THREE.MeshStandardMaterial({
      color: 0x161c28, metalness: .7, roughness: .45, envMap: NR.envCube
    });
    const glow = new THREE.MeshBasicMaterial({ color: color || 0xffb347, toneMapped: false });
    if (type === 'barrier') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.05, .55), dark);
      body.position.y = .55;
      g.add(body);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(4.2, .12, .58), glow);
      stripe.position.y = 1.08;
      g.add(stripe);
      for (const side of [-1, 1]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(.25, .8, .7), dark);
        leg.position.set(side * 1.8, .4, 0);
        g.add(leg);
      }
    } else if (type === 'block') {
      const body = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.2, 1.2), dark);
      body.position.y = .6;
      g.add(body);
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(2.42, .16, 1.22), glow);
      stripe.position.y = 1.12;
      g.add(stripe);
    } else if (type === 'drum') {
      const body = new THREE.Mesh(new THREE.CylinderGeometry(.52, .52, 1.15, 12), dark);
      body.position.y = .58;
      g.add(body);
      for (const y of [.42, .8]) {
        const band = new THREE.Mesh(new THREE.CylinderGeometry(.535, .535, .1, 12), glow);
        band.position.y = y;
        g.add(band);
      }
    } else if (type === 'gate') {
      for (const side of [-1, 1]) {
        const post = new THREE.Mesh(new THREE.BoxGeometry(.3, 4.2, .3), dark);
        post.position.set(side * 3.4, 2.1, 0);
        g.add(post);
      }
      const top = new THREE.Mesh(new THREE.BoxGeometry(7.1, .5, .5), dark);
      top.position.y = 4.2; g.add(top);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(6.8, .1, .52), glow);
      strip.position.y = 3.9; g.add(strip);
    }
    return g;
  };

  NR.createCar = createCar;
})(window.NR = window.NR || {});
