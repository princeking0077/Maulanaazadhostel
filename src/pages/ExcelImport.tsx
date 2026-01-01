import React, { useState } from 'react';
import { Box, Typography, Paper, Button, LinearProgress, Alert, List, ListItem, ListItemText, Divider, FormControlLabel, Switch } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import ContentPasteIcon from '@mui/icons-material/ContentPaste';
import { importStudentsFromExcel, downloadTemplate } from '../services/excelImport';
import BulkPasteImport from '../components/BulkPasteImport';

const ExcelImport: React.FC = () => {
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState<{ phase: string; current: number; total: number }>({ phase: '', current: 0, total: 0 });
  const [summary, setSummary] = useState<null | { success: boolean; message: string; importedStudents?: number; importedReceipts?: number; totalRows?: number; errors?: string[] }>(null);
  const [withReceipts, setWithReceipts] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setSummary(null);
    setProgress({ phase: 'reading', current: 0, total: 0 });
    try {
      const result = await importStudentsFromExcel(file, {
        onProgress: (phase, current, total) => setProgress({ phase, current, total }),
        createReceipts: withReceipts,
        skipDuplicates: !updateExisting,
        updateExisting: updateExisting
      });
      setSummary(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Import failed';
      setSummary({ success: false, message, errors: [message] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>Excel Import</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Import students and fee receipts from Excel. Supports multiple sheets in one file. Each row creates a student and optional payment record.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Instructions</Typography>
        <Typography variant="body2" component="div" mb={2}>
          <strong>Excel Format Requirements:</strong>
          <ul>
            <li>First row must contain headers (Sr.No, Name of Student, Wing & Room, etc.)</li>
            <li>Student name format: "Name, Address, Mobile" (comma-separated)</li>
            <li>Wing & Room format: "A-01" or "B-15" (Wing letter, dash, room number)</li>
            <li>Date format: DD.MM.YYYY or DD/MM/YYYY</li>
            <li>Multiple sheets are supported - all will be imported</li>
            <li>Empty rows are automatically skipped</li>
          </ul>
          <strong>Column Order:</strong><br />
          1. Sr.No | 2. Name of Student | 3. Wing & Room | 4. Class | 5. Date of Joining | 6. Receipt No. |
          7. Receipt Date | 8. Regi. Fee | 9. Room Rent | 10. Water & Electricity | 11. Other Activity |
          12. Total Fees Collection | 13. Approved Hostel Fees | 14. Outstanding Fee | 15. Remark | 16. Security Deposit
        </Typography>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Button variant="contained" startIcon={<CloudUploadIcon />} component="label" disabled={importing}>
          Select Excel File
          <input type="file" hidden accept=".xlsx,.xls" onChange={handleFileChange} />
        </Button>
        <Button sx={{ ml: 2 }} variant="outlined" startIcon={<DownloadIcon />} onClick={() => downloadTemplate()} disabled={importing}>
          Download Template
        </Button>
        <Button sx={{ ml: 2 }} variant="outlined" startIcon={<ContentPasteIcon />} onClick={() => setPasteDialogOpen(true)} disabled={importing}>
          Paste from Excel
        </Button>
        <FormControlLabel sx={{ ml: 3 }} control={<Switch checked={withReceipts} onChange={(e) => setWithReceipts(e.target.checked)} />} label="Import Payment Records" />
        <FormControlLabel sx={{ ml: 3 }} control={<Switch checked={updateExisting} onChange={(e) => setUpdateExisting(e.target.checked)} />} label="Update Existing Student Details" />

        {importing && (
          <Box mt={3}>
            <Typography variant="body2" gutterBottom>
              Phase: {progress.phase || 'starting'} {progress.total ? `(${progress.current}/${progress.total})` : ''}
            </Typography>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <BulkPasteImport
          inline
          title="Paste from Excel (Inline)"
          onSuccess={(count) => {
            setSummary({
              success: true,
              message: `Successfully imported ${count} students via paste`,
              importedStudents: count,
              importedReceipts: 0,
            });
          }}
        />
      </Paper>

      {summary && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Result</Typography>
          <Alert severity={summary.success ? 'success' : 'warning'} sx={{ mb: 2 }}>{summary.message}</Alert>
          <Typography variant="body2" gutterBottom>
            Students Imported: {summary.importedStudents} | Receipts Imported: {summary.importedReceipts} | Rows Processed: {summary.totalRows}
          </Typography>
          {summary.errors && summary.errors.length > 0 && (
            <Box mt={2}>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="subtitle2" gutterBottom>Errors ({summary.errors.length})</Typography>
              <List dense>
                {summary.errors.slice(0, 50).map((err: string, idx: number) => (
                  <ListItem key={idx}>
                    <ListItemText primary={err} />
                  </ListItem>
                ))}
              </List>
              {summary.errors.length > 50 && (
                <Typography variant="caption" color="text.secondary">
                  Showing first 50 errors of {summary.errors.length}
                </Typography>
              )}
            </Box>
          )}
        </Paper>
      )}

      <BulkPasteImport
        open={pasteDialogOpen}
        onClose={() => setPasteDialogOpen(false)}
        onSuccess={(count) => {
          setSummary({
            success: true,
            message: `Successfully imported ${count} students via paste`,
            importedStudents: count,
            importedReceipts: 0,
          });
          setPasteDialogOpen(false);
        }}
      />
    </Box>
  );
};

export default ExcelImport;
