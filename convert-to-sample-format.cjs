// This script converts the real student data to our app's sample data format

const realData = [
  {
    "student": {
      "id": 1,
      "name": "Uzair Khan Pathan Aslam Khan",
      "mobile": "9028974366",
      "wing": "A",
      "roomNo": "12",
      "faculty": "B.Com",
      "yearOfCollege": "1st",
      "joiningDate": "2025-06-27T00:00:00.000Z",
      "annualFee": 17500
    },
    "payments": [
      {
        "receiptNo": "6742",
        "date": "2025-06-27T00:00:00.000Z",
        "registrationFee": 500,
        "rentFee": 11000,
        "waterFee": 3000,
        "totalAmount": 14500,
        "balanceAmount": 3000
      }
    ]
  }
];

// Helper function to extract mobile from name string
function extractMobile(name, mobile) {
  return `${name} ${mobile}`;
}

// Helper function to format date
function formatDate(isoDate) {
  const date = new Date(isoDate);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Convert to sample data format
function convertToSampleFormat(data) {
  const sampleData = [];
  
  data.forEach((item, index) => {
    const student = item.student;
    const firstPayment = item.payments[0];
    
    const row = {
      srNo: student.id,
      studentNameMobile: extractMobile(student.name, student.mobile),
      wingRoom: `${student.wing}-${student.roomNo}`,
      class: `${student.faculty} ${student.yearOfCollege}`,
      dateOfJoining: formatDate(student.joiningDate),
      receiptNo: String(firstPayment.receiptNo),
      receiptDate: formatDate(firstPayment.date),
      regFee: firstPayment.registrationFee,
      roomRent: firstPayment.rentFee,
      waterElectricity: firstPayment.waterFee,
      otherActivity: firstPayment.gymFee || 0,
      totalFeesCollection: firstPayment.totalAmount,
      approvedHostelFees: student.annualFee,
      outstandingFee: firstPayment.balanceAmount,
      remark: "",
      securityDeposit: 0
    };
    
    sampleData.push(row);
  });
  
  return sampleData;
}

console.log('Sample data format ready for TypeScript file');
