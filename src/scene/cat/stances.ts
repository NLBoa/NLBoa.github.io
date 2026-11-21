/**
 * The poses the cat rests in and moves between, written as plain descriptions (see PoseSpec):
 * trunk bones by how far they turn, leg and tail segments by which way they point.
 */

import { buildPose, type Pose, type PoseSpec } from "./pose";

export const SPECS = {
  /** Sitting upright: haunches down, front legs straight, tail wrapped round to the front paws. */
  sit: {
    hips: [-50, 0, 0],
    spine1: [6, 0, 0],
    spine2: [10, 0, 0],
    chest: [12, 0, 0],
    neck: [-34, 0, 0],
    head: [52, 0, 0],
    arm: [-6, 3],
    forearm: [3, 0],
    paw: [78, 0],
    thigh: [90, 22],
    shin: [-58, 12],
    hock: [86, 6],
    foot: [90, 0],
    tail: [[25, 40], [60, 10], [95], [125], [150], [168], [178]],
    level: { front: ["paw"], back: ["hips", "hock", "foot"] },
    ch: { tail: 0.35 },
  },
  /** The loaf: legs folded away underneath, a tidy rounded block with the head held up. */
  loaf: {
    hips: [0, 0, 0],
    spine1: [7, 0, 0],
    spine2: [9, 0, 0],
    chest: [4, 0, 0],
    neck: [-60, 0, 0],
    head: [40, 0, 0],
    arm: [-50, 10],
    forearm: [100, -26],
    paw: [70, -45],
    thigh: [60, 28],
    shin: [-86, 10],
    hock: [86, 4],
    foot: [90, 0],
    tail: [[35, 25], [75, 8], [110], [138], [158], [170], [178]],
    level: { front: ["chest"], back: ["hips"] },
    ch: { tail: 0.15, eye: 0.94, tucked: 1 },
  },
  /** Flopped on its side with the belly toward the viewer. */
  side: {
    hips: [0, 0, 98],
    at: [-0.05, 0, 0],
    spine1: [0, 9, 0],
    spine2: [0, 10, 0],
    chest: [0, 9, 4],
    neck: [-6, 8, -18],
    head: [4, 6, -30],
    armL: [68, 52],
    forearmL: [104, 58],
    pawL: [-10, 60],
    armR: [60, -62],
    forearmR: [96, -72],
    pawR: [10, -70],
    thighL: [62, 62],
    shinL: [-100, 50],
    hockL: [78, 66],
    footL: [70, 74],
    thighR: [58, -64],
    shinR: [-102, -58],
    hockR: [80, -72],
    footR: [72, -78],
    tail: [[-25, 8], [-48, 4], [-72], [-94], [-112], [-126], [-136]],
    // Lying down, the body rests on the desk and the legs simply lie where they fall.
    ch: { tail: 0.4, tucked: 1 },
  },
} satisfies Record<string, PoseSpec>;

export type StanceName = keyof typeof SPECS;

export const STANCES: Record<StanceName, Pose> = {
  sit: buildPose(SPECS.sit),
  loaf: buildPose(SPECS.loaf),
  side: buildPose(SPECS.side),
};
