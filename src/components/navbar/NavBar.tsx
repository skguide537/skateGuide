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
import Loading from "@/components/loading/Loading";




export default function NavBar() {
    const [anchorElNav, setAnchorElNav] = React.useState<null | HTMLElement>(null);
    const [user, setUser] = React.useState<any>(null);


    const [isLoading, setIsLoading] = React.useState<boolean>(true);

    const router = useRouter();

    React.useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
        setIsLoading(false);
    }, []);

    const handleOpenNavMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorElNav(event.currentTarget);
    };

    const handleCloseNavMenu = (href?: string) => {
        setAnchorElNav(null);
        if (href) router.push(href);
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        router.push('/login');
    };
if (isLoading) return <Loading />;

    
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
                <Toolbar disableGutters>
                    {/* Logo / Home link */}
                    <Typography
                        variant="h6"
                        noWrap
                        onClick={() => router.push('/')}
                        sx={{
                            mr: 2,
                            fontWeight: 700,
                            color: '#2F2F2F',
                            cursor: 'pointer',
                        }}
                    >
                        SkateGuide🛹
                    </Typography>

                    {/* Mobile Menu */}
                    <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
                        <IconButton size="large" onClick={handleOpenNavMenu} color="inherit">
                            <MenuIcon />
                        </IconButton>
                        <Menu
                            anchorEl={anchorElNav}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                            transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                            open={Boolean(anchorElNav)}
                            onClose={() => handleCloseNavMenu()}
                            sx={{ display: { xs: 'block', md: 'none' } }}
                        >
                            <MenuItem onClick={() => handleCloseNavMenu('/map')}>
                                <Typography textAlign="center">Map</Typography>
                            </MenuItem>
                            {!user ? (
                                <>
                                    <MenuItem onClick={() => handleCloseNavMenu('/login')}>
                                        <Typography textAlign="center">Login</Typography>
                                    </MenuItem>
                                    <MenuItem onClick={() => handleCloseNavMenu('/register')}>
                                        <Typography textAlign="center">Register</Typography>
                                    </MenuItem>
                                </>
                            ) : (
                                <MenuItem onClick={handleLogout}>
                                    <Typography textAlign="center">Logout</Typography>
                                </MenuItem>
                            )}
                        </Menu>
                    </Box>

                    {/* Desktop Nav */}
                    <Box sx={{ flexGrow: 1, justifyContent: 'flex-end', display: 'flex', alignItems: 'center' }}>
                        <Button
                            onClick={() => handleCloseNavMenu('/map')}
                            sx={{
                                color: '#2F2F2F',
                                fontWeight: 'bold',
                                mx: 1,
                                '&:hover': { backgroundColor: '#8A8A8A', color: '#fff' }
                            }}
                        >
                            Map
                        </Button>

                        {!user ? (
                            <>
                                <Button
                                    onClick={() => handleCloseNavMenu('/login')}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 'bold',
                                        mx: 1,
                                        '&:hover': { backgroundColor: '#8A8A8A', color: '#fff' }
                                    }}
                                >
                                    Login
                                </Button>
                                <Button
                                    onClick={() => handleCloseNavMenu('/register')}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 'bold',
                                        mx: 1,
                                        '&:hover': { backgroundColor: '#8A8A8A', color: '#fff' }
                                    }}
                                >
                                    Register
                                </Button>
                            </>
                        ) : (
                            <>
                                <Typography sx={{ mr: 2, fontWeight: 'bold', color: '#2F2F2F' }}>
                                    Hello, {user.name}
                                </Typography>
                                <Avatar
                                    alt={user.name}
                                    src={user.photoUrl || DEFAULT_AVATAR_URL}
                                    sx={{ width: 36, height: 36, mr: 2 }}
                                />
                                <Button
                                    onClick={handleLogout}
                                    sx={{
                                        color: '#2F2F2F',
                                        fontWeight: 'bold',
                                        mx: 1,
                                        '&:hover': { backgroundColor: '#8A8A8A', color: '#fff' }
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
