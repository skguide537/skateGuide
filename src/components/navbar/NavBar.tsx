'use client';

import * as React from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import { useRouter } from 'next/navigation';
import { DEFAULT_AVATAR_URL } from '@/types/constants';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import Tooltip from '@mui/material/Tooltip';

export default function NavBar() {
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const { showToast } = useToast();
    const { user, logout, isLoading } = useUser();
    const router = useRouter();

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = (href?: string) => {
        setAnchorElNav(null);
        if (href) router.push(href);
    };

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'success');
        setTimeout(() => router.push('/login'), 1000);
    };

    return (
        <AppBar
            position="static"
            sx={{
                backgroundColor: '#D2B48C',
                border: '4px solid #A7A9AC',
                borderRadius: 0,
                width: '100%',
                boxShadow: 4,
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: { xs: 56, md: 64 } }}>
                    {/* Logo - Always visible */}
                    <Typography
                        variant="h6"
                        noWrap
                        onClick={() => router.push('/')}
                        sx={{
                            mr: 2,
                            fontWeight: 700,
                            color: '#2F2F2F',
                            cursor: 'pointer',
                            fontSize: { xs: '1rem', md: '1.25rem' },
                            flexShrink: 0,
                        }}
                    >
                        SkateGuide🛹
                    </Typography>

                    {/* Mobile Menu Button - Only show on mobile */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'flex-end' }}>
                        <IconButton 
                            size="large" 
                            onClick={handleOpenNavMenu} 
                            color="inherit"
                            sx={{ 
                                color: '#2F2F2F',
                                '&:hover': { backgroundColor: 'rgba(47, 47, 47, 0.1)' }
                            }}
                        >
                            <MenuIcon />
                        </IconButton>
                        
                        {/* Mobile Menu */}
                        <Menu
                            anchorEl={anchorElNav}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            open={Boolean(anchorElNav)}
                            onClose={() => handleCloseNavMenu()}
                            sx={{ 
                                display: { xs: 'block', md: 'none' },
                                '& .MuiPaper-root': {
                                    minWidth: 140,
                                    mt: 1,
                                    borderRadius: 2,
                                    boxShadow: 3,
                                }
                            }}
                        >
                            {/* Show user greeting on mobile */}
                            {user && (
                                <MenuItem sx={{ 
                                    pointerEvents: 'none', 
                                    borderBottom: '1px solid #e0e0e0',
                                    py: 2,
                                    px: 3
                                }}>
                                    <Typography textAlign="center" fontWeight={600} color="#2F2F2F" fontSize="0.9rem">
                                        Hello, {user.name}
                                    </Typography>
                                </MenuItem>
                            )}
                            
                            <MenuItem onClick={() => handleCloseNavMenu('/map')} sx={{ py: 1.5, px: 3 }}>
                                <Typography textAlign="center" fontWeight={500} fontSize="0.9rem">Map</Typography>
                            </MenuItem>
                            {user && (
                                <MenuItem onClick={() => handleCloseNavMenu('/add-spot')} sx={{ py: 1.5, px: 3 }}>
                                    <Typography textAlign="center" fontWeight={500} fontSize="0.9rem">Add Spot</Typography>
                                </MenuItem>
                            )}
                            {!user ? (
                                <>
                                    <MenuItem onClick={() => handleCloseNavMenu('/login')} sx={{ py: 1.5, px: 3 }}>
                                        <Typography textAlign="center" fontWeight={500} fontSize="0.9rem">Login</Typography>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCloseNavMenu('/register')} sx={{ py: 1.5, px: 3 }}>
                                        <Typography textAlign="center" fontWeight={500} fontSize="0.9rem">Register</Typography>
                                    </MenuItem>
                                </>
                            ) : (
                                <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 3 }}>
                                    <Typography textAlign="center" fontWeight={500} fontSize="0.9rem">Logout</Typography>
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>

                    {/* Desktop Navigation - Hidden on mobile */}
                    <Box sx={{ 
                        flexGrow: 1, 
                        justifyContent: 'flex-end', 
                        display: { xs: 'none', md: 'flex' }, 
                        alignItems: 'center',
                        gap: 2
                    }}>
                        {/* Add Spot Button */}
                        <Tooltip title={!user ? "You need to login to add a spot" : ""}>
                            <span>
                                <Button
                                    onClick={() => user && router.push('/add-spot')}
                                    disabled={!user}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': {
                                            backgroundColor: user ? 'rgba(47, 47, 47, 0.1)' : 'inherit',
                                            transform: user ? 'translateY(-1px)' : 'none',
                                        },
                                        '&:disabled': {
                                            color: '#8A8A8A',
                                        }
                                    }}
                                >
                                    Add Spot
                                </Button>
                            </span>
                        </Tooltip>

                        {/* Map Button */}
                        <Button
                            onClick={() => router.push('/map')}
                            sx={{
                                color: '#2F2F2F',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                px: 3,
                                py: 1.2,
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': { 
                                    backgroundColor: 'rgba(47, 47, 47, 0.1)',
                                    transform: 'translateY(-1px)',
                                }
                            }}
                        >
                            Map
                        </Button>

                        {/* Auth Buttons */}
                        {!user ? (
                            <>
                                <Button
                                    onClick={() => router.push('/login')}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(47, 47, 47, 0.1)',
                                            transform: 'translateY(-1px)',
                                        }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => router.push('/register')}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(47, 47, 47, 0.1)',
                                            transform: 'translateY(-1px)',
                                        }
                                    }}
                                >
                                    Register
                                </Button>
                            </>
                        ) : (
                            <>
                                {/* User Greeting */}
                                <Typography 
                                    sx={{ 
                                        mr: 2, 
                                        fontWeight: 600, 
                                        color: '#2F2F2F',
                                        fontSize: '0.875rem',
                                        display: { xs: 'none', lg: 'block' }
                                    }}
                                >
                                    Hello, {user.name}
                                </Typography>
                                
                                {/* User Avatar */}
                                <Avatar
                                    alt={user.name}
                                    src={user.photoUrl || DEFAULT_AVATAR_URL}
                                    sx={{ 
                                        width: 38, 
                                        height: 38, 
                                        mr: 2,
                                        cursor: 'pointer',
                                        border: '2px solid rgba(47, 47, 47, 0.1)',
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            opacity: 0.8,
                                            transform: 'scale(1.05)',
                                            borderColor: 'rgba(47, 47, 47, 0.3)'
                                        }
                                    }}
                                />
                                
                                {/* Logout Button */}
                                <Button
                                    onClick={handleLogout}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 2,
                                        transition: 'all 0.2s ease',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(47, 47, 47, 0.1)',
                                            transform: 'translateY(-1px)',
                                        }
                                    }}
                                >
                                    Logout
                                </Button>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
