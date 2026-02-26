import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBox } from '@react-three/drei';
import {
  DICE_FADE_MS,
  DICE_FALL_MS,
  DICE_HOLD_MS,
  DICE_SETTLE_MS,
  getTopFaceRotation,
  normalizeDiceValues,
  sumDiceValues,
} from './diceRoll';

interface Dice3DProps {
  rollToken: number;
  diceValues?: number[];
  onResult: (value: number) => void;
  onFinished?: () => void;
  className?: string;
}

interface DiceSceneProps {
  targetValue: number;
  rolling: boolean;
  offsetX: number;
  offsetZ: number;
  tiltOffset: number;
}

const FACE_MAP: Record<number, { position: [number, number, number]; rotation: [number, number, number] }> = {
  1: { position: [0, 0.5, 0], rotation: [Math.PI / 2, 0, 0] },
  2: { position: [0, 0, 0.5], rotation: [0, 0, 0] },
  3: { position: [0.5, 0, 0], rotation: [0, -Math.PI / 2, 0] },
  4: { position: [-0.5, 0, 0], rotation: [0, Math.PI / 2, 0] },
  5: { position: [0, 0, -0.5], rotation: [0, Math.PI, 0] },
  6: { position: [0, -0.5, 0], rotation: [-Math.PI / 2, 0, 0] },
};

const PIP_LAYOUTS: Record<number, Array<[number, number]>> = {
  1: [[0, 0]],
  2: [[-0.16, -0.16], [0.16, 0.16]],
  3: [[-0.16, -0.16], [0, 0], [0.16, 0.16]],
  4: [[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]],
  5: [[-0.16, -0.16], [0.16, -0.16], [0, 0], [-0.16, 0.16], [0.16, 0.16]],
  6: [[-0.16, -0.18], [0.16, -0.18], [-0.16, 0], [0.16, 0], [-0.16, 0.18], [0.16, 0.18]],
};

const layoutByCount = (count: number): Array<{ x: number; z: number; tilt: number }> => {
  if (count === 1) {
    return [{ x: 0, z: 0, tilt: 0 }];
  }
  if (count === 2) {
    return [
      { x: -0.62, z: 0.12, tilt: -0.05 },
      { x: 0.56, z: -0.16, tilt: 0.05 },
    ];
  }
  return [
    { x: -0.74, z: 0.18, tilt: -0.07 },
    { x: 0.04, z: -0.1, tilt: 0.02 },
    { x: 0.78, z: 0.14, tilt: 0.08 },
  ];
};

