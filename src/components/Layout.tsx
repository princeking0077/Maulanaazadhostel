import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  alpha,
  Badge,
  Tooltip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Hotel as HotelIcon,
  Assessment as ReportsIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  AccountCircle,
  Article as ArticleIcon,
  Notifications as NotificationsIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useAppLogo } from '../hooks/useAppLogo';
import { useAuth } from '../hooks/useAuth';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 280;

interface NavItem {
  text: string;
  icon: React.ReactElement;
  path: string;
  badge?: number;
}

const Layout: React.FC = () => {
  const theme = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const appLogo = useAppLogo();

  const navItems: NavItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Management', icon: <PeopleIcon />, path: '/management' },
    { text: 'Admin Billing', icon: <PaymentIcon />, path: '/admin-billing' },
    { text: 'Receipt Register', icon: <ArticleIcon />, path: '/receipt-register' },
    { text: 'Petty Cash', icon: <ArticleIcon />, path: '/petty-cash' },
    { text: 'Salary Statement', icon: <ArticleIcon />, path: '/salary-statement' },
    { text: 'Rooms', icon: <HotelIcon />, path: '/rooms' },
    { text: 'Reports', icon: <ReportsIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Bonafide', icon: <ArticleIcon />, path: '/bonafide' },
    { text: 'Excel Import', icon: <ArticleIcon />, path: '/import' },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const drawer = (
    <Box sx={{
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
    }}>
      {/* Sidebar Header - Premium Gradient */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)',
          color: 'white',
          p: 3,
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />

        <Box sx={{ position: 'relative', zIndex: 10 }}>
          <img
            src={appLogo}
            alt="Maulana Azad Logo"
            style={{
              width: 72,
              height: 72,
              marginBottom: 12,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.2))'
            }}
          />
          <Typography variant="h6" fontWeight="700" letterSpacing="0.5px">
            MAULANA AZAD
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: '1px', textTransform: 'uppercase' }}>
            Hostel Management
          </Typography>
        </Box>
      </Box>

      {/* Navigation Items */}
      <List sx={{ flex: 1, px: 2, py: 2 }} className="custom-scrollbar">
        {navItems.map((item) => {
          const isSelected = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                selected={isSelected}
                sx={{
                  borderRadius: 3,
                  py: 1.5,
                  transition: 'all 0.3s ease',
                  position: 'relative',
                  overflow: 'hidden',
                  '&.Mui-selected': {
                    background: 'linear-gradient(45deg, #1a237e 0%, #3949ab 100%)',
                    color: 'white',
                    boxShadow: '0 4px 12px rgba(26, 35, 126, 0.25)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1a237e 0%, #283593 100%)',
                    },
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    }
                  },
                  '&:hover': {
                    backgroundColor: 'rgba(26, 35, 126, 0.05)',
                    transform: 'translateX(4px)',
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 40,
                    color: isSelected ? 'white' : '#64748b',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {item.badge ? (
                    <Badge badgeContent={item.badge} color="error">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontSize: '0.95rem',
                    fontWeight: isSelected ? 600 : 500,
                  }}
                />
                {isSelected && (
                  <Box sx={{
                    width: 4,
                    height: '60%',
                    bgcolor: '#ffc107',
                    position: 'absolute',
                    right: 0,
                    borderRadius: '4px 0 0 4px'
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* User Info at Bottom */}
      <Box sx={{ p: 2 }}>
        <Box
          className="glass-card"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            p: 2,
            background: 'rgba(255, 255, 255, 0.6)',
            borderRadius: 3,
          }}
        >
          <Avatar
            sx={{
              width: 44,
              height: 44,
              background: 'linear-gradient(135deg, #ff6f00 0%, #ffca28 100%)',
              fontWeight: 'bold',
              boxShadow: '0 4px 8px rgba(255, 111, 0, 0.2)'
            }}
          >
            {(user?.fullName || user?.name || user?.username || 'A').charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" noWrap fontWeight="600" color="#1e293b">
              {user?.fullName || user?.name || user?.username}
            </Typography>
            <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', mt: -0.5 }}>
              {user?.role}
            </Typography>
          </Box>
          <Tooltip title="Logout">
            <IconButton size="small" onClick={handleLogout} sx={{ color: '#ef4444' }}>
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'transparent' }}>
      {/* App Bar - Glassmorphism */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
          color: '#1e293b',
          zIndex: (theme) => theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, background: 'linear-gradient(45deg, #1a237e, #c2185b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {navItems.find(item => item.path === location.pathname)?.text || 'Dashboard'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton size="large" sx={{ color: '#64748b' }}>
              <SearchIcon />
            </IconButton>
            <IconButton size="large" sx={{ color: '#64748b' }}>
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <IconButton
              size="large"
              onClick={handleMenuClick}
              sx={{
                color: theme.palette.primary.main,
                ml: 1,
                border: '1px solid rgba(26, 35, 126, 0.1)',
                p: 0.5
              }}
            >
              <AccountCircle fontSize="large" />
            </IconButton>
          </Box>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            keepMounted
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              elevation: 0,
              sx: {
                overflow: 'visible',
                filter: 'drop-shadow(0px 6px 20px rgba(0,0,0,0.15))',
                mt: 1.5,
                width: 200,
                borderRadius: 3,
                '& .MuiAvatar-root': {
                  width: 32,
                  height: 32,
                  ml: -0.5,
                  mr: 1,
                },
              },
            }}
          >
            <MenuItem onClick={handleMenuClose} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <MenuItem onClick={() => { handleMenuClose(); navigate('/settings'); }} sx={{ py: 1.5 }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              Settings
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: '#ef4444' }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#ef4444' }} />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              backgroundColor: 'transparent',
              boxShadow: '10px 0 30px rgba(0,0,0,0.1)'
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
              backgroundColor: 'transparent',
              borderRight: '1px solid rgba(255,255,255,0.4)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          paddingTop: '64px', // Appbar height
          transition: 'all 0.3s ease',
        }}
        className="animate-fade-in"
      >
        {/* Background gradient handled in index.css body */}
        <Box sx={{ p: 4 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};
export default Layout;
