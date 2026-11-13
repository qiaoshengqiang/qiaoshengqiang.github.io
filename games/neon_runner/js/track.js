/* ============================================================
   NEON RUNNER // track: spline, sectors, road ribbons, tunnel
   ============================================================ */
(function (NR) {
  'use strict';

  const TAU = Math.PI * 2;
  const N = 1600;
  const HALF = 10.5;        // road half width (21 m)
  const WALL_LIMIT = 9.92;  // car lateral collision limit
  const SECTOR_DEFS = NR.SECTORS;

  // Clean single-loop circuit. Direction: start heading +X (east).
  const CONTROL = [
    [-150, 0, -150],  // 0 START / finish straight
    [0, 0, -150],
    [120, 0, -130],
    [200, 0, -80],    // 3 street -> elevated
    [250, 5, 0],
    [300, 12, 100],
    [360, 18, 190],
    [450, 21, 250],   // 7 elevated -> bridge
    [560, 23, 300],
    [650, 24, 370],
    [690, 23, 460],
    [640, 21, 540],
    [540, 19, 580],
    [440, 16, 570],   // 13 bridge -> tunnel (approach)
    [370, 10, 520],
    [330, 4, 460],    // portal entry crossing near here
    [300, -2, 390],
    [280, -5, 310],
    [270, -6, 230],
    [260, -5, 150],
    [240, -1, 90],
    [200, 0, 40],     // 21 tunnel -> industrial (exit portal)
    [130, 0, 10],
    [50, 0, 0],
    [-40, 0, 0],      // 24 industrial -> plaza
    [-140, 0, -20],
    [-230, 0, -60],
    [-300, 0, -100],
    [-300, 0, -170],
    [-240, 0, -180]   // final sweep back to start
  ];

  function nearestIndexToPoint(samples, x, y, z) {
    let best = 0, bd = Infinity;
    const v = new THREE.Vector3(x, y, z);
    for (let i = 0; i < samples.length; i++) {
      const d = samples[i].pos.distanceToSquared(v);
      if (d < bd) { bd = d; best = i; }
    }
    return best;
  }

  function makeTrack() {
    const curve = new THREE.CatmullRomCurve3(
      CONTROL.map(p => new THREE.Vector3(p[0], p[1], p[2])), true, 'catmullrom', 0.45
    );
    const length = curve.getLength();
    const spacing = length / N;

    const samples = [];
    for (let i = 0; i < N; i++) {
      const pos = curve.getPointAt(i / N);
      samples.push({
        pos,
        i,
        dist: i * spacing,
        s: i / N,
        tangent: new THREE.Vector3(),
        right: new THREE.Vector3(),
        slope: 0,
        curvature: 0,
        sector: 0
      });
    }
    // tangents / right vectors
    for (let i = 0; i < N; i++) {
      const a = samples[(i - 1 + N) % N].pos;
      const b = samples[(i + 1) % N].pos;
      const t = new THREE.Vector3().subVectors(b, a).normalize();
      samples[i].tangent.copy(t);
      samples[i].right.set(t.z, 0, -t.x).normalize(); // up x forward
      samples[i].slope = Math.atan2(t.y, Math.hypot(t.x, t.z));
      const t2 = samples[(i + 8) % N].tangent;
      samples[i].curvature = Math.acos(NR.clamp(t.dot(t2), -1, 1));
    }

    // sector boundaries: closest samples to designated control points
    const boundaryIdx = [3, 7, 13, 21, 24].map(ci => {
      const c = CONTROL[ci];
      return nearestIndexToPoint(samples, c[0], c[1], c[2]);
    });
    boundaryIdx.unshift(0);
    boundaryIdx.push(N);
    // ensure monotonic (in case of weird curve sampling)
    for (let i = 1; i < boundaryIdx.length; i++) {
      if (boundaryIdx[i] <= boundaryIdx[i - 1]) boundaryIdx[i] = boundaryIdx[i - 1] + 1;
    }

    const zoneRanges = SECTOR_DEFS.map((sector, z) => ({
      sector, zone: z,
      startIdx: boundaryIdx[z], endIdx: boundaryIdx[z + 1],
      startS: boundaryIdx[z] / N, endS: boundaryIdx[z + 1] / N
    }));

    function zoneAtIdx(i) {
      i = NR.wrap(i, N);
      for (let z = 0; z < zoneRanges.length; z++) {
        const r = zoneRanges[z];
        if (r.endIdx >= N) {
          if (i >= r.startIdx || i < r.endIdx - N) return z;
        } else if (i >= r.startIdx && i < r.endIdx) return z;
      }
      return 0;
    }
    for (let i = 0; i < N; i++) samples[i].sector = zoneAtIdx(i);

    function sectorAtS(s) {
      s = NR.wrap(s, 1);
      for (let z = 0; z < zoneRanges.length; z++) {
        const r = zoneRanges[z];
        if (r.endIdx >= N) {
          if (s >= r.startS || s < r.endS) return r;
        } else if (s >= r.startS && s < r.endS) return r;
      }
      return zoneRanges[0];
    }

    // tunnel portals = ground crossings after bridge, before industrial
    let portalEntry = -1, portalExit = -1;
    for (let i = 400; i < 1000; i++) {
      if (samples[(i - 1 + N) % N].y >= 0 && samples[i].y < 0) { portalEntry = i; break; }
    }
    if (portalEntry < 0) portalEntry = Math.floor(0.58 * N);
    for (let i = portalEntry + 40; i < 1300; i++) {
      if (samples[(i - 1 + N) % N].y < 0 && samples[i].y >= 0) { portalExit = i; break; }
    }
    if (portalExit < 0) portalExit = Math.floor(0.73 * N);

    const track = {
      curve, N, length, spacing, samples, halfWidth: HALF, wallLimit: WALL_LIMIT,
      zoneRanges, sectorAtS, boundaryIdx, portalEntry, portalExit,
      startIndex: 0,
      startDist: 0,
      sectors: SECTOR_DEFS,
      query, pointAt, frameAt, sampleAtS, nearestIndexToPoint: (x, y, z) => nearestIndexToPoint(samples, x, y, z)
    };

    // ---------- query / interpolation ----------
    function query(pos, hint) {
      hint = hint == null ? 0 : hint;
      let best = -1, bd = Infinity;
      const W = 40;
      for (let k = -W; k <= W; k++) {
        const idx = NR.wrap(hint + k, N);
        const p = samples[idx].pos;
        const dx = pos.x - p.x, dy = pos.y - p.y, dz = pos.z - p.z;
        const d = dx * dx + dy * dy + dz * dz;
        if (d < bd) { bd = d; best = idx; }
      }
      // fall back to global if clearly not on the local piece
      if (bd > 60 * 60) {
        for (let i = 0; i < N; i += 2) {
          const p = samples[i].pos;
          const dx = pos.x - p.x, dy = pos.y - p.y, dz = pos.z - p.z;
          const d = dx * dx + dy * dy + dz * dz;
          if (d < bd) { bd = d; best = i; }
        }
      }
      const sm = samples[best];
      const dx = pos.x - sm.pos.x, dy = pos.y - sm.pos.y, dz = pos.z - sm.pos.z;
      const along = dx * sm.tangent.x + dy * sm.tangent.y + dz * sm.tangent.z;
      const nx = samples[(best + 1) % N].pos;
      const segLen = sm.pos.distanceTo(nx);
      const frac = segLen > 0.0001 ? along / segLen : 0;
      const f = NR.clamp(frac, 0, 1);
      const s = NR.wrap((best + f) / N, 1);
      const gy = NR.lerp(sm.pos.y, nx.y, f);
      const lat = dx * sm.right.x + dz * sm.right.z;
      return {
        idx: best, s, lat, groundY: gy,
        dist: (best + f) * spacing,
        tangent: sm.tangent, right: sm.right, sample: sm,
        sector: sectorAtS(s).sector, offTrack: Math.abs(lat) > HALF
      };
    }

    function sampleAtS(s) {
      s = NR.wrap(s, 1);
      const f = s * N;
      const i = Math.floor(f) % N;
      return samples[i];
    }

    function pointAt(s, lat, yOff) {
      s = NR.wrap(s, 1);
      const f = s * N;
      const i = Math.floor(f) % N;
      const next = (i + 1) % N;
      const t = f - Math.floor(f);
      const p = new THREE.Vector3().lerpVectors(samples[i].pos, samples[next].pos, t);
      const r = new THREE.Vector3().lerpVectors(samples[i].right, samples[next].right, t).normalize();
      p.addScaledVector(r, lat || 0);
      p.y += yOff || 0;
      return p;
    }

    function frameAt(s) {
      const sm = sampleAtS(s);
      return {
        pos: pointAt(s, 0, 0),
        tangent: sm.tangent.clone(),
        right: sm.right.clone(),
        yaw: Math.atan2(sm.tangent.x, sm.tangent.z),
        pitch: sm.slope,
        sample: sm
      };
    }

    // ---------- geometry build ----------
    track.build = function (scene) {
      const group = new THREE.Group();
      group.name = 'TRACK';
      scene.add(group);
      const envMap = NR.envCube;

      // --- materials ---
      const asphaltMap = NR.asphaltTexture();
      asphaltMap.repeat.set(1.7, 1);
      const asphaltMat = new THREE.MeshStandardMaterial({
        map: asphaltMap, color: 0xb8c1cc, roughness: .3, metalness: .52,
        envMap: envMap, envMapIntensity: .5
      });
      const sidewalkMat = new THREE.MeshStandardMaterial({
        map: NR.sidewalkTexture(), color: 0x9aa3b0, roughness: .78, metalness: .1
      });
      const concreteMat = new THREE.MeshStandardMaterial({
        map: NR.concreteTexture('#23262f'), color: 0xa0a8b5, roughness: .82, metalness: .08
      });
      const metalMat = new THREE.MeshStandardMaterial({
        map: NR.metalTexture(), color: 0x8b95a8, roughness: .42, metalness: .8,
        envMap: envMap, envMapIntensity: .45
      });
      const darkMetalMat = new THREE.MeshStandardMaterial({
        color: 0x151a26, roughness: .48, metalness: .82, envMap: envMap, envMapIntensity: .3
      });
      const glowMat = new THREE.MeshBasicMaterial({
        vertexColors: true, toneMapped: false, side: THREE.DoubleSide
      });
      const glowMatSoft = new THREE.MeshBasicMaterial({
        vertexColors: true, transparent: true, opacity: .13, side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false
      });

      const col = new THREE.Color();
      const zoneColor = z => new THREE.Color(SECTOR_DEFS[z].color);

      function ribbon(startIdx, endIdx, latA, latB, yA, yB, material, opts) {
        opts = opts || {};
        let count = endIdx - startIdx;
        if (endIdx >= N && startIdx === 0) count = N;
        if (count <= 0) count += N;
        const rows = count + 1;
        const startDist = samples[startIdx % N].dist;
        const verts = rows * 2;
        const positions = new Float32Array(verts * 3);
        const uvs = new Float32Array(verts * 2);
        const colors = (material === glowMat || material === glowMatSoft || opts.colors) ? new Float32Array(verts * 3) : null;
        const vScale = opts.vScale || 20;
        for (let k = 0; k < rows; k++) {
          const idx = (startIdx + (k % count)) % N;
          const sm = samples[idx];
          const y0 = (yA || 0) + (opts.terrainY ? sm.pos.y : 0);
          const y1 = (yB || 0) + (opts.terrainY ? sm.pos.y : 0);
          const ax = sm.pos.x + sm.right.x * latA;
          const az = sm.pos.z + sm.right.z * latA;
          const bx = sm.pos.x + sm.right.x * latB;
          const bz = sm.pos.z + sm.right.z * latB;
          const o = k * 6;
          positions[o] = ax; positions[o + 1] = y0; positions[o + 2] = az;
          positions[o + 3] = bx; positions[o + 4] = y1; positions[o + 5] = bz;
          const vv = (startDist + k * spacing) / vScale;
          uvs[k * 4] = 0; uvs[k * 4 + 1] = vv;
          uvs[k * 4 + 2] = 1; uvs[k * 4 + 3] = vv;
          if (colors) {
            const z = opts.colorSector != null ? opts.colorSector : sm.sector;
            col.setHex(SECTOR_DEFS[z].color);
            colors[k * 6] = col.r; colors[k * 6 + 1] = col.g; colors[k * 6 + 2] = col.b;
            colors[k * 6 + 3] = col.r; colors[k * 6 + 4] = col.g; colors[k * 6 + 5] = col.b;
          }
        }
        const indices = [];
        for (let k = 0; k < rows - 1; k++) {
          const a = k * 2, b = a + 1, c = a + 2, d = a + 3;
          indices.push(a, c, b, b, c, d);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        g.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
        if (colors) g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        g.setIndex(indices);
        g.computeVertexNormals();
        const mesh = new THREE.Mesh(g, material);
        mesh.frustumCulled = false;
        if (opts.renderOrder != null) mesh.renderOrder = opts.renderOrder;
        group.add(mesh);
        return mesh;
      }

      function quadStrip(startIdx, endIdx, lat, width, y, material, dashLen, gapLen, rgbaFunc) {
        const positions = [], colors = [], uvs = [];
        let idx = startIdx;
        const end = endIdx >= N ? endIdx : endIdx;
        const total = (end - startIdx + N) % N || N;
        // convert metric dash lengths to samples
        const dashSamples = Math.max(1, Math.round(dashLen / spacing));
        const gapSamples = Math.max(1, Math.round(gapLen / spacing));
        let cursor = 0;
        const colorArr = rgbaFunc ? new Float32Array(3) : null;
        while (cursor < total) {
          const i0 = (startIdx + cursor) % N;
          const i1 = (startIdx + cursor + dashSamples) % N;
          const s0 = samples[i0], s1 = samples[i1];
          const hw = width * .5;
          const p = [
            s0.pos.x + s0.right.x * (lat - hw), s0.pos.y + y, s0.pos.z + s0.right.z * (lat - hw),
            s0.pos.x + s0.right.x * (lat + hw), s0.pos.y + y, s0.pos.z + s0.right.z * (lat + hw),
            s1.pos.x + s1.right.x * (lat - hw), s1.pos.y + y, s1.pos.z + s1.right.z * (lat - hw),
            s1.pos.x + s1.right.x * (lat + hw), s1.pos.y + y, s1.pos.z + s1.right.z * (lat + hw)
          ];
          positions.push(...p);
          if (rgbaFunc) {
            rgbaFunc(s0, colorArr);
            for (let v = 0; v < 4; v++) colors.push(colorArr[0], colorArr[1], colorArr[2]);
          }
          uvs.push(0, 0, 1, 0, 0, 1, 1, 1);
          cursor += dashSamples + gapSamples;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        if (rgbaFunc) g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        const idxs = [];
        for (let q = 0; q < positions.length / 12; q++) {
          const a = q * 4;
          idxs.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
        g.setIndex(idxs);
        g.computeVertexNormals();
        const mesh = new THREE.Mesh(g, material);
        mesh.frustumCulled = false;
        group.add(mesh);
        return mesh;
      }

      // --- road surface ---
      ribbon(0, N, -HALF, HALF, .035, .035, asphaltMat, {
        vScale: 22, terrainY: true, renderOrder: 0
      });

      // subtle road-side wet reflection bands (neon wash)
      const wetMatA = new THREE.MeshBasicMaterial({
        color: 0x25edff, transparent: true, opacity: .055, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false, side: THREE.DoubleSide
      });
      const wetMatB = new THREE.MeshBasicMaterial({
        color: 0xff2d95, transparent: true, opacity: .05, blending: THREE.AdditiveBlending,
        depthWrite: false, toneMapped: false, side: THREE.DoubleSide
      });
      ribbon(0, N, -9.8, -4.0, .055, .055, wetMatA, { terrainY: true, vScale: 30, renderOrder: 1 });
      ribbon(0, N, 4.0, 9.8, .055, .055, wetMatB, { terrainY: true, vScale: 30, renderOrder: 1 });

      // lane dashes: center + two lane guides
      const laneMat = new THREE.MeshBasicMaterial({
        color: 0x7197aa, transparent: true, opacity: .42, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false
      });
      const centerMat = new THREE.MeshBasicMaterial({
        color: 0x8ff8ff, transparent: true, opacity: .5, depthWrite: false,
        blending: THREE.AdditiveBlending, toneMapped: false
      });
      quadStrip(0, N, 0, .17, .065, centerMat, 5.5, 9.5);
      quadStrip(0, N, -5.2, .12, .062, laneMat, 4.5, 10.5);
      quadStrip(0, N, 5.2, .12, .062, laneMat, 4.5, 10.5);

      // neon rumble dash just inside the barriers
      quadStrip(0, N, -9.72, .5, .06, glowMat, 3.2, 2.7, (sm, out) => {
        col.setHex(SECTOR_DEFS[sm.sector].color);
        out[0] = col.r; out[1] = col.g; out[2] = col.b;
      });
      quadStrip(0, N, 9.72, .5, .06, glowMat, 3.2, 2.7, (sm, out) => {
        col.setHex(SECTOR_DEFS[sm.sector].color);
        out[0] = col.r; out[1] = col.g; out[2] = col.b;
      });

      // --- neon edge lines ---
      ribbon(0, N, -10.18, -9.97, .075, .075, glowMat, { terrainY: true, vScale: 30, renderOrder: 2 });
      ribbon(0, N, 9.97, 10.18, .075, .075, glowMat, { terrainY: true, vScale: 30, renderOrder: 2 });
      ribbon(0, N, -10.9, -9.7, .072, .072, glowMatSoft, { terrainY: true, vScale: 30, renderOrder: 2 });
      ribbon(0, N, 9.7, 10.9, .072, .072, glowMatSoft, { terrainY: true, vScale: 30, renderOrder: 2 });

      // --- curb / shoulder / deck ---
      for (const r of zoneRanges) {
        const zid = r.sector.id;
        if (zid === 'street' || zid === 'plaza' || zid === 'industrial') {
          // raised walkways
          ribbon(r.startIdx, r.endIdx, -13.3, -HALF, .2, .2, sidewalkMat, { terrainY: true, vScale: 8 });
          ribbon(r.startIdx, r.endIdx, HALF, 13.3, .2, .2, sidewalkMat, { terrainY: true, vScale: 8 });
          // curb face
          ribbon(r.startIdx, r.endIdx, -HALF, -HALF, .03, .2, concreteMat, { terrainY: true, vScale: 4 });
          ribbon(r.startIdx, r.endIdx, HALF, HALF, .03, .2, concreteMat, { terrainY: true, vScale: 4 });
          // curb glow strip
          ribbon(r.startIdx, r.endIdx, -10.55, -10.39, .205, .205, glowMat, { terrainY: true, colorSector: r.zone });
          ribbon(r.startIdx, r.endIdx, 10.39, 10.55, .205, .205, glowMat, { terrainY: true, colorSector: r.zone });
        } else {
          // service ledge
          ribbon(r.startIdx, r.endIdx, -11.9, -HALF, .08, .08, darkMetalMat, { terrainY: true, vScale: 6 });
          ribbon(r.startIdx, r.endIdx, HALF, 11.9, .08, .08, darkMetalMat, { terrainY: true, vScale: 6 });
        }
        if (zid === 'elevated' || zid === 'bridge') {
          // deck fascia and underside
          ribbon(r.startIdx, r.endIdx, -12.15, -12.15, .08, -1.35, darkMetalMat, { terrainY: true, vScale: 6 });
          ribbon(r.startIdx, r.endIdx, 12.15, 12.15, .08, -1.35, darkMetalMat, { terrainY: true, vScale: 6 });
          ribbon(r.startIdx, r.endIdx, -12.15, 12.15, -1.35, -1.35, darkMetalMat, {
            terrainY: true, vScale: 6, reverse: true
          });
          // neon underglow along deck
          ribbon(r.startIdx, r.endIdx, -12.2, -12.05, -.68, -.68, glowMat, { terrainY: true, colorSector: r.zone });
          ribbon(r.startIdx, r.endIdx, 12.05, 12.2, -.68, -.68, glowMat, { terrainY: true, colorSector: r.zone });
        }
      }

      // --- barriers (continuous) ---
      const railBottom = .08, railTop = 1.05;
      const barrierGeo = (lat, mirror) => {
        const rows = N + 1, positions = [], uvs = [], indices = [];
        for (let k = 0; k < rows; k++) {
          const sm = samples[k % N];
          const x = sm.pos.x + sm.right.x * lat;
          const z = sm.pos.z + sm.right.z * lat;
          positions.push(x, sm.pos.y + railBottom, z, x, sm.pos.y + railTop, z);
          const v = sm.dist / 4;
          uvs.push(0, v, 1, v);
        }
        for (let k = 0; k < N; k++) {
          const a = k * 2, b = a + 1, c = a + 2, d = a + 3;
          if (mirror) indices.push(a, c, b, b, c, d);
          else indices.push(a, b, c, b, d, c);
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        g.setIndex(indices);
        g.computeVertexNormals();
        const mesh = new THREE.Mesh(g, metalMat);
        mesh.frustumCulled = false;
        group.add(mesh);
        return mesh;
      };
      barrierGeo(-11.0, false);
      barrierGeo(11.0, true);

      // glowing handrail caps
      ribbon(0, N, -11.055, -10.945, 1.06, 1.06, glowMat, { terrainY: true, vScale: 30, renderOrder: 3 });
      ribbon(0, N, 10.945, 11.055, 1.06, 1.06, glowMat, { terrainY: true, vScale: 30, renderOrder: 3 });
      // vertical glow line at barrier base
      ribbon(0, N, -11.0, -11.0, .18, .28, glowMat, { terrainY: true, colorSector: undefined, vScale: 30 });
      ribbon(0, N, 11.0, 11.0, .18, .28, glowMat, { terrainY: true, vScale: 30 });

      // barrier posts
      const postGeo = new THREE.BoxGeometry(.16, .92, .26);
      const postCount = Math.ceil(N / 5) * 2;
      const posts = new THREE.InstancedMesh(postGeo, darkMetalMat, postCount);
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
      let pi = 0;
      for (let i = 0; i < N; i += 5) {
        const sm = samples[i];
        for (const side of [-1, 1]) {
          e.set(0, Math.atan2(sm.tangent.x, sm.tangent.z), 0);
          q.setFromEuler(e);
          m4.compose(
            new THREE.Vector3(sm.pos.x + sm.right.x * 11.0 * side, sm.pos.y + .5, sm.pos.z + sm.right.z * 11.0 * side),
            q, new THREE.Vector3(1, 1, 1)
          );
          posts.setMatrixAt(pi++, m4);
        }
      }
      posts.instanceMatrix.needsUpdate = true;
      posts.frustumCulled = false;
      group.add(posts);

      // ---- START LINE ----
      const start = samples[0];
      const startYaw = Math.atan2(start.tangent.x, start.tangent.z);
      const lineGeo = new THREE.PlaneGeometry(HALF * 2 - .4, 2.6);
      const lineTex = NR.checkerTexture();
      const lineMat = new THREE.MeshBasicMaterial({
        map: lineTex, toneMapped: false, side: THREE.DoubleSide,
        polygonOffset: true, polygonOffsetFactor: -3
      });
      const startGroup = new THREE.Group();
      startGroup.position.set(start.pos.x, start.pos.y + .085, start.pos.z);
      startGroup.rotation.y = startYaw;
      const startLine = new THREE.Mesh(lineGeo, lineMat);
      startLine.rotation.x = -Math.PI / 2;
      startGroup.add(startLine);
      group.add(startGroup);

      // grid slots (behind the start line: the cars launch over the line)
      const gridMat = new THREE.MeshBasicMaterial({
        color: 0xbff8ff, transparent: true, opacity: .28, toneMapped: false,
        depthWrite: false, side: THREE.DoubleSide
      });
      const gridGeo = new THREE.PlaneGeometry(.18, 5);
      for (let g = 0; g < 6; g++) {
        const gs = NR.wrap(-.0034 - g * .0042, 1);
        const gp = pointAt(gs, 0, .08);
        for (const side of [-1, 1]) {
          const slot = new THREE.Mesh(gridGeo, gridMat);
          slot.rotation.x = -Math.PI / 2;
          const rt = sampleAtS(gs).right;
          const slotGroup = new THREE.Group();
          slotGroup.position.set(gp.x + rt.x * side * 3.1, gp.y, gp.z + rt.z * side * 3.1);
          slotGroup.rotation.y = Math.atan2(sampleAtS(gs).tangent.x, sampleAtS(gs).tangent.z);
          slotGroup.add(slot);
          group.add(slotGroup);
        }
      }

      // ---- TUNNEL ARCH ----
      const profile = [
        [-11.8, 0], [-11.65, 2.1], [-11.15, 3.7], [-10.2, 5.2], [-8.6, 6.35],
        [-6.2, 7.1], [-3.2, 7.55], [0, 7.7], [3.2, 7.55], [6.2, 7.1],
        [8.6, 6.35], [10.2, 5.2], [11.15, 3.7], [11.65, 2.1], [11.8, 0]
      ];
      const tStart = portalEntry, tEnd = portalExit;
      const tCount = (tEnd - tStart + N) % N;
      const tRows = tCount + 1;
      const pCount = profile.length;
      const archVerts = tRows * pCount;
      const archPos = new Float32Array(archVerts * 3);
      const archUv = new Float32Array(archVerts * 2);
      for (let k = 0; k < tRows; k++) {
        const sm = samples[(tStart + k) % N];
        for (let j = 0; j < pCount; j++) {
          const o = (k * pCount + j) * 3;
          archPos[o] = sm.pos.x + sm.right.x * profile[j][0];
          archPos[o + 1] = sm.pos.y + profile[j][1];
          archPos[o + 2] = sm.pos.z + sm.right.z * profile[j][0];
          archUv[(k * pCount + j) * 2] = j / (pCount - 1);
          archUv[(k * pCount + j) * 2 + 1] = sm.dist / 12;
        }
      }
      const archIdx = [];
      for (let k = 0; k < tRows - 1; k++) {
        for (let j = 0; j < pCount - 1; j++) {
          const a = k * pCount + j, b = a + 1, c = a + pCount, d = c + 1;
          archIdx.push(a, c, b, b, c, d);
        }
      }
      const archGeo = new THREE.BufferGeometry();
      archGeo.setAttribute('position', new THREE.BufferAttribute(archPos, 3));
      archGeo.setAttribute('uv', new THREE.BufferAttribute(archUv, 2));
      archGeo.setIndex(archIdx);
      archGeo.computeVertexNormals();
      const archMat = new THREE.MeshStandardMaterial({
        color: 0x23262f, roughness: .76, metalness: .42,
        side: THREE.DoubleSide, map: NR.concreteTexture('#1b1e28')
      });
      archMat.map.repeat.set(1, 1);
      const archMesh = new THREE.Mesh(archGeo, archMat);
      archMesh.frustumCulled = false;
      group.add(archMesh);

      // tunnel ribs
      const ribPositions = [], ribColors = [], ribIdx = [];
      let rv = 0;
      const ribEvery = 11;
      for (let k = 0; k < tRows; k += ribEvery) {
        const sm = samples[(tStart + k) % N];
        const c = new THREE.Color(k % (ribEvery * 2) === 0 ? 0xffb347 : 0x25edff);
        const next = samples[(tStart + Math.min(k + 1, tRows - 1)) % N];
        const base = rv;
        for (let j = 0; j < pCount; j++) {
          // two vertices across track direction, thin band
          for (const off of [-.14, .14]) {
            const sm2 = off < 0 ? sm : next;
            ribPositions.push(
              sm2.pos.x + sm2.right.x * profile[j][0] + sm2.tangent.x * off,
              sm2.pos.y + profile[j][1],
              sm2.pos.z + sm2.right.z * profile[j][0] + sm2.tangent.z * off
            );
            ribColors.push(c.r, c.g, c.b);
            rv++;
          }
        }
        for (let j = 0; j < pCount - 1; j++) {
          const a = base + j * 2, b = a + 1, cc = a + 2, d = a + 3;
          ribIdx.push(a, b, cc, b, d, cc);
        }
      }
      if (ribPositions.length) {
        const rg = new THREE.BufferGeometry();
        rg.setAttribute('position', new THREE.Float32BufferAttribute(ribPositions, 3));
        rg.setAttribute('color', new THREE.Float32BufferAttribute(ribColors, 3));
        rg.setIndex(ribIdx);
        const rm = new THREE.Mesh(rg, new THREE.MeshBasicMaterial({
          vertexColors: true, toneMapped: false, side: THREE.DoubleSide
        }));
        rm.frustumCulled = false;
        group.add(rm);
      }

      // tunnel longitudinal light strips (inside wall + ceiling)
      const tunnelGlowPos = [], tunnelGlowCol = [], tunnelGlowIdx = [];
      function tunnelStrip(latOffset, height, colorA, colorB) {
        let vi = 0;
        for (const [type, cc] of [[-1, colorA], [1, colorB]]) {
          const startV = vi;
          for (let k = 0; k <= tCount; k += 2) {
            const sm = samples[(tStart + k) % N];
            const lat = type * latOffset;
            const x = sm.pos.x + sm.right.x * lat;
            const z = sm.pos.z + sm.right.z * lat;
            tunnelGlowPos.push(x, sm.pos.y + height - .055, z, x, sm.pos.y + height + .055, z);
            const c = new THREE.Color(cc);
            tunnelGlowCol.push(c.r, c.g, c.b, c.r, c.g, c.b);
            vi += 2;
          }
          for (let q = 0; q < vi - startV - 2; q += 2) {
            const a = startV + q, b = a + 1, c2 = a + 2, d = a + 3;
            tunnelGlowIdx.push(a, c2, b, b, c2, d);
          }
        }
      }
      tunnelStrip(10.45, 3.1, 0x25edff, 0xff2d95);
      // center ceiling strip (thin, amber)
      {
        const startV = tunnelGlowPos.length / 3;
        let vi = startV;
        for (let k = 0; k <= tCount; k += 3) {
          const sm = samples[(tStart + k) % N];
          const x = sm.pos.x, z = sm.pos.z;
          tunnelGlowPos.push(x - sm.right.x * .1, sm.pos.y + 7.42, z - sm.right.z * .1,
            x + sm.right.x * .1, sm.pos.y + 7.42, z + sm.right.z * .1);
          const c = new THREE.Color(0xffc067);
          tunnelGlowCol.push(c.r, c.g, c.b, c.r, c.g, c.b);
          vi += 2;
        }
        for (let q = 0; q < vi - startV - 2; q += 2) {
          const a = startV + q, b = a + 1, c2 = a + 2, d = a + 3;
          tunnelGlowIdx.push(a, c2, b, b, c2, d);
        }
      }
      if (tunnelGlowPos.length) {
        const tg = new THREE.BufferGeometry();
        tg.setAttribute('position', new THREE.Float32BufferAttribute(tunnelGlowPos, 3));
        tg.setAttribute('color', new THREE.Float32BufferAttribute(tunnelGlowCol, 3));
        tg.setIndex(tunnelGlowIdx);
        const tm = new THREE.Mesh(tg, new THREE.MeshBasicMaterial({
          vertexColors: true, toneMapped: false, side: THREE.DoubleSide
        }));
        tm.frustumCulled = false;
        group.add(tm);
      }

      // tunnel interior point lights
      track.tunnelLights = [];
      for (let k = 11; k < tCount; k += 26) {
        const sm = samples[(tStart + k) % N];
        const pl = new THREE.PointLight(k % (26 * 2) === 11 ? 0x25dfff : 0xffa347, 2.4, 34, 1.7);
        pl.position.set(sm.pos.x, sm.pos.y + 5.6, sm.pos.z);
        group.add(pl);
        track.tunnelLights.push(pl);
      }
      // portal hazard beacons
      track.tunnelBeacons = [];
      const beaconMat = new THREE.MeshBasicMaterial({ color: 0xff3355, toneMapped: false });
      for (const idx of [portalEntry, portalExit]) {
        const sm = samples[idx];
        for (const side of [-1, 1]) {
          const b = new THREE.Mesh(new THREE.SphereGeometry(.15, 8, 6), beaconMat);
          b.position.set(
            sm.pos.x + sm.right.x * 12.0 * side,
            sm.pos.y + 8.1,
            sm.pos.z + sm.right.z * 12.0 * side
          );
          group.add(b);
          track.tunnelBeacons.push(b);
        }
      }

      // tunnel portal facades
      track.portalGroups = [];
      function buildPortal(idx, exit) {
        const sm = samples[idx];
        const g = NR.frameGroup(sm, 0);
        const signCol = exit ? 0x74ffb0 : 0xffb347;
        const signCol2 = exit ? 0x25edff : 0xff2d95;
        // pillars
        for (const side of [-1, 1]) {
          const pillar = new THREE.Mesh(new THREE.BoxGeometry(3.4, 11, 2.2), darkMetalMat);
          pillar.position.set(side * 13.4, 5.5, 0);
          g.add(pillar);
          const strip = new THREE.Mesh(new THREE.BoxGeometry(.12, 9.2, .14),
            new THREE.MeshBasicMaterial({ color: side < 0 ? signCol : signCol2, toneMapped: false }));
          strip.position.set(side * 11.69, 5.4, 1.09);
          g.add(strip);
        }
        // top beam
        const beam = new THREE.Mesh(new THREE.BoxGeometry(30.2, 2.5, 2.4), darkMetalMat);
        beam.position.set(0, 9.65, 0);
        g.add(beam);
        const beamStrip = new THREE.Mesh(new THREE.BoxGeometry(28, .12, .2),
          new THREE.MeshBasicMaterial({ color: signCol, toneMapped: false }));
        beamStrip.position.set(0, 8.36, 1.2);
        g.add(beamStrip);
        // sign
        const tex = NR.signTexture({
          text: exit ? 'EXIT 05' : 'UNDERPASS 09',
          sub: exit ? '工业区 / RUST YARDS' : '地底环线 / NO SIGNAL',
          color: '#' + new THREE.Color(signCol).getHexString(),
          color2: '#' + new THREE.Color(signCol2).getHexString()
        });
        const signMat = new THREE.MeshBasicMaterial({
          map: tex, transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false, side: THREE.DoubleSide, toneMapped: false
        });
        const sign = new THREE.Mesh(new THREE.PlaneGeometry(17, 4.2), signMat);
        sign.position.set(0, 7.3, -1.22);
        sign.rotation.y = Math.PI;
        g.add(sign);
        // hazard stripes on pillars
        const hazardMat = new THREE.MeshBasicMaterial({ map: NR.hazardStripeTexture('#ffb347'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
        for (const side of [-1, 1]) {
          const hp = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 7), hazardMat);
          hp.position.set(side * 13.4, 4.2, -1.13);
          hp.rotation.y = Math.PI;
          hp.scale.y = 1.1;
          g.add(hp);
        }
        // top blinking red lights
        for (const side of [-1, 1]) {
          const lamp = new THREE.Mesh(new THREE.SphereGeometry(.22, 10, 8),
            new THREE.MeshBasicMaterial({ color: 0xff2d55, toneMapped: false }));
          lamp.position.set(side * 12.7, 11.1, .9);
          g.add(lamp);
        }
        group.add(g);
        track.portalGroups.push(g);
      }
      buildPortal(portalEntry, false);
      buildPortal(portalExit, true);

      // tunnel wall signage
      for (let k = 30; k < tCount - 20; k += 70) {
        const sm = samples[(tStart + k) % N];
        const side = k % 140 === 30 ? 1 : -1;
        const g = NR.frameGroup(sm, 0);
        const sign = new THREE.Mesh(
          new THREE.PlaneGeometry(4.6, 1.25),
          new THREE.MeshBasicMaterial({
            map: NR.signTexture({
              text: 'EXIT ' + Math.max(1, Math.round((tCount - k) / 80)),
              sub: 'UNDERPASS 09 // 前方出口',
              color: '#ffb347', color2: '#25edff'
            }),
            transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
            side: THREE.DoubleSide, toneMapped: false
          })
        );
        sign.position.set(side * 10.9, 3.9, 0);
        sign.rotation.y = side < 0 ? Math.PI / 2 : -Math.PI / 2;
        g.add(sign);
        group.add(g);
      }

      // bridge support lights under deck handled in environment

      track.group = group;
      return group;
    };

    // minimap coordinate mapping
    let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    samples.forEach(sm => {
      minX = Math.min(minX, sm.pos.x); maxX = Math.max(maxX, sm.pos.x);
      minZ = Math.min(minZ, sm.pos.z); maxZ = Math.max(maxZ, sm.pos.z);
    });
    track.bounds = { minX, maxX, minZ, maxZ };
    track.mapPoints = samples.filter((_, i) => i % 4 === 0).map(sm => ({
      x: sm.pos.x, z: sm.pos.z, zone: sm.sector
    }));
    track.zoneStartFor = id => zoneRanges.find(r => r.sector.id === id);

    return track;
  }

  NR.makeTrack = makeTrack;
})(window.NR = window.NR || {});
