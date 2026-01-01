import React, { useState, useRef, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Button, Autocomplete, TextField, InputAdornment, MenuItem } from '@mui/material';
import { db, getAcademicYearFromDate, type Student } from '../database/db';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { useAppLogo } from '../hooks/useAppLogo';

const Bonafide: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [certificateDate, setCertificateDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [academicYear, setAcademicYear] = useState<string>('');
  const [messCharges, setMessCharges] = useState<number>(30000);
  const [hostelCharges, setHostelCharges] = useState<number>(19000);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [yearOfStudy, setYearOfStudy] = useState<string>('IInd');
  const [collegeName, setCollegeName] = useState<string>('Marathwada College of Education, Aurangabad');
  const [courseName, setCourseName] = useState<string>('B.Ed.');
  const [fontScale, setFontScale] = useState<number>(1.0);
  const [fontFamily, setFontFamily] = useState<string>('Times New Roman, serif');
  const appLogo = useAppLogo();

  const loadStudents = async () => {
    const all = await db.students.toArray();
    setStudents(all);
  };

  useEffect(() => { (async () => { await loadStudents(); })(); }, []);

  const handleSavePDF = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const data = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;
      pdf.addImage(data, 'JPEG', 0, 0, width, height);
      pdf.save(`Bonafide_${selectedStudent?.name.replace(/\s+/g, '_') || 'student'}.pdf`);
    } catch (err) {
      console.error('Export failed', err);
    }
  };

  const handlePrint = () => {
    if (!previewRef.current) return;
    window.print();
  };

  const prefillStudent = async (student: Student | null) => {
    if (!student) return;
    const mess = await db.settings.where('key').equals('mess_veg_fee').first();
    const messFee = mess ? parseInt(mess.value, 10) : 30000;
    setMessCharges(messFee || 30000);
    setHostelCharges(Number(student.annualFee ?? 19000));
    setAcademicYear(getAcademicYearFromDate(new Date(student.joiningDate || new Date())).label);
    setCertificateDate(new Date().toISOString().split('T')[0]);
    
    // Extract year of study from yearOfCollege field (I, II, III, IV, V, VI, XI, XII)
    const year = student.yearOfCollege || 'II';
    const yearMap: { [key: string]: string } = {
      'I': 'Ist', 'II': 'IInd', 'III': 'IIIrd', 'IV': 'IVth', 'V': 'Vth', 'VI': 'VIth', 'XI': 'XIth', 'XII': 'XIIth'
    };
    setYearOfStudy(yearMap[year] || 'IInd');
    
    const detectedCollege = student.collegeName || 'Marathwada College of Education, Aurangabad';
    setCollegeName(detectedCollege);
    // Detect course/degree from college name (overrideable by user)
    const upper = detectedCollege.toUpperCase();
    let detectedCourse = 'B.Ed.';
    if (upper.includes('PHARMACY')) detectedCourse = 'B.Pharm.';
    else if (upper.includes('ENGINEERING')) detectedCourse = 'B.E.';
    else if (upper.includes('SCIENCE')) detectedCourse = 'B.Sc.';
    else if (upper.includes('COMMERCE')) detectedCourse = 'B.Com.';
    else if (upper.includes('ART') || upper.includes('ARTS')) detectedCourse = 'B.A.';
    else if (upper.includes('EDUCATION') || upper.includes('B.ED')) detectedCourse = 'B.Ed.';
    setCourseName(detectedCourse);
  };

  useEffect(() => {
    if (!selectedStudent) return;
    (async () => {
      await prefillStudent(selectedStudent);
    })();
  }, [selectedStudent]);

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Bonafide Certificate</Typography>
      <Card>
        <CardContent>
          <Autocomplete
            options={students}
            getOptionLabel={(s) => s.name}
            value={selectedStudent}
            onChange={(_e, v) => setSelectedStudent(v)}
            renderInput={(params) => <TextField {...params} label="Select Student" />}
            sx={{ mb: 2 }}
          />

          <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
            <Box>
              <Button variant="contained" onClick={handleSavePDF} disabled={!selectedStudent}>Download PDF</Button>
            </Box>
            <Box>
              <Button variant="outlined" onClick={handlePrint} disabled={!selectedStudent}>Print</Button>
            </Box>
            <Box>
              <Button variant="text" onClick={() => setIsEditing(prev => !prev)} disabled={!selectedStudent}>{isEditing ? 'Done' : 'Edit'}</Button>
            </Box>
          </Box>

          {selectedStudent && (
            <Box ref={previewRef} sx={{ 
              p: 4, 
              mt: 2, 
              bgcolor: 'white',
              minHeight: '297mm',
              fontFamily: fontFamily,
              color: '#000',
              '@media print': {
                p: '20mm',
              }
            }}>
              {/** font size helper */}
              {(() => null)()}
              
              {/* helper for font sizes */}
              {/* Using inline scale via local function */}
              {/**/}
              
              {/* Header with Logo and Title */}
              <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 3, borderBottom: '2px solid #000', pb: 2 }}>
                <Box sx={{ flexShrink: 0, mr: 2 }}>
                  <img 
                    src={appLogo} 
                    alt="Maulana Azad Logo" 
                    style={{ width: '90px', height: '90px', objectFit: 'contain' }}
                  />
                </Box>
                <Box sx={{ flex: 1, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: `${14 * fontScale}px`, fontWeight: 500, mb: 0.5, fontFamily: fontFamily }}>
                    MAULANA AZAD EDUCATIONAL TRUST'S
                  </Typography>
                  <Typography sx={{ fontSize: `${22 * fontScale}px`, fontWeight: 'bold', letterSpacing: '0.5px', fontFamily: fontFamily }}>
                    MAULANA AZAD COMPLEX OF HOSTEL
                  </Typography>
                  <Typography sx={{ fontSize: `${12 * fontScale}px`, mt: 0.5, fontFamily: fontFamily }}>
                    Dr.Rafiq Zakaria Campus, Rauza Bagh, Chh.Sambhajinagar (Aurangabad)-431001(M.S.)
                  </Typography>
                  <Typography sx={{ fontSize: `${12 * fontScale}px`, fontFamily: fontFamily }}>
                    Email: mail2azadhostel@gmail.com
                  </Typography>
                </Box>
              </Box>

              {/* Date */}
              <Box sx={{ textAlign: 'right', mb: 4 }}>
                <Typography sx={{ fontSize: `${14 * fontScale}px`, fontFamily: fontFamily }}>
                  Date: {new Date(certificateDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}
                </Typography>
              </Box>

              {/* Title */}
              <Box sx={{ textAlign: 'center', mb: 4, mt: 6 }}>
                <Typography sx={{ 
                  fontSize: `${20 * fontScale}px`, 
                  fontWeight: 'bold', 
                  textDecoration: 'underline',
                  letterSpacing: '2px',
                  fontFamily: fontFamily
                }}>
                  BONAFIDE/EXPENDITURE CERTIFICATE
                </Typography>
              </Box>

              {/* Editable Fields Panel */}
              {isEditing && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 1, border: '1px dashed #999' }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Edit Certificate Details:</Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2,1fr)' }, gap: 2 }}>
                    <TextField 
                      label="Certificate Date" 
                      type="date" 
                      fullWidth 
                      value={certificateDate} 
                      onChange={(e) => setCertificateDate(e.target.value)}
                      size="small"
                    />
                    <TextField 
                      label="Academic Year" 
                      fullWidth 
                      value={academicYear} 
                      onChange={(e) => setAcademicYear(e.target.value)}
                      size="small"
                      placeholder="2025-2026"
                    />
                    <TextField 
                      label="Year of Study" 
                      fullWidth 
                      value={yearOfStudy} 
                      onChange={(e) => setYearOfStudy(e.target.value)}
                      size="small"
                      placeholder="IInd"
                    />
                    <TextField 
                      label="Course / Degree" 
                      fullWidth 
                      value={courseName} 
                      onChange={(e) => setCourseName(e.target.value)}
                      size="small"
                      placeholder="B.Pharm."
                    />
                    <TextField 
                      label="College Name" 
                      fullWidth 
                      value={collegeName} 
                      onChange={(e) => setCollegeName(e.target.value)}
                      size="small"
                    />
                    <TextField 
                      label="Mess Charges" 
                      type="number" 
                      fullWidth 
                      value={messCharges} 
                      onChange={(e) => setMessCharges(Number(e.target.value || 0))} 
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      size="small"
                    />
                    <TextField 
                      label="Hostel Charges" 
                      type="number" 
                      fullWidth 
                      value={hostelCharges} 
                      onChange={(e) => setHostelCharges(Number(e.target.value || 0))} 
                      InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                      size="small"
                    />
                    <TextField 
                      label="Font Scale" 
                      type="number" 
                      fullWidth 
                      inputProps={{ step: 0.05, min: 0.8, max: 1.8 }}
                      value={fontScale} 
                      onChange={(e) => setFontScale(parseFloat(e.target.value || '1'))} 
                      size="small"
                    />
                    <TextField 
                      select
                      label="Font Family" 
                      fullWidth 
                      value={fontFamily} 
                      onChange={(e) => setFontFamily(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="Times New Roman, serif">Times New Roman</MenuItem>
                      <MenuItem value="Georgia, serif">Georgia</MenuItem>
                      <MenuItem value="Garamond, serif">Garamond</MenuItem>
                      <MenuItem value="serif">Serif (Default)</MenuItem>
                      <MenuItem value="Arial, sans-serif">Arial</MenuItem>
                    </TextField>
                  </Box>
                </Box>
              )}

              {/* Certificate Body */}
              <Box sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2.2, textAlign: 'justify', fontFamily: fontFamily, mt: 4 }}>
                <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2.2, textIndent: '50px', fontFamily: fontFamily }}>
                  This is to certify that <strong>Mr. {selectedStudent?.name}</strong> is a bonafide student of {collegeName} and studying in {courseName} {yearOfStudy} Year in the academic year {academicYear}. At present he is residing in the Maulana Azad Complex of Hostels.
                </Typography>
                
                <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2.2, textIndent: '50px', fontFamily: fontFamily, mt: 1 }}>
                  Further his residing at this hostel is valid for the academic year {academicYear} only.
                </Typography>

                <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2.2, fontWeight: 'bold', fontFamily: fontFamily, mt: 2 }}>
                  The academic year expenses are as follows:-
                </Typography>

                <Box sx={{ ml: 2, mt: 1 }}>
                  <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2, fontFamily: fontFamily }}>
                    <strong>Mess Charges :-</strong> <span style={{ marginLeft: '10px' }}>{messCharges}/-</span>
                  </Typography>
                  <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2, fontFamily: fontFamily, textDecoration: 'underline' }}>
                    <strong>Hostel Charges: - {hostelCharges}/-</strong>
                  </Typography>
                  <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2, fontFamily: fontFamily, fontWeight: 'bold' }}>
                    <strong>Total</strong> <span style={{ marginLeft: '85px' }}>: - {messCharges + hostelCharges}/-</span>
                  </Typography>
                </Box>

                <Typography sx={{ fontSize: `${16 * fontScale}px`, lineHeight: 2.2, fontFamily: fontFamily, mt: 3 }}>
                  This letter is issued at the student's request.
                </Typography>
              </Box>

              {/* Signature Section */}
              <Box sx={{ mt: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <img 
                    src={appLogo} 
                    alt="Seal" 
                    style={{ width: '110px', height: '110px', opacity: 0.3 }}
                  />
                </Box>
                
                <Box sx={{ textAlign: 'center', minWidth: '220px' }}>
                  <Box sx={{ 
                    borderBottom: '1px solid #000', 
                    mb: 0.5, 
                    height: '70px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center'
                  }}>
                    {/* Signature line */}
                  </Box>
                  <Typography sx={{ fontSize: `${14 * fontScale}px`, fontFamily: fontFamily }}>
                    Dr. Shaikh Shakeel Majeed
                  </Typography>
                  <Typography sx={{ fontSize: `${14 * fontScale}px`, fontWeight: 'bold', fontFamily: fontFamily }}>
                    Chief Warden
                  </Typography>
                  <Typography sx={{ fontSize: `${13 * fontScale}px`, fontStyle: 'italic', color: '#1976d2', fontFamily: 'cursive' }}>
                    Warden
                  </Typography>
                  <Typography sx={{ fontSize: `${13 * fontScale}px`, fontStyle: 'italic', fontWeight: 'bold', fontFamily: 'cursive' }}>
                    Maulana Azad Hostel
                  </Typography>
                  <Typography sx={{ fontSize: `${13 * fontScale}px`, fontStyle: 'italic', fontFamily: 'cursive' }}>
                    Aurangabad
                  </Typography>
                </Box>
              </Box>

            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Bonafide;
