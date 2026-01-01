import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  LinearProgress,
} from '@mui/material';
import {
  Download as DownloadIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Hotel as HotelIcon,
  Assessment as AssessmentIcon,
  TrendingUp as TrendingUpIcon,
  PieChart as PieChartIcon,
} from '@mui/icons-material';
import { db } from '../database/db';
import type { Student, Payment, Room } from '../database/db';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Reports: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [students, setStudents] = useState<Student[]>([]);
  const [payments, setPayments] = useState<(Payment & { studentName?: string })[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWing, setSelectedWing] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [studentsData, paymentsData, roomsData] = await Promise.all([
        db.students.toArray(),
        db.payments.orderBy('createdAt').reverse().toArray(),
        db.rooms.toArray()
      ]);

      // Add student names to payments
      const paymentsWithNames = paymentsData.map(payment => {
        const student = studentsData.find(s => s.id === payment.studentId);
        return {
          ...payment,
          studentName: student?.name || 'Unknown Student'
        };
      });

      setStudents(studentsData);
      setPayments(paymentsWithNames);
      setRooms(roomsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const csvContent = data.map(row =>
      Object.values(row).map(value =>
        typeof value === 'string' && value.includes(',') ? `"${value}"` : value
      ).join(',')
    ).join('\n');

    const csv = `${headers}\n${csvContent}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculate statistics
  const totalStudents = students.length;
  const totalPayments = payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const averagePayment = payments.length > 0 ? totalPayments / payments.length : 0;
  const occupiedRooms = rooms.filter(r => r.currentOccupancy > 0).length;

  // Wing-wise statistics
  const wingStats = ['A', 'B', 'C', 'D'].map(wing => {
    const wingStudents = students.filter(s => s.wing === wing);
    const wingPayments = payments.filter(p => {
      const student = students.find(s => s.id === p.studentId);
      return student?.wing === wing;
    });
    const totalCollected = wingPayments.reduce((sum, p) => sum + p.totalAmount, 0);

    return {
      wing,
      students: wingStudents.length,
      payments: wingPayments.length,
      totalCollected,
      averagePayment: wingPayments.length > 0 ? totalCollected / wingPayments.length : 0,
    };
  });

  // Payment method breakdown
  const paymentMethods = payments.reduce((acc, payment) => {
    acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Student type breakdown
  const studentTypes = students.reduce((acc, student) => {
    acc[student.studentType] = (acc[student.studentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Faculty wise distribution
  const facultyStats = students.reduce((acc, student) => {
    if (student.faculty) {
      acc[student.faculty] = (acc[student.faculty] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filteredStudents = selectedWing ? students.filter(s => s.wing === selectedWing) : students;
  const filteredPayments = selectedWing
    ? payments.filter(p => {
      const student = students.find(s => s.id === p.studentId);
      return student?.wing === selectedWing;
    })
    : payments;

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: 'center', mt: 2 }}>
          Loading reports...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Reports & Analytics
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <InputLabel>Wing Filter</InputLabel>
            <Select
              value={selectedWing}
              onChange={(e) => setSelectedWing(e.target.value)}
              label="Wing Filter"
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All Wings</MenuItem>
              <MenuItem value="A">Wing A</MenuItem>
              <MenuItem value="B">Wing B</MenuItem>
              <MenuItem value="C">Wing C</MenuItem>
              <MenuItem value="D">Wing D</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Overview Stats */}
      <Box display="flex" flexWrap="wrap" gap={3} mb={3}>
        <Box flex={1} minWidth={250}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600" color="primary.main">
                {filteredStudents.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Students
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} minWidth={250}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <PaymentIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600" color="success.main">
                ₹{filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total Collection
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} minWidth={250}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <HotelIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600" color="warning.main">
                {Math.round((occupiedRooms / rooms.length) * 100)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Occupancy Rate
              </Typography>
            </CardContent>
          </Card>
        </Box>
        <Box flex={1} minWidth={250}>
          <Card elevation={2}>
            <CardContent sx={{ textAlign: 'center' }}>
              <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
              <Typography variant="h4" fontWeight="600" color="info.main">
                ₹{Math.round(averagePayment).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Average Payment
              </Typography>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Tabs for different reports */}
      <Card elevation={2}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab label="Student Reports" />
            <Tab label="Payment Reports" />
            <Tab label="Room Reports" />
            <Tab label="Analytics" />
          </Tabs>
        </Box>

        {/* Student Reports Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex={1} minWidth={300}>
              <Typography variant="h6" gutterBottom>
                Wing-wise Distribution
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Wing</TableCell>
                      <TableCell align="right">Students</TableCell>
                      <TableCell align="right">Percentage</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wingStats.map((stat) => (
                      <TableRow key={stat.wing}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main', fontSize: 12 }}>
                              {stat.wing}
                            </Avatar>
                            Wing {stat.wing}
                          </Box>
                        </TableCell>
                        <TableCell align="right">{stat.students}</TableCell>
                        <TableCell align="right">
                          {totalStudents > 0 ? Math.round((stat.students / totalStudents) * 100) : 0}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box flex={1} minWidth={300}>
              <Typography variant="h6" gutterBottom>
                Student Type Distribution
              </Typography>
              <Box sx={{ space: 2 }}>
                {Object.entries(studentTypes).map(([type, count]) => (
                  <Box key={type} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{type}</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {count} ({Math.round((count / totalStudents) * 100)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(count / totalStudents) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                ))}
              </Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(filteredStudents, 'students-report')}
                sx={{ mt: 2 }}
              >
                Export Students CSV
              </Button>
            </Box>

            <Box width="100%">
              <Typography variant="h6" gutterBottom>
                Faculty-wise Distribution
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {Object.entries(facultyStats).map(([faculty, count]) => (
                  <Box key={faculty} flex={1} minWidth={200}>
                    <Paper sx={{ p: 2, textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight="600" color="primary.main">
                        {count}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {faculty || 'Not Specified'}
                      </Typography>
                    </Paper>
                  </Box>
                ))}
              </Box>
            </Box>
          </Box>
        </TabPanel>

        {/* Payment Reports Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box flex={2} minWidth={300}>
              <Typography variant="h6" gutterBottom>
                Wing-wise Payment Summary
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Wing</TableCell>
                      <TableCell align="right">Total Payments</TableCell>
                      <TableCell align="right">Total Amount</TableCell>
                      <TableCell align="right">Average</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {wingStats.map((stat) => (
                      <TableRow key={stat.wing}>
                        <TableCell>Wing {stat.wing}</TableCell>
                        <TableCell align="right">{stat.payments}</TableCell>
                        <TableCell align="right">₹{stat.totalCollected.toLocaleString()}</TableCell>
                        <TableCell align="right">₹{Math.round(stat.averagePayment).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box flex={1} minWidth={300}>
              <Typography variant="h6" gutterBottom>
                Payment Methods
              </Typography>
              <Box sx={{ space: 2 }}>
                {Object.entries(paymentMethods).map(([method, count]) => (
                  <Box key={method} sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{method}</Typography>
                      <Typography variant="body2" fontWeight="600">
                        {count} ({Math.round((count / payments.length) * 100)}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(count / payments.length) * 100}
                      sx={{ height: 8, borderRadius: 4 }}
                      color="secondary"
                    />
                  </Box>
                ))}
              </Box>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(filteredPayments, 'payments-report')}
                sx={{ mt: 2 }}
              >
                Export Payments CSV
              </Button>
            </Box>

            <Box width="100%">
              <Typography variant="h6" gutterBottom>
                Recent Payments
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Receipt No</TableCell>
                      <TableCell>Student</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Method</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPayments.slice(0, 10).map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.receiptNo}</TableCell>
                        <TableCell>{payment.studentName}</TableCell>
                        <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                        <TableCell align="right">₹{payment.totalAmount.toLocaleString()}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </Box>
        </TabPanel>

        {/* Room Reports Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box width="100%">
              <Typography variant="h6" gutterBottom>
                Room Occupancy Summary
              </Typography>
              <TableContainer component={Paper} elevation={1}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Wing</TableCell>
                      <TableCell align="right">Total Rooms</TableCell>
                      <TableCell align="right">Occupied</TableCell>
                      <TableCell align="right">Empty</TableCell>
                      <TableCell align="right">Occupancy %</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['A', 'B', 'C', 'D'].map((wing) => {
                      const wingRooms = rooms.filter(r => r.wing === wing);
                      const occupied = wingRooms.filter(r => r.currentOccupancy > 0).length;
                      const occupancyRate = wingRooms.length > 0 ? (occupied / wingRooms.length) * 100 : 0;

                      return (
                        <TableRow key={wing}>
                          <TableCell>Wing {wing}</TableCell>
                          <TableCell align="right">{wingRooms.length}</TableCell>
                          <TableCell align="right">{occupied}</TableCell>
                          <TableCell align="right">{wingRooms.length - occupied}</TableCell>
                          <TableCell align="right">{Math.round(occupancyRate)}%</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            <Box width="100%">
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => exportToCSV(rooms, 'rooms-report')}
              >
                Export Rooms CSV
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box display="flex" flexWrap="wrap" gap={3}>
            <Box width="100%">
              <Typography variant="h6" gutterBottom>
                Key Performance Indicators
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Box flex={1} minWidth={200}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                    <Typography variant="h5" fontWeight="600" color="success.main">
                      {Math.round((occupiedRooms / rooms.length) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Occupancy Rate
                    </Typography>
                  </Paper>
                </Box>
                <Box flex={1} minWidth={200}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <PaymentIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                    <Typography variant="h5" fontWeight="600" color="primary.main">
                      ₹{Math.round(totalPayments / totalStudents).toLocaleString()}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Revenue per Student
                    </Typography>
                  </Paper>
                </Box>
                <Box flex={1} minWidth={200}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <PieChartIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                    <Typography variant="h5" fontWeight="600" color="warning.main">
                      {Math.round((payments.length / totalStudents) * 100)}%
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Payment Coverage
                    </Typography>
                  </Paper>
                </Box>
                <Box flex={1} minWidth={200}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <AssessmentIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                    <Typography variant="h5" fontWeight="600" color="info.main">
                      {Object.keys(facultyStats).length}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Faculties Represented
                    </Typography>
                  </Paper>
                </Box>
              </Box>
            </Box>

            <Box width="100%">
              <Typography variant="h6" gutterBottom>
                Summary Insights
              </Typography>
              <Paper sx={{ p: 3 }}>
                <Typography variant="body1" paragraph>
                  <strong>Student Distribution:</strong> Total {totalStudents} students across {Object.keys(facultyStats).length} faculties.
                  {Object.entries(studentTypes).map(([type, count]) =>
                    ` ${count} ${type.toLowerCase()}s`
                  ).join(', ')}.
                </Typography>
                <Typography variant="body1" paragraph>
                  <strong>Payment Performance:</strong> Collected ₹{totalPayments.toLocaleString()} from {payments.length} transactions
                  with an average payment of ₹{Math.round(averagePayment).toLocaleString()}.
                </Typography>
                <Typography variant="body1">
                  <strong>Occupancy Status:</strong> {occupiedRooms} out of {rooms.length} rooms are occupied
                  ({Math.round((occupiedRooms / rooms.length) * 100)}% occupancy rate).
                </Typography>
              </Paper>
            </Box>
          </Box>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default Reports;