import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,

} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import PrintIcon from '@mui/icons-material/Print';
import PageviewIcon from '@mui/icons-material/Pageview';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableViewIcon from '@mui/icons-material/TableView';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import ReceiptIcon from '@mui/icons-material/Receipt';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PettyCashEntry {
  id: number;
  date: string;
  particulars: string;
  voucherNo: string;
  totalExpenses: number;
  misc: number;
  conveyance: number;
  xerox: number;
  housekeeping: number;
  security: number;
  repairs: number;
  office: number;
}

interface HeaderInfo {
  organization: string;
  complex: string;
  address: string;
  month: string;
  year: string;
  academicYear?: string; // e.g., '2025-2026'
  chequeNo: string;
  chequeDate: string;
  withdrawalDate: string;
  openingBalance: number;
  authorizedBy: string;
  designation: string;
}

const PettyCashRegister: React.FC = () => {
  const [entries, setEntries] = useState<PettyCashEntry[]>([]);
  const [header, setHeader] = useState<HeaderInfo>({
    organization: "MAULANA AZAD EDUCATIONAL TRUST'S",
    complex: 'Maulana Azad Complex of Hostels',
    address: 'Dr.Rafiq Zakaria Campus, Rauza Bagh, Aurangabad.-431001',
    month: 'October',
    year: '2025',
    academicYear: '2025-2026',
    chequeNo: '000514',
    chequeDate: '25 / 09 /2025',
    withdrawalDate: '01 / 10 /2025',
    openingBalance: 970,
    authorizedBy: 'Dr.Shaikh Shakeel',
    designation: 'Warden',
  });

  const [editingHeader, setEditingHeader] = useState(false);
  const [tempHeader, setTempHeader] = useState<HeaderInfo | null>(null);
  // Start editing header
  const startEditHeader = () => {
    setTempHeader({ ...header });
    setEditingHeader(true);
  };

  // Save edited header
  const saveEditHeader = () => {
    if (tempHeader) {
      setHeader(tempHeader);
      // Persist using same month dataset structure as loader/saveData
      const monthKey = getMonthKey();
      const existing = localStorage.getItem(monthKey);
      const data = existing ? JSON.parse(existing) : {};
      const newData = { ...data, header: tempHeader, entries };
      localStorage.setItem(monthKey, JSON.stringify(newData));
      setEditingHeader(false);
      setTempHeader(null);
    }
  };

  // Cancel editing header
  const cancelEditHeader = () => {
    setEditingHeader(false);
    setTempHeader(null);
  };
  const [editingEntry, setEditingEntry] = useState<number | null>(null);
  const [tempEntry, setTempEntry] = useState<PettyCashEntry | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [logoBase64, setLogoBase64] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const getMonthKey = React.useCallback(() => {
    return `pettyCash_${header.month}_${header.year}`;
  }, [header.month, header.year]);

  const loadMonthData = React.useCallback(() => {
    const monthKey = getMonthKey();
    const savedData = localStorage.getItem(monthKey);

    if (savedData) {
      const data = JSON.parse(savedData);
      setEntries(data.entries || []);
      // Load month-specific header info (cheque number, opening balance)
      setHeader(prev => ({
        ...prev,
        chequeNo: data.header?.chequeNo || prev.chequeNo,
        chequeDate: data.header?.chequeDate || prev.chequeDate,
        withdrawalDate: data.header?.withdrawalDate || prev.withdrawalDate,
        openingBalance: data.header?.openingBalance || 0,
      }));
    } else {
      // New month - clear entries
      setEntries([]);
    }
  }, [getMonthKey]);

  const loadData = async () => {
    // Load global header (organization info)
    const savedHeader = localStorage.getItem('pettyCashHeader');

    if (savedHeader) {
      const parsed = JSON.parse(savedHeader);
      setHeader(prev => ({
        ...prev,
        organization: parsed.organization || prev.organization,
        complex: parsed.complex || prev.complex,
        address: parsed.address || prev.address,
        authorizedBy: parsed.authorizedBy || prev.authorizedBy,
        designation: parsed.designation || prev.designation,
        month: parsed.month || prev.month,
        year: parsed.year || prev.year,
      }));
    }
  };

  const loadSettings = async () => {
    const uploadedLogo = localStorage.getItem('uploadedLogo');
    if (uploadedLogo) setLogoBase64(uploadedLogo);
  };

  useEffect(() => {
    loadData();
    loadSettings();
  }, []);

  // Load data when month/year changes
  useEffect(() => {
    if (header.month && header.year) {
      loadMonthData();
    }
  }, [header.month, header.year, loadMonthData]);

  const summary = useMemo(() => {
    const totals = entries.reduce(
      (acc, entry) => ({
        totalExpenses: acc.totalExpenses + entry.totalExpenses,
        misc: acc.misc + entry.misc,
        conveyance: acc.conveyance + entry.conveyance,
        xerox: acc.xerox + entry.xerox,
        housekeeping: acc.housekeeping + entry.housekeeping,
        security: acc.security + entry.security,
        repairs: acc.repairs + entry.repairs,
        office: acc.office + entry.office,
      }),
      { totalExpenses: 0, misc: 0, conveyance: 0, xerox: 0, housekeeping: 0, security: 0, repairs: 0, office: 0 }
    );

    const totalAmount = header.openingBalance;
    const closingBalance = totalAmount - totals.totalExpenses;

    return { ...totals, totalAmount, closingBalance };
  }, [entries, header.openingBalance]);

  // Build printable/report HTML used for both Preview/Print and PDF export
  const buildReportHtml = () => `
    <div style="text-align: center; margin-bottom: 30px;">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo" style="width: 80px; height: 80px; margin-bottom: 10px;" />` : ''}
      <h2 style="margin: 5px 0; font-size: 20px; font-weight: bold;">${header.organization}</h2>
      <h3 style="margin: 5px 0; font-size: 18px; font-weight: 600;">${header.complex}</h3>
      <p style="margin: 5px 0; font-size: 12px; color: #555;">${header.address}</p>
      <h4 style="margin: 15px 0 10px; font-size: 16px; font-weight: bold; text-decoration: underline;">
        Petty Cash Register of Hostel Court Yard for the Month of ${header.month}- ${header.year}
      </h4>
    </div>
    <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f5f5f5; border: 2px solid #333; border-radius: 8px;">
      <div style="flex: 1;">
        <p style="margin: 5px 0; font-size: 12px;"><strong>Withdrawal Cheque No.:</strong> ${header.chequeNo}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Cheque Dated:</strong> ${header.chequeDate}</p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Withdrawal Date:</strong> ${header.withdrawalDate}</p>
      </div>
      <div style="flex: 1; text-align: right;">
        <p style="margin: 5px 0; font-size: 12px;"><strong>Opening Balance:</strong> <span style="color: #2563eb; font-weight: bold;">₹${header.openingBalance.toLocaleString()}</span></p>
        <p style="margin: 5px 0; font-size: 12px;"><strong>Total Amount:</strong> <span style="color: #7c3aed; font-weight: bold;">₹${summary.totalAmount.toLocaleString()}</span></p>
      </div>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 11px;">
      <thead>
        <tr style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white;">
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: left; font-weight: bold;">Date</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: left; font-weight: bold;">Particulars</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: center; font-weight: bold;">Voucher No.</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Total</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Misc</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Conv</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Xerox</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">House</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Security</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Repairs</th>
          <th style="border: 1px solid #333; padding: 10px 8px; text-align: right; font-weight: bold;">Office</th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((entry, idx) => `
          <tr style="background: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="border: 1px solid #ddd; padding: 8px 6px;">${entry.date}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; font-weight: 500;">${entry.particulars}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: center; color: #dc2626; font-weight: bold;">${entry.voucherNo}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right; font-weight: bold;">₹${entry.totalExpenses.toLocaleString()}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.misc ? '₹' + entry.misc.toLocaleString() : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.conveyance ? '₹' + entry.conveyance.toLocaleString() : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.xerox ? '₹' + entry.xerox.toLocaleString() : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.housekeeping ? '₹' + entry.housekeeping.toLocaleString() : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.security ? '₹' + entry.security.toLocaleString() : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.repairs ? '₹' + entry.repairs.toLocaleString() : ''}</td>
            <td style="border: 1px solid #ddd; padding: 8px 6px; text-align: right;">${entry.office ? '₹' + entry.office.toLocaleString() : ''}</td>
          </tr>
        `).join('')}
        <tr style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; font-weight: bold;">
          <td colspan="3" style="border: 2px solid #333; padding: 12px 8px; font-size: 13px;">TOTAL</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right; font-size: 13px;">₹${summary.totalExpenses.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.misc.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.conveyance.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.xerox.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.housekeeping.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.security.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.repairs.toLocaleString()}</td>
          <td style="border: 2px solid #333; padding: 12px 8px; text-align: right;">₹${summary.office.toLocaleString()}</td>
        </tr>
      </tbody>
    </table>
    <div style="display: flex; gap: 30px; margin-top: 30px;">
      <div style="flex: 1; border: 2px solid #333; border-radius: 8px; padding: 20px; background: #fef3c7;">
        <h4 style="margin: 0 0 15px; font-size: 15px; font-weight: bold; text-align: center; color: #92400e; border-bottom: 2px solid #92400e; padding-bottom: 10px;">( Head Summary )</h4>
        <table style="width: 100%; font-size: 12px;">
          <tr><td style="padding: 6px 0;">Conveyance & Allowances</td><td style="text-align: right; font-weight: bold;">₹${summary.conveyance.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">Xerox & Stationery</td><td style="text-align: right; font-weight: bold;">₹${summary.xerox.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">House keeping</td><td style="text-align: right; font-weight: bold;">₹${summary.housekeeping.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">Security Deposit</td><td style="text-align: right; font-weight: bold;">₹${summary.security.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">Repairs & Maintenance</td><td style="text-align: right; font-weight: bold;">₹${summary.repairs.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">Office Expenses</td><td style="text-align: right; font-weight: bold;">₹${summary.office.toLocaleString()}</td></tr>
          <tr style="border-top: 2px solid #92400e;"><td style="padding: 10px 0; font-weight: bold; font-size: 13px;">Total:-</td><td style="text-align: right; font-weight: bold; font-size: 13px; color: #dc2626;">₹${summary.totalExpenses.toLocaleString()}</td></tr>
        </table>
      </div>
      <div style="flex: 1; border: 2px solid #333; border-radius: 8px; padding: 20px; background: #d1fae5;">
        <h4 style="margin: 0 0 15px; font-size: 15px; font-weight: bold; text-align: center; color: #065f46; border-bottom: 2px solid #065f46; padding-bottom: 10px;">( Cash Summary )</h4>
        <table style="width: 100%; font-size: 12px;">
          <tr><td style="padding: 6px 0;">Opening Balance</td><td style="text-align: right; font-weight: bold;">₹${header.openingBalance.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">Total:</td><td style="text-align: right; font-weight: bold;">₹${summary.totalAmount.toLocaleString()}</td></tr>
          <tr><td style="padding: 6px 0;">Less Expenses</td><td style="text-align: right; font-weight: bold; color: #dc2626;">₹${summary.totalExpenses.toLocaleString()}</td></tr>
          <tr style="border-top: 2px solid #065f46;"><td style="padding: 10px 0; font-weight: bold; font-size: 13px;">Closing Balance</td><td style="text-align: right; font-weight: bold; font-size: 13px; color: #16a34a;">₹${summary.closingBalance.toLocaleString()}</td></tr>
        </table>
        <div style="margin-top: 20px; padding-top: 15px; border-top: 2px solid #065f46; text-align: right;">
          <p style="margin: 5px 0; font-weight: bold; font-size: 13px;">( ${header.authorizedBy} )</p>
          <p style="margin: 5px 0; font-size: 11px; color: #374151;">${header.designation}</p>
        </div>
      </div>
    </div>
    <div style="margin-top: 30px; padding-top: 15px; border-top: 2px dashed #999; text-align: center;">
      <p style="font-size: 10px; color: #6b7280; margin: 5px 0;">Generated on ${new Date().toLocaleString('en-IN')}</p>
      <p style="font-size: 10px; color: #6b7280; margin: 5px 0;">Maulana Azad Hostel Management System - Confidential Document</p>
    </div>
  `;

  // Safely build report HTML with try/catch to avoid throwing in window contexts


  const saveData = (newEntries: PettyCashEntry[], newHeader?: HeaderInfo) => {
    // Save to month-specific key
    const monthKey = getMonthKey();
    const monthData = {
      entries: newEntries,
      header: newHeader ? {
        chequeNo: newHeader.chequeNo,
        chequeDate: newHeader.chequeDate,
        withdrawalDate: newHeader.withdrawalDate,
        openingBalance: newHeader.openingBalance,
      } : undefined
    };
    localStorage.setItem(monthKey, JSON.stringify(monthData));

    // Save global header info (organization, month/year selection)
    if (newHeader) {
      const globalHeader = {
        organization: newHeader.organization,
        complex: newHeader.complex,
        address: newHeader.address,
        authorizedBy: newHeader.authorizedBy,
        designation: newHeader.designation,
        month: newHeader.month,
        year: newHeader.year,
      };
      localStorage.setItem('pettyCashHeader', JSON.stringify(globalHeader));
    }
  };

  const addEntry = () => {
    const newId = Math.max(...entries.map((e) => e.id), 0) + 1;
    const newEntry: PettyCashEntry = {
      id: newId,
      date: '',
      particulars: '',
      voucherNo: `V - ${newId + 75}`,
      totalExpenses: 0,
      misc: 0,
      conveyance: 0,
      xerox: 0,
      housekeeping: 0,
      security: 0,
      repairs: 0,
      office: 0,
    };
    const newEntries = [...entries, newEntry];
    setEntries(newEntries);
    setEditingEntry(newId);
    setTempEntry(newEntry);
    saveData(newEntries);
  };

  const startEdit = (entry: PettyCashEntry) => {
    setEditingEntry(entry.id);
    setTempEntry({ ...entry });
  };

  const saveEdit = () => {
    if (!tempEntry || tempEntry.particulars.trim() === '') {
      alert('Particulars is required');
      return;
    }
    const newEntries = entries.map((e) => (e.id === editingEntry ? tempEntry : e));
    setEntries(newEntries);
    setEditingEntry(null);
    setTempEntry(null);
    saveData(newEntries);
  };

  const cancelEdit = () => {
    if (tempEntry && tempEntry.particulars === '') {
      const newEntries = entries.filter((e) => e.id !== editingEntry);
      setEntries(newEntries);
      saveData(newEntries);
    }
    setEditingEntry(null);
    setTempEntry(null);
  };

  const deleteEntry = (id: number) => {
    const newEntries = entries.filter((e) => e.id !== id);
    setEntries(newEntries);
    setDeleteConfirmId(null);
    saveData(newEntries);
  };



  const exportToExcel = () => {
    let csv = '\uFEFF';

    csv += `${header.organization}\n`;
    csv += `${header.complex}\n`;
    csv += `${header.address}\n`;
    csv += `Petty Cash Register of Hostel Court Yard for the Month of ${header.month}- ${header.year}\n\n`;

    csv += 'Date,Particulars,Voucher No.,Total Expenses,misc. Expenses,Conveyance & Allowance,Xerox & Stationery,House keeping,Security Deposit,Repairs & Maintenance,Office Expenses,Closing Balance\n';

    csv += `,,,,,,,,,,Opening Balance :-,${header.openingBalance}\n`;
    csv += `,,Withdrawl Cheque No. ${header.chequeNo},Dated.:- ${header.chequeDate},,,withdrawal Date:- ${header.withdrawalDate},,,${summary.totalAmount}\n`;

    entries.forEach((entry) => {
      csv += `${entry.date},"${entry.particulars}",${entry.voucherNo},${entry.totalExpenses},${entry.misc || ''},${entry.conveyance || ''},${entry.xerox || ''},${entry.housekeeping || ''},${entry.security || ''},${entry.repairs || ''},${entry.office || ''},,\n`;
    });

    csv += `\nTOTAL,,${summary.totalExpenses},${summary.misc},${summary.conveyance},${summary.xerox},${summary.housekeeping},${summary.security},${summary.repairs},${summary.office},${summary.closingBalance}\n\n`;

    csv += '( Head Summary ),,,( Cash Summary )\n';
    csv += `Conveyance & Allowances,${summary.conveyance},,Opening Balance,${header.openingBalance}\n`;
    csv += `Xerox & Stationery,${summary.xerox},,Total:,${summary.totalAmount}\n`;
    csv += `House keeping,${summary.housekeeping},,Less Expenses,${summary.totalExpenses},,,( ${header.authorizedBy} )\n`;
    csv += `Security Deposit,${summary.security},,Closing Balance,${summary.closingBalance},,,${header.designation}\n`;
    csv += `Repairs & Maintenance,${summary.repairs}\n`;
    csv += `Office Expenses,${summary.office}\n`;
    csv += `Total:-,${summary.totalExpenses}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Petty_Cash_Register_${header.month}_${header.year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = async () => {
    const targetElement = previewRef.current || printRef.current;
    if (!targetElement) {
      alert('Nothing to export');
      return;
    }
    try {
      // Use the actual DOM container so html2canvas captures computed styles
      const pdfContent = targetElement;
      // Generate PDF
      const canvas = await html2canvas(pdfContent, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1400,
        windowHeight: pdfContent.scrollHeight,
      });

      if (!canvas || canvas.width === 0 || canvas.height === 0) {
        console.error('html2canvas returned empty canvas', { canvas });
        throw new Error('Captured screenshot was empty. Check content and styles.');
      }

      // if we temporarily created a container we removed it; here we used existing DOM so nothing to remove

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidthPx = imgProps.width;
      const imgHeightPx = imgProps.height;
      const pxToMm = pdfWidth / imgWidthPx;
      const imgHeightMm = imgHeightPx * pxToMm;

      if (imgHeightMm <= pdfHeight) {
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, imgHeightMm);
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

            const pageData = canvasPage.toDataURL('image/jpeg', 1.0);
            const pageHeightMm = canvasPage.height * pxToMm;

            if (positionPx > 0) pdf.addPage();
            pdf.addImage(pageData, 'JPEG', 0, 0, pdfWidth, pageHeightMm);

            positionPx += canvasPage.height;
            remainingHeightPx -= canvasPage.height;
          } else {
            break;
          }
        }
      }

      pdf.save(`Petty_Cash_Register_${header.month}_${header.year}.pdf`);
    } catch (error: unknown) {
      console.error('Error generating PDF:', error);
      const msg = (error && typeof error === 'object' && 'message' in error) ? String(error.message) : String(error);
      alert(`Error generating PDF: ${msg}. Try Excel export or check console for details.`);
      // Open a debugging window to show the HTML that failed (optional)
      try {
        const debugWindow = window.open('', '_blank');
        if (debugWindow) {
          debugWindow.document.open();
          debugWindow.document.write(`<pre style="white-space:pre-wrap;padding:12px">${String(buildReportHtml())}</pre>`);
          debugWindow.document.close();
        }
      } catch {
        // ignore - failed to open debug window
      }
    }
  };

  const handlePrint = () => {
    const targetElement = previewRef.current || printRef.current;
    if (!targetElement) return;

    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const styles = `
      <style>
        @media print { @page { size: A4 landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 16px; }
        .container { max-width: 1123px; margin: 0 auto; background: #fff; padding: 24px; border: 2px solid #111827; border-radius: 10px; }
      </style>
    `;
    const html = `
      <html><head><meta charset="utf-8" />${styles}</head><body>
        <div class="container">${targetElement.innerHTML}</div>
      </body></html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch { /* ignore print errors */ } }, 300);
  };

  const handlePreview = () => {
    const targetElement = previewRef.current || printRef.current;
    if (!targetElement) return;

    const w = window.open('', '_blank', 'noopener,noreferrer');
    if (!w) return;
    const styles = `
      <style>
        @media print { @page { size: A4 landscape; margin: 10mm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: Arial, sans-serif; background: #f3f4f6; padding: 16px; }
        .container { max-width: 1123px; margin: 0 auto; background: #fff; padding: 24px; border: 2px solid #111827; border-radius: 10px; }
        .toolbar { position: sticky; top: 0; background: #fff; padding: 8px 0 16px; margin-bottom: 16px; border-bottom: 1px solid #e5e7eb; }
        .btn { display: inline-block; padding: 8px 14px; margin-right: 8px; border-radius: 6px; border: 1px solid #d1d5db; background: #111827; color: #fff; cursor: pointer; text-decoration: none; font-size: 14px; }
      </style>
    `;
    const html = `
      <html><head><meta charset="utf-8" />${styles}</head><body>
        <div class="container">
          <div class="toolbar">
            <button class="btn" onclick="window.print()">Print</button>
            <button class="btn" onclick="window.close()">Close</button>
          </div>
          ${targetElement.innerHTML}
        </div>
      </body></html>
    `;
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <AccountBalanceWalletIcon sx={{ fontSize: 40, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Petty Cash Register
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Hostel financial management system
            </Typography>
          </Box>
        </Box>
        <Box display="flex" gap={1}>
          <Button startIcon={<PageviewIcon />} onClick={handlePreview} variant="outlined">
            Preview
          </Button>
          <Button startIcon={<PrintIcon />} onClick={handlePrint} variant="outlined">
            Print
          </Button>
          <Button startIcon={<PictureAsPdfIcon />} onClick={exportToPDF} variant="outlined" color="error">
            PDF
          </Button>
          <Button startIcon={<TableViewIcon />} onClick={exportToExcel} variant="outlined" color="success">
            Excel
          </Button>
          <Button startIcon={<AddIcon />} onClick={addEntry} variant="contained">
            Add Entry
          </Button>
        </Box>
      </Box>

      {/* Header Information Card */}
      <div ref={(el) => { printRef.current = el as HTMLDivElement | null; previewRef.current = el as HTMLDivElement | null; }}>
        <Paper sx={{ p: 3, mb: 3 }} elevation={2}>
          {editingHeader ? (
            <Box>
              <Box display="flex" flexWrap="wrap" gap={2}>
                <Box width="100%" display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Organization"
                    value={tempHeader?.organization || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, organization: e.target.value } : h)}
                  />
                  <TextField
                    fullWidth
                    label="Complex"
                    value={tempHeader?.complex || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, complex: e.target.value } : h)}
                  />
                </Box>
                <TextField
                  fullWidth
                  label="Address"
                  value={tempHeader?.address || ''}
                  onChange={e => setTempHeader(h => h ? { ...h, address: e.target.value } : h)}
                />
                <Box width="100%" display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Month"
                    value={tempHeader?.month || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, month: e.target.value } : h)}
                  />
                  <TextField
                    fullWidth
                    label="Year"
                    value={tempHeader?.year || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, year: e.target.value } : h)}
                  />
                  <TextField
                    fullWidth
                    label="Withdrawal Cheque No."
                    value={tempHeader?.chequeNo || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, chequeNo: e.target.value } : h)}
                  />
                  <TextField
                    fullWidth
                    label="Cheque Date"
                    value={tempHeader?.chequeDate || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, chequeDate: e.target.value } : h)}
                  />
                </Box>
                <Box width="100%" display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Withdrawal Date"
                    value={tempHeader?.withdrawalDate || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, withdrawalDate: e.target.value } : h)}
                  />
                  <TextField
                    fullWidth
                    type="number"
                    label="Opening Balance"
                    value={tempHeader?.openingBalance || 0}
                    onChange={e => setTempHeader(h => h ? { ...h, openingBalance: parseFloat(e.target.value) || 0 } : h)}
                  />
                </Box>
                <Box width="100%" display="flex" gap={2}>
                  <TextField
                    fullWidth
                    label="Authorized By"
                    value={tempHeader?.authorizedBy || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, authorizedBy: e.target.value } : h)}
                  />
                  <TextField
                    fullWidth
                    label="Designation"
                    value={tempHeader?.designation || ''}
                    onChange={e => setTempHeader(h => h ? { ...h, designation: e.target.value } : h)}
                  />
                </Box>
              </Box>
              <Button startIcon={<SaveIcon />} onClick={saveEditHeader} variant="contained" sx={{ mt: 2, mr: 2 }}>
                Save Header
              </Button>
              <Button startIcon={<CloseIcon />} onClick={cancelEditHeader} variant="outlined" sx={{ mt: 2 }}>
                Cancel
              </Button>
            </Box>
          ) : (
            <Box textAlign="center" position="relative">
              <IconButton
                onClick={startEditHeader}
                sx={{ position: 'absolute', top: 0, right: 0 }}
                size="small"
              >
                <EditIcon />
              </IconButton>
              <Typography variant="h6" fontWeight="bold">
                {header.organization}
              </Typography>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {header.complex}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {header.address}
              </Typography>
              <Box display="inline-flex" alignItems="center" gap={1} sx={{ bgcolor: 'primary.light', px: 3, py: 1.5, borderRadius: 2, mt: 2 }}>
                <ReceiptIcon />
                <Typography variant="body1" fontWeight="bold">
                  Petty Cash Register of Hostel Court Yard for the Month of {header.month}- {header.year}
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
                      Opening Balance
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{header.openingBalance.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
          <Box flex={1} minWidth={250}>
            <Card sx={{ borderLeft: 4, borderColor: 'error.main' }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Total Expenses
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{summary.totalExpenses.toLocaleString()}
                    </Typography>
                  </Box>
                  <ReceiptIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.7 }} />
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
                      Closing Balance
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      ₹{summary.closingBalance.toLocaleString()}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.dark', opacity: 0.7 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Entries Table */}
        <TableContainer component={Paper} elevation={2} sx={{ mb: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.200' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Particulars</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Voucher No.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Total Expenses</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>misc.</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Conveyance</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Xerox</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>House keeping</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Security</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Repairs</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Office</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Opening Balance Row */}
              <TableRow sx={{ bgcolor: 'primary.light' }}>
                <TableCell colSpan={10} sx={{ fontWeight: 'bold' }}>
                  Opening Balance :-
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {header.openingBalance}
                </TableCell>
                <TableCell />
              </TableRow>

              {/* Withdrawal Info Row */}
              <TableRow sx={{ bgcolor: 'warning.light' }}>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  Withdrawal Cheque No. {header.chequeNo}
                </TableCell>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  Dated.:- {header.chequeDate}
                </TableCell>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                  withdrawal Date:- {header.withdrawalDate}
                </TableCell>
                <TableCell colSpan={3} />
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  Add Receipts

                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {summary.totalAmount}
                </TableCell>
              </TableRow>

              {/* Data Rows */}
              {entries.map((entry) => (
                <TableRow key={entry.id} hover sx={{ bgcolor: editingEntry === entry.id ? 'action.selected' : 'inherit' }}>
                  {editingEntry === entry.id && tempEntry ? (
                    <>
                      <TableCell>
                        <TextField
                          size="small"
                          value={tempEntry.date}
                          onChange={(e) => setTempEntry({ ...tempEntry, date: e.target.value })}
                          placeholder="DD.MM.YYYY"
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={tempEntry.particulars}
                          onChange={(e) => setTempEntry({ ...tempEntry, particulars: e.target.value })}
                          fullWidth
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          value={tempEntry.voucherNo}
                          onChange={(e) => setTempEntry({ ...tempEntry, voucherNo: e.target.value })}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={tempEntry.totalExpenses}
                          onChange={(e) => setTempEntry({ ...tempEntry, totalExpenses: parseFloat(e.target.value) || 0 })}
                          sx={{ width: 80 }}
                        />
                      </TableCell>
                      {(['misc', 'conveyance', 'xerox', 'housekeeping', 'security', 'repairs', 'office'] as const).map((field) => (
                        <TableCell key={field}>
                          <TextField
                            size="small"
                            type="number"
                            value={tempEntry[field]}
                            onChange={(e) => setTempEntry({ ...tempEntry, [field]: parseFloat(e.target.value) || 0 })}
                            sx={{ width: 60 }}
                          />
                        </TableCell>
                      ))}
                      <TableCell>
                        <IconButton size="small" color="success" onClick={saveEdit}>
                          <SaveIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={cancelEdit}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{entry.particulars}</TableCell>
                      <TableCell sx={{ color: 'error.main', fontWeight: 'bold' }}>{entry.voucherNo}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>{entry.totalExpenses}</TableCell>
                      <TableCell align="right">{entry.misc || ''}</TableCell>
                      <TableCell align="right">{entry.conveyance || ''}</TableCell>
                      <TableCell align="right">{entry.xerox || ''}</TableCell>
                      <TableCell align="right">{entry.housekeeping || ''}</TableCell>
                      <TableCell align="right">{entry.security || ''}</TableCell>
                      <TableCell align="right">{entry.repairs || ''}</TableCell>
                      <TableCell align="right">{entry.office || ''}</TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => startEdit(entry)} color="primary">
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => setDeleteConfirmId(entry.id)} color="error">
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))}

              {/* Total Row */}
              <TableRow sx={{ bgcolor: 'grey.300', borderTop: 3, borderColor: 'grey.500' }}>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  TOTAL
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                  {summary.totalExpenses}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.misc}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.conveyance}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.xerox}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.housekeeping}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.security}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.repairs}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>{summary.office}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <Box display="flex" gap={3} flexWrap="wrap">
        <Box flex={1} minWidth={300}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              ( Head Summary )
            </Typography>
            <Box display="grid" gap={1.5}>
              {[
                ['Conveyance & Allowances', summary.conveyance],
                ['Xerox & Stationery', summary.xerox],
                ['House keeping', summary.housekeeping],
                ['Security Deposit', summary.security],
                ['Repairs & Maintenance', summary.repairs],
                ['Office Expenses', summary.office],
              ].map(([label, value]) => (
                <Box key={label as string} display="flex" justifyContent="space-between" py={1} borderBottom={1} borderColor="divider">
                  <Typography variant="body2" fontWeight={500}>
                    {label}
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    ₹{(value as number).toLocaleString()}
                  </Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" py={1.5} bgcolor="primary.light" px={2} borderRadius={1} mt={1}>
                <Typography variant="body1" fontWeight="bold">
                  Total:-
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="primary">
                  ₹{summary.totalExpenses.toLocaleString()}
                </Typography>
              </Box>
            </Box>
          </Paper>


        </Box>

        <Box flex={1} minWidth={300}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              ( Cash Summary )
            </Typography>
            <Box display="grid" gap={1.5}>
              {[
                ['Opening Balance', header.openingBalance],
                ['Total:', summary.totalAmount],
                ['Less Expenses', summary.totalExpenses],
              ].map(([label, value], idx) => (
                <Box key={label as string} display="flex" justifyContent="space-between" py={1} borderBottom={1} borderColor="divider">
                  <Typography variant="body2" fontWeight={500}>
                    {label}
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color={idx === 2 ? 'error.main' : 'inherit'}
                  >
                    ₹{(value as number).toLocaleString()}
                  </Typography>
                </Box>
              ))}
              <Box display="flex" justifyContent="space-between" py={1.5} bgcolor="success.light" px={2} borderRadius={1} mt={1}>
                <Typography variant="body1" fontWeight="bold">
                  Closing Balance
                </Typography>
                <Typography variant="body1" fontWeight="bold" color="success.dark">
                  ₹{summary.closingBalance.toLocaleString()}
                </Typography>
              </Box>
            </Box>
            <Box mt={3} pt={3} borderTop={2} borderColor="divider" textAlign="right">
              <Typography variant="body1" fontWeight="bold">
                ( {header.authorizedBy} )
              </Typography>
              <Typography variant="body2" color="text.secondary" fontWeight={600}>
                {header.designation}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <DeleteIcon color="error" />
            Confirm Deletion
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete entry for{' '}
            <strong>{entries.find((e) => e.id === deleteConfirmId)?.particulars}</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirmId && deleteEntry(deleteConfirmId)}
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box >
  );
};

export default PettyCashRegister;
