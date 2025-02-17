import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  Timestamp,
  updateDoc,
  doc,
  orderBy,
  getDoc, 
  limit,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';

export const employeesRef = collection(db, 'employees');
export const salaryTransactionsRef = collection(db, 'salaryTransactions');

// Add new employee
export const addEmployee = async (employeeData) => {
  try {
    const docRef = await addDoc(employeesRef, {
      ...employeeData,
      dateOfJoining: Timestamp.fromDate(new Date(employeeData.dateOfJoining)),
      nextSalaryDate: Timestamp.fromDate(new Date(employeeData.nextSalaryDate)),
      createdAt: Timestamp.now(),
      lastSalaryAmount: 0,
      lastSalaryDate: null,
      lastTransactionNumber: null,
      lastReceiptUrl: null
    });
    return docRef.id;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

// Get all employees with their salary status
export const getAllEmployees = async () => {
  try {
    const q = query(employeesRef, orderBy('name'));
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dateOfJoining: doc.data().dateOfJoining?.toDate(),
      nextSalaryDate: doc.data().nextSalaryDate?.toDate(),
      lastSalaryDate: doc.data().lastSalaryDate?.toDate()
    }));
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

// Get employee by ID
export const getEmployeeById = async (employeeId) => {
  try {
    const docRef = doc(employeesRef, employeeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dateOfJoining: data.dateOfJoining?.toDate(),
        nextSalaryDate: data.nextSalaryDate?.toDate(),
        lastSalaryDate: data.lastSalaryDate?.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

// Get employee's salary history
export const getEmployeeSalaryHistory = async (employeeId) => {
  try {
    const q = query(
      salaryTransactionsRef,
      where('employeeId', '==', employeeId),
      orderBy('transactionDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      transactionDate: doc.data().transactionDate?.toDate()
    }));
  } catch (error) {
    console.error('Error getting salary history:', error);
    throw error;
  }
};

// Record salary payment
export const recordSalaryPayment = async (paymentData) => {
  try {
    let receiptUrl = '';
    
    // Upload receipt if provided
    if (paymentData.receipt) {
      const storageRef = ref(storage, `receipts/${paymentData.employeeId}/${Date.now()}_${paymentData.receipt.name}`);
      const snapshot = await uploadBytes(storageRef, paymentData.receipt);
      receiptUrl = await getDownloadURL(snapshot.ref);
    }

    // Add salary transaction
    const transactionData = {
      employeeId: paymentData.employeeId,
      employeeName: paymentData.employeeName,
      transactionAmount: paymentData.amount,
      transactionDate: Timestamp.fromDate(new Date(paymentData.transactionDate)),
      nextSalaryDate: Timestamp.fromDate(new Date(paymentData.nextSalaryDate)),
      transactionNumber: paymentData.transactionNumber,
      receiptUrl,
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(salaryTransactionsRef, transactionData);

    // Update employee's last salary information
    await updateDoc(doc(employeesRef, paymentData.employeeId), {
      lastSalaryAmount: paymentData.amount,
      lastSalaryDate: transactionData.transactionDate,
      lastTransactionNumber: paymentData.transactionNumber,
      lastReceiptUrl: receiptUrl,
      nextSalaryDate: transactionData.nextSalaryDate
    });

    return docRef.id;
  } catch (error) {
    console.error('Error recording salary payment:', error);
    throw error;
  }
};

export const getSalaryAlerts = async () => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const q = query(employeesRef);
    const querySnapshot = await getDocs(q);
    
    const alerts = {
      upcoming: [],
      overdue: []
    };

    querySnapshot.forEach(doc => {
      const employee = { id: doc.id, ...doc.data() };
      // Handle the nextSalaryDate properly whether it's a Timestamp or Date string
      const nextSalaryDate = employee.nextSalaryDate instanceof Timestamp 
        ? employee.nextSalaryDate.toDate() 
        : new Date(employee.nextSalaryDate);
      
      if (nextSalaryDate) {
        if (nextSalaryDate < today) {
          alerts.overdue.push({
            ...employee,
            nextSalaryDate, // Store the converted Date object
            daysOverdue: Math.floor((today - nextSalaryDate) / (1000 * 60 * 60 * 24))
          });
        } else if (nextSalaryDate <= nextWeek) {
          alerts.upcoming.push({
            ...employee,
            nextSalaryDate, // Store the converted Date object
            daysUntilDue: Math.floor((nextSalaryDate - today) / (1000 * 60 * 60 * 24))
          });
        }
      }
    });

    return alerts;
  } catch (error) {
    console.error('Error getting salary alerts:', error);
    throw error;
  }
};

export const deleteSalaryTransaction = async (transactionId, employeeId) => {
  try {
    // Get the employee document first to get their current data
    const employeeDoc = await getDoc(doc(db, 'employees', employeeId));
    const employeeData = employeeDoc.data();

    // Get the transaction to check if it's the last one
    const transactionDoc = await getDoc(doc(db, 'salaryTransactions', transactionId));
    const transactionData = transactionDoc.data();

    // Delete the transaction
    await deleteDoc(doc(db, 'salaryTransactions', transactionId));

    // If this was the last salary transaction for this employee,
    // update the employee's last salary information
    if (employeeData.lastTransactionNumber === transactionData.transactionNumber) {
      // Get the next most recent transaction
      const q = query(
        collection(db, 'salaryTransactions'),
        where('employeeId', '==', employeeId),
        orderBy('transactionDate', 'desc'),
        limit(1)
      );
      
      const nextMostRecentSnapshot = await getDocs(q);
      let updateData = {};
      
      if (nextMostRecentSnapshot.empty) {
        // No previous transactions exist
        updateData = {
          lastSalaryAmount: 0,
          lastSalaryDate: null,
          lastTransactionNumber: null,
          lastReceiptUrl: null
        };
      } else {
        // Update with the next most recent transaction
        const nextMostRecent = nextMostRecentSnapshot.docs[0].data();
        updateData = {
          lastSalaryAmount: nextMostRecent.transactionAmount,
          lastSalaryDate: nextMostRecent.transactionDate,
          lastTransactionNumber: nextMostRecent.transactionNumber,
          lastReceiptUrl: nextMostRecent.receiptUrl
        };
      }
      
      await updateDoc(doc(db, 'employees', employeeId), updateData);
    }

    return true;
  } catch (error) {
    console.error('Error deleting salary transaction:', error);
    throw error;
  }
};