'use client';

import { Box, CircularProgress } from '@mui/material';
import { Suspense, useState, useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as THREE from 'three';

// Model file path - update if your file has a different name
const MODEL_URL = '/models/Skateboard.glb';

// If you want to try loading directly from Poly Pizza (may not work due to CORS):
// const MODEL_URL = 'https://poly.pizza/api/7Dfn4VtTCWY/glb';

// Load the 3D model from Poly Pizza
function SkateboardModel({ isHovered, isDragging }: { isHovered: boolean; isDragging: boolean }) {
    const { scene } = useGLTF(MODEL_URL);
    const meshRef = useRef<THREE.Group>(null);

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
    scene.scale.setScalar(1.1);
    scene.position.set(0, 0, 0);

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

function Scene({ isHovered, isDragging, setIsDragging }: { isHovered: boolean; isDragging: boolean; setIsDragging: (dragging: boolean) => void }) {
    return (
        <>
            <ambientLight intensity={0.6} />
            <directionalLight position={[5, 5, 5]} intensity={0.8} />
            <directionalLight position={[-5, 5, -5]} intensity={0.4} />
            <SkateboardModel isHovered={isHovered} isDragging={isDragging} />
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

export default function SkateHeroAnimation() {
    const [isHovered, setIsHovered] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

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
            >
                <Suspense fallback={<LoadingFallback />}>
                    <Scene isHovered={isHovered} isDragging={isDragging} setIsDragging={setIsDragging} />
                </Suspense>
            </Canvas>
        </Box>
    );
}

