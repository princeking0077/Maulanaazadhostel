import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  Alert,
  Snackbar,
} from '@mui/material';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  People as PeopleIcon,
  Home as HomeIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { db, WING_CONFIGURATION, type Room, type Student } from '../database/db';

const Rooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [wingFilter, setWingFilter] = useState<string>('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [showStudentsDialog, setShowStudentsDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState<Partial<Room>>({
    roomNumber: '',
    wing: 'A',
    capacity: WING_CONFIGURATION['A'].capacity,
    currentOccupancy: 0,
    isActive: true,
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [roomsData, studentsData] = await Promise.all([
        db.rooms.orderBy('roomNumber').toArray(),
        db.students.toArray()
      ]);

      // Update room occupancy based on actual student count
      const updatedRooms = await Promise.all(
        roomsData.map(async (room) => {
          const occupancy = studentsData.filter(
            student => student.roomNo === room.roomNumber && student.wing === room.wing
          ).length;
          
          if (occupancy !== room.currentOccupancy) {
            await db.rooms.update(room.id!, { currentOccupancy: occupancy });
            return { ...room, currentOccupancy: occupancy };
          }
          return room;
        })
      );

      setRooms(updatedRooms);
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleSaveRoom = async () => {
    try {
      if (!formData.roomNumber || !formData.wing) {
        showSnackbar('Please fill in all required fields', 'error');
        return;
      }

      const wing = formData.wing as Room['wing'];
      const wingConfig = WING_CONFIGURATION[wing];
      if (wingConfig && formData.capacity !== wingConfig.capacity) {
        showSnackbar(`Wing ${wing} must have capacity of ${wingConfig.capacity}`, 'error');
        return;
      }

      if ((formData.currentOccupancy ?? 0) > (formData.capacity ?? 0)) {
        showSnackbar('Current occupancy cannot exceed capacity', 'error');
        return;
      }

      // Check if room number already exists for this wing
      const existingRoom = await db.rooms
        .where(['roomNumber', 'wing'])
        .equals([formData.roomNumber, formData.wing])
        .first();

      if (existingRoom && (!editingRoom || existingRoom.id !== editingRoom.id)) {
        showSnackbar('Room number already exists in this wing', 'error');
        return;
      }

      if (editingRoom) {
        // Update existing room
        await db.rooms.update(editingRoom.id!, formData);
        showSnackbar('Room updated successfully', 'success');
      } else {
        // Add new room
        await db.rooms.add(formData as Room);
        showSnackbar('Room added successfully', 'success');
      }

      setOpenDialog(false);
      setEditingRoom(null);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving room:', error);
      showSnackbar('Error saving room', 'error');
    }
  };

  const handleEditRoom = (room: Room) => {
    setEditingRoom(room);
    setFormData({ ...room });
    setOpenDialog(true);
  };

  const handleDeleteRoom = async (room: Room) => {
    // Check if room has students
    const roomStudents = students.filter(
      student => student.roomNo === room.roomNumber && student.wing === room.wing
    );

    if (roomStudents.length > 0) {
      showSnackbar('Cannot delete room with students. Please reassign students first.', 'error');
      return;
    }

    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await db.rooms.delete(room.id!);
        showSnackbar('Room deleted successfully', 'success');
        loadData();
      } catch (error) {
        console.error('Error deleting room:', error);
        showSnackbar('Error deleting room', 'error');
      }
    }
  };

  const handleViewStudents = (room: Room) => {
    setSelectedRoom(room);
    setShowStudentsDialog(true);
  };

  const resetForm = () => {
    setFormData({
      roomNumber: '',
      wing: 'A',
      capacity: WING_CONFIGURATION['A'].capacity,
      currentOccupancy: 0,
      isActive: true,
    });
  };

  const handleOpenAddDialog = () => {
    resetForm();
    setEditingRoom(null);
    setOpenDialog(true);
  };

  const filteredRooms = rooms.filter(room => {
    return !wingFilter || room.wing === wingFilter;
  });

  const getRoomStudents = (room: Room) => {
    return students.filter(
      student => student.roomNo === room.roomNumber && student.wing === room.wing
    );
  };

  const getOccupancyStatus = (room: Room) => {
    if (room.currentOccupancy === 0) return { status: 'Empty', color: 'default' as const };
    if (room.currentOccupancy < room.capacity) return { status: 'Partial', color: 'warning' as const };
    if (room.currentOccupancy === room.capacity) return { status: 'Full', color: 'success' as const };
    return { status: 'Overbooked', color: 'error' as const };
  };

  const columns: GridColDef[] = [
    {
      field: 'roomNumber',
      headerName: 'Room Number',
      width: 130,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HotelIcon sx={{ color: 'primary.main', fontSize: 20 }} />
          <Typography variant="body2" fontWeight="500">
            {params.value}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'wing',
      headerName: 'Wing',
      width: 80,
      renderCell: (params) => (
        <Chip
          label={params.value}
          size="small"
          color="primary"
          variant="outlined"
        />
      ),
    },
    {
      field: 'capacity',
      headerName: 'Capacity',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PeopleIcon sx={{ color: 'info.main', fontSize: 16 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'currentOccupancy',
      headerName: 'Occupied',
      width: 100,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon sx={{ color: 'secondary.main', fontSize: 16 }} />
          {params.value}
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      renderCell: (params) => {
        const room = params.row as Room;
        const { status, color } = getOccupancyStatus(room);
        return <Chip label={status} size="small" color={color} />;
      },
    },
    {
      field: 'isActive',
      headerName: 'Active',
      width: 80,
      renderCell: (params) => (
        params.value ? 
          <CheckCircleIcon sx={{ color: 'success.main' }} /> : 
          <WarningIcon sx={{ color: 'error.main' }} />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<PeopleIcon />}
          label="View Students"
          onClick={() => handleViewStudents(params.row)}
          key="view"
        />,
        <GridActionsCellItem
          icon={<EditIcon />}
          label="Edit"
          onClick={() => handleEditRoom(params.row)}
          key="edit"
        />,
        <GridActionsCellItem
          icon={<DeleteIcon />}
          label="Delete"
          onClick={() => handleDeleteRoom(params.row)}
          key="delete"
        />,
      ],
    },
  ];

  // Calculate statistics
  const totalRooms = rooms.length;
  const occupiedRooms = rooms.filter(r => r.currentOccupancy > 0).length;
  const emptyRooms = rooms.filter(r => r.currentOccupancy === 0).length;
  // const fullRoomCount = rooms.filter(r => r.currentOccupancy >= r.capacity).length; // metric reserved for future use
  const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Room Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenAddDialog}
          sx={{ borderRadius: 2 }}
        >
          Add Room
        </Button>
      </Box>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HomeIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="600" color="primary.main">
                {totalRooms}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Rooms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="600" color="success.main">
                {occupiedRooms}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Occupied Rooms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HotelIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="600" color="warning.main">
                {emptyRooms}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Empty Rooms
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h5" fontWeight="600" color="info.main">
                {occupancyRate}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Occupancy Rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth>
                <InputLabel>Filter by Wing</InputLabel>
                <Select
                  value={wingFilter}
                  onChange={(e) => setWingFilter(e.target.value)}
                  label="Filter by Wing"
                >
                  <MenuItem value="">All Wings</MenuItem>
                  {Object.keys(WING_CONFIGURATION).map(wing => (
                    <MenuItem value={wing} key={wing}>
                      Wing {wing}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rooms Table */}
      <Card elevation={2}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={filteredRooms}
            columns={columns}
            loading={loading}
            pageSizeOptions={[10, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10 },
              },
            }}
            disableRowSelectionOnClick
            sx={{
              border: 0,
              '& .MuiDataGrid-cell': {
                borderColor: 'rgba(224, 224, 224, 0.5)',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: 'grey.50',
                borderColor: 'rgba(224, 224, 224, 0.5)',
              },
            }}
          />
        </Box>
      </Card>

      {/* Add/Edit Room Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingRoom ? 'Edit Room' : 'Add New Room'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Room Number *"
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g., A001, B105"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Wing *</InputLabel>
                <Select
                  value={formData.wing}
                  onChange={(e) => {
                    const selectedWing = e.target.value as Room['wing'];
                    const config = WING_CONFIGURATION[selectedWing];
                    setFormData(prev => ({
                      ...prev,
                      wing: selectedWing,
                      capacity: config.capacity,
                    }));
                  }}
                  label="Wing"
                >
                  {Object.entries(WING_CONFIGURATION).map(([wing, config]) => (
                    <MenuItem value={wing} key={wing}>
                      Wing {wing} (Cap {config.capacity})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Capacity *"
                type="number"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                inputProps={{
                  min: 1,
                  max: formData.wing ? WING_CONFIGURATION[formData.wing].capacity : 4,
                }}
                helperText={formData.wing ? `Required capacity: ${WING_CONFIGURATION[formData.wing].capacity}` : undefined}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.value === 'active' })}
                  label="Status"
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveRoom}
            sx={{ borderRadius: 2 }}
          >
            {editingRoom ? 'Update' : 'Add'} Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Students Dialog */}
      <Dialog
        open={showStudentsDialog}
        onClose={() => setShowStudentsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Students in Room {selectedRoom?.roomNumber} - Wing {selectedRoom?.wing}
        </DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Capacity: {selectedRoom.capacity} | Occupied: {selectedRoom.currentOccupancy}
              </Typography>
              
              {getRoomStudents(selectedRoom).length === 0 ? (
                <Paper sx={{ p: 3, textAlign: 'center' }}>
                  <HotelIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No students assigned to this room
                  </Typography>
                </Paper>
              ) : (
                <List>
                  {getRoomStudents(selectedRoom).map((student, index) => (
                    <React.Fragment key={student.id}>
                      <ListItem>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {student.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={student.name}
                          secondary={`${student.enrollmentNo} | ${student.mobile}`}
                        />
                      </ListItem>
                      {index < getRoomStudents(selectedRoom).length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStudentsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Rooms;