// This is a reference for the Firestore collection structure

/*
Collection: employees
{
  id: string,
  name: string,
  designation: string,
  dateOfJoining: timestamp,
  grossSalary: number,
  accountNumber: string,
  lastSalarySent: {
    transactionNumber: string,
    transactionAmount: number,
    transactionDate: timestamp
  },
  createdAt: timestamp,
  updatedAt: timestamp
}

Collection: salaryTransactions
{
  id: string,
  employeeId: string,
  employeeName: string,
  transactionNumber: string,
  transactionAmount: number,
  transactionDate: timestamp,
  status: 'pending' | 'completed' | 'overdue',
  createdAt: timestamp,
  updatedAt: timestamp
}

Collection: notifications
{
  id: string,
  recipients: array<string>,
  type: 'today_payment' | 'tomorrow_payment' | 'overdue_payment',
  employeeData: {
    employeeId: string,
    employeeName: string,
    amount: number
  },
  sentAt: timestamp,
  status: 'pending' | 'sent' | 'failed'
}
*/