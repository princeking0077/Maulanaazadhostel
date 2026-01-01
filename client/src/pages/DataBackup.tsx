import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Divider, RadioGroup, FormControlLabel, Radio, LinearProgress, Tooltip } from '@mui/material';
import { getCounts } from '../utils/backup';
import { db } from '../database/db';
import 'dexie-export-import';
import { saveAs } from 'file-saver';

const DataBackup: React.FC = () => {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'merge' | 'replace'>('merge');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<{ totalRows: number; completedRows: number } | null>(null);
  const [importProgress, setImportProgress] = useState<{ totalRows: number; completedRows: number } | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const refreshCounts = async () => {
    setLoading(true);
    const c = await getCounts();
    setCounts(c);
    setLoading(false);
  };

  useEffect(() => { refreshCounts(); }, []);

  const handleExport = async () => {
    setError('');
    setSuccess('');
    setExporting(true); // Set exporting state to true
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = await (db as any).export({
        prettyJson: true,
        progressCallback: (progress: { totalRows: number; completedRows: number }) => {
          setExportProgress(progress);
          return true;
        },
      });
      saveAs(blob, `hostel_backup_${new Date().toISOString().split('T')[0]}.json`);
      setSuccess('Backup created successfully');
    } catch (err) {
      console.error('Export failed', err);
      setError('Failed to create backup');
    } finally {
      setExporting(false);
      setExportProgress(null);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      setError('');
      setSuccess('');


      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any).import(file, {
        overwrite: mode === 'replace', // Use 'overwrite' option based on mode
        progressCallback: (progress: { totalRows: number; completedRows: number }) => {
          setImportProgress(progress);
          return true;
        },
        acceptMissingTables: true,
      });

      setSuccess('Data restored successfully');
      refreshCounts(); // Changed from loadCounts() to refreshCounts()
    } catch (err) {
      console.error('Import failed', err);
      setError('Failed to restore data');
    } finally {
      setImporting(false);
      setImportProgress(null);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <Box>
      <Typography variant="h4" fontWeight={600} gutterBottom>Data Backup & Restore</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>Offline export/import of all hostel data (JSON). Keep regular backups.</Typography>
      <Divider sx={{ mb: 3 }} />
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600}>Export Current Data</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>Downloads a JSON file with all tables.</Typography>
          <Button variant="contained" onClick={handleExport} disabled={exporting || !db}>
            {exporting ? 'Exporting...' : 'Export Backup'}
          </Button>
          {exporting && exportProgress && (
            <LinearProgress
              variant="determinate"
              value={(exportProgress.completedRows / exportProgress.totalRows) * 100}
              sx={{ mt: 2 }}
            />
          )}
          {exporting && exportProgress && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {`Exporting ${exportProgress.completedRows} of ${exportProgress.totalRows} rows`}
            </Typography>
          )}
          {success && <Typography color="success.main" sx={{ mt: 1 }}>{success}</Typography>}
          {error && <Typography color="error.main" sx={{ mt: 1 }}>{error}</Typography>}
        </CardContent>
      </Card>
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>Restore From Backup</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>Select a previously exported JSON file. Merge keeps existing records; Replace clears then imports.</Typography>
            <RadioGroup row value={mode} onChange={e => setMode(e.target.value as 'merge' | 'replace')}>
              <FormControlLabel value="merge" control={<Radio />} label="Merge" />
              <FormControlLabel value="replace" control={<Radio />} label="Replace" />
            </RadioGroup>
            <Tooltip title={mode === 'replace' ? 'All existing data will be cleared before import.' : 'New/updated records will be added.'}>
              <Button component="label" variant="outlined" color={mode === 'replace' ? 'error' : 'primary'} sx={{ mt: 1 }} disabled={importing || !db}>
                {importing ? 'Importing...' : 'Import Backup'}
                <input type="file" accept="application/json" hidden onChange={handleImport} />
              </Button>
            </Tooltip>
            {importing && importProgress && (
              <LinearProgress
                variant="determinate"
                value={(importProgress.completedRows / importProgress.totalRows) * 100}
                sx={{ mt: 2 }}
              />
            )}
            {importing && importProgress && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {`Importing ${importProgress.completedRows} of ${importProgress.totalRows} rows`}
              </Typography>
            )}
          </CardContent>
        </Card>
      </Box>
      <Box sx={{ mt: 3 }}>
        <Card>
          <CardContent>
            <Typography variant="h6" fontWeight={600}>Record Counts</Typography>
            {loading && <LinearProgress sx={{ mb: 2 }} />}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)', md: 'repeat(3,1fr)' }, gap: 2 }}>
              {Object.entries(counts).map(([k, v]) => (
                <Box key={k} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Typography variant="subtitle2" fontWeight={600}>{k}</Typography>
                  <Typography variant="body2" color="text.secondary">{v} records</Typography>
                </Box>
              ))}
            </Box>
            <Button sx={{ mt: 2 }} variant="text" onClick={refreshCounts}>Refresh Counts</Button>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default DataBackup;