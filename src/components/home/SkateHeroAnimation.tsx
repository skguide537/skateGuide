'use client';

import { Box, CircularProgress } from '@mui/material';
import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, extend, useFrame, useThree } from '@react-three/fiber';
import { TransformControls, useGLTF } from '@react-three/drei';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

// Create wrapper classes for geometries that GLB files might reference with non-standard names
// These are proper constructors that R3F can instantiate
class Circle extends THREE.CircleGeometry {
    constructor(...args: any[]) {
        super(...args);
    }
}

class Svg extends THREE.ShapeGeometry {
    constructor(...args: any[]) {
        super(...args);
    }
}

// Extend R3F to recognize THREE.js geometries and objects that might be in GLB models
extend({ 
    OrbitControls, 
    TransformControls,
    // Add common geometries for GLB file compatibility
    CircleGeometry: THREE.CircleGeometry,
    ShapeGeometry: THREE.ShapeGeometry,
    BoxGeometry: THREE.BoxGeometry,
    SphereGeometry: THREE.SphereGeometry,
    PlaneGeometry: THREE.PlaneGeometry,
    CylinderGeometry: THREE.CylinderGeometry,
    ConeGeometry: THREE.ConeGeometry,
    TorusGeometry: THREE.TorusGeometry,
    TubeGeometry: THREE.TubeGeometry,
    ExtrudeGeometry: THREE.ExtrudeGeometry,
    // Add wrapper classes for non-standard geometry names in GLB files
    Circle, // Proper constructor class that extends CircleGeometry
    Svg, // Proper constructor class that extends ShapeGeometry
});

// Model file path - update if your file has a different name
const MODEL_URL = '/models/Skateboard.glb';



// Load the 3D model from Poly Pizza
function SkateboardModel({ isHovered, isDragging, onError }: { isHovered: boolean; isDragging: boolean; onError?: () => void }) {
    const meshRef = useRef<THREE.Group>(null);
    
    // Always call hooks at the top level (React rules)
    // useGLTF will throw if model fails, but Suspense will catch it
    const { scene } = useGLTF(MODEL_URL);

    // Idle animation: subtle bobbing (only when not being dragged)
    useFrame((state) => {
        if (meshRef.current && !isDragging) {
            if (isHovered) {
                // Hover animation: pop/kick effect (only vertical movement, no rotation to avoid conflict)
                const hoverTime = state.clock.elapsedTime * 2;
                meshRef.current.position.y = Math.sin(hoverTime) * 0.1 + 0.2;
            } else {
                // Idle animation: gentle bobbing (4 second cycle) - only vertical, rotation handled by OrbitControls
                const idleTime = state.clock.elapsedTime * 0.5;
                meshRef.current.position.y = Math.sin(idleTime) * 0.05;
            }
        }
    });

    // Scale and center the model - make it bigger
    useEffect(() => {
        if (scene) {
            scene.scale.setScalar(1.1);
            scene.position.set(0, 0, 0);
        }
    }, [scene]);

    return (
        <group ref={meshRef}>
            <primitive object={scene} />
        </group>
    );
}

// Preload the model for better performance
useGLTF.preload(MODEL_URL);


function Controls({ setIsDragging }: { setIsDragging: (dragging: boolean) => void }) {
    const { camera, gl } = useThree();
    const controlsRef = useRef<OrbitControls | null>(null);

    useEffect(() => {
        if (!controlsRef.current) {
            controlsRef.current = new OrbitControls(camera, gl.domElement);
            controlsRef.current.enableZoom = false;
            controlsRef.current.enablePan = false;
            controlsRef.current.enableRotate = true;
            controlsRef.current.autoRotate = true;
            controlsRef.current.rotateSpeed = 0.8;
            // Lower damping factor for more momentum/inertia effect
            controlsRef.current.dampingFactor = 0.02;
            controlsRef.current.minPolarAngle = Math.PI / 3;
            controlsRef.current.maxPolarAngle = Math.PI / 1.5;

            // Track dragging state
            const handleStart = () => setIsDragging(true);
            const handleEnd = () => setIsDragging(false);
            
            controlsRef.current.addEventListener('start', handleStart);
            controlsRef.current.addEventListener('end', handleEnd);

            return () => {
                if (controlsRef.current) {
                    controlsRef.current.removeEventListener('start', handleStart);
                    controlsRef.current.removeEventListener('end', handleEnd);
                    controlsRef.current.dispose();
                }
            };
        }
    }, [camera, gl.domElement, setIsDragging]);

    useFrame(() => {
        if (controlsRef.current) {
            controlsRef.current.update();
        }
    });

    return null;
}

function Scene({ isHovered, isDragging, setIsDragging, onModelError }: { isHovered: boolean; isDragging: boolean; setIsDragging: (dragging: boolean) => void; onModelError?: () => void }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 5, -5]} intensity={0.4} />
            <SkateboardModel isHovered={isHovered} isDragging={isDragging} onError={onModelError} />
            <Controls setIsDragging={setIsDragging} />
        </>
    );
}

function LoadingFallback() {
    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
            }}
        >
            <CircularProgress size={40} sx={{ color: 'var(--color-accent-rust)' }} />
        </Box>
    );
}

// Error boundary component for 3D model
function ModelErrorBoundary({ children }: { children: React.ReactNode }) {
    const [hasError, setHasError] = useState(false);

    useEffect(() => {
        const handleError = (event: ErrorEvent) => {
            if (event.message?.includes('R3F') || event.message?.includes('THREE')) {
                console.warn('3D model error caught, showing fallback:', event.message);
                setHasError(true);
            }
        };

        window.addEventListener('error', handleError);
        return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: { xs: '200px', md: '250px' },
                    maxHeight: { xs: '250px', md: '300px' },
                }}
            >
                <CircularProgress size={40} sx={{ color: 'var(--color-accent-rust)' }} />
            </Box>
        );
    }

    return <>{children}</>;
}

export default function SkateHeroAnimation() {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [modelError, setModelError] = useState(false);

    // If model fails to load, show fallback
    if (modelError) {
        return (
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: { xs: '200px', md: '250px' },
                    maxHeight: { xs: '250px', md: '300px' },
                }}
            >
                <CircularProgress size={40} sx={{ color: 'var(--color-accent-rust)' }} />
            </Box>
        );
    }

    return (
        <ModelErrorBoundary>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    minHeight: { xs: '200px', md: '250px' },
                    maxHeight: { xs: '250px', md: '300px' },
                    cursor: isDragging ? 'grabbing' : 'grab',
                    backgroundColor: 'transparent',
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <Canvas
                    camera={{ position: [0, 0, 5], fov: 50 }}
                    style={{
                        width: '100%',
                        height: '100%',
                        maxWidth: '400px',
                        maxHeight: '300px',
                        cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                    gl={{ antialias: true, alpha: true }}
                    onCreated={() => {
                        // Reset error state on successful creation
                        setModelError(false);
                    }}
                >
                    <Suspense fallback={<LoadingFallback />}>
                        <Scene 
                            isHovered={isHovered} 
                            isDragging={isDragging} 
                            setIsDragging={setIsDragging}
                            onModelError={() => setModelError(true)}
                        />
                    </Suspense>
                </Canvas>
            </Box>
        </ModelErrorBoundary>
    );
}

