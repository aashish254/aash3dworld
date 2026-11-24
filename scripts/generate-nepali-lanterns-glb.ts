import * as fs from 'node:fs';
import * as path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Polyfill FileReader for Node.js so GLTFExporter binary (.glb) export works natively
if (typeof globalThis.FileReader === 'undefined') {
  class NodeFileReader {
    public result: ArrayBuffer | string | null = null;
    public onloadend: (() => void) | null = null;
    public onerror: ((err: unknown) => void) | null = null;

    readAsArrayBuffer(blob: Blob): void {
      blob
        .arrayBuffer()
        .then((buf) => {
          this.result = buf;
          this.onloadend?.();
        })
        .catch((err) => {
          this.onerror?.(err);
        });
    }

    readAsDataURL(blob: Blob): void {
      blob
        .arrayBuffer()
        .then((buf) => {
          const b64 = Buffer.from(buf).toString('base64');
          this.result = `data:${blob.type || 'application/octet-stream'};base64,${b64}`;
          this.onloadend?.();
        })
        .catch((err) => {
          this.onerror?.(err);
        });
    }
  }
  (globalThis as unknown as { FileReader: typeof NodeFileReader }).FileReader = NodeFileReader;
}

function makeLathe(pts: Array<[number, number]>, segments: number, mat: THREE.Material, name: string): THREE.Mesh {
  const vecs = pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y));
  const geo = new THREE.LatheGeometry(vecs, segments);
  // Keep LatheGeometry's built-in wrapped normals (calling computeVertexNormals breaks phi=0/2PI seam)
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  return mesh;
}

function makeTube(
  points: Array<[number, number, number]>,
  radius: number,
  tubularSegments: number,
  radialSegments: number,
  mat: THREE.Material,
  name: string,
): THREE.Mesh {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const geo = new THREE.TubeGeometry(curve, tubularSegments, radius, radialSegments, false);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = name;
  return mesh;
}

function makeTeardropFlame(mat: THREE.Material): THREE.Mesh {
  const pts: Array<[number, number]> = [
    [0.001, 0.0],
    [0.026, 0.015],
    [0.042, 0.045],
    [0.036, 0.088],
    [0.018, 0.132],
    [0.001, 0.165],
  ];
  return makeLathe(pts, 18, mat, 'LanternFlame');
}

function buildHexagonalLanternChamber(
  yBottom: number,
  height: number,
  radius: number,
  brassMat: THREE.Material,
  goldMat: THREE.Material,
  glassMat: THREE.Material,
  flameMat: THREE.Material,
): THREE.Group {
  const chamber = new THREE.Group();
  chamber.name = 'LanternChamber';
  chamber.position.y = yBottom;

  // Lower hexagonal carved lotus oil-tray base & upper collar cornice
  const lowerTray = makeLathe(
    [
      [0.08, -0.05],
      [radius * 0.72, -0.04],
      [radius * 1.12, 0.0],
      [radius * 1.16, 0.035],
      [radius * 0.96, 0.06],
      [radius * 0.65, 0.06],
    ],
    6,
    brassMat,
    'ChamberTray',
  );
  lowerTray.rotation.y = Math.PI / 6;

  const upperRing = makeLathe(
    [
      [radius * 0.72, height - 0.04],
      [radius * 1.06, height - 0.035],
      [radius * 1.14, height],
      [radius * 0.88, height + 0.025],
    ],
    6,
    brassMat,
    'ChamberUpperRing',
  );
  upperRing.rotation.y = Math.PI / 6;
  chamber.add(lowerTray, upperRing);

  // 6 Turned Newari corner brass colonnettes + arched jali window tracery ribs
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const cx = Math.cos(a) * radius * 0.96;
    const cz = Math.sin(a) * radius * 0.96;

    const post = makeLathe(
      [
        [0.018, 0.04],
        [0.022, 0.07],
        [0.014, 0.10],
        [0.015, height * 0.5],
        [0.019, height * 0.54],
        [0.014, height * 0.58],
        [0.014, height - 0.06],
        [0.021, height - 0.03],
      ],
      10,
      brassMat,
      `CornerPost_${i}`,
    );
    post.position.set(cx, 0, cz);
    chamber.add(post);

    // Arched Newari brass lattice cusped window frame connecting corner i -> corner (i+1)
    const aNext = ((i + 1) / 6) * Math.PI * 2 + Math.PI / 6;
    const nx = Math.cos(aNext) * radius * 0.96;
    const nz = Math.sin(aNext) * radius * 0.96;
    const mx = (cx + nx) * 0.5;
    const mz = (cz + nz) * 0.5;

    // Horizontal mid-muntin & cusped upper arch bar
    const archTracery = makeTube(
      [
        [cx, height * 0.72, cz],
        [cx * 0.65 + mx * 0.35, height * 0.86, cz * 0.65 + mz * 0.35],
        [mx * 1.03, height * 0.94, mz * 1.03],
        [nx * 0.65 + mx * 0.35, height * 0.86, nz * 0.65 + mz * 0.35],
        [nx, height * 0.72, nz],
      ],
      0.0085,
      12,
      6,
      brassMat,
      `WindowArch_${i}`,
    );
    const crossBar = makeTube(
      [
        [cx, height * 0.38, cz],
        [mx, height * 0.38, mz],
        [nx, height * 0.38, nz],
      ],
      0.007,
      6,
      6,
      brassMat,
      `WindowBar_${i}`,
    );
    chamber.add(archTracery, crossBar);
  }

  // Frosted warm amber mica/glass inner diffuser cylinder
  const glassGeo = new THREE.CylinderGeometry(radius * 0.74, radius * 0.70, height * 0.86, 18, 1, false);
  const glass = new THREE.Mesh(glassGeo, glassMat);
  glass.name = 'LanternGlass';
  glass.position.y = height * 0.48;
  chamber.add(glass);

  // Traditional Sukunda brass oil bowl & wick stand inside the glass
  const diyoCup = makeLathe(
    [
      [0.001, 0.055],
      [0.052, 0.058],
      [0.036, 0.082],
      [0.072, 0.115],
      [0.078, 0.132],
      [0.058, 0.134],
      [0.001, 0.12],
    ],
    18,
    goldMat,
    'SukundaCup',
  );
  chamber.add(diyoCup);

  const flame = makeTeardropFlame(flameMat);
  flame.position.y = 0.12;
  chamber.add(flame);

  return chamber;
}

