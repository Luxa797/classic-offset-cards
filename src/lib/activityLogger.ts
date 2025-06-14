// src/lib/activityLogger.ts
import { db } from './firebaseClient';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * பயனரின் செயல்பாட்டை Firestore இல் பதிவு செய்யும்.
 * @param message - செயல்பாட்டை விவரிக்கும் செய்தி (எ.கா., "Order #123 status updated to Printing").
 * @param user - செயல்பாட்டைச் செய்த பயனரின் பெயர் அல்லது ஐடி.
 */
export const logActivity = async (message: string, user: string) => {
  try {
    await addDoc(collection(db, 'activity_logs'), {
      message: message,
      user: user,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging activity:", error);
    // செயல்பாட்டைப் பதிவு செய்வதில் பிழை ஏற்பட்டால், அதை அமைதியாகப் புறக்கணிக்கலாம்.
    // இது பயனரின் முக்கிய அனுபவத்தைப் பாதிக்காது.
  }
};
