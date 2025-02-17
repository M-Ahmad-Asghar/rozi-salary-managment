import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';

const notificationsRef = collection(db, 'notifications');

export const sendSalaryNotification = async (recipients, employeeData, type) => {
  try {
    const notification = {
      recipients,
      type,
      employeeData,
      sentAt: serverTimestamp(),
      status: 'pending'
    };

    await addDoc(notificationsRef, notification);
    
    // In a real application, you would integrate with an email service here
    // For example, using Firebase Cloud Functions with Nodemailer or SendGrid
    console.log(`Notification sent to ${recipients.join(', ')} for ${type}`);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};