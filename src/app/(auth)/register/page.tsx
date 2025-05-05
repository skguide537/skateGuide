'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, TextField, Typography, Alert, Link } from '@mui/material';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password }),
            });

            if (res.ok) {
                router.push('/map');
            } else {
                const data = await res.json();
                setError(data.error);
            }
        } catch {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 12 }}>
            <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="h4" textAlign="center" fontWeight="bold" color="#2F2F2F">
                    Create your account
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="Name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    variant="outlined"
                />

                <TextField
                    label="Email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    variant="outlined"
                />

                <TextField
                    label="Password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    variant="outlined"
                />

                <div className="mt-4">
                    
                    <div className="flex items-center space-x-4">
                        <label
                            htmlFor="photo-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                        </label>
                        <span className="text-sm text-gray-500">
                            {photo ? photo.name : 'No file chosen'}
                        </span>
                    </div>
                    <input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                        className="hidden"
                    />
                </div>

                <Button
                    type="submit"
                    variant="contained"
                    sx={{
                        backgroundColor: '#A7A9AC',
                        color: '#fff',
                        fontWeight: 'bold',
                        '&:hover': { backgroundColor: '#8A8A8A' }
                    }}
                >
                    Sign up
                </Button>

                <Typography variant="body2" textAlign="center">
                    Already have an account?{' '}
                    <Link href="/login" sx={{ color: '#6E7763', fontWeight: 'bold' }}>
                        Sign in
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}
