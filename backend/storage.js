
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from './firebase';

// Upload a file
export const uploadFile = (path, file) => {
  const storageRef = ref(storage, path);
  return uploadBytes(storageRef, file);
};

// Get the download URL for a file
export const getFileURL = (path) => {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
};
