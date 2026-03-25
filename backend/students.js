
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// Add a new student
export const addStudent = httpsCallable(functions, "addStudent");

// Update an existing student
export const updateStudent = httpsCallable(functions, "updateStudent");

// Delete a student
export const deleteStudent = httpsCallable(functions, "deleteStudent");

// Get all students
export const getStudents = httpsCallable(functions, "getStudents");

// Assign a room to a student
export const assignRoom = httpsCallable(functions, "assignRoom");

// Export data to CSV
export const exportData = httpsCallable(functions, "exportData");
