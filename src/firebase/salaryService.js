import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db, storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import emailjs from '@emailjs/browser';

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
    // Send email to employee
    const emailParams = {
      employee_name: paymentData.employeeName,
      transaction_amount: paymentData.transactionAmount,
      transaction_date: new Date(paymentData.transactionDate).toLocaleDateString(),
      next_salary_date: new Date(paymentData.nextSalaryDate).toLocaleDateString(),
      transaction_number: paymentData.transactionNumber,
      receipt_url: paymentData?.receiptUrl,
      employee_email: paymentData.email, // Ensure paymentData contains employeeEmail
    };

    await emailjs.send(
      'service_cy3p2ob', // Replace with your EmailJS service ID
      'template_v4ui4jh', // Replace with your EmailJS template ID
      emailParams,
      'xXWVd7oS_khXD9Qch' // Replace with your EmailJS user ID
    );

    return docRef.id;
  } catch (error) {
    console.error("Error recording salary payment:", error);
    throw error;
  }
};
