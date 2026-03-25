
import { httpsCallable } from "firebase/functions";
import { functions } from "./firebase";

// Add a new room
export const addRoom = httpsCallable(functions, "addRoom");

// Update an existing room
export const updateRoom = httpsCallable(functions, "updateRoom");

// Delete a room
export const deleteRoom = httpsCallable(functions, "deleteRoom");

// Get all rooms
export const getRooms = httpsCallable(functions, "getRooms");
