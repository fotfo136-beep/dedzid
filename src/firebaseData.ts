import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

export const receiptsCollection = (userId: string) => 
  collection(db, "users", userId, "receipts");

export const addReceipt = async (userId: string, receipt: any) => {
  const docRef = await addDoc(receiptsCollection(userId), {
    ...receipt,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const updateReceipt = async (userId: string, receiptId: string, receipt: any) => {
  const docRef = doc(db, "users", userId, "receipts", receiptId);
  await updateDoc(docRef, receipt);
};

export const deleteReceipt = async (userId: string, receiptId: string) => {
  const docRef = doc(db, "users", userId, "receipts", receiptId);
  await deleteDoc(docRef);
};

export const subscribeToReceipts = (userId: string, callback: (receipts: any[]) => void) => {
  const q = query(receiptsCollection(userId), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const receipts = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(receipts);
  });
};

export const quotesCollection = (userId: string) => 
  collection(db, "users", userId, "quotes");

export const addQuote = async (userId: string, quote: any) => {
  const docRef = await addDoc(quotesCollection(userId), {
    ...quote,
    createdAt: Timestamp.now(),
  });
  return docRef.id;
};

export const subscribeToQuotes = (userId: string, callback: (quotes: any[]) => void) => {
  const q = query(quotesCollection(userId), orderBy("date", "desc"));
  return onSnapshot(q, (snapshot) => {
    const quotes = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    callback(quotes);
  });
};

export const settingsCollection = (userId: string) => 
  collection(db, "users", userId, "settings");

export const saveSettings = async (userId: string, settings: any) => {
  const docRef = doc(db, "users", userId, "settings", "company");
  await updateDoc(docRef, {
    ...settings,
    updatedAt: Timestamp.now(),
  }).catch(async () => {
    await addDoc(settingsCollection(userId), {
      id: "company",
      ...settings,
      updatedAt: Timestamp.now(),
    });
  });
};

export const subscribeToSettings = (userId: string, callback: (settings: any | null) => void) => {
  const docRef = doc(db, "users", userId, "settings", "company");
  return onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data());
    } else {
      callback(null);
    }
  });
};
