import * as THREE from 'three';

/** Sculpted details reused by the lobby and the playable character. */
export function characterShapes() {
  const ear = new THREE.Shape();
  ear.moveTo(-.14, -.13);
  ear.quadraticCurveTo(-.18, -.11, -.13, .025);
  ear.lineTo(-.035, .24);
  ear.quadraticCurveTo(-.008, .29, .027, .245);
  ear.lineTo(.15, -.1);
  ear.quadraticCurveTo(.17, -.15, .1, -.16);
  ear.quadraticCurveTo(0, -.18, -.14, -.13);

  const nose = new THREE.Shape();
  nose.moveTo(-.045, .014);
  nose.bezierCurveTo(-.052, .036, -.018, .037, 0, .026);
  nose.bezierCurveTo(.018, .037, .052, .036, .045, .014);
  nose.quadraticCurveTo(.027, -.012, .009, -.027);
  nose.quadraticCurveTo(0, -.034, -.009, -.027);
  nose.quadraticCurveTo(-.027, -.012, -.045, .014);

  const pumpkin = (radius: number, height: number, cap = false) => {
    const geometry = new THREE.SphereGeometry(radius, 64, 40, 0, Math.PI * 2, 0, cap ? Math.PI / 2 : Math.PI);
    const vertices = geometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) {
      const x = vertices.getX(i), y = vertices.getY(i), z = vertices.getZ(i);
      const ribs = 1 + Math.cos(Math.atan2(z, x) * 10) * .028;
      vertices.setXYZ(i, x * ribs, y * height, z * ribs * .93);
    }
    geometry.computeVertexNormals();
    return geometry;
  };
  const tube = (points: [number, number, number][], radius: number, segments = 20) =>
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p))), segments, radius, 6, false);
  // A single soft volume joins the cheek pads and chin, without overlapping edges.
  const muzzleDepth = (x: number) => .102 + .006 * Math.exp(-(((x - .085) / .065) ** 2)) + .006 * Math.exp(-(((x + .085) / .065) ** 2));
  const muzzle = new THREE.SphereGeometry(1, 48, 32);
  const muzzleVertices = muzzle.attributes.position;
  for (let i = 0; i < muzzleVertices.count; i++) {
    const x = muzzleVertices.getX(i) * .218;
    muzzleVertices.setXYZ(i, x, muzzleVertices.getY(i) * .105 - .177, muzzleVertices.getZ(i) * muzzleDepth(x) - .418);
  }
  muzzle.computeVertexNormals();
  const onMuzzle = (x: number, y: number): [number, number, number] => {
    const front = Math.sqrt(Math.max(0, 1 - (x / .218) ** 2 - ((y + .177) / .105) ** 2));
    return [x, y, -.418 - front * muzzleDepth(x) - .002];
  };
  const suitSeam = (side: number) => {
    const points = Array.from({ length: 33 }, (_, i): [number, number, number] => {
      const t = i / 32, y = .93 - t * .69;
      const radial = Math.sqrt(.38 ** 2 - ((y - .6) / 1.06) ** 2);
      const width = .72 + Math.sin(t * Math.PI) * .13;
      const x = side * radial * width, z = -radial * Math.sqrt(1 - width ** 2);
      const ribs = 1 + Math.cos(Math.atan2(z, x) * 10) * .028;
      return [x * ribs, y, z * ribs * .93 - .002];
    });
    return tube(points, .0026, 48);
  };

  return {
    ear: new THREE.ExtrudeGeometry(ear, { depth: .055, bevelEnabled: true, bevelThickness: .025, bevelSize: .02, bevelSegments: 4, steps: 1, curveSegments: 16 }),
    nose: new THREE.ExtrudeGeometry(nose, { depth: .014, bevelEnabled: true, bevelThickness: .008, bevelSize: .005, bevelSegments: 3, steps: 1 }),
    suit: pumpkin(.38, 1.06),
    cap: pumpkin(.32, .48, true),
    bucket: pumpkin(.17, .86),
    muzzle,
    noseLine: tube([onMuzzle(0, -.131), onMuzzle(0, -.148), onMuzzle(0, -.166)], .0027),
    smile: [-1, 1].map(side => tube([onMuzzle(0, -.166), onMuzzle(side * .03, -.177), onMuzzle(side * .061, -.166)], .0027)),
    whiskers: [-1, 1].flatMap(side => [0, 1, 2].map(i => tube([
      [side * .19, -.14 - i * .026, -.454],
      [side * .32, -.12 - i * .035, -.435],
      [side * (.46 + (i === 1 ? .035 : 0)), -.092 - i * .055, -.37],
    ], .0028 - i * .00035))),
    lids: [-1, 1].map(side => tube([
      [-.142, .025, -.032], [-.11, .13, -.055], [0, .164, -.057], [.11, .13 + side * .006, -.055], [.142, .025, -.032],
    ], .0055)),
    seams: [-1, 1].map(suitSeam),
    bucketHandle: tube([[-.14, .015, 0], [-.135, .18, 0], [0, .235, 0], [.135, .18, 0], [.14, .015, 0]], .009, 28),
    stem: tube([[0, 0, 0], [.013, .065, .006], [-.01, .13, .012], [-.035, .17, .012]], .032),
  };
}
