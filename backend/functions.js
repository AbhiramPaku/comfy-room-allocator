
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();

// --- Sample Data (from your original server.js) ---
const sampleRooms = [
  { roomNumber: "ACR-101", type: "ACR", floor: 1, totalBeds: 3, occupants: ["S001", "S002", "S003"] },
  { roomNumber: "ACR-102", type: "ACR", floor: 1, totalBeds: 3, occupants: ["S004", "S005"] },
  { roomNumber: "NCR-103", type: "NCR", floor: 1, totalBeds: 4, occupants: [] },
  { roomNumber: "NCR-201", type: "NCR", floor: 2, totalBeds: 2, occupants: ["S006"] },
  { roomNumber: "NCR-202", type: "NCR", floor: 2, totalBeds: 4, occupants: ["S007", "S008"] },
  { roomNumber: "ACR-203", type: "ACR", floor: 2, totalBeds: 2, occupants: [] },
  { roomNumber: "ACR-301", type: "ACR", floor: 3, totalBeds: 4, occupants: ["S009"] }
];
const sampleStudents = [
  { studentId: "S001", name: "Arjun Sharma", email: "arjun.sharma@example.com", roomNumber: "ACR-101" },
  { studentId: "S002", name: "Priya Patel", email: "priya.patel@example.com", roomNumber: "ACR-101" },
  { studentId: "S003", name: "Rohan Das", email: "rohan.das@example.com", roomNumber: "ACR-101" },
  { studentId: "S004", name: "Sneha Reddy", email: "sneha.reddy@example.com", roomNumber: "ACR-102" },
  { studentId: "S005", name: "Vikram Singh", email: "vikram.singh@example.com", roomNumber: "ACR-102" },
  { studentId: "S006", name: "Anjali Iyer", email: "anjali.iyer@example.com", roomNumber: "NCR-201" },
  { studentId: "S007", name: "Karan Malhotra", email: "karan.malhotra@example.com", roomNumber: "NCR-202" },
  { studentId: "S008", name: "Natasha Rao", email: "natasha.rao@example.com", roomNumber: "NCR-202" },
  { studentId: "S009", name: "Aditya Joshi", email: "aditya.joshi@example.com", roomNumber: "ACR-301" }
];

/**
 * Seeds the database with sample data if it's empty.
 */
async function seedDatabase(db) {
  console.log("Checking if database needs seeding...");
  const roomsCollection = db.collection("rooms");
  const snapshot = await roomsCollection.limit(1).get();

  if (snapshot.empty) {
    console.log("Database is empty. Seeding with sample data...");
    const batch = db.batch();

    sampleRooms.forEach(room => {
      const docRef = db.collection("rooms").doc(room.roomNumber);
      batch.set(docRef, room);
    });
    sampleStudents.forEach(student => {
      const docRef = db.collection("students").doc(student.studentId);
      batch.set(docRef, student);
    });

    await batch.commit();
    console.log("Database seeded successfully.");
  } else {
    console.log("Database already contains data. No seeding needed.");
  }
}

/**
 * Fetches and structures dashboard data (rooms grouped by floor).
 */
exports.getDashboardData = onCall(async (request) => {
  try {
    const db = getFirestore();
    await seedDatabase(db); // Ensure data exists

    const roomsSnapshot = await db.collection("rooms").orderBy("floor").orderBy("roomNumber").get();

    const floorsMap = {};
    roomsSnapshot.forEach(doc => {
      const room = doc.data();
      const floorNum = room.floor;

      if (!floorsMap[floorNum]) {
        floorsMap[floorNum] = {
          floorNumber: floorNum,
          rooms: []
        };
      }

      const processedRoom = {
        ...room,
        id: doc.id,
        occupiedBeds: room.occupants.length
      };
      floorsMap[floorNum].rooms.push(processedRoom);
    });

    return { floors: Object.values(floorsMap) };

  } catch (error) {
    console.error("Error in getDashboardData:", error);
    throw new HttpsError("internal", "Failed to retrieve dashboard data.", error.message);
  }
});

/**
 * Fetches a list of all students.
 */
exports.getStudents = onCall(async (request) => {
  try {
    const db = getFirestore();
    const studentsSnapshot = await db.collection("students").get();
    const students = studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return { students };
  } catch (error) {
    console.error("Error fetching students:", error);
    throw new HttpsError("internal", "Unable to fetch student data.");
  }
});
