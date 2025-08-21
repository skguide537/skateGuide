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
import { useRouter, usePathname } from 'next/navigation';
import { DEFAULT_AVATAR_URL } from '@/types/constants';
import { useToast } from '@/context/ToastContext';
import { useUser } from '@/context/UserContext';
import { useTheme } from '@/context/ThemeContext';
import Tooltip from '@mui/material/Tooltip';
import HomeIcon from '@mui/icons-material/Home';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

export default function NavBar() {
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const { showToast } = useToast();
    const { user, logout, isLoading } = useUser();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();

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

    const handleLogoClick = () => {
        if (pathname === '/') {
            window.dispatchEvent(new CustomEvent('resetToPageOne'));
        } else {
            router.push('/');
        }
    };

    const handleHomeClick = () => {
        if (pathname === '/') {
            window.dispatchEvent(new CustomEvent('resetToPageOne'));
        } else {
            router.push('/');
        }
    };

    return (
        <AppBar
            position="static"
            sx={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)',
                border: 'none',
                borderRadius: 0,
                width: '100%',
                boxShadow: 'var(--shadow-lg)',
                backdropFilter: 'blur(10px)',
                transition: 'all var(--transition-normal)',
            }}
        >
            <Container maxWidth="xl">
                <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
                    {/* Logo - Always visible */}
                    <Typography
                        variant="h5"
                        noWrap
                        onClick={handleLogoClick}
                        sx={{
                            mr: 3,
                            fontWeight: 800,
                            color: 'var(--color-accent-green)',
                            cursor: 'pointer',
                            fontSize: { xs: '1.25rem', md: '1.5rem' },
                            flexShrink: 0,
                            transition: 'all var(--transition-fast)',
                            textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                            '&:hover': {
                                transform: 'scale(1.05)',
                                color: 'var(--color-accent-green)',
                                textShadow: '0 4px 8px rgba(0, 0, 0, 0.4)',
                            }
                        }}
                    >
                        🛹 SkateGuide
                    </Typography>

                    {/* Home Button - Next to logo */}
                    <Tooltip title="Go to Home">
                        <IconButton
                            onClick={handleHomeClick}
                            sx={{
                                mr: 2,
                                color: 'var(--color-accent-blue)',
                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                border: '2px solid var(--color-accent-blue)',
                                borderRadius: 'var(--radius-md)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': {
                                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'var(--shadow-md)',
                                }
                            }}
                        >
                            <HomeIcon />
                        </IconButton>
                    </Tooltip>

                    {/* Theme Toggle - Next to home button */}
                    <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                mr: 2,
                                color: theme === 'light' ? 'var(--color-accent-rust)' : 'var(--color-accent-green)',
                                backgroundColor: theme === 'light' 
                                    ? 'rgba(230, 126, 34, 0.1)' 
                                    : 'rgba(39, 174, 96, 0.1)',
                                border: `2px solid ${theme === 'light' ? 'var(--color-accent-rust)' : 'var(--color-accent-green)'}`,
                                borderRadius: 'var(--radius-md)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': {
                                    backgroundColor: theme === 'light' 
                                        ? 'rgba(230, 126, 34, 0.2)' 
                                        : 'rgba(39, 174, 96, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'var(--shadow-md)',
                                }
                            }}
                        >
                            {theme === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
                        </IconButton>
                    </Tooltip>

                    {/* Mobile Menu Button - Only show on mobile */}
                    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexGrow: 1, justifyContent: 'flex-end' }}>
                        <IconButton 
                            size="large" 
                            onClick={handleOpenNavMenu} 
                            color="inherit"
                            sx={{ 
                                color: 'var(--color-accent-green)',
                                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                                border: '2px solid var(--color-accent-green)',
                                borderRadius: 'var(--radius-md)',
                                transition: 'all var(--transition-fast)',
                                '&:hover': { 
                                    backgroundColor: 'rgba(39, 174, 96, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'var(--shadow-md)',
                                }
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
                                    minWidth: 160,
                                    mt: 1,
                                    borderRadius: 'var(--radius-lg)',
                                    boxShadow: 'var(--shadow-xl)',
                                    backgroundColor: 'var(--color-surface-elevated)',
                                    border: '1px solid var(--color-border)',
                                }
                            }}
                        >
                            {/* Show user greeting on mobile */}
                            {user && (
                                <MenuItem sx={{ 
                                    pointerEvents: 'none', 
                                    borderBottom: '1px solid var(--color-border)',
                                    py: 2,
                                    px: 3
                                }}>
                                    <Typography textAlign="center" fontWeight={600} color="var(--color-text-primary)" fontSize="0.9rem">
                                        Hello, {user.name}
                                    </Typography>
                                </MenuItem>
                            )}
                            
                            <MenuItem onClick={() => handleCloseNavMenu('/map')} sx={{ py: 1.5, px: 3 }}>
                                <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Map</Typography>
                            </MenuItem>
                            {user && (
                                <MenuItem onClick={() => handleCloseNavMenu('/add-spot')} sx={{ py: 1.5, px: 3 }}>
                                    <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Add Spot</Typography>
                                </MenuItem>
                            )}
                            {!user ? (
                                <>
                                    <MenuItem onClick={() => handleCloseNavMenu('/login')} sx={{ py: 1.5, px: 3 }}>
                                        <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Login</Typography>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCloseNavMenu('/register')} sx={{ py: 1.5, px: 3 }}>
                                        <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Register</Typography>
                                    </MenuItem>
                                </>
                            ) : (
                                <MenuItem onClick={handleLogout} sx={{ py: 1.5, px: 3 }}>
                                    <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Logout</Typography>
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
                                        color: 'var(--color-surface-elevated)',
                                        backgroundColor: 'var(--color-accent-rust)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--color-accent-rust)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        '&:hover': {
                                            backgroundColor: user ? 'var(--color-accent-rust)' : 'inherit',
                                            transform: user ? 'translateY(-2px)' : 'none',
                                            boxShadow: user ? 'var(--shadow-md)' : 'none',
                                        },
                                        '&:disabled': {
                                            color: 'var(--color-text-secondary)',
                                            backgroundColor: 'var(--color-surface)',
                                            borderColor: 'var(--color-border)',
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
                                color: 'var(--color-accent-blue)',
                                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                fontWeight: 600,
                                textTransform: 'none',
                                fontSize: '0.875rem',
                                px: 3,
                                py: 1.2,
                                borderRadius: 'var(--radius-md)',
                                border: '2px solid var(--color-accent-blue)',
                                transition: 'all var(--transition-fast)',
                                boxShadow: 'var(--shadow-sm)',
                                '&:hover': { 
                                    backgroundColor: 'rgba(52, 152, 219, 0.2)',
                                    transform: 'translateY(-2px)',
                                    boxShadow: 'var(--shadow-md)',
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
                                        color: 'var(--color-accent-green)',
                                        backgroundColor: 'rgba(39, 174, 96, 0.1)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--color-accent-green)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(39, 174, 96, 0.2)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'var(--shadow-md)',
                                        }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => router.push('/register')}
                                    sx={{
                                        color: 'var(--color-surface-elevated)',
                                        backgroundColor: 'var(--color-accent-green)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--color-accent-green)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        '&:hover': { 
                                            backgroundColor: 'var(--color-accent-green)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'var(--shadow-md)',
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
                                        color: 'var(--color-accent-green)',
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
                                        width: 40, 
                                        height: 40, 
                                        mr: 2,
                                        cursor: 'pointer',
                                        border: '3px solid var(--color-accent-green)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        '&:hover': { 
                                            opacity: 0.8,
                                            transform: 'scale(1.05)',
                                            boxShadow: 'var(--shadow-md)',
                                        }
                                    }}
                                />
                                
                                {/* Logout Button */}
                                <Button
                                    onClick={handleLogout}
                                    sx={{
                                        color: 'var(--color-accent-rust)',
                                        backgroundColor: 'rgba(230, 126, 34, 0.1)',
                                        fontWeight: 600,
                                        textTransform: 'none',
                                        fontSize: '0.875rem',
                                        px: 3,
                                        py: 1.2,
                                        borderRadius: 'var(--radius-md)',
                                        border: '2px solid var(--color-accent-rust)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        '&:hover': { 
                                            backgroundColor: 'rgba(230, 126, 34, 0.2)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'var(--shadow-md)',
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