function buildPagodaCanopyAndGajur(
  yBase: number,
  canopyRadius: number,
  canopyHeight: number,
  brassMat: THREE.Material,
  goldMat: THREE.Material,
): THREE.Group {
  const canopy = new THREE.Group();
  canopy.name = 'PagodaCanopy';
  canopy.position.y = yBase;

  // Concave swooping Newari Pagoda brass roof bell
  const roof = makeLathe(
    [
      [canopyRadius * 1.0, 0.0],
      [canopyRadius * 0.94, canopyHeight * 0.12],
      [canopyRadius * 0.72, canopyHeight * 0.34],
      [canopyRadius * 0.48, canopyHeight * 0.62],
      [canopyRadius * 0.28, canopyHeight * 0.88],
      [canopyRadius * 0.20, canopyHeight * 1.0],
    ],
    24,
    brassMat,
    'PagodaRoof',
  );
  canopy.add(roof);

  // 6 upturned Nepali corner roof ribs with delicate upturned eaves
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const rib = makeTube(
      [
        [cos * canopyRadius * 0.21, canopyHeight * 0.96, sin * canopyRadius * 0.21],
        [cos * canopyRadius * 0.56, canopyHeight * 0.52, sin * canopyRadius * 0.56],
        [cos * canopyRadius * 0.92, canopyHeight * 0.12, sin * canopyRadius * 0.92],
        [cos * canopyRadius * 1.09, canopyHeight * 0.18, sin * canopyRadius * 1.09],
      ],
      0.011,
      10,
      6,
      goldMat,
      `RoofRib_${i}`,
    );
    canopy.add(rib);
  }

  // Traditional Nepali Gajur Spire (Lotus collar -> Amalaka -> Kalash -> Pointed tip)
  const gajur = makeLathe(
    [
      [canopyRadius * 0.24, canopyHeight * 0.98],
      [canopyRadius * 0.26, canopyHeight * 1.06],
      [canopyRadius * 0.16, canopyHeight * 1.14],
      [canopyRadius * 0.22, canopyHeight * 1.24],
      [canopyRadius * 0.12, canopyHeight * 1.36],
      [canopyRadius * 0.19, canopyHeight * 1.50],
      [canopyRadius * 0.15, canopyHeight * 1.62],
      [canopyRadius * 0.05, canopyHeight * 1.78],
      [0.002, canopyHeight * 2.02],
    ],
    20,
    goldMat,
    'GajurFinial',
  );
  canopy.add(gajur);

  return canopy;
}

