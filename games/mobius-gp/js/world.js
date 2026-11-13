import * as THREE from 'three';
import {
  TAU, mulberry32, glowTexture, makeCanvas, canvasTexture,
  makeEnvironmentTexture, makeNebulaTexture, hexToRgba, disposeGroup,
} from './utils.js';

function makeStarField(theme, quality) {
  const group = new THREE.Group();
  const rng = mulberry32(theme.seed || 5);
  const layers = [
    { count: quality === 'low' ? 550 : 1100, size: 1.6, radius: [420, 900], opacity: 0.9, tint: theme.star },
    { count: quality === 'low' ? 70 : 150, size: 3.2, radius: [300, 800], opacity: 0.55, tint: theme.accent },
  ];
  const starTex = glowTexture();
  layers.forEach((layer, li) => {
    const positions = [];
    const colors = [];
    const base = new THREE.Color(layer.tint);
    for (let i = 0; i < layer.count; i++) {
      const theta = rng() * TAU;
      const phi = Math.acos(2 * rng() - 1);
      const r = layer.radius[0] + rng() * (layer.radius[1] - layer.radius[0]);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi) * 0.75;
      const z = r * Math.sin(phi) * Math.sin(theta);
      positions.push(x, y, z);
      const c = base.clone().lerp(new THREE.Color('#ffffff'), rng() * 0.5);
      if (rng() > 0.95) c.lerp(new THREE.Color(theme.accent2), 0.7);
      colors.push(c.r, c.g, c.b);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      map: starTex, color: 0xffffff, vertexColors: true,
      size: layer.size, sizeAttenuation: false,
      transparent: true, opacity: layer.opacity,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false,
      toneMapped: false,
    });
    const points = new THREE.Points(geo, mat);
    points.renderOrder = -900 + li;
    group.add(points);
  });

  // a handful of bigger sparkles
  const glow = glowTexture();
  const sparkleCount = quality === 'low' ? 20 : 42;
  for (let i = 0; i < sparkleCount; i++) {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: glow, color: i % 5 === 0 ? theme.accent2 : theme.accent,
      transparent: true, opacity: 0.4 + rng() * 0.35,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
    }));
    const theta = rng() * TAU;
    const phi = Math.acos(2 * rng() - 1);
    const r = 360 + rng() * 450;
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.cos(phi) * 0.7,
      r * Math.sin(phi) * Math.sin(theta)
    );
    const s = 2 + rng() * 8;
    sprite.scale.set(s, s, 1);
    group.add(sprite);
  }
  return group;
}

function makeSky(theme, quality) {
  const uniforms = {
    topColor: { value: new THREE.Color(theme.skyTop) },
    bottomColor: { value: new THREE.Color(theme.skyBottom) },
    fogColor: { value: new THREE.Color(theme.fog) },
    accentColor: { value: new THREE.Color(theme.accent) },
    accent2Color: { value: new THREE.Color(theme.accent2) },
    time: { value: 0 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 topColor;
      uniform vec3 bottomColor;
      uniform vec3 fogColor;
      uniform vec3 accentColor;
      uniform vec3 accent2Color;
      uniform float time;
      varying vec3 vDir;
      void main() {
        float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 col = mix(bottomColor, topColor, smoothstep(0.25, 0.92, h));
        float horizon = exp(-abs(vDir.y + 0.02) * 10.0);
        col += accentColor * horizon * 0.055;
        float band = sin(vDir.x * 5.0 + vDir.z * 3.0 + time * 0.015 + vDir.y * 8.0) * 0.5 + 0.5;
        col += mix(accentColor, accent2Color, vDir.x * 0.5 + 0.5) * band * 0.012;
        float glow = pow(max(0.0, 1.0 - length(vDir - normalize(vec3(0.55, 0.18, -0.75)))), 18.0);
        col += accentColor * glow * 0.24;
        col = mix(fogColor, col, smoothstep(0.0, 0.34, h));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
  });
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1400, 40, 24), mat);
  sphere.renderOrder = -1000;
  sphere.frustumCulled = false;
  return { sphere, uniforms };
}

