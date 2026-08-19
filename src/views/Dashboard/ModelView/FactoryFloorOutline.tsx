import { Line } from '@react-three/drei';
import type { DashboardTheme } from '../theme';

type Point = [number, number, number];

const OUTER_BOUNDARY: Point[] = [
    [-25, 0.055, -12],
    [-25, 0.055, 12],
    [13, 0.055, 12],
    [13, 0.055, -12],
    [-25, 0.055, -12],
];

const EQUIPMENT_ZONE: Point[] = [
    [-22.5, 0.06, -9],
    [-22.5, 0.06, 9],
    [10.5, 0.06, 9],
    [10.5, 0.06, -9],
    [-22.5, 0.06, -9],
];

const SERVICE_AISLE_NORTH: Point[] = [
    [-23.5, 0.062, -10.4],
    [11.5, 0.062, -10.4],
];

const SERVICE_AISLE_SOUTH: Point[] = [
    [-23.5, 0.062, 10.4],
    [11.5, 0.062, 10.4],
];

const COLUMN_POSITIONS: Array<[number, number]> = [
    [-24, -11],
    [-15, -11],
    [-6, -11],
    [3, -11],
    [12, -11],
    [-24, 11],
    [-15, 11],
    [-6, 11],
    [3, 11],
    [12, 11],
];

function WallBase({
    position,
    size,
    theme,
}: {
    position: [number, number, number];
    size: [number, number, number];
    theme: DashboardTheme;
}) {
    const isLight = theme === "light";

    return (
        <mesh position={position} receiveShadow>
            <boxGeometry args={size} />
            <meshStandardMaterial
                color={isLight ? "#aab9c5" : "#263946"}
                metalness={isLight ? 0.48 : 0.62}
                roughness={isLight ? 0.62 : 0.58}
                envMapIntensity={isLight ? 0.42 : 0.52}
            />
        </mesh>
    );
}

function ColumnBase({ position, theme }: { position: [number, number]; theme: DashboardTheme }) {
    const isLight = theme === "light";

    return (
        <group position={[position[0], 0.07, position[1]]}>
            <mesh>
                <cylinderGeometry args={[0.28, 0.28, 0.12, 12]} />
                <meshStandardMaterial
                    color={isLight ? "#839aaa" : "#587184"}
                    metalness={isLight ? 0.54 : 0.68}
                    roughness={isLight ? 0.52 : 0.48}
                />
            </mesh>
            <mesh position={[0, 0.064, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.34, 0.43, 16]} />
                <meshBasicMaterial
                    color={isLight ? "#5f87a0" : "#6f9aad"}
                    transparent
                    opacity={isLight ? 0.38 : 0.42}
                />
            </mesh>
        </group>
    );
}

/**
 * Factory context for the overview camera. Low wall bases and floor markings
 * remain unobtrusive when the operator switches to a perspective view.
 */
export function FactoryFloorOutline({ theme }: { theme: DashboardTheme }) {
    const isLight = theme === "light";

    return (
        <group>
            <WallBase theme={theme} position={[-6, 0.07, -12]} size={[38, 0.14, 0.22]} />
            <WallBase theme={theme} position={[-6, 0.07, 12]} size={[38, 0.14, 0.22]} />
            <WallBase theme={theme} position={[-25, 0.07, 0]} size={[0.22, 0.14, 24]} />
            <WallBase theme={theme} position={[13, 0.07, -7]} size={[0.22, 0.14, 10]} />
            <WallBase theme={theme} position={[13, 0.07, 7]} size={[0.22, 0.14, 10]} />

            <Line
                points={OUTER_BOUNDARY}
                color={isLight ? "#668ba4" : "#6f94a8"}
                lineWidth={1.35}
                transparent
                opacity={0.58}
            />
            <Line
                points={EQUIPMENT_ZONE}
                color={isLight ? "#7a9bb0" : "#426b80"}
                lineWidth={0.9}
                transparent
                opacity={0.38}
            />
            <Line
                points={SERVICE_AISLE_NORTH}
                color={isLight ? "#8da5b5" : "#8ba3ad"}
                lineWidth={0.8}
                transparent
                opacity={0.27}
            />
            <Line
                points={SERVICE_AISLE_SOUTH}
                color={isLight ? "#8da5b5" : "#8ba3ad"}
                lineWidth={0.8}
                transparent
                opacity={0.27}
            />

            {COLUMN_POSITIONS.map((position) => (
                <ColumnBase key={`${position[0]}:${position[1]}`} position={position} theme={theme} />
            ))}
        </group>
    );
}
