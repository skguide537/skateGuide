'use client';

import { useRouter } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { HERO_STYLES } from '@/constants/homePage';

interface HeroSectionProps {
    showHero: boolean;
    onHideHero: () => void;
    onShowHero: () => void;
}

export default function HeroSection({ showHero, onHideHero, onShowHero }: HeroSectionProps) {
    const router = useRouter();
    const { theme } = useTheme();

    if (showHero) {
        return (
            <Box 
                textAlign="center" 
                mb={8}
                sx={{
                    ...HERO_STYLES.heroBox,
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
                
                <Typography 
                    variant="h1" 
                    fontWeight="800" 
                    color="var(--color-accent-green)" 
                    gutterBottom 
                    id="home-welcome-heading"
                    sx={{
                        ...HERO_STYLES.heroTitle,
                        textShadow: theme === 'dark' 
                            ? '0 4px 8px rgba(0, 0, 0, 0.7), 0 2px 4px rgba(0, 0, 0, 0.5)'
                            : '0 2px 4px rgba(0, 0, 0, 0.2), 0 1px 2px rgba(0, 0, 0, 0.1)',
                        filter: theme === 'dark' 
                            ? 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.8))'
                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))',
                    }}
                >
                    WELCOME TO SKATEGUIDE 🛹
                </Typography>
                
                <Typography 
                    variant="h5" 
                    sx={{ 
                        ...HERO_STYLES.heroSubtitle,
                        color: 'var(--color-accent-green)',
                        fontWeight: 600,
                        textShadow: theme === 'dark'
                            ? '0 2px 4px rgba(0, 0, 0, 0.8), 0 1px 2px rgba(0, 0, 0, 0.6)'
                            : '0 1px 2px rgba(0, 0, 0, 0.2)',
                        filter: theme === 'dark'
                            ? 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.9))'
                            : 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
                    }} 
                    id="home-subtitle"
                >
                    Discover, rate, and share skateparks around the city — from wooden ramps to metallic rails.
                </Typography>
                
                <Button
                    variant="contained"
                    onClick={() => router.push('/map')}
                    id="home-explore-map-btn"
                    sx={{
                        ...HERO_STYLES.exploreButton,
                        backgroundColor: 'var(--color-accent-rust)',
                        color: 'var(--color-surface-elevated)',
                        '&:hover': { 
                            backgroundColor: 'var(--color-accent-rust)',
                            transform: 'translateY(-3px)',
                            boxShadow: 'var(--shadow-xl)',
                        }
                    }}
                >
                    Explore the Map
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ 
            textAlign: 'left', 
            mb: 6,
            p: 3,
            backgroundColor: 'var(--color-surface-elevated)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-md)',
            background: 'linear-gradient(135deg, var(--color-surface-elevated) 0%, var(--color-surface) 100%)'
        }}>
            <Button
                variant="contained"
                onClick={onShowHero}
                size="small"
                sx={{
                    ...HERO_STYLES.showHeroButton,
                    backgroundColor: 'var(--color-accent-green)',
                    color: 'var(--color-surface-elevated)',
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
