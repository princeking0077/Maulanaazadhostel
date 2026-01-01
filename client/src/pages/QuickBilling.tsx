import React, { useEffect, useMemo, useState } from 'react';
import { Box, Card, CardContent, Typography, Tabs, Tab, TextField, Button, InputAdornment, MenuItem, Stack, Alert, Snackbar, IconButton } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { db } from '../database/db';
import type { FacilityTransaction, BillingItem } from '../database/db';
import { useAppLogo } from '../hooks/useAppLogo';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const QuickBilling: React.FC = () => {
  const [tab, setTab] = useState<'mess' | 'canteen' | 'xerox' | 'utilities' | 'workers'>('mess');
  const [partyName, setPartyName] = useState<string>('');
  const [date, setDate] = useState<Date>(new Date());
  const [txnType, setTxnType] = useState<'Income' | 'Expense'>('Expense');
  const [amount, setAmount] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<{open:boolean; message:string; severity:'success'|'error'}>({open:false, message:'', severity:'success'});
  const [description, setDescription] = useState<string>('');
  const [items, setItems] = useState<BillingItem[]>([]);
  const [gstPercent, setGstPercent] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [billNo, setBillNo] = useState<string>('');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [utilityType, setUtilityType] = useState<'Rent'|'Electricity'|'Water'|''>('');
  const [periodFrom, setPeriodFrom] = useState<Date | null>(null);
  const [periodTo, setPeriodTo] = useState<Date | null>(null);
  const [meterUnits, setMeterUnits] = useState<number>(0);
  const [workerRole, setWorkerRole] = useState<string>('');
  const appLogo = useAppLogo();

  useEffect(() => { (async () => {
    setPartyName('');
    setDescription('');
    setAmount(0);
    setItems([]);
    setGstPercent(0);
    setPaidAmount(0);
    setBillNo('');
    setPaymentRef('');
    setUtilityType('');
    setPeriodFrom(null);
    setPeriodTo(null);
    setMeterUnits(0);
    setWorkerRole('');

    if (tab === 'mess') {
      setTxnType('Income');
      const s = await db.settings.where('key').equals('mess_veg_fee').first();
      const val = s ? parseInt(s.value, 10) : 0;
      setAmount(val);
      setItems(val>0 ? [{ description: 'Mess Charges', qty: 1, rate: val, amount: val }] : []);
    } else if (tab === 'canteen') {
      setTxnType('Income');
      const s = await db.settings.where('key').equals('canteen_fee').first();
      const val = s ? parseInt(s.value, 10) : 0;
      setAmount(val);
      setItems(val>0 ? [{ description: 'Canteen Charges', qty: 1, rate: val, amount: val }] : []);
    } else if (tab === 'xerox') {
      setTxnType('Income');
      const s = await db.settings.where('key').equals('xerox_fee').first();
      const val = s ? parseInt(s.value, 10) : 0;
      setAmount(val);
      setItems(val>0 ? [{ description: 'Xerox Charges', qty: 1, rate: val, amount: val }] : []);
    } else if (tab === 'utilities') {
      setTxnType('Expense');
      setDescription('Electricity/Rent/Water Bill');
      setUtilityType('Electricity');
    } else if (tab === 'workers') {
      setTxnType('Expense');
      setDescription('Staff Salary Payment');
      setWorkerRole('');
    }
  })(); }, [tab]);

  const title = useMemo(() => {
    if (tab === 'mess') return 'Admin Billing - Mess';
    if (tab === 'canteen') return 'Admin Billing - Canteen';
    if (tab === 'xerox') return 'Admin Billing - Xerox';
    if (tab === 'utilities') return 'Admin Billing - Utilities (Rent/Electricity/Water)';
    return 'Admin Billing - Worker Payments';
  }, [tab]);

  const handleDownloadPDF = async (txn: FacilityTransaction) => {
    try {
      const receiptEl = document.getElementById('pdf-receipt-container');
      if (!receiptEl) return;
      const canvas = await html2canvas(receiptEl, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AdminReceipt_${txn.receiptNo}.pdf`);
      receiptEl.style.display = 'none';
    } catch (err) {
      console.error('PDF export failed', err);
      setSnackbar({open:true, message:'Failed to generate PDF', severity:'error'});
    }
  };

  const computeSubtotal = (): number => items.length > 0
    ? items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0)
    : (Number(amount) || 0);

  const subtotal = computeSubtotal();
  const computedGstAmount = Math.round((subtotal * (Number(gstPercent) || 0)) / 100);
  const netAmount = subtotal + computedGstAmount;
  const balanceAmount = Math.max(0, (Number(paidAmount) || 0) > 0 ? netAmount - (Number(paidAmount) || 0) : 0);

  const updateItem = (index: number, patch: Partial<BillingItem>) => {
    setItems(prev => {
      const next = [...prev];
      const curr = next[index];
      const qty = patch.qty !== undefined ? patch.qty : curr.qty;
      const rate = patch.rate !== undefined ? patch.rate : curr.rate;
      const amount = qty * rate;
      next[index] = { ...curr, ...patch, amount } as BillingItem;
      return next;
    });
  };
  const addItem = () => setItems(prev => [...prev, { description: '', qty: 1, rate: 0, amount: 0 }]);
  const removeItem = (index: number) => setItems(prev => prev.filter((_, i) => i !== index));

  const numberToWords = (num: number): string => {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const convert = (n: number): string => {
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
      if (n < 10000000) return convert(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + convert(n % 100000) : '');
      return convert(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + convert(n % 10000000) : '');
    };
    return convert(num).trim();
  };

  const generateReceiptHTML = (txn: FacilityTransaction): string => {
    const categoryLabel = tab === 'utilities' ? 'Utilities Payment' : tab === 'workers' ? 'Worker Payment' : `${txn.facility} ${txn.txnType}`;
    const showItems = (txn.items && txn.items.length) ? true : false;
    return `
      <div style="font-family: 'Times New Roman', serif; padding: 40px; background: white; min-height: 297mm; width: 210mm;">
        <div style="display: flex; align-items: flex-start; border-bottom: 3px solid #000; padding-bottom: 16px; margin-bottom: 24px;">
          <img src="${appLogo}" alt="Logo" style="width: 90px; height: 90px; margin-right: 16px; object-fit: contain;" />
          <div style="flex: 1; text-align: center;">
            <div style="font-size: 16px; font-weight: 500; margin-bottom: 4px;">MAULANA AZAD EDUCATIONAL TRUST'S</div>
            <div style="font-size: 24px; font-weight: bold; letter-spacing: 0.5px;">MAULANA AZAD COMPLEX OF HOSTEL</div>
            <div style="font-size: 13px; margin-top: 4px;">Dr.Rafiq Zakaria Campus, Rauza Bagh, Chh.Sambhajinagar (Aurangabad)-431001(M.S.)</div>
            <div style="font-size: 13px;">Email: mail2azadhostel@gmail.com</div>
          </div>
        </div>
        <div style="text-align: center; margin: 32px 0;">
          <div style="font-size: 22px; font-weight: bold; text-decoration: underline; letter-spacing: 1px;">ADMINISTRATIVE ${txn.txnType.toUpperCase()} RECEIPT</div>
          <div style="font-size: 16px; margin-top: 8px; color: #555;">${categoryLabel}</div>
        </div>
        <div style="margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold; width: 25%;">Receipt No:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.receiptNo ?? '-'}</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold; width: 15%;">Date:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${new Date(txn.date).toLocaleDateString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Bill No:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.billNo ?? '-'}</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Payment Ref:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.paymentRef ?? '-'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Party Name:</td>
              <td colspan="3" style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.partyName}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Category:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${categoryLabel}</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Type:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.txnType}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Description:</td>
              <td colspan="3" style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.description || '-'}</td>
            </tr>
            ${tab === 'utilities' ? `
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Utility Type:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.utilityType ?? '-'}</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Period:</td>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.periodFrom ? new Date(txn.periodFrom).toLocaleDateString('en-IN') : '-'} to ${txn.periodTo ? new Date(txn.periodTo).toLocaleDateString('en-IN') : '-'}</td>
            </tr>
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Units:</td>
              <td colspan="3" style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.meterUnits ?? '-'}</td>
            </tr>
            ` : ''}
            ${tab === 'workers' ? `
            <tr>
              <td style="padding: 12px; border: 1px solid #333; font-size: 15px; font-weight: bold;">Worker Role:</td>
              <td colspan="3" style="padding: 12px; border: 1px solid #333; font-size: 15px;">${txn.workerRole ?? '-'}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        ${showItems ? `
        <div style="margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="border: 1px solid #333; padding: 8px; text-align: left;">Description</th>
                <th style="border: 1px solid #333; padding: 8px; width: 80px;">Qty</th>
                <th style="border: 1px solid #333; padding: 8px; width: 120px;">Rate (₹)</th>
                <th style="border: 1px solid #333; padding: 8px; width: 140px;">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${txn.items!.map(it => `
              <tr>
                <td style="border: 1px solid #333; padding: 8px;">${it.description}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: center;">${it.qty}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right;">${(it.rate || 0).toLocaleString('en-IN')}</td>
                <td style="border: 1px solid #333; padding: 8px; text-align: right;">${(it.amount || 0).toLocaleString('en-IN')}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
        ` : `
        <div style="margin: 24px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 16px; border: 2px solid #000; font-size: 17px; font-weight: bold; background: #f5f5f5;">Amount (₹):</td>
              <td colspan="3" style="padding: 16px; border: 2px solid #000; font-size: 18px; font-weight: bold;">₹ ${txn.subtotal?.toLocaleString('en-IN') || txn.amount.toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
        `}
        <div style="margin: 24px 0; display: flex; justify-content: flex-end;">
          <table style="border-collapse: collapse; min-width: 360px;">
            <tr>
              <td style="padding: 8px; border: 1px solid #333;">Subtotal</td>
              <td style="padding: 8px; border: 1px solid #333; text-align: right;">₹ ${(txn.subtotal ?? 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333;">GST (${txn.gstPercent ?? 0}%)</td>
              <td style="padding: 8px; border: 1px solid #333; text-align: right;">₹ ${(txn.gstAmount ?? 0).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 2px solid #000; font-weight: bold;">Net Amount</td>
              <td style="padding: 8px; border: 2px solid #000; text-align: right; font-weight: bold;">₹ ${(txn.netAmount ?? txn.amount).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333;">Paid</td>
              <td style="padding: 8px; border: 1px solid #333; text-align: right;">₹ ${(txn.paidAmount ?? txn.netAmount ?? txn.amount).toLocaleString('en-IN')}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #333;">Balance</td>
              <td style="padding: 8px; border: 1px solid #333; text-align: right;">₹ ${(txn.balanceAmount ?? 0).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
        <div style="margin: 24px 0; padding: 12px; background: #f9f9f9; border-left: 4px solid #1976d2;">
          <div style="font-size: 14px; color: #555;">Amount in words:</div>
          <div style="font-size: 16px; font-weight: 600; margin-top: 4px;">${numberToWords(txn.netAmount ?? txn.amount)} Rupees Only</div>
        </div>
        <div style="margin: 24px 0;">
          <div style="font-size: 15px;"><strong>Payment Method:</strong> ${txn.paymentMethod || 'Cash'}</div>
          <div style="font-size: 14px; margin-top: 8px; color: #666;">Issued on: ${new Date(txn.createdAt).toLocaleString('en-IN')}</div>
        </div>
        <div style="margin-top: 80px; display: flex; justify-content: space-between; align-items: flex-end;">
          <div style="text-align: center;">
            <img src="${appLogo}" alt="Seal" style="width: 100px; height: 100px; opacity: 0.3;" />
          </div>
          <div style="text-align: center; min-width: 220px;">
            <div style="border-bottom: 1px solid #000; height: 60px;"></div>
            <div style="font-size: 14px; margin-top: 8px;">Authorized Signature</div>
            <div style="font-size: 13px; font-weight: bold;">Chief Warden</div>
            <div style="font-size: 12px; font-style: italic;">Maulana Azad Hostel</div>
          </div>
        </div>
        <div style="margin-top: 40px; padding-top: 16px; border-top: 1px solid #ccc; text-align: center; font-size: 12px; color: #777;">
          This is a computer-generated receipt and is valid without physical signature.<br/>
          For queries, contact the hostel administration office.
        </div>
      </div>
    `;
  };

  const handleSave = async (downloadPDF:boolean) => {
    try {
      if (!partyName.trim()) { setSnackbar({open:true, message:'Enter party/vendor/worker name', severity:'error'}); return; }
      if (items.length === 0 && amount <= 0) { setSnackbar({open:true, message:'Enter valid amount', severity:'error'}); return; }
      const receiptNo = `ADM${Date.now().toString().slice(-8)}`;
      const facilityMap: Record<typeof tab, 'Mess'|'Canteen'|'Xerox'> = { mess: 'Mess', canteen: 'Canteen', xerox: 'Xerox', utilities: 'Mess', workers: 'Mess' };
      const txnSubtotal = subtotal;
      const txnGstAmount = computedGstAmount;
      const txnNetAmount = netAmount;
      const txnPaidAmount = paidAmount > 0 ? paidAmount : txnNetAmount;
      const txnBalance = Math.max(0, txnNetAmount - txnPaidAmount);
      const txn: FacilityTransaction = {
        facility: facilityMap[tab], txnType, date, amount: txnNetAmount, partyName,
        description: description || (tab === 'utilities' ? 'Utility Bill Payment' : tab === 'workers' ? 'Worker Salary' : ''),
        receiptNo, billNo: billNo || undefined, paymentMethod: 'Cash', paymentRef: paymentRef || undefined,
        items: items.length > 0 ? items : undefined, subtotal: txnSubtotal, gstPercent: Number(gstPercent) || 0, gstAmount: txnGstAmount,
        netAmount: txnNetAmount, paidAmount: txnPaidAmount, balanceAmount: txnBalance,
        utilityType: tab === 'utilities' ? (utilityType || undefined) : undefined,
        periodFrom: tab === 'utilities' && periodFrom ? periodFrom : undefined,
        periodTo: tab === 'utilities' && periodTo ? periodTo : undefined,
        meterUnits: tab === 'utilities' && meterUnits ? meterUnits : undefined,
        workerRole: tab === 'workers' && workerRole ? workerRole : undefined,
        createdAt: new Date(), updatedAt: new Date(),
      };
      const id = await db.facilityTransactions.add(txn);
      const saved = await db.facilityTransactions.get(id);
      if (!saved) throw new Error('Transaction save failed');
      setSnackbar({open:true, message:'Payment saved successfully', severity:'success'});
      if (downloadPDF) {
        const container = document.getElementById('pdf-receipt-container');
        if (container) {
          container.style.display = 'block';
          container.innerHTML = generateReceiptHTML(saved);
          setTimeout(() => { handleDownloadPDF(saved); }, 300);
        }
      }
      setPartyName(''); setDescription(''); setAmount(0); setItems([]); setGstPercent(0); setPaidAmount(0); setBillNo(''); setPaymentRef('');
      setUtilityType(''); setPeriodFrom(null); setPeriodTo(null); setMeterUnits(0); setWorkerRole('');
    } catch (e) {
      console.error(e); setSnackbar({open:true, message:'Error saving payment', severity:'error'});
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>{title}</Typography>
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_,v)=>setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Mess" value="mess" />
            <Tab label="Canteen" value="canteen" />
            <Tab label="Xerox" value="xerox" />
            <Tab label="Utilities (Rent/Electricity)" value="utilities" />
            <Tab label="Worker Payments" value="workers" />
          </Tabs>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label={tab === 'workers' ? 'Worker Name' : 'Party / Vendor Name'} value={partyName} onChange={(e)=>setPartyName(e.target.value)} sx={{ minWidth: 280 }} />
            <DatePicker label="Date" value={date} onChange={(d)=> d && setDate(d)} />
            <TextField select label="Type" value={txnType} onChange={(e)=>setTxnType(e.target.value as 'Income'|'Expense')} sx={{ minWidth: 160 }}>
              <MenuItem value="Income">Income</MenuItem>
              <MenuItem value="Expense">Expense</MenuItem>
            </TextField>
            {items.length === 0 && (
              <TextField label="Amount" type="number" value={amount} onChange={(e)=>setAmount(parseInt(e.target.value || '0', 10))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ minWidth: 160 }} />
            )}
          </Stack>
          {tab === 'utilities' && (
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField select label="Utility Type" value={utilityType} onChange={(e)=>setUtilityType(e.target.value as 'Rent'|'Electricity'|'Water')} sx={{ minWidth: 180 }}>
                <MenuItem value="Electricity">Electricity</MenuItem>
                <MenuItem value="Rent">Rent</MenuItem>
                <MenuItem value="Water">Water</MenuItem>
              </TextField>
              <DatePicker label="Period From" value={periodFrom} onChange={(d)=> setPeriodFrom(d)} />
              <DatePicker label="Period To" value={periodTo} onChange={(d)=> setPeriodTo(d)} />
              <TextField label="Units" type="number" value={meterUnits} onChange={(e)=>setMeterUnits(parseInt(e.target.value || '0', 10))} sx={{ minWidth: 140 }} />
            </Stack>
          )}
          {tab === 'workers' && (
            <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2 }}>
              <TextField label="Worker Role" value={workerRole} onChange={(e)=>setWorkerRole(e.target.value)} sx={{ minWidth: 220 }} />
            </Stack>
          )}
          <TextField label={tab === 'utilities' ? 'Bill Details (Electricity/Rent/Water)' : tab === 'workers' ? 'Salary Details / Month' : 'Description / Notes'} value={description} onChange={(e)=>setDescription(e.target.value)} fullWidth multiline minRows={2} sx={{ mb: 2 }} />
          <Card variant="outlined" sx={{ mb: 2, background: '#fafafa' }}>
            <CardContent>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="h6">Items</Typography>
                <Button size="small" onClick={addItem}>Add Item</Button>
              </Stack>
              {items.length > 0 ? (
                <Box>
                  <Box display="flex" sx={{ fontWeight: 600, mb: 1 }}>
                    <Box flex={6}>Description</Box>
                    <Box flex={2}>Qty</Box>
                    <Box flex={2}>Rate</Box>
                    <Box flex={2} textAlign="right">Amount</Box>
                  </Box>
                  {items.map((it, idx) => (
                    <Box key={idx} display="flex" alignItems="center" sx={{ mb: 1 }}>
                      <Box flex={6} pr={1}><TextField size="small" fullWidth value={it.description} onChange={(e)=>updateItem(idx, { description: e.target.value })} /></Box>
                      <Box flex={2} pr={1}><TextField size="small" type="number" value={it.qty} onChange={(e)=>updateItem(idx, { qty: parseInt(e.target.value || '0', 10) })} /></Box>
                      <Box flex={2} pr={1}><TextField size="small" type="number" value={it.rate} onChange={(e)=>updateItem(idx, { rate: parseFloat(e.target.value || '0') })} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} /></Box>
                      <Box flex={2} display="flex" alignItems="center" justifyContent="space-between">
                        <Typography variant="body2" sx={{ width: '100%', textAlign:'right' }}>₹ {it.amount.toLocaleString('en-IN')}</Typography>
                        <IconButton size="small" aria-label="remove" onClick={()=>removeItem(idx)} sx={{ ml: 1 }}>✕</IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">No items added. You can enter a single amount above or add items.</Typography>
              )}
            </CardContent>
          </Card>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="GST %" type="number" value={gstPercent} onChange={(e)=>setGstPercent(parseFloat(e.target.value || '0'))} sx={{ minWidth: 120 }} />
            <TextField label="Bill No" value={billNo} onChange={(e)=>setBillNo(e.target.value)} sx={{ minWidth: 160 }} />
            <TextField label="Payment Ref (UTR/Cheque)" value={paymentRef} onChange={(e)=>setPaymentRef(e.target.value)} sx={{ minWidth: 220 }} />
          </Stack>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2} sx={{ mb: 2 }}>
            <TextField label="Subtotal" value={subtotal} InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ minWidth: 180 }} />
            <TextField label="GST Amount" value={computedGstAmount} InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ minWidth: 180 }} />
            <TextField label="Net Amount" value={netAmount} InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ minWidth: 180 }} />
            <TextField label="Paid Amount" type="number" value={paidAmount} onChange={(e)=>setPaidAmount(parseInt(e.target.value || '0', 10))} InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ minWidth: 180 }} />
            <TextField label="Balance" value={balanceAmount} InputProps={{ readOnly: true, startAdornment: <InputAdornment position="start">₹</InputAdornment> }} sx={{ minWidth: 180 }} />
          </Stack>
          <Stack direction={{ xs:'column', sm:'row' }} spacing={2}>
            <Button variant="contained" onClick={()=>handleSave(false)} disabled={!partyName.trim() || ((items.length===0 && amount<=0) || (items.length>0 && subtotal<=0))}>Save</Button>
            <Button variant="outlined" onClick={()=>handleSave(true)} disabled={!partyName.trim() || ((items.length===0 && amount<=0) || (items.length>0 && subtotal<=0))}>Save & Download PDF</Button>
          </Stack>
        </CardContent>
      </Card>
      <div id="pdf-receipt-container" style={{ display: 'none', position: 'fixed', top: '-9999px', left: '-9999px' }}></div>
      <Snackbar open={snackbar.open} autoHideDuration={2500} onClose={()=>setSnackbar(s=>({...s, open:false}))}>
        <Alert severity={snackbar.severity} onClose={()=>setSnackbar(s=>({...s, open:false}))}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default QuickBilling;
