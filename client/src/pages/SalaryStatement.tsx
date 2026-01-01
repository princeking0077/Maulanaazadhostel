import React, { useState, useMemo, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  IconButton,
  Paper,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Close as CloseIcon,
  PictureAsPdf as PdfIcon,
  People as PeopleIcon,
  AccountBalance as AccountBalanceIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { kvGet, kvSet } from '../services/kvStore';

interface Employee {
  id: number;
  name: string;
  totalAmount: number;
  loanAdvance: number;
  epf: number;
  other: number;
  category: 'A' | 'B';
}

interface HeaderInfo {
  campus: string;
  complex: string;
  address: string;
  month: string;
  year: string;
  authorizedBy: string;
  designation: string;
}

const EMPLOYEES_KEY = 'salary-employees';
const HEADER_KEY = 'salary-header';

const SalaryStatement: React.FC = () => {
  const theme = useTheme();
  const printRef = useRef<HTMLDivElement>(null);

  const [employees, setEmployees] = useState<Employee[]>([
    { id: 1, name: 'Shaikh Kadar', totalAmount: 15000, loanAdvance: 0, epf: 1800, other: 1000, category: 'A' },
    { id: 2, name: 'Bashir Khan Osman Khan', totalAmount: 16800, loanAdvance: 0, epf: 1800, other: 6000, category: 'A' },
    { id: 3, name: 'Mohan Salve', totalAmount: 15000, loanAdvance: 0, epf: 1800, other: 1000, category: 'A' },
    { id: 4, name: 'Shaikh Sikander', totalAmount: 15000, loanAdvance: 0, epf: 1800, other: 1000, category: 'A' },
    { id: 5, name: 'Hussaini Shabbir Hussain Bha', totalAmount: 15000, loanAdvance: 0, epf: 1800, other: 1000, category: 'A' },
    { id: 6, name: 'Shafik Chand Khan', totalAmount: 15000, loanAdvance: 0, epf: 1800, other: 1000, category: 'A' },
    { id: 7, name: 'Majed Rehan Ijlal Ahmed', totalAmount: 5300, loanAdvance: 0, epf: 636, other: 0, category: 'A' },
    { id: 8, name: 'Ansari Abrar Ahamad MD Mukhtar Ahmad', totalAmount: 12000, loanAdvance: 0, epf: 1440, other: 1000, category: 'A' },
    { id: 10, name: 'Nanda Vijay Magre', totalAmount: 9000, loanAdvance: 0, epf: 1080, other: 0, category: 'B' },
    { id: 11, name: 'Gusale Pushpabai Uttam', totalAmount: 9000, loanAdvance: 0, epf: 1080, other: 0, category: 'B' },
  ]);

  const [header, setHeader] = useState<HeaderInfo>({
    campus: 'Dr.Rafiq Zakaria Campus',
    complex: 'Maulana Azad Complex of Hostels',
    address: 'Dr.Rafiq Zakaria Marg, Rauza Bagh, Aurangabad',
    month: 'October',
    year: '2025',
    authorizedBy: 'Mohammed Shakir',
    designation: 'Accountant',
  });

  const [editingHeader, setEditingHeader] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<number | null>(null);
  const [tempEmployee, setTempEmployee] = useState<Employee | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'A' | 'B'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [generating, setGenerating] = useState(false);

  // Load from storage on mount
  React.useEffect(() => {
    (async () => {
      const [storedEmployees, storedHeader] = await Promise.all([
        kvGet<Employee[]>(EMPLOYEES_KEY, employees),
        kvGet<HeaderInfo>(HEADER_KEY, header),
      ]);
      setEmployees(storedEmployees);
      setHeader(storedHeader);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const calculateGrossTotal = (emp: Employee) => emp.totalAmount;
  const calculateTotalDeduction = (emp: Employee) => (emp.epf || 0) + (emp.other || 0) + (emp.loanAdvance || 0);
  const calculateNetSalary = (emp: Employee) => calculateGrossTotal(emp) - calculateTotalDeduction(emp);

  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesCategory = filterCategory === 'ALL' || emp.category === filterCategory;
      const matchesSearch = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [employees, filterCategory, searchTerm]);

  const summary = useMemo(() => {
    const categoryGroups = {
      A: filteredEmployees.filter((e) => e.category === 'A'),
      B: filteredEmployees.filter((e) => e.category === 'B'),
    };

    const calculateCategoryTotal = (category: Employee[]) => {
      return category.reduce(
        (acc, emp) => ({
          totalAmount: acc.totalAmount + emp.totalAmount,
          loanAdvance: acc.loanAdvance + (emp.loanAdvance || 0),
          epf: acc.epf + (emp.epf || 0),
          other: acc.other + (emp.other || 0),
          totalDeduction: acc.totalDeduction + calculateTotalDeduction(emp),
          netSalary: acc.netSalary + calculateNetSalary(emp),
        }),
        { totalAmount: 0, loanAdvance: 0, epf: 0, other: 0, totalDeduction: 0, netSalary: 0 }
      );
    };

    return {
      A: calculateCategoryTotal(categoryGroups.A),
      B: calculateCategoryTotal(categoryGroups.B),
      total: calculateCategoryTotal(filteredEmployees),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredEmployees]);

  const addEmployee = async () => {
    const newId = Math.max(...employees.map((e) => e.id), 0) + 1;
    const newEmployee: Employee = {
      id: newId,
      name: '',
      totalAmount: 0,
      loanAdvance: 0,
      epf: 0,
      other: 0,
      category: 'A',
    };
    const next = [...employees, newEmployee];
    setEmployees(next);
    await kvSet(EMPLOYEES_KEY, next, 'Salary employees');
    setEditingEmployee(newId);
    setTempEmployee(newEmployee);
  };

  const startEdit = (emp: Employee) => {
    setEditingEmployee(emp.id);
    setTempEmployee({ ...emp });
  };

  const saveEdit = async () => {
    if (!tempEmployee || tempEmployee.name.trim() === '') {
      alert('Employee name is required');
      return;
    }
    const next = employees.map((emp) => (emp.id === editingEmployee ? tempEmployee : emp));
    setEmployees(next);
    await kvSet(EMPLOYEES_KEY, next, 'Salary employees');
    setEditingEmployee(null);
    setTempEmployee(null);
  };

  const cancelEdit = async () => {
    if (tempEmployee && tempEmployee.name === '') {
      const next = employees.filter((emp) => emp.id !== editingEmployee);
      setEmployees(next);
      await kvSet(EMPLOYEES_KEY, next, 'Salary employees');
    }
    setEditingEmployee(null);
    setTempEmployee(null);
  };

  const deleteEmployee = async (id: number) => {
    const next = employees.filter((emp) => emp.id !== id);
    setEmployees(next);
    await kvSet(EMPLOYEES_KEY, next, 'Salary employees');
    setShowDeleteConfirm(null);
  };

  const saveHeader = async () => {
    await kvSet(HEADER_KEY, header, 'Salary header');
    setEditingHeader(false);
  };

  const exportToExcel = () => {
    let csv = '\uFEFF';
    csv += `${header.campus}\n${header.complex}\n${header.address}\n`;
    csv += `Statement Showing Salary of Fixed Pay Employees for the Month of ${header.month} - ${header.year}\n\n`;
    csv += 'S.No.,Name Fixed Pay,Total Amount,Loan & Advance,Gross Total,EPF Deduction,Other Deduction,Total Deduction,Net Salary,Category\n';

    const categoryA = employees.filter((e) => e.category === 'A');
    if (categoryA.length > 0) {
      categoryA.forEach((emp, idx) => {
        csv += `${idx + 1},"${emp.name}",${emp.totalAmount},${emp.loanAdvance || '-'},${calculateGrossTotal(emp)},${
          emp.epf || '-'
        },${emp.other || '-'},${calculateTotalDeduction(emp)},${calculateNetSalary(emp)},${emp.category}\n`;
      });
      csv += `Total (A),,${summary.A.totalAmount},,${summary.A.totalAmount},${summary.A.epf},${summary.A.other},${summary.A.totalDeduction},${summary.A.netSalary}\n\n`;
    }

    const categoryB = employees.filter((e) => e.category === 'B');
    if (categoryB.length > 0) {
      categoryB.forEach((emp, idx) => {
        csv += `${categoryA.length + idx + 1},"${emp.name}",${emp.totalAmount},${emp.loanAdvance || '-'},${calculateGrossTotal(emp)},${
          emp.epf || '-'
        },${emp.other || '-'},${calculateTotalDeduction(emp)},${calculateNetSalary(emp)},${emp.category}\n`;
      });
      csv += `Total (B),,${summary.B.totalAmount},,${summary.B.totalAmount},${summary.B.epf},${summary.B.other},${summary.B.totalDeduction},${summary.B.netSalary}\n\n`;
    }

    csv += `Total (A + B),,${summary.total.totalAmount},,${summary.total.totalAmount},${summary.total.epf},${summary.total.other},${summary.total.totalDeduction},${summary.total.netSalary}\n\n`;
    csv += `\n\nNote:-\nSr.\n\n\n,,,,,"(${header.authorizedBy})"\n,,,,,"${header.designation}"\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const fileName = `Salary_Statement_${header.month}_${header.year}.csv`;
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    if (!printRef.current) return;
    setGenerating(true);
    try {
      const canvas = await html2canvas(printRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Salary_Statement_${header.month}_${header.year}.pdf`);
    } catch (error) {
      console.error('PDF generation error:', error);
      alert('Error generating PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" fontWeight="600">
          Salary Statement Manager
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportToExcel}>
            Export CSV
          </Button>
          <Button variant="contained" color="error" startIcon={<PdfIcon />} onClick={exportToPDF} disabled={generating}>
            {generating ? 'Generating...' : 'Export PDF'}
          </Button>
          <Button variant="contained" startIcon={<AddIcon />} onClick={addEmployee}>
            Add Employee
          </Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
        <Card elevation={2} sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.05)})` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Employees
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="primary.main">
                  {filteredEmployees.length}
                </Typography>
              </Box>
              <PeopleIcon sx={{ fontSize: 40, color: theme.palette.primary.main, opacity: 0.6 }} />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.success.main, 0.1)}, ${alpha(theme.palette.success.main, 0.05)})` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Gross Total
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="success.main">
                  ₹{summary.total.totalAmount.toLocaleString()}
                </Typography>
              </Box>
              <MoneyIcon sx={{ fontSize: 40, color: theme.palette.success.main, opacity: 0.6 }} />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.1)}, ${alpha(theme.palette.error.main, 0.05)})` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Total Deductions
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="error.main">
                  ₹{summary.total.totalDeduction.toLocaleString()}
                </Typography>
              </Box>
              <TrendingDownIcon sx={{ fontSize: 40, color: theme.palette.error.main, opacity: 0.6 }} />
            </Box>
          </CardContent>
        </Card>
        <Card elevation={2} sx={{ background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.1)}, ${alpha(theme.palette.info.main, 0.05)})` }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Net Payable
                </Typography>
                <Typography variant="h4" fontWeight="bold" color="info.main">
                  ₹{summary.total.netSalary.toLocaleString()}
                </Typography>
              </Box>
              <AccountBalanceIcon sx={{ fontSize: 40, color: theme.palette.info.main, opacity: 0.6 }} />
            </Box>
          </CardContent>
        </Card>
      </Box>

      {/* Header Info */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          {editingHeader ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Edit Header Information
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mt: 1 }}>
                <TextField fullWidth label="Campus Name" value={header.campus} onChange={(e) => setHeader({ ...header, campus: e.target.value })} />
                <TextField fullWidth label="Complex Name" value={header.complex} onChange={(e) => setHeader({ ...header, complex: e.target.value })} />
                <TextField fullWidth label="Address" value={header.address} onChange={(e) => setHeader({ ...header, address: e.target.value })} />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField fullWidth label="Month" value={header.month} onChange={(e) => setHeader({ ...header, month: e.target.value })} />
                  <TextField fullWidth label="Year" value={header.year} onChange={(e) => setHeader({ ...header, year: e.target.value })} />
                </Box>
                <TextField fullWidth label="Authorized By" value={header.authorizedBy} onChange={(e) => setHeader({ ...header, authorizedBy: e.target.value })} />
                <TextField fullWidth label="Designation" value={header.designation} onChange={(e) => setHeader({ ...header, designation: e.target.value })} />
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Button variant="contained" startIcon={<SaveIcon />} onClick={saveHeader}>
                  Save Header
                </Button>
                <Button variant="text" onClick={() => setEditingHeader(false)}>
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box sx={{ position: 'relative' }}>
              <IconButton sx={{ position: 'absolute', top: 0, right: 0 }} onClick={() => setEditingHeader(true)}>
                <EditIcon />
              </IconButton>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                  {header.campus}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  {header.complex}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {header.address}
                </Typography>
                <Paper sx={{ display: 'inline-block', px: 3, py: 1.5, mt: 2, bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
                  <Typography variant="body1" fontWeight="600">
                    Statement Showing Salary of Fixed Pay Employees for the Month of {header.month} - {header.year}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card elevation={2} sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField fullWidth label="Search by name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <FormControl fullWidth>
              <InputLabel>Filter Category</InputLabel>
              <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as 'ALL' | 'A' | 'B')}>
                <MenuItem value="ALL">All Categories</MenuItem>
                <MenuItem value="A">Category A</MenuItem>
                <MenuItem value="B">Category B</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </CardContent>
      </Card>

      {/* Printable Table */}
      <Box ref={printRef} sx={{ bgcolor: 'white', p: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            {header.campus}
          </Typography>
          <Typography variant="h6">{header.complex}</Typography>
          <Typography variant="body2" color="text.secondary">
            {header.address}
          </Typography>
          <Typography variant="body1" fontWeight="600" sx={{ mt: 2 }}>
            Statement Showing Salary of Fixed Pay Employees for the Month of {header.month} - {header.year}
          </Typography>
        </Box>

        <Box sx={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>S.No.</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'left' }}>Employee Name</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Total Amount</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Loan & Advance</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Gross Total</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>EPF</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Other</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Total Deduction</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>Net Salary</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>Signature</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>Category</th>
                <th style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <tr key={emp.id}>
                  {editingEmployee === emp.id && tempEmployee ? (
                    <>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <TextField size="small" fullWidth value={tempEmployee.name} onChange={(e) => setTempEmployee({ ...tempEmployee, name: e.target.value })} />
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={tempEmployee.totalAmount}
                          onChange={(e) => setTempEmployee({ ...tempEmployee, totalAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <TextField
                          size="small"
                          type="number"
                          fullWidth
                          value={tempEmployee.loanAdvance}
                          onChange={(e) => setTempEmployee({ ...tempEmployee, loanAdvance: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{calculateGrossTotal(tempEmployee).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <TextField size="small" type="number" fullWidth value={tempEmployee.epf} onChange={(e) => setTempEmployee({ ...tempEmployee, epf: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <TextField size="small" type="number" fullWidth value={tempEmployee.other} onChange={(e) => setTempEmployee({ ...tempEmployee, other: parseFloat(e.target.value) || 0 })} />
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', color: '#d32f2f', fontWeight: 600 }}>
                        ₹{calculateTotalDeduction(tempEmployee).toLocaleString()}
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', color: '#2e7d32', fontWeight: 700 }}>₹{calculateNetSalary(tempEmployee).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', minHeight: 40 }}></td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>
                        <Select size="small" fullWidth value={tempEmployee.category} onChange={(e) => setTempEmployee({ ...tempEmployee, category: e.target.value as 'A' | 'B' })}>
                          <MenuItem value="A">A</MenuItem>
                          <MenuItem value="B">B</MenuItem>
                        </Select>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                        <IconButton size="small" color="success" onClick={saveEdit}>
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={cancelEdit}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </td>
                    </>
                  ) : (
                    <>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>{idx + 1}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8 }}>{emp.name}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{emp.totalAmount.toLocaleString()}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{emp.loanAdvance === 0 ? '-' : `₹${emp.loanAdvance.toLocaleString()}`}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', fontWeight: 600 }}>₹{calculateGrossTotal(emp).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{emp.epf === 0 ? '-' : `₹${emp.epf.toLocaleString()}`}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>{emp.other === 0 ? '-' : `₹${emp.other.toLocaleString()}`}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', color: '#d32f2f', fontWeight: 600 }}>₹{calculateTotalDeduction(emp).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right', color: '#2e7d32', fontWeight: 700 }}>₹{calculateNetSalary(emp).toLocaleString()}</td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center', minHeight: 40 }}></td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                        <Box
                          sx={{
                            display: 'inline-block',
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 2,
                            bgcolor: emp.category === 'A' ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.secondary.main, 0.1),
                            color: emp.category === 'A' ? theme.palette.primary.main : theme.palette.secondary.main,
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          {emp.category}
                        </Box>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                        <IconButton size="small" color="primary" onClick={() => startEdit(emp)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => setShowDeleteConfirm(emp.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {/* Category A Total */}
              {filteredEmployees.some((e) => e.category === 'A') && (
                <tr style={{ background: alpha(theme.palette.primary.main, 0.08), fontWeight: 700 }}>
                  <td colSpan={2} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                    Total (A)
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.A.totalAmount.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>-</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.A.totalAmount.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.A.epf.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.A.other.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.A.totalDeduction.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.A.netSalary.toLocaleString()}</td>
                  <td colSpan={3} style={{ border: '1px solid #ddd', padding: 8 }} />
                </tr>
              )}
              {/* Category B Total */}
              {filteredEmployees.some((e) => e.category === 'B') && (
                <tr style={{ background: alpha(theme.palette.secondary.main, 0.08), fontWeight: 700 }}>
                  <td colSpan={2} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                    Total (B)
                  </td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.B.totalAmount.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8 }}>-</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.B.totalAmount.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.B.epf.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.B.other.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.B.totalDeduction.toLocaleString()}</td>
                  <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.B.netSalary.toLocaleString()}</td>
                  <td colSpan={3} style={{ border: '1px solid #ddd', padding: 8 }} />
                </tr>
              )}
              {/* Grand Total */}
              <tr style={{ background: alpha(theme.palette.success.main, 0.12), fontWeight: 700, fontSize: 15 }}>
                <td colSpan={2} style={{ border: '1px solid #ddd', padding: 8, textAlign: 'center' }}>
                  Total (A + B)
                </td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.total.totalAmount.toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8 }}>-</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.total.totalAmount.toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.total.epf.toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.total.other.toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.total.totalDeduction.toLocaleString()}</td>
                <td style={{ border: '1px solid #ddd', padding: 8, textAlign: 'right' }}>₹{summary.total.netSalary.toLocaleString()}</td>
                <td colSpan={3} style={{ border: '1px solid #ddd', padding: 8 }} />
              </tr>
            </tbody>
          </table>
        </Box>

        <Box sx={{ mt: 4, textAlign: 'right' }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            ({header.authorizedBy})
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {header.designation}
          </Typography>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm !== null} onClose={() => setShowDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this employee?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteConfirm(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (showDeleteConfirm !== null) deleteEmployee(showDeleteConfirm);
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SalaryStatement;
