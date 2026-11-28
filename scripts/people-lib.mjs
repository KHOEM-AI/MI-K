// Gives a figure from createHumanFigure() unique joint names and turns the clips of people-motion.mjs
// into three.js AnimationClips. All three.js access goes through the THREE object you pass in.
import { JOINTS, CLIPS, CLIP_NAMES, sampleClip } from "./people-motion.mjs";

const groupsOf = (o) => o.children.filter((c) => !c.isMesh);
const only = (list, what) => {
  if (list.length !== 1) throw new Error(`unexpected figure structure: found ${list.length} x ${what}`);
  return list[0];
};

/**
 * Names the joints of a standing figure: Hips, Spine, Head, ArmL/R, ElbowL/R, LegL/R, KneeL/R
 * (plus `prefix`, so several figures can share one file). "L" is the figure's own left (the +X side, it faces +Z).
 * Returns { joints, rest, hipsRest }. Throws for a sitting figure or anything unexpected.
 */
export function rigFigure(figure, prefix = "") {
  const root = only(groupsOf(figure), "root");
  const hips = only(groupsOf(root), "hips");
  const hipsKids = groupsOf(hips);
  if (hipsKids.some((g) => g.name === "sitLeg")) throw new Error("a sitting figure cannot be animated");
  const torso = only(hipsKids.filter((g) => g.name === ""), "torso");
  const head = only(groupsOf(torso).filter((g) => g.name === ""), "head");
  const arms = groupsOf(torso).filter((g) => g.name === "arm");
  const legs = hipsKids.filter((g) => g.name === "leg");
  if (arms.length !== 2 || legs.length !== 2) throw new Error(`unexpected figure structure: ${arms.length} arms, ${legs.length} legs`);
  const side = (g) => (g.position.x > 0 ? "L" : "R");
  if (side(arms[0]) === side(arms[1]) || side(legs[0]) === side(legs[1])) throw new Error("arms or legs are not left/right pairs");

  const joints = { Hips: hips, Spine: torso, Head: head };
  for (const arm of arms) { joints["Arm" + side(arm)] = arm; joints["Elbow" + side(arm)] = only(groupsOf(arm), "elbow"); }
  for (const leg of legs) { joints["Leg" + side(leg)] = leg; joints["Knee" + side(leg)] = only(groupsOf(leg), "knee"); }
  for (const j of JOINTS) if (!joints[j]) throw new Error(`joint missing: ${j}`);

  const rest = {};
  for (const j of JOINTS) {
    joints[j].name = prefix + j;
    const r = joints[j].rotation;
    rest[j] = { x: r.x, y: r.y, z: r.z };
  }
  return { joints, rest, hipsRest: hips.position.clone() };
}

/**
 * One AnimationClip per name. Rotations are quaternion tracks (what glTF stores); the hips also get a
 * position track so the feet stay on the ground. `clipPrefix` is put in front of the clip names.
 */
export function buildClips(THREE, rig, names = CLIP_NAMES, { fps = 20, clipPrefix = "" } = {}) {
  const euler = new THREE.Euler(0, 0, 0, "XYZ"), q = new THREE.Quaternion(), prev = new THREE.Quaternion();
  return names.map((name) => {
    if (!CLIPS[name]) throw new Error(`unknown clip: ${name}`);
    const s = sampleClip(name, fps), tracks = [];
    for (const j of JOINTS) {
      const r = rig.rest[j], values = [];
      s.joints[j].forEach((d, i) => {
        euler.set(r.x + d[0], r.y + d[1], r.z + d[2]);
        q.setFromEuler(euler);
        if (i > 0 && q.dot(prev) < 0) { q.x = -q.x; q.y = -q.y; q.z = -q.z; q.w = -q.w; } // keep neighbouring keys on the short side
        prev.copy(q);
        values.push(q.x, q.y, q.z, q.w);
      });
      tracks.push(new THREE.QuaternionKeyframeTrack(`${rig.joints[j].name}.quaternion`, s.times, values));
    }
    const h = rig.hipsRest, pos = [];
    for (const dy of s.hipsY) pos.push(h.x, h.y + dy, h.z);
    tracks.push(new THREE.VectorKeyframeTrack(`${rig.joints.Hips.name}.position`, s.times, pos));
    return new THREE.AnimationClip(clipPrefix + name, s.duration, tracks);
  });
}
