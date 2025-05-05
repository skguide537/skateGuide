'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, TextField, Typography, Alert, Link } from '@mui/material';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
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
          Sign in to your account
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

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
          Sign in
        </Button>

        <Typography variant="body2" textAlign="center">
          Don&apos;t have an account?{' '}
          <Link href="/register" sx={{ color: '#6E7763', fontWeight: 'bold' }}>
            Sign up
          </Link>
        </Typography>
      </Box>
    </Container>
  );
}
