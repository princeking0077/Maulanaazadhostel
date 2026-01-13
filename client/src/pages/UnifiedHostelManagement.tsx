import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Users, CreditCard, Plus, Search, Edit, Trash2, CheckCircle, X } from 'lucide-react';
import { calculateStayEndDate } from '../database/db';
import { studentsStorage, paymentsStorage } from '../services/storage';
import ReceiptPrintDialog from '../components/ReceiptPrintDialog';
import type { Student, Payment } from '../database/db';
import { FACULTY_OPTIONS, COLLEGE_OPTIONS } from '../constants/dropdowns';

export default function Admission() {
    const [activeTab, setActiveTab] = useState('students');
    const [students, setStudents] = useState<Student[]>([]);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [showStudentForm, setShowStudentForm] = useState(false);
    const [showPaymentForm, setShowPaymentForm] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [facultyFilter, setFacultyFilter] = useState('');
    const [receiptCounter, setReceiptCounter] = useState('01');

    // Form states
    const [studentForm, setStudentForm] = useState({
        name: '',
        mobile: '',
        email: '',
        enrollmentNo: '',
        address: '',
        faculty: '',
        collegeName: '',
        yearOfCollege: '',
        wing: '',
        roomNo: '',
        residency: 'Permanent',
        studentType: 'Hosteller', // Default to Hosteller
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        annualFees: '',
        // Temporary student specific
        tempDurationValue: '',
        tempDurationUnit: 'months'
    });

    const [paymentForm, setPaymentForm] = useState({
        studentId: '',
        paymentType: 'Full Payment', // 'Full Payment' or 'Installment'
        securityDeposit: 0,
        registrationFees: 0,
        roomRent: 0,
        waterElectricity: 0,
        gym: 0,
        others: 0,
        paymentMode: 'Cash',
        utr: '',
        paymentDate: new Date().toISOString().split('T')[0],
        balanceAmount: 0 // Track balance
    });

    const [receiptDialogOpen, setReceiptDialogOpen] = useState(false);
    const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<Payment | null>(null);
    const [selectedStudentForReceipt, setSelectedStudentForReceipt] = useState<Student | null>(null);

    const loadData = useCallback(async () => {
        try {
            const studentsData = await studentsStorage.getAll();
            const paymentsData = await paymentsStorage.getAll();

            // Calculate next receipt counter
            let nextNum = 1;
            if (paymentsData.length > 0) {
                // Find max receipt number manually since we can't use db.orderBy in storage service
                const maxReceipt = paymentsData.reduce((max, p) => {
                    if (p.receiptNo) {
                        const match = p.receiptNo.match(/(\d+)$/);
                        if (match) {
                            const num = parseInt(match[1]);
                            return num > max ? num : max;
                        }
                    }
                    return max;
                }, 0);
                nextNum = maxReceipt + 1;
            }
            setReceiptCounter(nextNum.toString().padStart(2, '0'));

            setStudents(studentsData);
            setPayments(paymentsData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Auto-calculate end date for temporary students
    useEffect(() => {
        if (studentForm.residency === 'Temporary' && studentForm.startDate) {
            if (studentForm.tempDurationValue) {
                const durationString = `${studentForm.tempDurationValue} ${studentForm.tempDurationUnit}`;
                const end = calculateStayEndDate(new Date(studentForm.startDate), durationString);
                setStudentForm(prev => ({
                    ...prev,
                    endDate: end.toISOString().split('T')[0]
                }));
            }
        } else if (studentForm.residency === 'Permanent' && studentForm.startDate) {
            // Default 10 months for permanent
            const end = calculateStayEndDate(new Date(studentForm.startDate), '10 months');
            setStudentForm(prev => ({
                ...prev,
                endDate: end.toISOString().split('T')[0]
            }));
        }
    }, [studentForm.residency, studentForm.startDate, studentForm.tempDurationValue, studentForm.tempDurationUnit]);


    const handleStudentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const isHosteller = studentForm.studentType === 'Hosteller';
            // eslint-disable-next-line react-hooks/purity
            const generatedEnrollmentNo = studentForm.enrollmentNo || `ENR-${Date.now()}`;

            const studentData: Student = {
                name: studentForm.name,
                mobile: studentForm.mobile,
                email: studentForm.email || '',
                enrollmentNo: generatedEnrollmentNo,
                faculty: studentForm.faculty,
                collegeName: studentForm.collegeName,
                yearOfCollege: studentForm.yearOfCollege || '1st Year',
                address: studentForm.address,
                residencyStatus: studentForm.residency,
                // Clear wing/room if not a hosteller
                wing: isHosteller ? (studentForm.wing || 'A') : 'A',
                roomNo: isHosteller ? (studentForm.roomNo || '') : '',
                studentType: studentForm.studentType,
                joiningDate: new Date(studentForm.startDate),
                annualFee: Number(studentForm.annualFees) || 0,
                // Temporary student fields
                stayDuration: studentForm.residency === 'Temporary'
                    ? `${studentForm.tempDurationValue} ${studentForm.tempDurationUnit}`
                    : undefined,
                stayEndDate: studentForm.endDate ? new Date(studentForm.endDate) : undefined,
                createdAt: editingStudent?.createdAt || new Date(),
                updatedAt: new Date()
            };

            if (editingStudent && editingStudent.id) {
                await studentsStorage.update(editingStudent.id, studentData);
            } else {
                await studentsStorage.add(studentData);
            }

            await loadData();
            resetStudentForm();
        } catch (error) {
            console.error('Error saving student:', error);
            alert('Failed to save student');
        }
    };

    const resetStudentForm = () => {
        setStudentForm({
            name: '',
            mobile: '',
            email: '',
            enrollmentNo: '',
            address: '',
            faculty: '',
            collegeName: 'Maulana Azad College',
            yearOfCollege: '',
            wing: '',
            roomNo: '',
            residency: 'Permanent',
            studentType: 'Hosteller',
            startDate: new Date().toISOString().split('T')[0],
            endDate: '',
            annualFees: '',
            tempDurationValue: '',
            tempDurationUnit: 'months'
        });
        setEditingStudent(null);
        setShowStudentForm(false);
    };

    const handlePaymentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const selectedStudent = students.find(s => s.id === Number(paymentForm.studentId));
            if (!selectedStudent) return;

            const totalAmount = parseFloat(paymentForm.securityDeposit || 0) +
                parseFloat(paymentForm.registrationFees || 0) +
                parseFloat(paymentForm.roomRent || 0) +
                parseFloat(paymentForm.waterElectricity || 0) +
                parseFloat(paymentForm.gym || 0) +
                parseFloat(paymentForm.others || 0);

            const newPayment: Payment = {
                studentId: selectedStudent.id!,
                receiptNo: receiptCounter,
                date: new Date(paymentForm.paymentDate),
                registrationFee: Number(paymentForm.registrationFees) || 0,
                rentFee: Number(paymentForm.roomRent) || 0,
                waterFee: Number(paymentForm.waterElectricity) || 0,
                gymFee: Number(paymentForm.gym) || 0,
                otherFee: Number(paymentForm.others) || 0,
                securityDeposit: Number(paymentForm.securityDeposit) || 0,
                totalAmount: totalAmount,
                balanceAmount: 0,
                paymentStatus: paymentForm.paymentType === 'Installment' ? 'Partial' : 'Paid',
                paymentMethod: paymentForm.paymentMode === 'online' ? 'Online' :
                    paymentForm.paymentMode === 'cheque' ? 'Cheque' : 'Cash',
                utrNo: paymentForm.utr,
                cashier: 'Admin',
                paymentType: paymentForm.paymentType,
                createdAt: new Date()
            };

            await paymentsStorage.add(newPayment);
            await loadData();
            resetPaymentForm();
        } catch (error) {
            console.error('Error saving payment:', error);
            alert('Failed to save payment');
        }
    };

    const resetPaymentForm = () => {
        setPaymentForm({
            studentId: '',
            paymentType: 'Full Payment',
            securityDeposit: 0,
            registrationFees: 0,
            roomRent: 0,
            waterElectricity: 0,
            gym: 0,
            others: 0,
            paymentMode: 'Cash',
            utr: '',
            paymentDate: new Date().toISOString().split('T')[0]
        });
        setShowPaymentForm(false);
        setShowPaymentForm(false);
    };

    const handleStudentSelect = (studentId: string) => {
        const student = students.find(s => s.id === Number(studentId));
        if (!student) {
            setPaymentForm({
                ...paymentForm,
                studentId: '',
                registrationFees: 0,
                roomRent: 0,
                waterElectricity: 0,
                gym: 0,
                others: 0,
                securityDeposit: 0,
                balanceAmount: 0
            });
            return;
        }

        // Calculate previous pending balance
        const studentPayments = payments.filter(p => p.studentId === student.id);
        const previousPending = studentPayments.reduce((sum, p) => sum + (p.balanceAmount || 0), 0);

        // Set limits/defaults based on logic
        const defaultRegistrationFee = 3000;
        let defaultRentFee = 11000;
        const defaultWaterAndElectricity = 4000;

        if (student.wing === 'A') {
            defaultRentFee = 14000;
        }

        setPaymentForm({
            ...paymentForm,
            studentId: studentId,
            registrationFees: defaultRegistrationFee,
            roomRent: defaultRentFee,
            waterElectricity: defaultWaterAndElectricity,
            gym: 0,
            others: 0,
            securityDeposit: 0,
            paymentType: previousPending > 0 ? 'Installment' : 'Full Payment',
            balanceAmount: previousPending
        });
    };

    const handlePrintReceipt = (payment: Payment) => {
        const student = students.find(s => s.id === payment.studentId);
        if (student) {
            setSelectedPaymentForReceipt(payment);
            setSelectedStudentForReceipt(student);
            setReceiptDialogOpen(true);
        } else {
            alert('Student details not found for this payment');
        }
    };

    const deleteStudent = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this student?')) {
            try {
                await studentsStorage.delete(id);
                await loadData();
            } catch (error) {
                console.error('Error deleting student:', error);
            }
        }
    };

    const editStudent = (student: Student) => {
        // Parse duration if temporary
        let tempValue = '';
        let tempUnit = 'months';
        if (student.stayDuration) {
            const parts = student.stayDuration.split(' ');
            if (parts.length >= 2) {
                tempValue = parts[0];
                tempUnit = parts[1];
            }
        }

        setStudentForm({
            name: student.name,
            mobile: student.mobile,
            email: student.email,
            address: student.address,
            faculty: student.faculty,
            collegeName: student.collegeName,
            yearOfCollege: student.yearOfCollege,
            wing: student.wing,
            roomNo: student.roomNo,
            residency: student.residencyStatus,
            studentType: student.studentType,
            startDate: student.joiningDate ? new Date(student.joiningDate).toISOString().split('T')[0] : '',
            endDate: student.stayEndDate ? new Date(student.stayEndDate).toISOString().split('T')[0] : '',
            annualFees: student.annualFee,
            tempDurationValue: tempValue,
            tempDurationUnit: tempUnit
        });
        setEditingStudent(student);
        setShowStudentForm(true);
    };

    const filteredStudents = students.filter(student =>
        (facultyFilter === '' || student.faculty === facultyFilter) &&
        (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.mobile.includes(searchTerm) ||
            (student.roomNo && student.roomNo.toLowerCase().includes(searchTerm.toLowerCase())))
    );

    return (
        <div className="min-h-screen bg-transparent p-2 md:p-6 animate-fade-in">
            <div className="max-w-7xl mx-auto">
                <div className="glass rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                    {/* Premium Header */}
                    <div className="bg-gradient-to-r from-primary to-primary-light p-8 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                        <Building2 size={32} className="text-yellow-400" />
                                    </div>
                                    <h1 className="text-3xl font-bold tracking-tight">Admission & Fees</h1>
                                </div>
                                <p className="text-blue-100 text-lg opacity-90">Manage student admissions and fee collection seamlessly</p>
                            </div>

                            {/* Stats/Quick Actions Placeholder can go here */}
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div className="border-b border-gray-200/50 bg-white/50 backdrop-blur-sm">
                        <div className="flex px-6">
                            <button
                                onClick={() => setActiveTab('students')}
                                className={`flex items-center gap-2 px-8 py-5 font-semibold text-sm tracking-wide transition-all relative ${activeTab === 'students'
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <Users size={18} />
                                ADMISSION
                                {activeTab === 'students' && (
                                    <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(26,35,126,0.3)]" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`flex items-center gap-2 px-8 py-5 font-semibold text-sm tracking-wide transition-all relative ${activeTab === 'payments'
                                    ? 'text-primary'
                                    : 'text-slate-500 hover:text-slate-800'
                                    }`}
                            >
                                <CreditCard size={18} />
                                FEE COLLECTION
                                {activeTab === 'payments' && (
                                    <span className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full shadow-[0_-2px_6px_rgba(26,35,126,0.3)]" />
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <div className="bg-white/40 backdrop-blur-sm min-h-[600px]">
                        {activeTab === 'students' && (
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                                    <div className="relative w-full md:w-96 group">
                                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primary" size={20} />
                                        <input
                                            type="text"
                                            placeholder="Search by name, mobile, or room..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm hover:shadow-md"
                                        />
                                    </div>
                                    <div className="w-full md:w-64">
                                        <select
                                            value={facultyFilter}
                                            onChange={(e) => setFacultyFilter(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all shadow-sm hover:shadow-md appearance-none"
                                        >
                                            <option value="">All Faculties</option>
                                            {FACULTY_OPTIONS.map(opt => (
                                                <option key={opt} value={opt}>{opt}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <button
                                        onClick={() => setShowStudentForm(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        New Admission
                                    </button>
                                </div>

                                {showStudentForm && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                                    {editingStudent ? <Edit size={24} className="text-primary" /> : <Plus size={24} className="text-primary" />}
                                                    {editingStudent ? 'Edit Admission' : 'New Admission'}
                                                </h3>
                                                <button onClick={resetStudentForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                                    <X size={24} className="text-slate-500" />
                                                </button>
                                            </div>

                                            <form onSubmit={handleStudentSubmit} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                {/* Personal Details */}
                                                <div className="md:col-span-2">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <Users size={16} /> Personal Details
                                                    </h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Full Name *</label>
                                                    <input
                                                        type="text"
                                                        required
                                                        value={studentForm.name}
                                                        onChange={(e) => setStudentForm({ ...studentForm, name: e.target.value })}
                                                        className="input-primary"
                                                        placeholder="Enter student name"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Mobile Number *</label>
                                                    <input
                                                        type="tel"
                                                        required
                                                        value={studentForm.mobile}
                                                        onChange={(e) => setStudentForm({ ...studentForm, mobile: e.target.value })}
                                                        className="input-primary"
                                                        placeholder="10-digit mobile number"
                                                    />
                                                </div>
                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Permanent Address *</label>
                                                    <textarea
                                                        required
                                                        value={studentForm.address}
                                                        onChange={(e) => setStudentForm({ ...studentForm, address: e.target.value })}
                                                        className="input-primary resize-none"
                                                        rows={2}
                                                        placeholder="Full residential address"
                                                    />
                                                </div>

                                                {/* Academic Details */}
                                                <div className="md:col-span-2 mt-4">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <Building2 size={16} /> Academic Details
                                                    </h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">College Name</label>
                                                    <select
                                                        value={studentForm.collegeName}
                                                        onChange={(e) => setStudentForm({ ...studentForm, collegeName: e.target.value })}
                                                        className="input-primary"
                                                    >
                                                        <option value="">Select College</option>
                                                        {/* Support imported values */}
                                                        {studentForm.collegeName && !COLLEGE_OPTIONS.includes(studentForm.collegeName) && (
                                                            <option key={studentForm.collegeName} value={studentForm.collegeName}>
                                                                {studentForm.collegeName} (Imported)
                                                            </option>
                                                        )}
                                                        {COLLEGE_OPTIONS.map((college) => (
                                                            <option key={college} value={college}>
                                                                {college}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Faculty/Course *</label>
                                                    <select
                                                        required
                                                        value={studentForm.faculty}
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            // Auto-extract year if possible
                                                            let year = '';
                                                            if (val.includes('I Year')) year = '1st Year';
                                                            else if (val.includes('II Year')) year = '2nd Year';
                                                            else if (val.includes('III Year')) year = '3rd Year';
                                                            else if (val.includes('IV Year')) year = '4th Year';

                                                            setStudentForm({
                                                                ...studentForm,
                                                                faculty: val,
                                                                yearOfCollege: year || studentForm.yearOfCollege
                                                            });
                                                        }}
                                                        className="input-primary"
                                                    >
                                                        <option value="">Select Course & Year</option>
                                                        {/* Show the current value if it's not in the standard options (Imported data support) */}
                                                        {studentForm.faculty && !FACULTY_OPTIONS.includes(studentForm.faculty) && (
                                                            <option key={studentForm.faculty} value={studentForm.faculty}>
                                                                {studentForm.faculty} (Imported)
                                                            </option>
                                                        )}
                                                        {FACULTY_OPTIONS.map((opt) => (
                                                            <option key={opt} value={opt}>
                                                                {opt}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Enrollment No</label>
                                                    <input
                                                        type="text"
                                                        value={studentForm.enrollmentNo}
                                                        onChange={(e) => setStudentForm({ ...studentForm, enrollmentNo: e.target.value })}
                                                        className="input-primary"
                                                        placeholder="College ID / Enrollment No"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Year of College</label>
                                                    <select
                                                        value={studentForm.yearOfCollege}
                                                        onChange={(e) => setStudentForm({ ...studentForm, yearOfCollege: e.target.value })}
                                                        className="input-primary"
                                                    >
                                                        <option value="">Select Year</option>
                                                        {/* Support imported values */}
                                                        {studentForm.yearOfCollege && ![
                                                            '1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Postgraduate', 'PhD'
                                                        ].includes(studentForm.yearOfCollege) && (
                                                                <option key={studentForm.yearOfCollege} value={studentForm.yearOfCollege}>
                                                                    {studentForm.yearOfCollege} (Imported)
                                                                </option>
                                                            )}
                                                        <option value="1st Year">1st Year</option>
                                                        <option value="2nd Year">2nd Year</option>
                                                        <option value="3rd Year">3rd Year</option>
                                                        <option value="4th Year">4th Year</option>
                                                        <option value="5th Year">5th Year</option>
                                                        <option value="Postgraduate">Postgraduate</option>
                                                        <option value="PhD">PhD</option>
                                                    </select>
                                                </div>

                                                {/* Admission Type */}
                                                <div className="md:col-span-2 mt-4">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <Building2 size={16} /> Admission Type
                                                    </h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Student Category *</label>
                                                    <select
                                                        required
                                                        value={studentForm.studentType}
                                                        onChange={(e) => setStudentForm({ ...studentForm, studentType: e.target.value })}
                                                        className="input-primary"
                                                    >
                                                        <option value="Hosteller">Hosteller (Regular)</option>
                                                        <option value="PhD">PhD Scholar</option>
                                                        <option value="Non-Hosteller">Non-Hosteller (Certificate Only)</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Residency Type *</label>
                                                    <select
                                                        required
                                                        value={studentForm.residency}
                                                        onChange={(e) => setStudentForm({ ...studentForm, residency: e.target.value })}
                                                        className="input-primary"
                                                    >
                                                        <option value="Permanent">Permanent (10 Months)</option>
                                                        <option value="Temporary">Temporary (Custom)</option>
                                                    </select>
                                                </div>

                                                {/* Room Allocation - Only for Hostellers */}
                                                {studentForm.studentType === 'Hosteller' && (
                                                    <>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-slate-700">Wing *</label>
                                                            <select
                                                                required
                                                                value={studentForm.wing}
                                                                onChange={(e) => setStudentForm({ ...studentForm, wing: e.target.value })}
                                                                className="input-primary"
                                                            >
                                                                <option value="">Select Wing</option>
                                                                <option value="A">Wing A</option>
                                                                <option value="B">Wing B</option>
                                                                <option value="C">Wing C</option>
                                                                <option value="D">Wing D</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-semibold text-slate-700">Room Number *</label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={studentForm.roomNo}
                                                                onChange={(e) => setStudentForm({ ...studentForm, roomNo: e.target.value })}
                                                                className="input-primary"
                                                                placeholder="e.g. 101"
                                                            />
                                                        </div>
                                                    </>
                                                )}

                                                {/* Duration & Fees */}
                                                <div className="md:col-span-2 mt-4">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <CreditCard size={16} /> Duration & Fees
                                                    </h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Joining Date *</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={studentForm.startDate}
                                                        onChange={(e) => setStudentForm({ ...studentForm, startDate: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                {studentForm.residency === 'Temporary' && (
                                                    <div className="flex gap-4">
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-sm font-semibold text-slate-700">Duration *</label>
                                                            <input
                                                                type="number"
                                                                required
                                                                min="1"
                                                                value={studentForm.tempDurationValue}
                                                                onChange={(e) => setStudentForm({ ...studentForm, tempDurationValue: e.target.value })}
                                                                className="input-primary"
                                                                placeholder="Value"
                                                            />
                                                        </div>
                                                        <div className="flex-1 space-y-2">
                                                            <label className="text-sm font-semibold text-slate-700">Unit</label>
                                                            <select
                                                                value={studentForm.tempDurationUnit}
                                                                onChange={(e) => setStudentForm({ ...studentForm, tempDurationUnit: e.target.value })}
                                                                className="input-primary"
                                                            >
                                                                <option value="days">Days</option>
                                                                <option value="months">Months</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">End Date (Auto)</label>
                                                    <input
                                                        type="date"
                                                        readOnly
                                                        value={studentForm.endDate}
                                                        className="input-primary bg-slate-100 text-slate-500 cursor-not-allowed"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Total Agreed Fees (₹) *</label>
                                                    <input
                                                        type="number"
                                                        required
                                                        value={studentForm.annualFees}
                                                        onChange={(e) => setStudentForm({ ...studentForm, annualFees: e.target.value })}
                                                        className="input-primary text-lg font-bold text-green-700"
                                                        placeholder="0.00"
                                                    />
                                                </div>

                                                <div className="col-span-2 flex gap-4 mt-8 pt-4 border-t border-gray-100">
                                                    <button
                                                        type="submit"
                                                        className="flex-1 btn-primary py-3 text-lg shadow-xl shadow-primary/20"
                                                    >
                                                        {editingStudent ? 'Update Admission' : 'Confirm Admission'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={resetStudentForm}
                                                        className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-md transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white/50">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Category</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Room</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Residency</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {filteredStudents.map((student) => (
                                                <tr key={student.id} className="hover:bg-blue-50/50 transition-colors group">
                                                    <td className="px-6 py-4 text-sm font-semibold text-slate-800">{student.name}</td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">{student.mobile}</td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${student.studentType === 'PhD' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                                            student.studentType === 'Non-Hosteller' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                                                                'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                            }`}>
                                                            {student.studentType}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                                                        {student.studentType === 'Hosteller' ? `${student.wing}-${student.roomNo}` : <span className="text-slate-400">-</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${student.residencyStatus === 'Permanent' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                                            }`}>
                                                            {student.residencyStatus}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm">
                                                        <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => editStudent(student)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => student.id && deleteStudent(student.id)}
                                                                className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {filteredStudents.length === 0 && (
                                        <div className="text-center py-16 text-slate-400 bg-white/30 container mx-auto flex flex-col items-center justify-center">
                                            <Search size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg">No students found matching your search</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="p-6 md:p-8">
                                <div className="flex flex-col md:flex-row justify-between items-center mb-8">
                                    <div className="mb-4 md:mb-0">
                                        <h2 className="text-2xl font-bold text-slate-800">Fee Collection History</h2>
                                        <p className="text-slate-500">Track and manage all fee payments</p>
                                    </div>
                                    <button
                                        onClick={() => setShowPaymentForm(true)}
                                        className="btn-primary flex items-center gap-2"
                                    >
                                        <Plus size={20} />
                                        Collect Fee
                                    </button>
                                </div>

                                {showPaymentForm && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                                            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
                                                <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                                    <CreditCard size={24} className="text-primary" />
                                                    New Payment Receipt
                                                </h3>
                                                <button onClick={resetPaymentForm} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                                    <X size={24} className="text-slate-500" />
                                                </button>
                                            </div>

                                            <form onSubmit={handlePaymentSubmit} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <Users size={16} /> Student Details
                                                    </h4>
                                                </div>

                                                <div className="md:col-span-2 space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Select Student *</label>
                                                    <select
                                                        required
                                                        value={paymentForm.studentId}
                                                        onChange={(e) => handleStudentSelect(e.target.value)}
                                                        className="input-primary text-lg"
                                                    >
                                                        <option value="">Choose a student</option>
                                                        {students.map(student => (
                                                            <option key={student.id} value={student.id}>
                                                                {student.name} - {student.mobile} ({student.studentType})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Payment Type *</label>
                                                    <select
                                                        required
                                                        value={paymentForm.paymentType}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentType: e.target.value })}
                                                        className="input-primary"
                                                    >
                                                        <option value="Full Payment">Full Payment</option>
                                                        <option value="Installment">Installment</option>
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Receipt No (Auto)</label>
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={receiptCounter}
                                                        className="input-primary bg-slate-100 font-mono font-bold tracking-wider text-slate-600"
                                                    />
                                                </div>

                                                {/* Fee Breakdown */}
                                                <div className="md:col-span-2 mt-4">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <CreditCard size={16} /> Fee Breakdown
                                                    </h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Registration Fees (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={paymentForm.registrationFees}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, registrationFees: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Security Deposit (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={paymentForm.securityDeposit}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, securityDeposit: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Room Rent (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={paymentForm.roomRent}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, roomRent: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Water & Electricity (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={paymentForm.waterElectricity}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, waterElectricity: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Gym Fee (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={paymentForm.gym}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, gym: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Other Charges (₹)</label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={paymentForm.others}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, others: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                {/* Payment Mode */}
                                                <div className="md:col-span-2 mt-4">
                                                    <h4 className="flex items-center gap-2 text-sm font-bold text-primary uppercase tracking-wider mb-4 border-b border-primary/10 pb-2">
                                                        <CheckCircle size={16} /> Payment Mode
                                                    </h4>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Mode *</label>
                                                    <select
                                                        required
                                                        value={paymentForm.paymentMode}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentMode: e.target.value })}
                                                        className="input-primary"
                                                    >
                                                        <option value="cash">Cash</option>
                                                        <option value="online">Online</option>
                                                        <option value="cheque">Cheque</option>
                                                    </select>
                                                </div>

                                                {paymentForm.paymentMode === 'online' && (
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-semibold text-slate-700">UTR Number *</label>
                                                        <input
                                                            type="text"
                                                            required
                                                            value={paymentForm.utr}
                                                            onChange={(e) => setPaymentForm({ ...paymentForm, utr: e.target.value })}
                                                            className="input-primary"
                                                            placeholder="Enter Transaction ID"
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-slate-700">Date *</label>
                                                    <input
                                                        type="date"
                                                        required
                                                        value={paymentForm.paymentDate}
                                                        onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                                                        className="input-primary"
                                                    />
                                                </div>

                                                <div className="md:col-span-2 mt-4">
                                                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100 flex flex-col md:flex-row justify-between items-center gap-4 shadow-sm">
                                                        <span className="text-blue-900 font-bold text-lg">Total Payable Amount:</span>
                                                        <span className="text-3xl font-extrabold text-primary">
                                                            ₹{(
                                                                parseFloat(paymentForm.securityDeposit || 0) +
                                                                parseFloat(paymentForm.registrationFees || 0) +
                                                                parseFloat(paymentForm.roomRent || 0) +
                                                                parseFloat(paymentForm.waterElectricity || 0) +
                                                                parseFloat(paymentForm.gym || 0) +
                                                                parseFloat(paymentForm.others || 0)
                                                            ).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="col-span-2 flex gap-4 mt-8 pt-4 border-t border-gray-100">
                                                    <button
                                                        type="submit"
                                                        className="flex-1 btn-primary py-3 text-lg shadow-xl shadow-primary/20"
                                                    >
                                                        Generate Receipt
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={resetPaymentForm}
                                                        className="flex-1 px-6 py-3 bg-white border border-slate-300 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:shadow-md transition-all"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm bg-white/50">
                                    <table className="w-full">
                                        <thead className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Receipt No</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Mode</th>
                                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {payments.map((payment) => {
                                                const student = students.find(s => s.id === payment.studentId);
                                                return (
                                                    <tr key={payment.id} className="hover:bg-blue-50/50 transition-colors group">
                                                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">#{payment.receiptNo}</td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            {new Date(payment.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                                            {student ? student.name : 'Unknown Student'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm font-bold text-emerald-600">
                                                            ₹{payment.totalAmount}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            {payment.paymentType || 'Full'}
                                                        </td>
                                                        <td className="px-6 py-4 text-sm text-slate-600">
                                                            <span className="capitalize px-2 py-1 bg-slate-100 rounded text-xs font-semibold">{payment.paymentMethod}</span>
                                                        </td>
                                                        <td className="px-6 py-4 text-sm">
                                                            <button
                                                                className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                                                                title="Download Receipt"
                                                                onClick={() => handlePrintReceipt(payment)}
                                                            >
                                                                <CreditCard size={18} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                    {payments.length === 0 && (
                                        <div className="text-center py-16 text-slate-400 bg-white/30 flex flex-col items-center justify-center">
                                            <CreditCard size={48} className="mb-4 opacity-20" />
                                            <p className="text-lg">No payments recorded yet</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Receipt Dialog */}
            {selectedPaymentForReceipt && selectedStudentForReceipt && (
                <ReceiptPrintDialog
                    open={receiptDialogOpen}
                    onClose={() => setReceiptDialogOpen(false)}
                    payment={selectedPaymentForReceipt}
                    student={selectedStudentForReceipt}
                />
            )}
        </div>
    );
}
