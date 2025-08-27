'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Container, TextField, Typography, Alert, Link } from '@mui/material';
import { useToast } from '@/context/ToastContext';
import { useTheme } from '@/context/ThemeContext';
import { authClient } from '@/services/skateparkClient';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [photo, setPhoto] = useState<File | null>(null);
    const router = useRouter();
    const { showToast } = useToast();
    const { theme } = useTheme();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = await authClient.register({ name, email, password });
            showToast('Account created successfully!', 'success');
            await authClient.login({ email, password });
            setTimeout(() => router.push('/map'), 1000);
        } catch (error: any) {
            const errorMessage = error.message || 'Registration failed';
            setError(errorMessage);
            showToast(errorMessage, 'error');
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
                    🛹 Create your account
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
                    label="Name *"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    variant="outlined"
                    placeholder="Enter your full name"
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
                    placeholder="Create a strong password"
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

                {/* Photo Upload Section */}
                <Box sx={{ 
                    mb: 4,
                    p: 2,
                    backgroundColor: 'var(--color-surface-elevated)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                }}>
                    <Typography variant="body2" sx={{ color: 'var(--color-text-secondary)', mb: 1, fontWeight: 500 }}>
                        📸 Profile Photo (Optional)
                    </Typography>
                    <Box sx={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '100%'
                    }}>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                            style={{
                                position: 'absolute',
                                opacity: 0,
                                width: '100%',
                                height: '100%',
                                cursor: 'pointer'
                            }}
                            id="photo-upload"
                        />
                        <label 
                            htmlFor="photo-upload"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '12px 16px',
                                backgroundColor: 'var(--color-surface)',
                                border: '2px dashed var(--color-accent-blue)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-accent-blue)',
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)',
                                minHeight: '60px',
                                textAlign: 'center'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = 'rgba(93, 173, 226, 0.1)';
                                e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                                e.currentTarget.style.borderColor = 'var(--color-accent-blue)';
                            }}
                        >
                            <Box sx={{ textAlign: 'center' }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                                    📁 Choose Photo
                                </Typography>
                                <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }}>
                                    {photo ? photo.name : 'Click to select or drag and drop'}
                                </Typography>
                            </Box>
                        </label>
                    </Box>
                </Box>

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
                    Sign up
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
                    Already have an account?{' '}
                    <Link href="/login">
                        Sign in
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}
