import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import TableViewIcon from '@mui/icons-material/TableView';
import ReceiptIcon from '@mui/icons-material/Receipt';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import DescriptionIcon from '@mui/icons-material/Description';
import BoltIcon from '@mui/icons-material/Bolt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintIcon from '@mui/icons-material/Print';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { db } from '../database/db';
import type { ReceiptRegisterEntry } from '../database/db';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReceiptRegister: React.FC = () => {
  const [entries, setEntries] = useState<ReceiptRegisterEntry[]>([]);
  const [dateRange, setDateRange] = useState({
    startDate: '01.04.2024',
    endDate: '31.03.2025'
  });
  const [editingDateRange, setEditingDateRange] = useState(false);
  const [editingEntry, setEditingEntry] = useState<number | null>(null);
  const [tempEntry, setTempEntry] = useState<ReceiptRegisterEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [logoBase64] = useState(() => localStorage.getItem('uploadedLogo') || '');
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [header, setHeader] = useState(() => {
    try {
      const saved = localStorage.getItem('receiptRegisterHeader');
      return saved ? JSON.parse(saved) : {
        organization: "MAULANA AZAD EDUCATIONAL TRUST'S",
        complex: 'Maulana Azad Complex of Hostels',
        address: 'Dr.Rafiq Zakaria Campus, Rauza Bagh, Aurangabad.-431001',
      };
    } catch {
      return {
        organization: "MAULANA AZAD EDUCATIONAL TRUST'S",
        complex: 'Maulana Azad Complex of Hostels',
        address: 'Dr.Rafiq Zakaria Campus, Rauza Bagh, Aurangabad.-431001',
      };
    }
  });
  const [editingHeader, setEditingHeader] = useState(false);

  const loadData = async () => {
    try {
      const data = await db.receiptRegister.orderBy('date').reverse().toArray();
      setEntries(data);
    } catch (error) {
      console.error('Error loading receipt register:', error);
    }
  };



  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const saveHeaderSettings = (newHeader: typeof header) => {
    localStorage.setItem('receiptRegisterHeader', JSON.stringify(newHeader));
    setHeader(newHeader);
  };

  const startEdit = (entry: ReceiptRegisterEntry) => {
    setEditingEntry(entry.id!);
    setTempEntry({ ...entry });
  };

  const saveEdit = async () => {
    if (!tempEntry) return;
    try {
      await db.receiptRegister.update(tempEntry.id!, tempEntry);
      setEditingEntry(null);
      setTempEntry(null);
      loadData();
    } catch (error) {
      console.error('Error updating entry:', error);
      alert('Failed to update entry');
    }
  };

  const cancelEdit = () => {
    setEditingEntry(null);
    setTempEntry(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await db.receiptRegister.delete(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert('Failed to delete entry');
    }
  };

  const updateTempEntry = (field: keyof ReceiptRegisterEntry, value: string | number) => {
    if (!tempEntry) return;
    setTempEntry(prev => {
      if (!prev) return null;
      const updated = { ...prev, [field]: value };

      // Auto-calculate total
      if (['rent', 'electricity', 'securityDeposit', 'anyOther', 'registrationFees'].includes(field)) {
        updated.totalAmount =
          (updated.rent || 0) +
          (updated.electricity || 0) +
          (updated.securityDeposit || 0) +
          (updated.anyOther || 0) +
          (updated.registrationFees || 0);
      }

      return updated;
    });
  };

  const summary = useMemo(() => {
    return entries.reduce((acc, entry) => ({
      rent: acc.rent + entry.rent,
      electricity: acc.electricity + entry.electricity,
      securityDeposit: acc.securityDeposit + entry.securityDeposit,
      anyOther: acc.anyOther + entry.anyOther,
      registrationFees: acc.registrationFees + entry.registrationFees,
      total: acc.total + entry.totalAmount
    }), { rent: 0, electricity: 0, securityDeposit: 0, anyOther: 0, registrationFees: 0, total: 0 });
  }, [entries]);

  const exportToExcel = () => {
    try {
      let csv = '\uFEFF';

      csv += `Receipt Register - ${dateRange.startDate} to ${dateRange.endDate}\n\n`;
      csv += 'Date,Receipt No.,Name,Year,Rent,Electricity,Security Deposit,Any Other,Registration Fee,Total,Mode of Payment,College Name,Faculty\n';

      entries.forEach((entry) => {
        const date = new Date(entry.date).toLocaleDateString('en-GB').replace(/\//g, '.');
        csv += `${date},${entry.receiptNo},"${entry.name}",${entry.year},${entry.rent},${entry.electricity || ''},${entry.securityDeposit || ''},${entry.anyOther || ''},${entry.registrationFees || ''},${entry.totalAmount},${entry.modeOfTransaction},"${entry.collegeName}","${entry.faculty}"\n`;
      });

      csv += `\nTOTAL,,,${summary.rent},${summary.electricity},${summary.securityDeposit},${summary.anyOther},${summary.registrationFees},${summary.total}\n`;

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Receipt_Register_${dateRange.startDate}_to_${dateRange.endDate}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
    }
  };

  const exportToPDF = async () => {
    const targetElement = previewRef.current || printRef.current;
    if (!targetElement) return;

    try {
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1400,
        windowHeight: targetElement.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4'); // portrait
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidthPx = imgProps.width;
      const imgHeightPx = imgProps.height;
      const pxToMm = pdfWidth / imgWidthPx;
      const imgHeightMm = imgHeightPx * pxToMm;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, imgHeightMm);
      } else {
        // Multi-page support
        let remainingHeightPx = imgHeightPx;
        let positionPx = 0;
        const pageHeightPx = Math.floor(pdfHeight / pxToMm);

        while (remainingHeightPx > 0) {
          const canvasPage = document.createElement('canvas');
          canvasPage.width = imgWidthPx;
          canvasPage.height = Math.min(pageHeightPx, remainingHeightPx);

          const ctx = canvasPage.getContext('2d');
          if (ctx) {
            ctx.drawImage(
              canvas,
              0, positionPx,
              imgWidthPx, canvasPage.height,
              0, 0,
              imgWidthPx, canvasPage.height
            );

            const pageData = canvasPage.toDataURL('image/png', 1.0);
            const pageHeightMm = canvasPage.height * pxToMm;

            if (positionPx > 0) pdf.addPage();
            pdf.addImage(pageData, 'PNG', 0, 0, pdfWidth, pageHeightMm);

            positionPx += canvasPage.height;
            remainingHeightPx -= canvasPage.height;
          } else {
            break;
          }
        }
      }

      pdf.save(`Receipt_Register_${dateRange.startDate}_to_${dateRange.endDate}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Error generating PDF. Please try Excel export instead.');
    }
  };

  const handlePrint = () => {
    const targetElement = previewRef.current || printRef.current;
    if (!targetElement) return;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt Register</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 12px; }
              th { background-color: #1976d2; color: white; }
              .header { text-align: center; margin-bottom: 20px; }
              .logo { width: 80px; height: 80px; float: left; margin-right: 20px; }
              @media print {
                body { margin: 10px; }
              }
            </style>
          </head>
          <body>
            ${targetElement.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB').replace(/\//g, '.');
  };

  return (
    <Box>
      <Box id="printable-area" ref={printRef}>
        {/* Header Section - Same as Petty Cash */}
        <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
          {editingHeader ? (
            <Box>
              <TextField
                fullWidth
                label="Organization"
                value={header.organization}
                onChange={(e) => setHeader({ ...header, organization: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Complex"
                value={header.complex}
                onChange={(e) => setHeader({ ...header, complex: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Address"
                value={header.address}
                onChange={(e) => setHeader({ ...header, address: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Box display="flex" gap={1}>
                <Button
                  startIcon={<SaveIcon />}
                  onClick={() => {
                    saveHeaderSettings(header);
                    setEditingHeader(false);
                  }}
                  variant="contained"
                >
                  Save Header
                </Button>
                <Button
                  startIcon={<CloseIcon />}
                  onClick={() => {
                    const saved = localStorage.getItem('receiptRegisterHeader');
                    if (saved) setHeader(JSON.parse(saved));
                    setEditingHeader(false);
                  }}
                  variant="outlined"
                >
                  Cancel
                </Button>
              </Box>
            </Box>
          ) : (
            <Box position="relative">
              <IconButton
                onClick={() => setEditingHeader(true)}
                sx={{ position: 'absolute', top: 0, right: 0 }}
                size="small"
              >
                <EditIcon />
              </IconButton>
              <Box display="flex" alignItems="flex-start" gap={2} mb={1}>
                {logoBase64 && (
                  <Box
                    component="img"
                    src={logoBase64}
                    alt="Logo"
                    sx={{ width: 80, height: 80, objectFit: 'contain' }}
                  />
                )}
                <Box flex={1} textAlign="center">
                  <Typography variant="h5" fontWeight="bold">
                    {header.organization}
                  </Typography>
                  <Typography variant="body1" fontWeight="600">
                    {header.complex}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {header.address}
                  </Typography>
                </Box>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Main Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center" gap={2}>
            <ReceiptIcon sx={{ fontSize: 40, color: 'primary.main' }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Receipt Register
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Financial receipt management system
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={1}>
            <Button startIcon={<PrintIcon />} onClick={() => setShowPrintPreview(true)} variant="outlined" color="primary">
              Print
            </Button>
            <Button startIcon={<PictureAsPdfIcon />} onClick={exportToPDF} variant="outlined" color="error">
              Export to PDF
            </Button>
            <Button startIcon={<TableViewIcon />} onClick={exportToExcel} variant="outlined" color="success">
              Export to Excel
            </Button>
          </Box>
        </Box>

        {/* Date Range Card */}
        <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
          {editingDateRange ? (
            <Box display="flex" alignItems="center" gap={2}>
              <TextField
                size="small"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                placeholder="DD.MM.YYYY"
                sx={{ width: 150 }}
              />
              <Typography variant="body1" fontWeight={600}>to</Typography>
              <TextField
                size="small"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                placeholder="DD.MM.YYYY"
                sx={{ width: 150 }}
              />
              <Button
                startIcon={<SaveIcon />}
                onClick={() => setEditingDateRange(false)}
                variant="contained"
                size="small"
              >
                Save
              </Button>
            </Box>
          ) : (
            <Box position="relative">
              <IconButton
                onClick={() => setEditingDateRange(true)}
                sx={{ position: 'absolute', top: 0, right: 0 }}
                size="small"
              >
                <EditIcon />
              </IconButton>
              <Box display="flex" alignItems="center" gap={2}>
                <CalendarTodayIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h5" fontWeight="bold">
                  {dateRange.startDate} to {dateRange.endDate}
                </Typography>
              </Box>
            </Box>
          )}
        </Paper>

        {/* Summary Cards */}
        <Box display="flex" gap={2} mb={3} flexWrap="wrap">
          <Box flex={1} minWidth={250}>
            <Card sx={{ borderLeft: 4, borderColor: 'primary.main' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Entries
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {entries.length}
                    </Typography>
                  </Box>
                  <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex={1} minWidth={250}>
            <Card sx={{ borderLeft: 4, borderColor: 'success.main' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Rent
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{summary.rent.toLocaleString()}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex={1} minWidth={250}>
            <Card sx={{ borderLeft: 4, borderColor: 'warning.main' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Electricity
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{summary.electricity.toLocaleString()}
                    </Typography>
                  </Box>
                  <BoltIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex={1} minWidth={250}>
            <Card sx={{ borderLeft: 4, borderColor: 'success.dark' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Grand Total
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{summary.total.toLocaleString()}
                    </Typography>
                  </Box>
                  <AttachMoneyIcon sx={{ fontSize: 40, color: 'success.dark', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Entries Table */}
        <TableContainer component={Paper} elevation={2}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Receipt No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Year</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Rent</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Electricity</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Security Deposit</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Any Other</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Registration</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Mode</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>College</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Faculty</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No receipts recorded yet. Receipts will automatically appear here when payments are recorded.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const isEditing = editingEntry === entry.id;
                  return (
                    <TableRow key={entry.id} hover>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="date"
                            value={tempEntry ? new Date(tempEntry.date).toISOString().split('T')[0] : ''}
                            onChange={(e) => updateTempEntry('date', new Date(e.target.value).toISOString())}
                            sx={{ width: 140 }}
                          />
                        ) : (
                          formatDate(entry.date)
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={tempEntry?.receiptNo || ''}
                            onChange={(e) => updateTempEntry('receiptNo', e.target.value)}
                            sx={{ width: 120 }}
                          />
                        ) : (
                          entry.receiptNo
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={tempEntry?.name || ''}
                            onChange={(e) => updateTempEntry('name', e.target.value)}
                            sx={{ width: 150 }}
                          />
                        ) : (
                          entry.name
                        )}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={tempEntry?.year || ''}
                            onChange={(e) => updateTempEntry('year', e.target.value)}
                            sx={{ width: 100 }}
                          />
                        ) : (
                          entry.year
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={tempEntry?.rent || 0}
                            onChange={(e) => updateTempEntry('rent', Number(e.target.value))}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          entry.rent || ''
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={tempEntry?.electricity || 0}
                            onChange={(e) => updateTempEntry('electricity', Number(e.target.value))}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          entry.electricity || ''
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={tempEntry?.securityDeposit || 0}
                            onChange={(e) => updateTempEntry('securityDeposit', Number(e.target.value))}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          entry.securityDeposit || ''
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={tempEntry?.anyOther || 0}
                            onChange={(e) => updateTempEntry('anyOther', Number(e.target.value))}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          entry.anyOther || ''
                        )}
                      </TableCell>
                      <TableCell align="right">
                        {isEditing ? (
                          <TextField
                            size="small"
                            type="number"
                            value={tempEntry?.registrationFees || 0}
                            onChange={(e) => updateTempEntry('registrationFees', Number(e.target.value))}
                            sx={{ width: 80 }}
                          />
                        ) : (
                          entry.registrationFees || ''
                        )}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        {isEditing ? tempEntry?.totalAmount : entry.totalAmount}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={tempEntry?.modeOfTransaction || ''}
                            onChange={(e) => updateTempEntry('modeOfTransaction', e.target.value)}
                            sx={{ width: 100 }}
                          />
                        ) : (
                          entry.modeOfTransaction
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={tempEntry?.collegeName || ''}
                            onChange={(e) => updateTempEntry('collegeName', e.target.value)}
                            sx={{ width: 150 }}
                          />
                        ) : (
                          entry.collegeName
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <TextField
                            size="small"
                            value={tempEntry?.faculty || ''}
                            onChange={(e) => updateTempEntry('faculty', e.target.value)}
                            sx={{ width: 120 }}
                          />
                        ) : (
                          entry.faculty
                        )}
                      </TableCell>
                      <TableCell>
                        {isEditing ? (
                          <Box display="flex" gap={0.5}>
                            <IconButton size="small" color="primary" onClick={saveEdit}>
                              <SaveIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="default" onClick={cancelEdit}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        ) : (
                          <Box display="flex" gap={0.5}>
                            <IconButton size="small" color="primary" onClick={() => startEdit(entry)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" color="error" onClick={() => setDeleteConfirmId(entry.id!)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}

              {/* Total Row */}
              {entries.length > 0 && (
                <TableRow sx={{ bgcolor: 'grey.300', borderTop: 3, borderColor: 'grey.500' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                    TOTAL
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.rent}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.electricity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.securityDeposit}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.anyOther}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.registrationFees}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>{summary.total}</TableCell>
                  <TableCell colSpan={4} />
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this receipt entry? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Print Preview Dialog */}
      <Dialog open={showPrintPreview} onClose={() => setShowPrintPreview(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <VisibilityIcon />
              <Typography variant="h6">Print Preview - Receipt Register</Typography>
            </Box>
            <IconButton onClick={() => setShowPrintPreview(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box ref={previewRef} sx={{ p: 3, bgcolor: 'white' }}>
            {/* Preview Header */}
            <Box display="flex" alignItems="flex-start" gap={2} mb={3}>
              {logoBase64 && (
                <Box
                  component="img"
                  src={logoBase64}
                  alt="Logo"
                  sx={{ width: 80, height: 80, objectFit: 'contain' }}
                />
              )}
              <Box flex={1} textAlign="center">
                <Typography variant="h5" fontWeight="bold">
                  {header.organization}
                </Typography>
                <Typography variant="body1" fontWeight="600">
                  {header.complex}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {header.address}
                </Typography>
              </Box>
            </Box>

            <Typography variant="h5" fontWeight="bold" textAlign="center" mb={2}>
              Receipt Register
            </Typography>

            <Typography variant="body2" textAlign="center" mb={3}>
              Period: {dateRange.startDate} to {dateRange.endDate}
            </Typography>

            {/* Preview Table */}
            <Table size="small" sx={{ border: '1px solid #ddd' }}>
              <TableHead>
                <TableRow sx={{ bgcolor: '#1976d2' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Receipt No</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Year</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }} align="right">Rent</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }} align="right">Electricity</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }} align="right">Security</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }} align="right">Other</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }} align="right">Reg Fees</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }} align="right">Total</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>College</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Faculty</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold', border: '1px solid #ddd' }}>Transaction</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell sx={{ border: '1px solid #ddd' }}>{formatDate(entry.date)}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }}>{entry.receiptNo}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }}>{entry.name}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }}>{entry.year}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} align="right">{entry.rent}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} align="right">{entry.electricity}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} align="right">{entry.securityDeposit}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} align="right">{entry.anyOther}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} align="right">{entry.registrationFees}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd' }} align="right"><strong>{entry.totalAmount}</strong></TableCell>
                    <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.75rem' }}>{entry.collegeName}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.75rem' }}>{entry.faculty}</TableCell>
                    <TableCell sx={{ border: '1px solid #ddd', fontSize: '0.75rem' }}>{entry.modeOfTransaction}</TableCell>
                  </TableRow>
                ))}
                {/* Total Row */}
                <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                  <TableCell colSpan={4} sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>TOTAL</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{summary.rent}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{summary.electricity}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{summary.securityDeposit}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{summary.anyOther}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{summary.registrationFees}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold', border: '1px solid #ddd' }}>{summary.total}</TableCell>
                  <TableCell colSpan={3} sx={{ border: '1px solid #ddd' }} />
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPrintPreview(false)}>Close</Button>
          <Button startIcon={<PictureAsPdfIcon />} onClick={exportToPDF} variant="outlined" color="error">
            Export PDF
          </Button>
          <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="contained" color="primary">
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceiptRegister;