async function generate(): Promise<void> {
  const root = new THREE.Scene();
  root.name = 'NepaliBrassLanternsAsset';

  const stoneMat = new THREE.MeshStandardMaterial({
    name: 'NewariStonePlinth',
    color: 0x80796f,
    roughness: 0.86,
    metalness: 0.04,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    name: 'AntiqueNepaliBrass',
    color: 0xc29336,
    roughness: 0.36,
    metalness: 0.82,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    name: 'PolishedGajurGold',
    color: 0xe3b84d,
    roughness: 0.24,
    metalness: 0.88,
  });
  const glassMat = new THREE.MeshStandardMaterial({
    name: 'AmberMicaGlass',
    color: 0xffd284,
    emissive: new THREE.Color(0xff9a2e),
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.05,
    transparent: true,
    opacity: 0.86,
  });
  const flameMat = new THREE.MeshStandardMaterial({
    name: 'DiyoFlameCore',
    color: 0xfff0b8,
    emissive: new THREE.Color(0xffaa2b),
    emissiveIntensity: 2.6,
    roughness: 0.18,
    metalness: 0.0,
  });

  // -------------------------------------------------------------------------
  // MODEL 1: Standing Courtyard Panasa Temple Brass Lantern (bottom at y = 0)
  // -------------------------------------------------------------------------
  const standing = new THREE.Group();
  standing.name = 'StandingPanasaLantern';

  // Carved octagonal Newari stone plinth
  const plinth = makeLathe(
    [
      [0.245, 0.0],
      [0.245, 0.10],
      [0.210, 0.13],
      [0.205, 0.26],
      [0.228, 0.29],
      [0.228, 0.34],
      [0.165, 0.37],
      [0.001, 0.37],
    ],
    8,
    stoneMat,
    'StoneChaukathPlinth',
  );
  plinth.rotation.y = Math.PI / 8;
  standing.add(plinth);

  // Turned fluted antique brass standard shaft with Kumbha collars
  const shaft = makeLathe(
    [
      [0.155, 0.365],
      [0.165, 0.40],
      [0.115, 0.44],
      [0.072, 0.50],
      [0.095, 0.58],
      [0.058, 0.64],
      [0.052, 0.94],
      [0.088, 1.00],
      [0.052, 1.06],
      [0.048, 1.38],
      [0.078, 1.44],
      [0.135, 1.54],
      [0.155, 1.58],
    ],
    24,
    brassMat,
    'TurnedBrassShaft',
  );
  standing.add(shaft);

  // 4 Curved S-scrollwork brass cradle brackets under the lantern chamber
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const bracket = makeTube(
      [
        [cos * 0.055, 1.36, sin * 0.055],
        [cos * 0.145, 1.42, sin * 0.145],
        [cos * 0.125, 1.52, sin * 0.125],
        [cos * 0.205, 1.58, sin * 0.205],
      ],
      0.012,
      12,
      8,
      goldMat,
      `ScrollBracket_${i}`,
    );
    standing.add(bracket);
  }

  const standingChamber = buildHexagonalLanternChamber(1.62, 0.42, 0.195, brassMat, goldMat, glassMat, flameMat);
  const standingCanopy = buildPagodaCanopyAndGajur(2.04, 0.30, 0.22, brassMat, goldMat);
  standing.add(standingChamber, standingCanopy);

  // -------------------------------------------------------------------------
  // MODEL 2: Hanging Akashdeep Brass Temple Archway Lantern (top hook at y = 0)
  // -------------------------------------------------------------------------
  const hanging = new THREE.Group();
  hanging.name = 'HangingAkashdeepLantern';

  // Carved ceiling lotus rose medallion
  const rose = makeLathe(
    [
      [0.115, 0.0],
      [0.122, -0.02],
      [0.088, -0.042],
      [0.032, -0.056],
      [0.001, -0.06],
    ],
    20,
    brassMat,
    'CeilingLotusRose',
  );
  hanging.add(rose);

  // Forged alternating brass chain links descending cleanly into top Gajur eyelet ring
  const linkGeo = new THREE.TorusGeometry(0.022, 0.006, 8, 16);
  linkGeo.scale(0.68, 1.32, 1.0);
  for (let i = 0; i < 4; i++) {
    const link = new THREE.Mesh(linkGeo, goldMat);
    link.name = `ChainLink_${i}`;
    link.position.y = -0.072 - i * 0.044;
    link.rotation.y = (i % 2) * (Math.PI / 2);
    hanging.add(link);
  }
  const topEyelet = new THREE.Mesh(new THREE.TorusGeometry(0.018, 0.0055, 8, 16), goldMat);
  topEyelet.name = 'GajurEyelet';
  topEyelet.position.y = -0.242;
  hanging.add(topEyelet);

  // Pagoda canopy (Gajur apex at -0.61 + 0.185*2.02 = -0.236) + hexagonal cage + lotus drop finial
  const hangCanopy = buildPagodaCanopyAndGajur(-0.61, 0.25, 0.185, brassMat, goldMat);
  const hangChamber = buildHexagonalLanternChamber(-1.00, 0.39, 0.175, brassMat, goldMat, glassMat, flameMat);
  const dropFinial = makeLathe(
    [
      [0.001, -1.17],
      [0.026, -1.11],
      [0.052, -1.05],
      [0.095, -1.02],
      [0.001, -1.00],
    ],
    18,
    goldMat,
    'LotusDropFinial',
  );

  hanging.add(hangCanopy, hangChamber, dropFinial);

  root.add(standing, hanging);

  const exporter = new GLTFExporter();
  const glbBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      root,
      (res) => resolve(res as ArrayBuffer),
      (err) => reject(err),
      { binary: true },
    );
  });

  const outDir = path.resolve(process.cwd(), 'public/assets/models');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'nepali_brass_lanterns.glb');
  fs.writeFileSync(outPath, Buffer.from(glbBuffer));
  console.log(`Exported ${outPath} (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
