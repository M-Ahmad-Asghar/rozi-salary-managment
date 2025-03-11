import emailjs from '@emailjs/browser';
import { supabase } from '../supabase/config';

export const recordSalaryPayment = async (paymentData, runToast) => {
  try {
    // Fetch the employee's last salary information
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', paymentData.employeeId)
      .single();

    if (employeeError) throw employeeError;

    const lastSalaryDateRaw = JSON.parse(employeeData?.last_salary_sent || "{}")?.transaction_date
      || null;
      const lastSalaryDate = new Date(lastSalaryDateRaw);
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
    const timestamp = new Date().toISOString();

    // Add the salary transaction
    const { data: transactionData, error: transactionError } = await supabase
      .from('salary_transactions')
      .insert({
        ...paymentData,
        transaction_date: new Date(paymentData.transactionDate).toISOString(),
        created_at: timestamp,
        updated_at: timestamp,
        updated_by: paymentData?.createdBy,
      });

    if (transactionError) throw transactionError;

    // Update the employee's last salary information
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        last_salary_sent: {
          transaction_number: paymentData.transactionNumber,
          transaction_amount: paymentData.transactionAmount,
          transaction_date: paymentData.transactionDate,
          receipt_url: paymentData?.receiptUrl,
        },
        next_salary_date: paymentData.nextSalaryDate,
        updated_at: timestamp,
        updated_by: paymentData?.createdBy,
      })
      .eq('id', paymentData.employeeId);

    if (updateError) throw updateError;

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
    const response = await fetch('https://zxyyalnafhelbmglnzhx.supabase.co/functions/v1/addSalaryToGoogleSheet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `${supabase.auth.headers.Authorization}`,
      },
      body: JSON.stringify({ transactionData: {
          ...paymentData,
          transaction_date: new Date(paymentData.transactionDate).toISOString(),
          created_at: timestamp,
          updated_at: timestamp,
          updated_by: paymentData?.createdBy,
      } }),
    });

    const result = await response.json();
    if (result.status !== 'success') {
      throw new Error(result.message);
    }
    runToast();
    // reload page
    window.location.reload();
    return transactionData[0].id;
  } catch (error) {
    console.error("Error recording salary payment:", error);
    throw error;
  }
};