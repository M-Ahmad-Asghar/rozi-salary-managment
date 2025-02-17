import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const salaryTransactionsRef = collection(db, "salaryTransactions");

export const recordSalaryPayment = async (paymentData) => {
  try {
    // Current timestamp
    const timestamp = Timestamp.now();

    // Add the salary transaction
    const docRef = await addDoc(salaryTransactionsRef, {
      ...paymentData,
      transactionDate: Timestamp.fromDate(
        new Date(paymentData.transactionDate)
      ),
      createdAt: timestamp,
      updatedAt: timestamp,
      updatedBy: paymentData?.createdBy,
    });

    // Update the employee's last salary information
    const employeeRef = doc(db, "employees", paymentData.employeeId);
    await updateDoc(employeeRef, {
      lastSalarySent: {
        transactionNumber: paymentData.transactionNumber,
        transactionAmount: paymentData.transactionAmount,
        transactionDate: paymentData.transactionDate,
        receiptUrl: paymentData?.receiptUrl,
      },
      nextSalaryDate: paymentData.nextSalaryDate,
      updatedAt: timestamp,
      updatedBy: paymentData?.createdBy,
    });

    return docRef.id;
  } catch (error) {
    console.error("Error recording salary payment:", error);
    throw error;
  }
};
