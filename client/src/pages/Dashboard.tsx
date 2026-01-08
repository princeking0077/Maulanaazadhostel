import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  useTheme,
  LinearProgress,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  Hotel as HotelIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PersonAdd as PersonAddIcon,
  AccountBalance as AccountBalanceIcon,
  BedroomParent as BedroomParentIcon,
  Assessment as AssessmentIcon,
  Upload as UploadIcon,
  Print as PrintIcon,
  SettingsBackupRestore as RestoreIcon,
} from '@mui/icons-material';
import { studentsStorage, roomsStorage } from '../services/storage';
import QuickPaymentDialog from '../components/payments/QuickPaymentDialog';
import { db, StudentFeeAggregate, InstallmentReceipt, Student } from '../database/db';
import { formatDateDDMonthYYYY, calculateAcademicPeriodEnd, getRemainingPeriod } from '../utils/dateUtils';

interface DashboardStats {
  totalStudents: number;
  permanentStudents: number;
  temporaryStudents: number;
  totalRooms: number;
  occupiedRooms: number;
  totalCollected: number;
  totalPending: number; // sum of pendingAmount across current academic year
  permanentPending: number;
  temporaryPending: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  thisMonthPayments: number;
  totalAnnualFees: number;
  wingStats: { A: number; B: number; C: number; D: number; };
  expiringStudents: { id: number; name: string; remainingDays: number; endDate: string }[];
  debugTotalFees?: number;
  debugTargetFees?: number;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    permanentStudents: 0,
    temporaryStudents: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    totalCollected: 0,
    totalPending: 0,
    permanentPending: 0,
    temporaryPending: 0,
    paidCount: 0,
    partialCount: 0,
    unpaidCount: 0,
    thisMonthPayments: 0,
    totalAnnualFees: 0,
    wingStats: { A: 0, B: 0, C: 0, D: 0 },
    expiringStudents: []
  });
  const [loading, setLoading] = useState(true);
  const [quickPaymentOpen, setQuickPaymentOpen] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get total students
      const totalStudents = await studentsStorage.count();

      // Get wing-wise student count
      const wingA = await studentsStorage.where('wing', 'A').count();
      const wingB = await studentsStorage.where('wing', 'B').count();
      const wingC = await studentsStorage.where('wing', 'C').count();
      const wingD = await studentsStorage.where('wing', 'D').count();

      // Get room stats
      const totalRooms = await roomsStorage.count();

      // Calculate actual occupied rooms based on student assignments
      const studentsInRooms = await studentsStorage.getAll();
      const occupiedRoomNumbers = new Set(
        studentsInRooms
          .filter(student => student.roomNo && student.roomNo.trim() !== '')
          .map(student => `${student.wing}${student.roomNo}`)
      );
      const occupiedRooms = occupiedRoomNumbers.size;

      // Offline fee aggregates
      const currentYearLabel = (() => {
        const yr = new Date().getFullYear();
        return `${yr}-${String(yr + 1).slice(2)}`;
      })();
      const feeRows: StudentFeeAggregate[] = await db.studentFees.where('academicYear').equals(currentYearLabel).toArray();
      const studentCollected = feeRows.reduce((s, f) => s + f.paidAmount, 0);
      const totalPending = feeRows.reduce((s, f) => s + f.pendingAmount, 0);
      const paidCount = feeRows.filter(f => f.status === 'Paid').length;
      const partialCount = feeRows.filter(f => f.status === 'Partially Paid').length;
      const unpaidCount = feeRows.filter(f => f.status === 'Unpaid').length;

      // Add admin billing income and subtract expenses
      const adminTransactions = await db.facilityTransactions.toArray();
      const adminIncome = adminTransactions.filter(t => t.txnType === 'Income').reduce((s, t) => s + t.amount, 0);
      const adminExpenses = adminTransactions.filter(t => t.txnType === 'Expense').reduce((s, t) => s + t.amount, 0);

      // Add petty cash expenses (Admin Panel expenses)
      const pettyCashTransactions = await db.pettyCash.toArray();
      const pettyCashExpenses = pettyCashTransactions.reduce((s, t) => s + t.amount, 0);

      // Total Expenses = Facility Expenses + Petty Cash
      const totalExpenses = adminExpenses + pettyCashExpenses;

      // Net Collection
      const totalCollected = studentCollected + adminIncome - totalExpenses;

      // This month's payments from installment receipts
      const month = new Date().getMonth();
      const yearNum = new Date().getFullYear();
      const monthReceipts: InstallmentReceipt[] = await db.installmentReceipts.where('paymentDate').between(new Date(yearNum, month, 1), new Date(yearNum, month + 1, 0), true, true).toArray();
      const thisMonthPayments = monthReceipts.reduce((s, r) => s + r.paymentAmount, 0);

      // Get all students and separate by residency status
      const students = await studentsStorage.getAll();
      const permanentStudents = students.filter(s => s.residencyStatus !== 'Temporary');
      const temporaryStudents = students.filter(s => s.residencyStatus === 'Temporary');

      // Map feeRows to students for permanent vs temporary pending
      const studentMap = new Map<number, Student>();
      students.forEach(s => { if (s.id != null) studentMap.set(s.id, s); });

      let permanentPendingAgg = 0; let temporaryPendingAgg = 0;
      feeRows.forEach(fr => {
        const st = studentMap.get(fr.studentId);
        if (!st) return;
        const isTemp = st.residencyStatus === 'Temporary';
        if (isTemp) {
          temporaryPendingAgg += fr.pendingAmount;
        } else {
          permanentPendingAgg += fr.pendingAmount;
        }
      });

      const totalAnnualFees = students.reduce((sum, student) => {
        return sum + (student.annualFee || 50000);
      }, 0);

      const expiringStudents = permanentStudents
        .map(s => {
          const end = calculateAcademicPeriodEnd(s.joiningDate || new Date());
          const { daysRemaining } = getRemainingPeriod(end);
    // Explicitly handle id existence. If id is missing, we skip.
    return { id: s.id || 0, name: s.name, remainingDays: daysRemaining, endDate: formatDateDDMonthYYYY(end) };
        })
  .filter(e => e.id !== 0) // Remove entries without valid ID
        .filter(e => e.remainingDays < 30)
        .sort((a, b) => a.remainingDays - b.remainingDays)
        .slice(0, 10);

      setStats({
        totalStudents,
        permanentStudents: permanentStudents.length,
        temporaryStudents: temporaryStudents.length,
        totalRooms,
        occupiedRooms,
        totalCollected,
        totalPending,
        permanentPending: permanentPendingAgg,
        temporaryPending: temporaryPendingAgg,
        paidCount,
        partialCount,
        unpaidCount,
        thisMonthPayments,
        totalAnnualFees,
        wingStats: { A: wingA, B: wingB, C: wingC, D: wingD },
        expiringStudents,
        debugTotalFees: await db.studentFees.count(),
        debugTargetFees: feeRows.length
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
    trend?: 'up' | 'down';
    trendValue?: string;
    delay?: number;
  }> = ({ title, value, subtitle, icon, color, trend, trendValue, delay = 0 }) => (
    <div
      className="glass rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary/20 group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-md shadow-inner`}>
          {React.cloneElement(icon as React.ReactElement, { sx: { fontSize: 32, color: color } })}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${trend === 'up' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend === 'up' ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
            {trendValue}
          </div>
        )}
      </div>
      <div className="relative z-10">
        <h3 className="text-3xl font-extrabold text-slate-800 mb-1 tracking-tight">{value}</h3>
        <p className="text-slate-500 font-medium text-sm uppercase tracking-wide">{title}</p>

        {subtitle && (
          <p className="text-sm text-slate-400 mt-2 font-medium bg-white/30 w-fit px-2 py-0.5 rounded-lg">
            {subtitle}
          </p>
        )}
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-gray-100 to-transparent rounded-full opacity-50 group-hover:scale-110 transition-transform duration-500" />
    </div>
  );

  const DebugSection = () => (
    <Box sx={{ mt: 4, p: 2, bgcolor: '#fff0f0', borderRadius: 2, border: '1px dashed red' }}>
      <Typography variant="subtitle2" color="error" fontWeight="bold">DIAGNOSTICS (Share this if data is zero)</Typography>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'auto auto', gap: 2, mt: 1 }}>
        <Typography variant="caption">System Date:</Typography>
        <Typography variant="caption" fontWeight="bold">{new Date().toLocaleString()}</Typography>

        <Typography variant="caption">Target Academic Year:</Typography>
        <Typography variant="caption" fontWeight="bold">
          {(() => { const y = new Date().getFullYear(); return `${y}-${String(y + 1).slice(2)}`; })()}
        </Typography>

        <Typography variant="caption">Total Fee Records in DB:</Typography>
        <Typography variant="caption" fontWeight="bold">{stats.debugTotalFees ?? 'Loading...'}</Typography>

        <Typography variant="caption">Records Matching Target Year:</Typography>
        <Typography variant="caption" fontWeight="bold">{stats.debugTargetFees ?? 'Loading...'}</Typography>
      </Box>
    </Box>
  );

  const ActionButton: React.FC<{
    title: string;
    icon: React.ReactNode;
    color: string;
    onClick: () => void;
  }> = ({ title, icon, color, onClick }) => (
    <button
      onClick={onClick}
      className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/50 border border-white/40 hover:bg-white hover:shadow-lg hover:shadow-blue-900/5 transition-all duration-300 group"
    >
      <div className={`p-3 rounded-xl mb-3 transition-transform group-hover:scale-110 duration-300`} style={{ backgroundColor: `${color}15`, color: color }}>
        {icon}
      </div>
      <span className="text-xs font-bold text-slate-600 group-hover:text-primary transition-colors">{title}</span>
    </button>
  );

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 4, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <LinearProgress sx={{ width: '50%', borderRadius: 4, height: 8 }} />
        <Typography variant="h6" sx={{ mt: 2, color: 'text.secondary', fontWeight: 500 }}>
          Loading dashboard insights...
        </Typography>
      </Box>
    );
  }

  return (
    <div className="animate-fade-in p-2 md:p-4 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            Dashboard
          </h1>
          <p className="text-slate-500 mt-1 text-lg">Welcome back to the control center.</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </button>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Active Registrations"
          icon={<PeopleIcon />}
          color={theme.palette.primary.main}
          trend="up"
          trendValue="+1 new this week"
          delay={0}
        />
        <StatCard
          title="Room Occupancy"
          value={`${stats.occupiedRooms}/${stats.totalRooms}`}
          subtitle={`${Math.round((stats.occupiedRooms / stats.totalRooms) * 100)}% Occupancy Rate`}
          icon={<HotelIcon />}
          color={theme.palette.secondary.main}
          delay={100}
        />
        <StatCard
          title="Total Collected"
          value={`₹${stats.totalCollected.toLocaleString()}`}
          subtitle="FY 2024-25 Revenue"
          icon={<PaymentIcon />}
          color={theme.palette.success.main}
          trend="up"
          trendValue="Healthy"
          delay={200}
        />
        <StatCard
          title="Pending Fees"
          value={`₹${stats.totalPending.toLocaleString()}`}
          subtitle="Action Required"
          icon={<AccountBalanceIcon />}
          color={theme.palette.warning.main}
          delay={300}
        />
      </div>

      {/* Secondary Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Fee Status Breakdown */}
        <div className="glass rounded-3xl p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <AssessmentIcon className="text-primary" /> Fee Status Overview
            </h3>
            <span className="text-xs font-bold px-3 py-1 bg-primary/10 text-primary rounded-full">Annual Cycle</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl bg-green-50 border border-green-100 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-green-800 font-bold text-lg">{stats.paidCount}</p>
                <p className="text-green-600 text-sm font-medium">Fully Paid</p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <PaymentIcon sx={{ fontSize: 60 }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-orange-50 border border-orange-100 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-orange-800 font-bold text-lg">{stats.partialCount}</p>
                <p className="text-orange-600 text-sm font-medium">Partial Payment</p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <AccountBalanceIcon sx={{ fontSize: 60 }} />
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 relative overflow-hidden">
              <div className="relative z-10">
                <p className="text-red-800 font-bold text-lg">{stats.unpaidCount}</p>
                <p className="text-red-600 text-sm font-medium">Unpaid</p>
              </div>
              <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                <TrendingDownIcon sx={{ fontSize: 60 }} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-white/50 border border-white/60">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-600">Permanent Students</span>
                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{stats.permanentStudents}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">₹{stats.permanentPending.toLocaleString()}</p>
              <p className="text-xs text-slate-400 font-medium uppercase mt-1">Pending Amount</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/50 border border-white/60">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-slate-600">Temporary Students</span>
                <span className="text-xs font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">{stats.temporaryStudents}</span>
              </div>
              <p className="text-2xl font-bold text-slate-800">₹{stats.temporaryPending.toLocaleString()}</p>
              <p className="text-xs text-slate-400 font-medium uppercase mt-1">Pending Amount</p>
            </div>
          </div>
        </div>

        {/* Wing Stats */}
        <div className="glass rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
              <HotelIcon className="text-secondary" /> Wing Occupancy
            </h3>
            <div className="space-y-4">
              {Object.entries(stats.wingStats).map(([wing, count]) => (
                <div key={wing} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-700 shadow-sm">
                    {wing}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-semibold text-slate-600">{count} Students</span>
                      <span className="text-slate-400 font-medium text-xs">{Math.min(100, Math.round((count / 20) * 100))}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full"
                        style={{ width: `${(count / 20) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider mb-1">THIS MONTH</p>
              <p className="text-2xl font-bold">₹{stats.thisMonthPayments.toLocaleString()}</p>
              <p className="text-indigo-100 text-sm opacity-80 mt-1">Total Collections</p>
            </div>
            <AssessmentIcon className="absolute -right-4 -bottom-4 text-white opacity-20" sx={{ fontSize: 100 }} />
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      {stats.expiringStudents.length > 0 && (
        <div className="mb-8 animate-slide-up">
          <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
            <h3 className="text-red-800 font-bold text-lg mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Academic Period Expiring (Next 30 Days)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {stats.expiringStudents.map(es => (
                <div key={es.id} className="bg-white p-3 rounded-xl border border-red-100 shadow-sm flex justify-between items-center hover:shadow-md transition-shadow">
                  <div>
                    <p className="font-bold text-slate-700">{es.name}</p>
                    <p className="text-xs text-slate-500">Ends: {es.endDate}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-lg ${es.remainingDays < 10 ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                    {es.remainingDays} days
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Dock */}
      <div className="glass rounded-3xl p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4 px-2">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          <ActionButton
            title="Add Student"
            icon={<PersonAddIcon fontSize="small" />}
            color={theme.palette.primary.main}
            onClick={() => navigate('/students')}
          />
          <ActionButton
            title="Add Payment"
            icon={<PaymentIcon fontSize="small" />}
            color={theme.palette.secondary.main}
            onClick={() => navigate('/payments')}
          />
          <ActionButton
            title="Quick Bill"
            icon={<PaymentIcon fontSize="small" />}
            color={theme.palette.error.main}
            onClick={() => setQuickPaymentOpen(true)}
          />
          <ActionButton
            title="Manage Rooms"
            icon={<BedroomParentIcon fontSize="small" />}
            color={theme.palette.success.main}
            onClick={() => navigate('/rooms')}
          />
          <ActionButton
            title="Reports"
            icon={<AssessmentIcon fontSize="small" />}
            color={theme.palette.info.main}
            onClick={() => navigate('/reports')}
          />
          <ActionButton
            title="Print"
            icon={<PrintIcon fontSize="small" />}
            color={theme.palette.warning.main}
            onClick={() => navigate('/print-center')}
          />
          <ActionButton
            title="Backup"
            icon={<RestoreIcon fontSize="small" />}
            color={theme.palette.info.main}
            onClick={() => navigate('/backup')}
          />
          <ActionButton
            title="Import"
            icon={<UploadIcon fontSize="small" />}
            color={theme.palette.grey[700]}
            onClick={() => navigate('/import')}
          />
        </div>
      </div>

      <DebugSection />
      <QuickPaymentDialog
        open={quickPaymentOpen}
        onClose={() => setQuickPaymentOpen(false)}
        onSuccess={() => { setQuickPaymentOpen(false); loadDashboardData(); }}
      />
    </div>
  );
};

export default Dashboard;
