import {
  collection,
  addDoc,
  updateDoc,
  doc,
  Timestamp,
  getDoc
} from "firebase/firestore";
import { db, storage } from "./config";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import emailjs from '@emailjs/browser';

const salaryTransactionsRef = collection(db, "salaryTransactions");

export const recordSalaryPayment = async (paymentData, runToast) => {
  try {
    // Fetch the employee's last salary information
    const employeeRef = doc(db, "employees", paymentData.employeeId);
    const employeeDoc = await getDoc(employeeRef);
    const employeeData = employeeDoc.data();

    // Check if the last salary date falls within the last 30 days
    const lastSalaryDate = employeeData?.lastSalarySent?.transactionDate
      ? new Date(employeeData.lastSalarySent.transactionDate)
      : null;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    if (lastSalaryDate && lastSalaryDate > thirtyDaysAgo) {
      const userConfirmed = window.confirm(
        `The salary for this employee has already been paid in the last 30 days (on ${lastSalaryDate.toLocaleDateString()}). Do you still want to proceed with the payment?`
      );
      if (!userConfirmed) {
        return;
      }
    }

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
    runToast();
    // reload page
    window
      .location
      .reload();
    return docRef.id;
  } catch (error) {
    console.error("Error recording salary payment:", error);
    throw error;
  }
};
