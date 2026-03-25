
import { 
  collection, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  doc 
} from "firebase/firestore";
import { firestore } from './firebase';

// Add a new document to a collection
export const addDocument = (collectionName, data) => {
  const collectionRef = collection(firestore, collectionName);
  return addDoc(collectionRef, data);
};

// Get a document from a collection
export const getDocument = (collectionName, id) => {
  const docRef = doc(firestore, collectionName, id);
  return getDoc(docRef);
};

// Update a document in a collection
export const updateDocument = (collectionName, id, data) => {
  const docRef = doc(firestore, collectionName, id);
  return updateDoc(docRef, data);
};

// Delete a document from a collection
export const deleteDocument = (collectionName, id) => {
  const docRef = doc(firestore, collectionName, id);
  return deleteDoc(docRef);
};
