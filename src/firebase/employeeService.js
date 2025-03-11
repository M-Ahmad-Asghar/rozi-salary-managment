import { supabase } from "../supabase/config";

// Add a new employee
export const addEmployee = async (employeeData) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .insert({
        ...employeeData,
        date_of_joining: new Date(employeeData.dateOfJoining).toISOString(),
        next_salary_date: new Date(employeeData.nextSalaryDate).toISOString(),
        created_at: new Date().toISOString(),
        last_salary_amount: 0,
        last_salary_date: null,
        last_transaction_number: null,
        last_receipt_url: null
      });
      console.log("data1212", data);
      
    if (error) throw error;
    
    // return data[0].id;
  } catch (error) {
    console.error('Error adding employee:', error);
    throw error;
  }
};

// Get all employees with their salary status
export const getAllEmployees = async () => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');

    if (error) throw error;
    return data.map(employee => ({
      ...employee,
      dateOfJoining: new Date(employee.date_of_joining),
      nextSalaryDate: new Date(employee.next_salary_date),
      lastSalaryDate: employee.last_salary_date ? new Date(employee.last_salary_date) : null,
    }));
  } catch (error) {
    console.error('Error getting employees:', error);
    throw error;
  }
};

// Get employee by ID
export const getEmployeeById = async (employeeId) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    return {
      ...data,
      dateOfJoining: new Date(data.date_of_joining),
      nextSalaryDate: new Date(data.next_salary_date),
      lastSalaryDate: data.last_salary_date ? new Date(data.last_salary_date) : null,
    };
  } catch (error) {
    console.error('Error getting employee:', error);
    throw error;
  }
};

// Get employee's salary history
export const getEmployeeSalaryHistory = async (employeeId) => {
  try {
    const { data, error } = await supabase
      .from('salary_transactions')
      .select('*')
      .eq('employee_id', employeeId)
      .order('transaction_date', { ascending: false });

    if (error) throw error;
    return data.map(transaction => ({
      ...transaction,
      transactionDate: new Date(transaction.transaction_date),
    }));
  } catch (error) {
    console.error('Error getting salary history:', error);
    throw error;
  }
};


export const getSalaryAlerts = async () => {
  try {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    const { data, error } = await supabase
      .from('employees')
      .select('*');

    if (error) throw error;

    const alerts = {
      overdue: [],
      upcoming: []
    };
    function isMoreThan23DaysAgo(date) {
      const currentDate = new Date();  // Get the current date
      const inputDate = new Date(date);  // Convert the input date to a Date object
      
      const diffInMilliseconds = currentDate - inputDate;
      const diffInDays = diffInMilliseconds / (1000 * 60 * 60 * 24);
      return diffInDays > 23;
    }
    data.forEach(employee => {
      const dateOfJoining = new Date(employee.date_of_joining);
      const lastSalaryDate = JSON.parse(employee.last_salary_sent || "{}").transaction_date || dateOfJoining;
      const lastSalaryTimeStamp = new Date(lastSalaryDate);
      
      let nextSalaryDate = new Date(today.getFullYear(), today.getMonth(), dateOfJoining.getDate());

      if (isMoreThan23DaysAgo(lastSalaryTimeStamp)) {
        if (nextSalaryDate < today) {
          alerts.overdue.push({
            ...employee,
            nextSalaryDate,
            daysOverdue: Math.floor((today - nextSalaryDate) / (1000 * 60 * 60 * 24))
          });
        } else if (nextSalaryDate <= nextWeek) {
          alerts.upcoming.push({
            ...employee,
            nextSalaryDate,
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

// Delete salary transaction
export const deleteSalaryTransaction = async (transactionId, employeeId) => {
  try {
    // Get the employee document first to get their current data
    const { data: employeeData, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', employeeId)
      .single();

    if (employeeError) throw employeeError;

    // Get the transaction to check if it's the last one
    const { data: transactionData, error: transactionError } = await supabase
      .from('salary_transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    if (transactionError) throw transactionError;

    // Delete the transaction
    const { error: deleteError } = await supabase
      .from('salary_transactions')
      .delete()
      .eq('id', transactionId);

    if (deleteError) throw deleteError;

    // If this was the last salary transaction for this employee,
    // update the employee's last salary information
    if (employeeData.last_transaction_number === transactionData.transaction_number) {
      // Get the next most recent transaction
      const { data: nextMostRecentData, error: nextMostRecentError } = await supabase
        .from('salary_transactions')
        .select('*')
        .eq('employee_id', employeeId)
        .order('transaction_date', { ascending: false })
        .limit(1);

      if (nextMostRecentError) throw nextMostRecentError;

      let updateData = {};

      if (nextMostRecentData.length === 0) {
        // No previous transactions exist
        updateData = {
          last_salary_amount: 0,
          last_salary_date: null,
          last_transaction_number: null,
          last_receipt_url: null
        };
      } else {
        // Update with the next most recent transaction
        const nextMostRecent = nextMostRecentData[0];
        updateData = {
          last_salary_amount: nextMostRecent.transaction_amount,
          last_salary_date: nextMostRecent.transaction_date,
          last_transaction_number: nextMostRecent.transaction_number,
          last_receipt_url: nextMostRecent.receipt_url
        };
      }

      const { error: updateEmployeeError } = await supabase
        .from('employees')
        .update(updateData)
        .eq('id', employeeId);

      if (updateEmployeeError) throw updateEmployeeError;
    }

    return true;
  } catch (error) {
    console.error('Error deleting salary transaction:', error);
    throw error;
  }
};