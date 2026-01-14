import React, { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useTheme,
} from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import LockIcon from '@mui/icons-material/Lock';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import SecurityIcon from '@mui/icons-material/Security';
import PersonIcon from '@mui/icons-material/Person';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import MoneyIcon from '@mui/icons-material/AttachMoney';
import ImageIcon from '@mui/icons-material/Image';
import UploadIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import { useAuth } from '../hooks/useAuth';
import { db, generateAcademicYears, getAcademicYearFromDate, setAnnualFeesForAcademicYear, getAnnualFeesForAcademicYear } from '../database/db';

const Settings: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Wing Annual Fees
  const [wingFees, setWingFees] = useState({
    A: 50000,
    B: 55000,
    C: 45000,
    D: 48000,
  });

  // Wing Room Capacities
  const [wingCapacities, setWingCapacities] = useState({
    A: { rooms: 33, capacity: 3 },
    B: { rooms: 7, capacity: 4 },
    C: { rooms: 35, capacity: 2 },
    D: { rooms: 9, capacity: 2 },
  });

  // Logo upload
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Application settings
  const [settings, setSettings] = useState({
    enableNotifications: true,
    darkMode: false,
    autoSave: true,
    showWelcomeMessage: true,
  });

  // Academic year defaults
  const academicYears = generateAcademicYears(5, 2);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>(academicYears[academicYears.length - 1].label);
  const [academicFees, setAcademicFees] = useState<Record<'A'|'B'|'C'|'D', number>>({ A: wingFees.A, B: wingFees.B, C: wingFees.C, D: wingFees.D });

  // Load wing fees and logo from database/localStorage
  useEffect(() => {
    loadWingFees();
    loadWingCapacities();
    loadLogo();
    loadAcademicFees();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLogo = async () => {
    const logo = await db.settings.get('logo');
    if (logo) {
      setUploadedLogo(logo.value);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showSnackbar('Please upload an image file', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showSnackbar('Image size should be less than 2MB', 'error');
      return;
    }

    setLogoFile(file);

    // Read and convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;
      setUploadedLogo(base64);
      await db.settings.put({ key: 'logo', value: base64 });
      showSnackbar('Logo uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteLogo = async () => {
    setUploadedLogo(null);
    setLogoFile(null);
    await db.settings.delete('logo');
    showSnackbar('Logo removed successfully', 'success');
  };

  const loadWingFees = async () => {
    try {
      if (!db || !db.settings) throw new Error('Database not initialized');
      const wings = ['A', 'B', 'C', 'D'] as const;
      const fees: Record<string, number> = {};
      const defaults = { A: 50000, B: 55000, C: 45000, D: 48000 };
      
      for (const wing of wings) {
        const setting = await db.settings.where('key').equals(`wing_${wing}_fee`).first();
        fees[wing] = setting ? parseInt(setting.value, 10) : defaults[wing];
      }
      
      setWingFees(fees as typeof wingFees);
    } catch (error) {
      console.error('Error loading wing fees:', error);
      showSnackbar('Error loading wing fees. Check console.', 'error');
    }
  };

  const loadWingCapacities = async () => {
    try {
      if (!db || !db.settings) throw new Error('Database not initialized');
      const wings = ['A', 'B', 'C', 'D'] as const;
      const capacities: Record<string, { rooms: number; capacity: number }> = {};
      const defaults = {
        A: { rooms: 33, capacity: 3 },
        B: { rooms: 7, capacity: 4 },
        C: { rooms: 35, capacity: 2 },
        D: { rooms: 9, capacity: 2 }
      };
      
      for (const wing of wings) {
        const roomsSetting = await db.settings.where('key').equals(`wing_${wing}_rooms`).first();
        const capacitySetting = await db.settings.where('key').equals(`wing_${wing}_capacity`).first();
        
        capacities[wing] = {
          rooms: roomsSetting ? parseInt(roomsSetting.value, 10) : defaults[wing].rooms,
          capacity: capacitySetting ? parseInt(capacitySetting.value, 10) : defaults[wing].capacity,
        };
      }
      
      setWingCapacities(capacities as typeof wingCapacities);
    } catch (error) {
      console.error('Error loading wing capacities:', error);
      showSnackbar('Error loading wing capacities. Check console.', 'error');
    }
  };

  const handleWingFeeChange = (wing: keyof typeof wingFees, value: string) => {
    const numValue = parseInt(value) || 0;
    setWingFees(prev => ({ ...prev, [wing]: numValue }));
  };

  const handleAcademicFeeChange = (wing: keyof typeof academicFees, value: string) => {
    const num = parseInt(value, 10) || 0;
    setAcademicFees(prev => ({ ...prev, [wing]: num }));
  };

  const loadAcademicFees = async (label?: string) => {
    try {
      const yrLabel = label || selectedAcademicYear;
      const yr = academicYears.find(y => y.label === yrLabel);
      if (!yr) return;
      const fees = await getAnnualFeesForAcademicYear(yr.startYear);
      if (fees) setAcademicFees(fees);
      else setAcademicFees({ A: wingFees.A, B: wingFees.B, C: wingFees.C, D: wingFees.D });
    } catch (error) {
      console.error('Error loading academic fees:', error);
    }
  };

  const saveAcademicFees = async () => {
    try {
      const yr = academicYears.find(y => y.label === selectedAcademicYear);
      if (!yr) return;
      await setAnnualFeesForAcademicYear(yr.startYear, academicFees);
      // Apply defaults to students of the selected academic year
      await applyAcademicFeesToStudents();
      showSnackbar('Academic year default fees saved', 'success');
    } catch (error) {
      console.error('Error saving academic fees:', error);
      showSnackbar('Error saving academic fees', 'error');
    }
  };

  const applyAcademicFeesToStudents = async () => {
    try {
      const yr = academicYears.find(y => y.label === selectedAcademicYear);
      if (!yr) return;
      const allStudents = await db.students.toArray();
      let updated = 0;
      for (const s of allStudents) {
        if (!s.joiningDate) continue;
        const studentYear = getAcademicYearFromDate(new Date(s.joiningDate));
        if (studentYear.startYear === yr.startYear) {
          const fee = academicFees[s.wing];
          if (fee !== undefined && fee !== s.annualFee) {
            await db.students.update(s.id!, { annualFee: fee });
            updated++;
          }
        }
      }
      showSnackbar(`Updated annual fee for ${updated} student(s)`, 'success');
    } catch (error) {
      console.error('Error applying academic fees:', error);
      showSnackbar('Error applying academic fees', 'error');
    }
  };

  const handleWingCapacityChange = (wing: keyof typeof wingCapacities, field: 'rooms' | 'capacity', value: string) => {
    const numValue = parseInt(value) || 0;
    setWingCapacities(prev => ({
      ...prev,
      [wing]: { ...prev[wing], [field]: numValue }
    }));
  };

  const saveWingFees = async () => {
    try {
      const wings = ['A', 'B', 'C', 'D'] as const;
      
      // Save fees
      for (const wing of wings) {
        const feeKey = `wing_${wing}_fee`;
        const existing = await db.settings.where('key').equals(feeKey).first();
        
        if (existing) {
          await db.settings.update(existing.id!, { value: wingFees[wing].toString() });
        } else {
          await db.settings.add({
            key: feeKey,
            value: wingFees[wing].toString(),
            description: `Annual fee for Wing ${wing}`,
          });
        }

        // Save capacities
        const roomsKey = `wing_${wing}_rooms`;
        const capacityKey = `wing_${wing}_capacity`;
        
        const roomsExisting = await db.settings.where('key').equals(roomsKey).first();
        const capacityExisting = await db.settings.where('key').equals(capacityKey).first();
        
        if (roomsExisting) {
          await db.settings.update(roomsExisting.id!, { value: wingCapacities[wing].rooms.toString() });
        } else {
          await db.settings.add({
            key: roomsKey,
            value: wingCapacities[wing].rooms.toString(),
            description: `Number of rooms in Wing ${wing}`,
          });
        }

        if (capacityExisting) {
          await db.settings.update(capacityExisting.id!, { value: wingCapacities[wing].capacity.toString() });
        } else {
          await db.settings.add({
            key: capacityKey,
            value: wingCapacities[wing].capacity.toString(),
            description: `Capacity per room in Wing ${wing}`,
          });
        }
      }

      // Auto create/delete rooms based on new configuration
      await syncRoomsWithCapacity();
      
      showSnackbar('Wing configuration updated successfully', 'success');
    } catch (error) {
      console.error('Error saving wing configuration:', error);
      showSnackbar('Error saving wing configuration', 'error');
    }
  };

  const syncRoomsWithCapacity = async () => {
    try {
      const wings = ['A', 'B', 'C', 'D'] as const;
      
      for (const wing of wings) {
        const targetRoomCount = wingCapacities[wing].rooms;
        const roomCapacity = wingCapacities[wing].capacity;
        
        // Get existing rooms for this wing
        const existingRooms = await db.rooms.where('wing').equals(wing).toArray();
        const existingNumbers = new Set(
          existingRooms.map(r => parseInt(r.roomNumber.replace(/^\D+/,'') || '0', 10))
        );

        // 1) Ensure rooms 1..targetRoomCount exist (fill gaps as needed)
        const roomsToAdd: { roomNumber: string; wing: typeof wing; capacity: number; currentOccupancy: number; isActive: boolean }[] = [];
        for (let i = 1; i <= targetRoomCount; i++) {
          if (!existingNumbers.has(i)) {
            const roomNumber = `${wing}${i.toString().padStart(3, '0')}`;
            roomsToAdd.push({
              roomNumber,
              wing,
              capacity: roomCapacity,
              currentOccupancy: 0,
              isActive: true,
            });
          }
        }
        if (roomsToAdd.length > 0) {
          await db.rooms.bulkAdd(roomsToAdd);
        }

        // 2) Delete rooms beyond target (only empty ones)
        const roomsBeyondTarget = existingRooms.filter(r => {
          const num = parseInt(r.roomNumber.replace(/^\D+/,'') || '0', 10);
          return num > targetRoomCount;
        });
        const emptyRoomsToDelete = roomsBeyondTarget.filter(r => r.currentOccupancy === 0);
        if (emptyRoomsToDelete.length > 0) {
          await db.rooms.bulkDelete(emptyRoomsToDelete.map(r => r.id!));
        }
        if (emptyRoomsToDelete.length < roomsBeyondTarget.length) {
          showSnackbar(
            `Warning: Some rooms in Wing ${wing} have occupants and cannot be deleted`,
            'error'
          );
        }
        
        // Update capacity for existing rooms
        const allWingRooms = await db.rooms.where('wing').equals(wing).toArray();
        for (const room of allWingRooms) {
          if (room.capacity !== roomCapacity) {
            await db.rooms.update(room.id!, { capacity: roomCapacity });
          }
        }
      }
    } catch (error) {
      console.error('Error syncing rooms:', error);
    }
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handlePasswordChange = async () => {
    if (!user || !user.id) {
      showSnackbar('User not identified', 'error');
      return;
    }

    try {
      // Validate current password
      const dbUser = await db.users.get(user.id);
      if (!dbUser || dbUser.password !== passwordForm.currentPassword) {
        showSnackbar('Current password is incorrect', 'error');
        return;
      }

      // Validate new password
      if (passwordForm.newPassword.length < 6) {
        showSnackbar('New password must be at least 6 characters long', 'error');
        return;
      }

      if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        showSnackbar('New passwords do not match', 'error');
        return;
      }

      // Update password
      await db.users.update(user.id, { password: passwordForm.newPassword });

      showSnackbar('Password changed successfully! Please remember your new password.', 'success');
      setPasswordDialog(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      showSnackbar('Failed to change password', 'error');
    }
  };

  const handleSettingChange = (setting: string) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({
      ...prev,
      [setting]: event.target.checked,
    }));
    showSnackbar('Settings updated successfully', 'success');
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight="600" gutterBottom>
        Settings
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
        {/* Account Settings */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <PersonIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Account Settings
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Current User
                </Typography>
                <Typography variant="body1" fontWeight="500">
                  {user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Role: {user?.role}
                </Typography>
              </Box>

              <Button
                variant="outlined"
                startIcon={<VpnKeyIcon />}
                onClick={() => setPasswordDialog(true)}
                fullWidth
                sx={{ borderRadius: 2 }}
              >
                Change Password
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Security Settings */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <SecurityIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Security Settings
                </Typography>
              </Box>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <LockIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Session Timeout" 
                    secondary="Automatically log out after inactivity"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Last Login" 
                    secondary="Today at 9:25 PM"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Application Preferences */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Application Preferences
                </Typography>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.enableNotifications}
                        onChange={handleSettingChange('enableNotifications')}
                        color="primary"
                      />
                    }
                    label="Enable Notifications"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.autoSave}
                        onChange={handleSettingChange('autoSave')}
                        color="primary"
                      />
                    }
                    label="Auto Save Data"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.showWelcomeMessage}
                        onChange={handleSettingChange('showWelcomeMessage')}
                        color="primary"
                      />
                    }
                    label="Show Welcome Message"
                  />
                </Box>
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.darkMode}
                        onChange={handleSettingChange('darkMode')}
                        color="primary"
                        disabled
                      />
                    }
                    label="Dark Mode (Coming Soon)"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Receipt Logo Upload */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <ImageIcon sx={{ mr: 2, color: 'primary.main' }} />
                <Typography variant="h6" fontWeight="600">
                  Receipt Logo Upload
                </Typography>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Upload your institution's logo to display on payment receipts. This is a one-time setup. Recommended: PNG or JPG, max 2MB.
              </Alert>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
                <Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<UploadIcon />}
                      fullWidth
                    >
                      Choose Logo Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </Button>
                    
                    {uploadedLogo && (
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={handleDeleteLogo}
                        fullWidth
                      >
                        Remove Logo
                      </Button>
                    )}

                    {logoFile && (
                      <Typography variant="body2" color="text.secondary">
                        Selected: {logoFile.name} ({(logoFile.size / 1024).toFixed(2)} KB)
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <Box
                    sx={{
                      border: '2px dashed',
                      borderColor: 'divider',
                      borderRadius: 2,
                      p: 3,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: 200,
                      bgcolor: 'background.default',
                    }}
                  >
                    {uploadedLogo ? (
                      <Box sx={{ textAlign: 'center' }}>
                        <img
                          src={uploadedLogo}
                          alt="Receipt Logo Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: 150,
                            objectFit: 'contain',
                          }}
                        />
                        <Typography variant="caption" display="block" sx={{ mt: 2 }} color="success.main">
                          ✓ Logo uploaded successfully
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ textAlign: 'center', color: 'text.secondary' }}>
                        <ImageIcon sx={{ fontSize: 60, mb: 1, opacity: 0.3 }} />
                        <Typography variant="body2">
                          No logo uploaded yet
                        </Typography>
                        <Typography variant="caption">
                          Default logo will be used on receipts
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Wing Annual Fees Configuration */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <MoneyIcon sx={{ mr: 2, color: 'primary.main' }} />
                  <Typography variant="h6" fontWeight="600">
                    Wing Configuration
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={saveWingFees}
                  size="small"
                >
                  Save Configuration
                </Button>
              </Box>

              <Alert severity="info" sx={{ mb: 3 }}>
                Set annual fees, room numbers, and capacity for each wing. These settings will be used as default when adding new students.
              </Alert>

              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Wing</strong></TableCell>
                      <TableCell><strong>Rooms</strong></TableCell>
                      <TableCell><strong>Capacity/Room</strong></TableCell>
                      <TableCell><strong>Annual Fee (₹)</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>Wing A</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.A?.rooms ?? 33}
                          onChange={(e) => handleWingCapacityChange('A', 'rooms', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.A?.capacity ?? 3}
                          onChange={(e) => handleWingCapacityChange('A', 'capacity', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">students</InputAdornment>,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingFees.A ?? 50000}
                          onChange={(e) => handleWingFeeChange('A', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ width: 180 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Wing B</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.B?.rooms ?? 7}
                          onChange={(e) => handleWingCapacityChange('B', 'rooms', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.B?.capacity ?? 4}
                          onChange={(e) => handleWingCapacityChange('B', 'capacity', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">students</InputAdornment>,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingFees.B ?? 55000}
                          onChange={(e) => handleWingFeeChange('B', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ width: 180 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Wing C</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.C?.rooms ?? 35}
                          onChange={(e) => handleWingCapacityChange('C', 'rooms', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.C?.capacity ?? 2}
                          onChange={(e) => handleWingCapacityChange('C', 'capacity', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">students</InputAdornment>,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingFees.C ?? 45000}
                          onChange={(e) => handleWingFeeChange('C', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ width: 180 }}
                        />
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Wing D</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.D?.rooms ?? 9}
                          onChange={(e) => handleWingCapacityChange('D', 'rooms', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingCapacities.D?.capacity ?? 2}
                          onChange={(e) => handleWingCapacityChange('D', 'capacity', e.target.value)}
                          size="small"
                          sx={{ width: 100 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">students</InputAdornment>,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={wingFees.D ?? 48000}
                          onChange={(e) => handleWingFeeChange('D', e.target.value)}
                          size="small"
                          InputProps={{
                            startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                          }}
                          sx={{ width: 180 }}
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* Academic Year Defaults */}
          <Card elevation={2} sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Academic Year Defaults</Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2 }}>
                <FormControl sx={{ minWidth: 220 }}>
                  <InputLabel>Academic Year</InputLabel>
                  <Select value={selectedAcademicYear} onChange={(e) => { setSelectedAcademicYear(e.target.value as string); loadAcademicFees(e.target.value as string); }} label="Academic Year">
                    {academicYears.map(y => (
                      <MenuItem value={y.label} key={y.label}>{y.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button variant="contained" onClick={saveAcademicFees} startIcon={<SaveIcon />}>Save Defaults</Button>
                <Button variant="outlined" onClick={applyAcademicFeesToStudents}>Apply to Students</Button>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
                <TextField label="Wing A Fee" value={academicFees.A} onChange={(e) => handleAcademicFeeChange('A', e.target.value)} />
                <TextField label="Wing B Fee" value={academicFees.B} onChange={(e) => handleAcademicFeeChange('B', e.target.value)} />
                <TextField label="Wing C Fee" value={academicFees.C} onChange={(e) => handleAcademicFeeChange('C', e.target.value)} />
                <TextField label="Wing D Fee" value={academicFees.D} onChange={(e) => handleAcademicFeeChange('D', e.target.value)} />
              </Box>
            </CardContent>
          </Card>

          {/* Mess / Canteen / Xerox - REMOVED */}

          {/* Danger Zone - Reset All Data */}
          <Card elevation={2} sx={{ mt: 3, border: `2px solid ${theme.palette.error.main}` }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1, color: 'error.main' }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Irreversible actions that will permanently delete all data from the application.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                onClick={async () => {
                  const confirm = window.confirm(
                    'WARNING: This will permanently delete ALL data including students, payments, rooms, settings, receipts, salary records, and billing records. This action CANNOT be undone. Are you absolutely sure?'
                  );
                  if (!confirm) return;

                  const doubleConfirm = window.confirm(
                    'FINAL CONFIRMATION: All data will be lost forever. Type anything to proceed or cancel to abort.'
                  );
                  if (!doubleConfirm) return;

                  try {
                    await db.delete();
                    await db.open();
                    localStorage.clear();
                    showSnackbar('All data has been permanently deleted. Reloading application...', 'success');
                    setTimeout(() => {
                      window.location.reload();
                    }, 2000);
                  } catch (e) {
                    console.error('Error resetting data:', e);
                    showSnackbar('Error resetting data', 'error');
                  }
                }}
                sx={{ fontWeight: 600 }}
              >
                Reset & Delete All Data
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* System Information */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                System Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Application Version
                  </Typography>
                  <Typography variant="body1">v2.2.0</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Database Version
                  </Typography>
                  <Typography variant="body1">v10</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Updated
                  </Typography>
                  <Typography variant="body1">November 17, 2025</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Developer Information */}
        <Box>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Developer Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Developed By
                  </Typography>
                  <Typography variant="body1" fontWeight="500">
                    Shaikh Shoaib Sk Iftekhar
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Contact
                  </Typography>
                  <Typography variant="body1">
                    +91 8698961313
                  </Typography>
                </Box>
                <Box sx={{ gridColumn: { xs: '1', sm: 'span 2' } }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    About
                  </Typography>
                  <Typography variant="body2">
                    This hostel management system is designed to streamline student administration,
                    fee collection, and hostel operations. For support or customization requests,
                    please contact the developer.
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Password Change Dialog */}
      <Dialog open={passwordDialog} onClose={() => setPasswordDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Current Password"
              type={showCurrentPassword ? 'text' : 'password'}
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 2 }}
            />
            
            <TextField
              fullWidth
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <Alert severity="info" sx={{ mt: 2 }}>
              Password must be at least 6 characters long and contain a mix of letters and numbers for better security.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialog(false)}>Cancel</Button>
          <Button 
            onClick={handlePasswordChange} 
            variant="contained"
            startIcon={<SaveIcon />}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
