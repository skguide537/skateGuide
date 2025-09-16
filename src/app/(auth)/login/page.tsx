'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, TextField, Typography, Alert, Link } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useTheme } from '@/context/ThemeContext';
import { authClient } from '@/services/authClient';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const router = useRouter();
    const { showToast } = useToast();
    const { setUser } = useUser();
    const { theme } = useTheme();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        try {
            await authClient.login({ email, password });
            const me = await authClient.getCurrentUser();
            setUser(me);
            showToast(`Hi ${me?.name || me?.email || 'Skater'} 👋`, 'success');
            router.push('/');
        } catch (error: any) {
            const errorMessage = error.message || 'Login failed';
            showToast(errorMessage, 'error');
            setError(errorMessage);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 12 }}>
            <Box 
                component="form" 
                onSubmit={handleSubmit} 
                sx={{
                    p: 4,
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius-xl)',
                    boxShadow: 'var(--shadow-lg)',
                    border: '1px solid var(--color-border)',
                    background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: 'linear-gradient(90deg, var(--color-accent-green) 0%, var(--color-accent-blue) 50%, var(--color-accent-rust) 100%)',
                    }
                }}
            >
                <Typography 
                    variant="h4" 
                    textAlign="center" 
                    fontWeight="bold" 
                    sx={{ 
                        mb: 4,
                        color: 'var(--color-text-primary)',
                        textShadow: theme === 'dark' 
                            ? '0 2px 4px rgba(0, 0, 0, 0.5)'
                            : '0 1px 2px rgba(0, 0, 0, 0.2)',
                        position: 'relative',
                        zIndex: 2
                    }}
                >
                     Sign in to your account
                </Typography>

                {error && (
                    <Alert 
                        severity="error" 
                        sx={{ 
                            mb: 3,
                            backgroundColor: 'var(--color-error)',
                            color: 'var(--color-surface-elevated)',
                            '& .MuiAlert-icon': {
                                color: 'var(--color-surface-elevated)'
                            }
                        }}
                    >
                        {error}
                    </Alert>
                )}

                <TextField
                    label="Email *"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your email address"
                    sx={{ 
                        mb: 3,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            transition: 'all var(--transition-fast)',
                            '&:hover': {
                                borderColor: 'var(--color-accent-blue)',
                                backgroundColor: 'var(--color-surface-elevated)',
                            },
                            '&.Mui-focused': {
                                borderColor: 'var(--color-accent-blue)',
                                boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                            }
                        },
                        '& .MuiInputLabel-root': {
                            color: 'var(--color-text-secondary)',
                            '&.Mui-focused': {
                                color: 'var(--color-accent-blue)'
                            }
                        }
                    }}
                />

                <TextField
                    label="Password *"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your password"
                    sx={{ 
                        mb: 4,
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            transition: 'all var(--transition-fast)',
                            '&:hover': {
                                borderColor: 'var(--color-accent-blue)',
                                backgroundColor: 'var(--color-surface-elevated)',
                            },
                            '&.Mui-focused': {
                                borderColor: 'var(--color-accent-blue)',
                                boxShadow: '0 0 0 2px rgba(93, 173, 226, 0.2)',
                            }
                        },
                        '& .MuiInputLabel-root': {
                            color: 'var(--color-text-secondary)',
                            '&.Mui-focused': {
                                color: 'var(--color-accent-blue)'
                            }
                        }
                    }}
                />

                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    sx={{
                        backgroundColor: 'var(--color-accent-green)',
                        color: 'var(--color-surface-elevated)',
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        px: 4,
                        py: 1.5,
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-lg)',
                        transition: 'all var(--transition-fast)',
                        textTransform: 'none',
                        '&:hover': {
                            backgroundColor: 'var(--color-accent-green)',
                            transform: 'translateY(-3px)',
                            boxShadow: 'var(--shadow-xl)',
                        }
                    }}
                >
                    Sign in
                </Button>

                <Typography 
                    variant="body2" 
                    textAlign="center" 
                    sx={{ 
                        mt: 3,
                        color: 'var(--color-text-secondary)',
                        '& a': {
                            color: 'var(--color-accent-blue)',
                            fontWeight: 'bold',
                            textDecoration: 'none',
                            '&:hover': {
                                textDecoration: 'underline'
                            }
                        }
                    }}
                >
                    Don&apos;t have an account?{' '}
                    <Link href="/register">
                        Sign up
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}
