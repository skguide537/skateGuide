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
import MapIcon from '@mui/icons-material/Map';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

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
                background: theme === 'dark' 
                    ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                    : 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
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



                    {/* Theme Toggle */}
                    <Tooltip title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}>
                        <IconButton
                            onClick={toggleTheme}
                            sx={{
                                mr: 1,
                                color: theme === 'light' ? 'var(--color-accent-rust)' : 'var(--color-accent-green)',
                                backgroundColor: theme === 'light' 
                                    ? 'rgba(230, 126, 34, 0.1)' 
                                    : 'rgba(39, 174, 96, 0.1)',
                                border: `2px solid ${theme === 'light' ? 'var(--color-accent-rust)' : 'var(--color-accent-green)'}`,
                                borderRadius: 'var(--radius-md)',
                                transition: 'all var(--transition-fast)',
                                p: 1,
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

                            
                            <MenuItem onClick={() => handleCloseNavMenu('/map')} sx={{ py: 1, px: 2 }}>
                                <MapIcon sx={{ mr: 1, fontSize: 20 }} />
                                <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Map</Typography>
                            </MenuItem>
                            {user && (
                                <MenuItem onClick={() => handleCloseNavMenu('/add-spot')} sx={{ py: 1, px: 2 }}>
                                    <AddLocationIcon sx={{ mr: 1, fontSize: 20 }} />
                                    <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Add Spot</Typography>
                                </MenuItem>
                            )}
                            {!user ? (
                                <>
                                    <MenuItem onClick={() => handleCloseNavMenu('/login')} sx={{ py: 1, px: 2 }}>
                                        <LoginIcon sx={{ mr: 1, fontSize: 20 }} />
                                        <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Login</Typography>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCloseNavMenu('/register')} sx={{ py: 1, px: 2 }}>
                                        <PersonAddIcon sx={{ mr: 1, fontSize: 20 }} />
                                        <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Register</Typography>
                                    </MenuItem>
                                </>
                            ) : (
                                <MenuItem onClick={handleLogout} sx={{ py: 1, px: 2 }}>
                                    <LogoutIcon sx={{ mr: 1, fontSize: 20 }} />
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
                        gap: 1
                    }}>
                        {/* Add Spot Button */}
                        <Tooltip title={!user ? "You need to login to add a spot" : "Add New Spot"}>
                            <span>
                                <IconButton
                                    onClick={() => user && router.push('/add-spot')}
                                    disabled={!user}
                                    sx={{
                                        color: 'var(--color-surface-elevated)',
                                        backgroundColor: 'var(--color-accent-rust)',
                                        border: '2px solid var(--color-accent-rust)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        p: 1,
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
                                    <AddLocationIcon />
                                </IconButton>
                            </span>
                        </Tooltip>

                        {/* Map Button */}
                        <Tooltip title="View Map">
                            <IconButton
                                onClick={() => router.push('/map')}
                                sx={{
                                    color: 'var(--color-accent-blue)',
                                    backgroundColor: 'rgba(52, 152, 219, 0.1)',
                                    border: '2px solid var(--color-accent-blue)',
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'all var(--transition-fast)',
                                    boxShadow: 'var(--shadow-sm)',
                                    p: 1,
                                    '&:hover': { 
                                        backgroundColor: 'rgba(52, 152, 219, 0.2)',
                                        transform: 'translateY(-2px)',
                                        boxShadow: 'var(--shadow-md)',
                                    }
                                }}
                            >
                                <MapIcon />
                            </IconButton>
                        </Tooltip>

                        {/* Auth Buttons */}
                        {!user ? (
                            <>
                                <Tooltip title="Login to your account">
                                    <IconButton
                                        onClick={() => router.push('/login')}
                                        sx={{
                                            color: 'var(--color-accent-green)',
                                            backgroundColor: 'rgba(39, 174, 96, 0.1)',
                                            border: '2px solid var(--color-accent-green)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all var(--transition-fast)',
                                            boxShadow: 'var(--shadow-sm)',
                                            p: 1,
                                            '&:hover': { 
                                                backgroundColor: 'rgba(39, 174, 96, 0.2)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'var(--shadow-md)',
                                            }
                                        }}
                                    >
                                        <LoginIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Create a new account">
                                    <IconButton
                                        onClick={() => router.push('/register')}
                                        sx={{
                                            color: 'var(--color-surface-elevated)',
                                            backgroundColor: 'var(--color-accent-green)',
                                            border: '2px solid var(--color-accent-green)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all var(--transition-fast)',
                                            boxShadow: 'var(--shadow-sm)',
                                            p: 1,
                                            '&:hover': { 
                                                backgroundColor: 'var(--color-accent-green)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'var(--shadow-md)',
                                            }
                                        }}
                                    >
                                        <PersonAddIcon />
                                    </IconButton>
                                </Tooltip>
                            </>
                        ) : (
                            <>

                                
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
                                <IconButton
                                    onClick={handleLogout}
                                    sx={{
                                        color: 'var(--color-accent-rust)',
                                        backgroundColor: 'rgba(230, 126, 34, 0.1)',
                                        border: '2px solid var(--color-accent-rust)',
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'all var(--transition-fast)',
                                        boxShadow: 'var(--shadow-sm)',
                                        p: 1,
                                        '&:hover': { 
                                            backgroundColor: 'rgba(230, 126, 34, 0.2)',
                                            transform: 'translateY(-2px)',
                                            boxShadow: 'var(--shadow-md)',
                                        }
                                    }}
                                >
                                    <LogoutIcon />
                                </IconButton>
                            </>
                        )}
                    </Box>
                </Toolbar>
            </Container>
        </AppBar>
    );
}
