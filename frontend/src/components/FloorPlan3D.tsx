import { Canvas } from '@react-three/fiber'
import { OrbitControls, Grid, PerspectiveCamera } from '@react-three/drei'
import { FloorPlan } from '../types'

interface FloorPlan3DProps {
  plan: FloorPlan
}

// Конвертация координат из 2D в 3D (10px = 1mm, 1000mm = 1m)
const scale = 0.001 // масштаб для конвертации в метры

const FloorPlan3D = ({ plan }: FloorPlan3DProps) => {
  const wallHeight = 2.7 // высота потолков в метрах
  const wallThickness = 0.15 // толщина стен в метрах (150мм для несущих)
  const doorHeight = 2.1 // высота двери
  const windowHeight = 1.5 // высота окна
  const windowSillHeight = 0.9 // высота подоконника

  return (
    <div className="w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[8, 8, 8]} fov={50} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={2}
          maxDistance={50}
        />

        {/* Освещение */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[-10, 10, -10]} intensity={0.5} />

        {/* Сетка пола */}
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6b7280"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#4b5563"
          fadeDistance={25}
          fadeStrength={1}
          followCamera={false}
          infiniteGrid
        />

        {/* Пол */}
        <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#f3f4f6" />
        </mesh>

        {/* Стены */}
        {plan.walls.map((wall, index) => {
          const x1 = wall.x1 * scale
          const z1 = wall.y1 * scale
          const x2 = wall.x2 * scale
          const z2 = wall.y2 * scale

          const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
          const angle = Math.atan2(z2 - z1, x2 - x1)

          const centerX = (x1 + x2) / 2
          const centerZ = (z1 + z2) / 2

          const thickness = wall.isLoadBearing ? wallThickness : wallThickness * 0.6
          const color = wall.isLoadBearing ? '#ef4444' : '#94a3b8'

          return (
            <mesh
              key={`wall-${index}`}
              position={[centerX, wallHeight / 2, centerZ]}
              rotation={[0, angle, 0]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[length, wallHeight, thickness]} />
              <meshStandardMaterial color={color} roughness={0.8} />
            </mesh>
          )
        })}

        {/* Двери */}
        {plan.doors.map((door, index) => {
          const x = door.x * scale
          const z = door.y * scale

          return (
            <group key={`door-${index}`} position={[x, 0, z]}>
              {/* Дверная рама */}
              <mesh position={[0, doorHeight / 2, 0]} castShadow>
                <boxGeometry args={[0.9, doorHeight, 0.05]} />
                <meshStandardMaterial color="#8b4513" roughness={0.6} />
              </mesh>
              {/* Дверная ручка */}
              <mesh position={[0.35, 1, 0.03]} castShadow>
                <sphereGeometry args={[0.03, 16, 16]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.8} roughness={0.2} />
              </mesh>
            </group>
          )
        })}

        {/* Окна */}
        {plan.windows.map((window, index) => {
          const x = window.x * scale
          const z = window.y * scale

          return (
            <group key={`window-${index}`} position={[x, windowSillHeight + windowHeight / 2, z]}>
              {/* Оконная рама */}
              <mesh castShadow>
                <boxGeometry args={[1.5, windowHeight, 0.05]} />
                <meshStandardMaterial
                  color="#60a5fa"
                  transparent
                  opacity={0.3}
                  roughness={0.1}
                  metalness={0.1}
                />
              </mesh>
              {/* Рама окна */}
              <mesh>
                <boxGeometry args={[1.5, 0.05, 0.06]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, windowHeight / 2, 0]}>
                <boxGeometry args={[1.5, 0.05, 0.06]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[0, -windowHeight / 2, 0]}>
                <boxGeometry args={[1.5, 0.05, 0.06]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
            </group>
          )
        })}

        {/* Комнаты - цветовые зоны на полу */}
        {plan.rooms.map((room, index) => {
          if (room.bounds) {
            const x = room.bounds.x * scale
            const z = room.bounds.y * scale
            const width = room.bounds.width * scale
            const height = room.bounds.height * scale

            // Цвета по типу комнаты
            const roomColors: Record<string, string> = {
              living: '#86efac',
              kitchen: '#fbbf24',
              bathroom: '#60a5fa',
              toilet: '#7dd3fc',
              corridor: '#d1d5db',
              balcony: '#c4b5fd',
              storage: '#fcd34d'
            }

            return (
              <mesh
                key={`room-${index}`}
                position={[x + width / 2, 0.01, z + height / 2]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[width, height]} />
                <meshStandardMaterial
                  color={roomColors[room.type] || '#e5e7eb'}
                  transparent
                  opacity={0.3}
                />
              </mesh>
            )
          }
          return null
        })}
      </Canvas>
    </div>
  )
}

export default FloorPlan3D