function makePlanet(theme, quality, seed) {
  const group = new THREE.Group();
  const rng = mulberry32(seed + 3);
  const c = makeCanvas(512, 256);
  const ctx = c.getContext('2d');
  const base = new THREE.Color(theme.planet);
  const glowCol = new THREE.Color(theme.planetGlow);
  ctx.fillStyle = `#${base.clone().multiplyScalar(0.35).getHexString()}`;
  ctx.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 38; i++) {
    const y = rng() * 256;
    const h = 3 + rng() * 26;
    const col = base.clone().lerp(glowCol, rng() * 0.45);
    ctx.fillStyle = `rgba(${Math.round(col.r * 255)},${Math.round(col.g * 255)},${Math.round(col.b * 255)},${0.1 + rng() * 0.25})`;
    ctx.fillRect(0, y, 512, h);
  }
  for (let i = 0; i < 900; i++) {
    const x = rng() * 512, y = rng() * 256;
    ctx.fillStyle = rng() > 0.55 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.08)';
    ctx.fillRect(x, y, 1 + rng() * 4, 1 + rng() * 2);
  }
  const tex = canvasTexture(c);
  const radius = 42;
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(radius, quality === 'low' ? 24 : 48, quality === 'low' ? 16 : 32),
    new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, fog: false })
  );
  group.add(sphere);

  const atmosphere = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture(), color: theme.planetGlow,
    transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending,
    depthWrite: false, fog: false, toneMapped: false,
  }));
  atmosphere.scale.setScalar(radius * 5.4);
  group.add(atmosphere);

  // planetary ring
  const ringGeo = new THREE.RingGeometry(radius * 1.35, radius * 2.35, 128, 1);
  const ringMat = new THREE.ShaderMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      colorA: { value: new THREE.Color(theme.planetGlow) },
      colorB: { value: new THREE.Color(theme.accent2) },
    },
    vertexShader: /* glsl */`
      varying vec2 vPos;
      void main() {
        vPos = position.xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 colorA;
      uniform vec3 colorB;
      varying vec2 vPos;
      void main() {
        float r = length(vPos);
        float bands = sin(r * 0.88) * 0.5 + 0.5;
        bands *= smoothstep(0.0, 0.08, bands);
        float edge = smoothstep(0.0, 0.14, r - 56.0) * (1.0 - smoothstep(0.0, 0.1, r - 98.0));
        float a = bands * edge * 0.18;
        gl_FragColor = vec4(mix(colorA, colorB, bands), a);
      }
    `,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = 1.22;
  ring.rotation.y = 0.22;
  group.add(ring);
  ring.userData.ring = true;

  const dir = new THREE.Vector3(
    0.48 + rng() * 0.22,
    0.18 + rng() * 0.16,
    -0.83 + rng() * 0.1
  ).normalize();
  group.position.copy(dir.multiplyScalar(620));
  group.scale.setScalar(0.85 + rng() * 0.4);
  group.userData.spinSpeed = 0.008 + rng() * 0.006;
  sphere.userData.spin = group.userData.spinSpeed;
  group.userData.sphere = sphere;
  return group;
}

