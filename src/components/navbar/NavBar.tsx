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
import { useToast } from '@/hooks/useToast';
import { useUser } from '@/hooks/useUser';
import { useTheme } from '@/hooks/useTheme';
import Tooltip from '@mui/material/Tooltip';
import HomeIcon from '@mui/icons-material/Home';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import MapIcon from '@mui/icons-material/Map';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationOffIcon from '@mui/icons-material/LocationOff';
import LocationSearchingIcon from '@mui/icons-material/LocationSearching';
import Link from 'next/link';
import { useGeolocationContext } from '@/hooks/useGeolocationContext';

export default function NavBar() {
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const { showToast } = useToast();
    const { user, logout, isLoading } = useUser();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();
    const pathname = usePathname();
    const { status: geoStatus, retry: onLocationRetry, isLoading: isGeoLoading } = useGeolocationContext();

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = () => {
        setAnchorElNav(null);
    };

    const handleLogout = () => {
        logout();
        showToast('Logged out successfully', 'success');
        setTimeout(() => router.push('/login'), 1000);
    };

    const handleHomeClick = () => {
        if (pathname === '/') {
            window.dispatchEvent(new CustomEvent('resetToPageOne'));
        } else {
            router.push('/');
        }
    };

    const handleLocationRetry = () => {
        if (geoStatus === 'fallback') {
            onLocationRetry();
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
                        onClick={handleHomeClick}
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

                    {/* Location Status Icon */}
                    <Tooltip 
                            title={
                                geoStatus === 'success' 
                                    ? 'Location access is enabled.'
                                    : 'Allow location access to see skateparks\' distance from you.'
                            }
                        >
                            <span>
                                <IconButton
                                    onClick={handleLocationRetry}
                                    disabled={geoStatus === 'success' || isGeoLoading}
                                    sx={{
                                        mr: 1,
                                        color: geoStatus === 'success' 
                                            ? 'var(--color-accent-green)' 
                                            : 'var(--color-accent-rust)',
                                        backgroundColor: geoStatus === 'success'
                                            ? 'rgba(39, 174, 96, 0.1)'
                                            : 'rgba(230, 126, 34, 0.1)',
                                        border: `2px solid ${geoStatus === 'success' ? 'var(--color-accent-green)' : 'var(--color-accent-rust)'}`,
                                        borderRadius: 'var(--radius-md)',
                                        transition: 'all var(--transition-fast)',
                                        p: 1,
                                        cursor: geoStatus === 'fallback' ? 'pointer' : 'default',
                                        '&:hover': {
                                            backgroundColor: geoStatus === 'success'
                                                ? 'rgba(39, 174, 96, 0.2)'
                                                : 'rgba(230, 126, 34, 0.2)',
                                            transform: geoStatus === 'fallback' ? 'translateY(-2px)' : 'none',
                                            boxShadow: geoStatus === 'fallback' ? 'var(--shadow-md)' : 'none',
                                        },
                                        '&:disabled': {
                                            opacity: 0.6,
                                            cursor: 'default',
                                        }
                                    }}
                                >
                                    {geoStatus === 'loading' || isGeoLoading ? (
                                        <LocationSearchingIcon />
                                    ) : geoStatus === 'success' ? (
                                        <LocationOnIcon />
                                    ) : (
                                        <LocationOffIcon />
                                    )}
                                </IconButton>
                            </span>
                    </Tooltip>

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
                            <MenuItem onClick={handleCloseNavMenu} sx={{ py: 1, px: 2 }}>
                                <Link href="/map" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                    <MapIcon sx={{ mr: 1, fontSize: 20 }} />
                                    <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Map</Typography>
                                </Link>
                            </MenuItem>
                            {user && (
                                <>
                                    {user.role === 'admin' && (
                                        <MenuItem onClick={handleCloseNavMenu} sx={{ py: 1, px: 2 }}>
                                            <Link href="/admin-panel" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                                <AdminPanelSettingsIcon sx={{ mr: 1, fontSize: 20 }} />
                                                <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Admin Panel</Typography>
                                            </Link>
                                        </MenuItem>
                                    )}
                                    <MenuItem onClick={handleCloseNavMenu} sx={{ py: 1, px: 2 }}>
                                        <Link href={`/profile/${user._id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                            <PersonIcon sx={{ mr: 1, fontSize: 20 }} />
                                            <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Profile</Typography>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem onClick={handleCloseNavMenu} sx={{ py: 1, px: 2 }}>
                                        <Link href="/add-spot" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                            <AddLocationIcon sx={{ mr: 1, fontSize: 20 }} />
                                            <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Add Spot</Typography>
                                        </Link>
                                    </MenuItem>
                                </>
                            )}
                            {!user ? (
                                <>
                                    <MenuItem onClick={handleCloseNavMenu} sx={{ py: 1, px: 2 }}>
                                        <Link href="/login" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                            <LoginIcon sx={{ mr: 1, fontSize: 20 }} />
                                            <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Login</Typography>
                                        </Link>
                                    </MenuItem>
                                    <MenuItem onClick={handleCloseNavMenu} sx={{ py: 1, px: 2 }}>
                                        <Link href="/register" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', width: '100%' }}>
                                            <PersonAddIcon sx={{ mr: 1, fontSize: 20 }} />
                                            <Typography textAlign="center" fontWeight={500} fontSize="0.9rem" color="var(--color-text-primary)">Register</Typography>
                                        </Link>
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
                                {user ? (
                                    <Link href="/add-spot" style={{ textDecoration: 'none' }}>
                                        <IconButton
                                            sx={{
                                                color: 'var(--color-surface-elevated)',
                                                backgroundColor: 'var(--color-accent-rust)',
                                                border: '2px solid var(--color-accent-rust)',
                                                borderRadius: 'var(--radius-md)',
                                                transition: 'all var(--transition-fast)',
                                                boxShadow: 'var(--shadow-sm)',
                                                p: 1,
                                                '&:hover': {
                                                    backgroundColor: 'var(--color-accent-rust)',
                                                    transform: 'translateY(-2px)',
                                                    boxShadow: 'var(--shadow-md)',
                                                }
                                            }}
                                        >
                                            <AddLocationIcon />
                                        </IconButton>
                                    </Link>
                                ) : (
                                    <IconButton
                                        disabled={true}
                                        sx={{
                                            color: 'var(--color-text-secondary)',
                                            backgroundColor: 'var(--color-surface)',
                                            border: '2px solid var(--color-border)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all var(--transition-fast)',
                                            boxShadow: 'var(--shadow-sm)',
                                            p: 1,
                                        }}
                                    >
                                        <AddLocationIcon />
                                    </IconButton>
                                )}
                            </span>
                        </Tooltip>

                        {/* Map Button */}
                        <Tooltip title="View Map">
                            <Link href="/map" style={{ textDecoration: 'none' }}>
                                <IconButton
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
                            </Link>
                        </Tooltip>

                        {user?.role === 'admin' && (
                            <Tooltip title="Admin Panel">
                                <Link href="/admin-panel" style={{ textDecoration: 'none' }}>
                                    <IconButton
                                        sx={{
                                            color: 'var(--color-accent-purple, #8e44ad)',
                                            backgroundColor: 'rgba(142, 68, 173, 0.12)',
                                            border: '2px solid rgba(142, 68, 173, 0.6)',
                                            borderRadius: 'var(--radius-md)',
                                            transition: 'all var(--transition-fast)',
                                            boxShadow: 'var(--shadow-sm)',
                                            p: 1,
                                            '&:hover': {
                                                backgroundColor: 'rgba(142, 68, 173, 0.2)',
                                                transform: 'translateY(-2px)',
                                                boxShadow: 'var(--shadow-md)',
                                            }
                                        }}
                                    >
                                        <AdminPanelSettingsIcon />
                                    </IconButton>
                                </Link>
                            </Tooltip>
                        )}

                        {/* Auth Buttons */}
                        {!user ? (
                            <>
                                <Tooltip title="Login to your account">
                                    <Link href="/login" style={{ textDecoration: 'none' }}>
                                        <IconButton
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
                                    </Link>
                                </Tooltip>
                                <Tooltip title="Create a new account">
                                    <Link href="/register" style={{ textDecoration: 'none' }}>
                                        <IconButton
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
                                    </Link>
                                </Tooltip>
                            </>
                        ) : (
                            <>
                                {/* User Avatar - Links to Profile */}
                                <Tooltip title="View Profile">
                                    <Link href={`/profile/${user._id}`} style={{ textDecoration: 'none' }}>
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
                                    </Link>
                                </Tooltip>
                                
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
