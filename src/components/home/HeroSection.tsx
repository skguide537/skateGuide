'use client';

import { useTheme } from '@/hooks/useTheme';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { HERO_STYLES } from '@/constants/homePage';
import SkateHeroAnimation from './SkateHeroAnimation';

interface HeroSectionProps {
    showHero: boolean;
    onHideHero: () => void;
    onShowHero: () => void;
}

export default function HeroSection({ showHero, onHideHero, onShowHero }: HeroSectionProps) {
    const { theme } = useTheme();

    if (showHero) {
        return (
            <Box 
                mb={4}
                sx={{
                    ...HERO_STYLES.heroBox,
                    p: { xs: 3, md: 4 },
                    background: theme === 'dark' 
                        ? 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)'
                        : 'linear-gradient(135deg, rgba(52, 152, 219, 0.3) 0%, rgba(46, 204, 113, 0.3) 100%)',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
                        opacity: 0.1,
                    },
                    '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: theme === 'dark'
                            ? 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.1) 100%)'
                            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        pointerEvents: 'none',
                    }
                }}
            >
                {/* Close Button */}
                <IconButton
                    onClick={onHideHero}
                    sx={HERO_STYLES.closeButton}
                >
                    <CloseIcon />
                </IconButton>
                
                {/* Two-column layout: Desktop side-by-side, Mobile stacked */}
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: { xs: 3, md: 4 },
                        position: 'relative' as const,
                        zIndex: 2,
                    }}
                >
                    {/* Left Column: Text Content */}
                    <Box
                        sx={{
                            flex: { xs: '1 1 auto', md: '1 1 50%' },
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: { xs: 'flex-start', md: 'flex-start' },
                            justifyContent: 'center',
                        }}
                    >
                        <Typography 
                            variant="h1" 
                            fontWeight="800" 
                            color="var(--color-accent-green)" 
                            gutterBottom 
                            id="home-welcome-heading"
                            sx={{
                                fontSize: { xs: '2rem', md: '2.5rem', lg: '3rem' },
                                mb: { xs: 1.5, md: 2 },
                                textShadow: theme === 'dark' 
                                    ? '0 4px 8px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5)'
                                    : '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)',
                                filter: theme === 'dark' 
                                    ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
                                    : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                            }}
                        >
                            WELCOME TO SKATEGUIDE
                        </Typography>
                        
                        <Typography 
                            variant="h6" 
                            sx={{ 
                                color: 'var(--color-accent-green)',
                                fontWeight: 500,
                                fontSize: { xs: '1rem', md: '1.125rem' },
                                lineHeight: 1.5,
                                textShadow: theme === 'dark'
                                    ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.6)'
                                    : '0 1px 2px rgba(0, 0, 0, 0.2)',
                                filter: theme === 'dark'
                                    ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9))'
                                    : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                            }} 
                            id="home-subtitle"
                        >
                            Discover, rate, and share skateparks around your city.
                        </Typography>
                    </Box>
                    
                    {/* Right Column: Animation */}
                    <Box
                        sx={{
                            flex: { xs: '1 1 auto', md: '1 1 50%' },
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                        }}
                    >
                        <SkateHeroAnimation />
                    </Box>
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            mb: 4,
            p: { xs: 2, md: 2.5 },
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            transition: 'all var(--transition-fast)',
            '&:hover': {
                boxShadow: 'var(--shadow-md)',
                borderColor: 'var(--color-accent-green)',
            }
        }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                    sx={{
                        fontSize: '1.5rem',
                        lineHeight: 1,
                    }}
                >
                    🛹
                </Box>
                <Typography
                    variant="body2"
                    sx={{
                        color: 'var(--color-text-secondary)',
                        fontWeight: 500,
                        fontSize: { xs: '0.875rem', md: '0.9375rem' },
                    }}
                >
                    Welcome message hidden
                </Typography>
            </Box>
            <Button
                variant="contained"
                onClick={onShowHero}
                size="small"
                sx={{
                    backgroundColor: 'var(--color-accent-green)',
                    color: 'var(--color-surface-elevated)',
                    fontWeight: 600,
                    px: 2.5,
                    py: 1,
                    borderRadius: 'var(--radius-md)',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'all var(--transition-fast)',
                    textTransform: 'none',
                    fontSize: { xs: '0.875rem', md: '0.9375rem' },
                    '&:hover': { 
                        backgroundColor: 'var(--color-accent-green)',
                        transform: 'translateY(-1px)',
                        boxShadow: 'var(--shadow-md)',
                    }
                }}
            >
                Show Welcome Message
            </Button>
        </Box>
    );
}