function makeGrid(theme) {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(theme.grid) },
      accent: { value: new THREE.Color(theme.accent) },
    },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      varying vec3 vWorld;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorld = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */`
      uniform vec3 color;
      uniform vec3 accent;
      varying vec3 vWorld;
      float gridLine(vec2 p, float scale, float width) {
        vec2 coord = p / scale;
        vec2 g = abs(fract(coord - 0.5) - 0.5) / fwidth(coord);
        float line = min(g.x, g.y);
        return 1.0 - min(line / width, 1.0);
      }
      void main() {
        vec2 p = vWorld.xz;
        float g1 = gridLine(p, 24.0, 0.6);
        float g2 = gridLine(p, 120.0, 0.85);
        float d = length(p);
        float fade = (1.0 - smoothstep(180.0, 1250.0, d)) * smoothstep(18.0, 90.0, d);
        float a = (g1 * 0.19 + g2 * 0.3) * fade;
        vec3 col = mix(color, accent, g2 * 0.35);
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(3200, 3200), mat);
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = -82;
  plane.renderOrder = -3;
  return plane;
}

function makeDust(theme, quality, track) {
  const rng = mulberry32((theme.seed || 4) + 91);
  const count = quality === 'low' ? 180 : 380;
  const positions = [], colors = [];
  const c = new THREE.Color(theme.accent);
  for (let i = 0; i < count; i++) {
    const u = rng() * TAU;
    const r = track.R * (0.4 + rng() * 1.15);
    const x = Math.cos(u) * r;
    const z = Math.sin(u) * r;
    const y = -25 + rng() * 90;
    positions.push(x, y, z);
    const col = c.clone().lerp(new THREE.Color(theme.accent2), rng() * 0.55);
    colors.push(col.r, col.g, col.b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const mat = new THREE.PointsMaterial({
    map: glowTexture(), size: quality === 'low' ? 0.75 : 0.55, sizeAttenuation: true,
    transparent: true, opacity: 0.42, blending: THREE.AdditiveBlending,
    depthWrite: false, vertexColors: true, fog: true, toneMapped: false,
  });
  const points = new THREE.Points(geo, mat);
  points.renderOrder = -2;
  return points;
}

function makeNebula(theme, quality) {
  const group = new THREE.Group();
  const rng = mulberry32((theme.seed || 9) + 42);
  const count = quality === 'low' ? 3 : 5;
  for (let i = 0; i < count; i++) {
    const tex = makeNebulaTexture(theme, theme.seed + i * 12);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: tex, transparent: true, opacity: 0.38 + rng() * 0.22,
      blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false,
    }));
    const theta = rng() * TAU;
    const phi = Math.acos(2 * rng() - 1);
    const r = 500 + rng() * 420;
    sprite.position.set(
      r * Math.sin(phi) * Math.cos(theta),
      Math.abs(r * Math.cos(phi) * 0.6) - 30,
      r * Math.sin(phi) * Math.sin(theta)
    );
    const s = 260 + rng() * 460;
    sprite.scale.set(s, s * (0.45 + rng() * 0.5), 1);
    sprite.material.rotation = rng() * TAU;
    group.add(sprite);
  }
  return group;
}

export function createEnvironment(track, renderer, quality = 'high') {
  const theme = track.config.theme;
  const themed = { ...theme, seed: track.config.seed };
  const group = new THREE.Group();
  group.name = 'environment';

  const envTex = makeEnvironmentTexture(theme);
  envTex.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());

  const { sphere: sky, uniforms: skyUniforms } = makeSky(theme, quality);
  group.add(sky);

  const stars = makeStarField(themed, quality);
  group.add(stars);
  const nebula = makeNebula(themed, quality);
  group.add(nebula);
  const planet = makePlanet(theme, quality, track.config.seed);
  group.add(planet);
  group.add(makeGrid(theme));
  const dust = makeDust(theme, quality, track);
  group.add(dust);

  const hemi = new THREE.HemisphereLight(theme.light, theme.road, 0.85);
  group.add(hemi);
  const ambient = new THREE.AmbientLight(theme.light, 0.3);
  group.add(ambient);

  const key = new THREE.DirectionalLight(theme.light, 2.25);
  key.position.set(track.R * 0.8, track.R * 1.25, track.R * 0.5);
  key.target.position.set(0, 0, 0);
  group.add(key, key.target);

  const rim = new THREE.DirectionalLight(theme.accent2, 1.35);
  rim.position.set(-track.R * 0.9, track.R * 0.55, -track.R * 0.9);
  rim.target.position.set(0, 0, 0);
  group.add(rim, rim.target);

  const under = new THREE.DirectionalLight(theme.accent, 1.15);
  under.position.set(track.R * 0.1, -track.R * 0.8, -track.R * 0.2);
  under.target.position.set(0, 0, 0);
  group.add(under, under.target);

  let elapsed = 0;
  return {
    group,
    theme,
    envTexture: envTex,
    fog: new THREE.FogExp2(theme.fog, quality === 'low' ? 0.0011 : 0.0009),
    update(dt) {
      elapsed += dt;
      skyUniforms.time.value = elapsed;
      stars.rotation.y += dt * 0.0012;
      stars.rotation.x = Math.sin(elapsed * 0.01) * 0.015;
      dust.rotation.y += dt * 0.002;
      planet.children.forEach((child) => {
        if (child.userData.ring) child.rotation.z += dt * 0.005;
      });
      if (planet.userData.sphere) {
        planet.userData.sphere.rotation.y += dt * planet.userData.spinSpeed;
      }
      planet.rotation.z = Math.sin(elapsed * 0.02) * 0.04;
      nebula.children.forEach((sprite, i) => {
        sprite.material.rotation += dt * (0.0008 + i * 0.0001);
      });
    },
    dispose() {
      envTex.dispose();
      disposeGroup(group);
    },
  };
}