const DiceBody = ({ targetValue, rolling, offsetX, offsetZ, tiltOffset }: DiceSceneProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const startTimeRef = useRef(0);
  const spinRef = useRef<[number, number, number]>([0, 0, 0]);
  const initialRotationRef = useRef<[number, number, number]>([0, 0, 0]);

  const targetRotation = useMemo(() => getTopFaceRotation(targetValue), [targetValue]);

  useEffect(() => {
    if (!rolling || !groupRef.current) {
      return;
    }

    const group = groupRef.current as unknown as {
      position?: { set: (x: number, y: number, z: number) => void };
      rotation?: { set: (x: number, y: number, z: number) => void };
    };
    if (!group.position || !group.rotation) {
      return;
    }

    startTimeRef.current = performance.now();
    spinRef.current = [
      (Math.random() * 8 + 9) * (Math.random() > 0.5 ? 1 : -1),
      (Math.random() * 8 + 10) * (Math.random() > 0.5 ? 1 : -1),
      (Math.random() * 8 + 9) * (Math.random() > 0.5 ? 1 : -1),
    ];
    initialRotationRef.current = [
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    ];

    group.position.set(offsetX, 2.8, offsetZ);
    group.rotation.set(
      initialRotationRef.current[0],
      initialRotationRef.current[1],
      initialRotationRef.current[2],
    );
  }, [offsetX, offsetZ, rolling, targetValue]);

  useFrame((_state, delta) => {
    if (!groupRef.current || !rolling) {
      return;
    }

    const group = groupRef.current as unknown as {
      position?: { y: number; set: (x: number, y: number, z: number) => void };
      rotation?: { x: number; y: number; z: number; set: (x: number, y: number, z: number) => void };
    };
    if (!group.position || !group.rotation) {
      return;
    }

    const elapsed = performance.now() - startTimeRef.current;

    if (elapsed <= DICE_FALL_MS) {
      const t = elapsed / DICE_FALL_MS;
      const eased = 1 - (1 - t) ** 4;
      group.position.y = 2.8 - 2.8 * eased;
      group.rotation.set(
        initialRotationRef.current[0] + spinRef.current[0] * t,
        initialRotationRef.current[1] + spinRef.current[1] * t,
        initialRotationRef.current[2] + spinRef.current[2] * t,
      );
      return;
    }

    const settleElapsed = Math.min(elapsed - DICE_FALL_MS, DICE_SETTLE_MS);
    const settleT = settleElapsed / DICE_SETTLE_MS;

    const bounce = Math.cos(settleT * Math.PI * 2.6) * Math.exp(-4.5 * settleT);
    group.position.y = Math.max(0, bounce * 0.18);
    if (bodyRef.current) {
      const squash = 1 - Math.max(0, -bounce) * 0.16;
      const stretch = 1 + Math.max(0, -bounce) * 0.1;
      bodyRef.current.scale.set(stretch, squash, stretch);
    }

    const lerp = 1 - Math.exp(-8 * delta);
    group.rotation.x += (targetRotation[0] - group.rotation.x) * lerp;
    group.rotation.y += (targetRotation[1] - group.rotation.y) * lerp;
    group.rotation.z += (targetRotation[2] - group.rotation.z) * lerp;

    if (settleElapsed >= DICE_SETTLE_MS) {
      group.position.y = 0;
      group.rotation.set(targetRotation[0] + tiltOffset, targetRotation[1], targetRotation[2]);
      bodyRef.current?.scale.set(1, 1, 1);
    }
  });

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <RoundedBox args={[1, 1, 1]} radius={0.17} smoothness={6} castShadow receiveShadow>
          <meshStandardMaterial color="#1f242d" roughness={0.4} metalness={0.2} />
        </RoundedBox>
        <mesh position={[0.02, 0.03, 0.03]}>
          <boxGeometry args={[0.96, 0.96, 0.96]} />
          <meshStandardMaterial color="#2b313b" roughness={0.5} metalness={0.15} transparent opacity={0.2} />
        </mesh>
      </group>

      {Object.entries(FACE_MAP).map(([face, transform]) => {
        const faceValue = Number(face);
        const pips = PIP_LAYOUTS[faceValue];
        return (
          <group
            key={`face-${faceValue}`}
            position={transform.position}
            rotation={transform.rotation}
          >
            {pips.map(([x, y], index) => (
              <mesh key={`${faceValue}-${index}`} position={[x, y, 0.014]}>
                <sphereGeometry args={[0.055, 18, 18]} />
                <meshStandardMaterial color="#f3f4f6" roughness={0.2} metalness={0.1} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

export const Dice3D = ({ rollToken, diceValues, onResult, onFinished, className }: Dice3DProps) => {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const [targetValues, setTargetValues] = useState<number[]>([1]);
  const [rolling, setRolling] = useState(false);
  const latestTokenRef = useRef(0);
  const onResultRef = useRef(onResult);
  const onFinishedRef = useRef(onFinished);
  const spreadJitter = useMemo(
    () =>
      targetValues.map(() => ({
        x: (Math.random() - 0.5) * 0.12,
        z: (Math.random() - 0.5) * 0.12,
        tilt: (Math.random() - 0.5) * 0.04,
      })),
    [rollToken, targetValues],
  );

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onFinishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    if (rollToken === 0 || rollToken === latestTokenRef.current) {
      return;
    }

    latestTokenRef.current = rollToken;
    const values = normalizeDiceValues(diceValues);
    const total = sumDiceValues(values);
    setTargetValues(values);
    setVisible(true);
    setFading(false);
    setRolling(true);

    const resultTimer = window.setTimeout(() => {
      onResultRef.current(total);
    }, DICE_FALL_MS + DICE_SETTLE_MS);

    const fadeTimer = window.setTimeout(() => {
      setFading(true);
    }, DICE_FALL_MS + DICE_SETTLE_MS + DICE_HOLD_MS);

    const finishTimer = window.setTimeout(() => {
      setRolling(false);
      setVisible(false);
      setFading(false);
      onFinishedRef.current?.();
    }, DICE_FALL_MS + DICE_SETTLE_MS + DICE_HOLD_MS + DICE_FADE_MS);

    return () => {
      window.clearTimeout(resultTimer);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(finishTimer);
    };
  }, [diceValues, rollToken]);

  if (!visible) {
    return null;
  }

  return (
    <div className={`pointer-events-none fixed inset-0 z-[60] flex items-start justify-center ${className ?? ''}`}>
      <div
        className={`pointer-events-auto mt-4 h-52 w-52 transition-opacity duration-500 sm:mt-8 sm:h-60 sm:w-60 ${
          fading ? 'opacity-0' : 'opacity-100'
        }`}
      >
      <Canvas shadows camera={{ position: [2.4, 2.3, 3.1], fov: 42 }}>
          <ambientLight intensity={0.55} />
          <hemisphereLight intensity={0.35} color="#eef2ff" groundColor="#111827" />
          <directionalLight
            castShadow
            intensity={1.15}
            position={[3.2, 4.2, 3]}
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          {targetValues.map((value, index) => {
            const count = targetValues.length;
            const baseLayout = layoutByCount(count)[index] ?? { x: 0, z: 0, tilt: 0 };
            const jitter = spreadJitter[index] ?? { x: 0, z: 0, tilt: 0 };
            return (
              <DiceBody
                key={`die-${index}-${value}-${rollToken}`}
                targetValue={value}
                rolling={rolling}
                offsetX={baseLayout.x + jitter.x}
                offsetZ={baseLayout.z + jitter.z}
                tiltOffset={baseLayout.tilt + jitter.tilt}
              />
            );
          })}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.56, 0]} receiveShadow>
            <planeGeometry args={[4, 4]} />
            <shadowMaterial opacity={0.22} />
          </mesh>
        </Canvas>
        <div className="mt-1 rounded-full bg-black/45 px-3 py-1 text-center text-xs font-medium text-white">
          Сума: {sumDiceValues(targetValues)}
        </div>
      </div>
    </div>
  );
};
