
import express from 'express';
import { MongoClient, ObjectId } from 'mongodb';
import cors from 'cors';

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

const mongoURI = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'hostel';
const serverStartedAt = new Date();

if (!mongoURI) {
  console.error('Missing required environment variable: MONGODB_URI');
  process.exit(1);
}

const defaultAllowedOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const configuredOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...configuredOrigins])];
const allowedRequestStatuses = new Set(['Pending', 'Approved', 'Rejected']);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests. Browser requests must match configured origins.
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

app.use((req, res, next) => {
  const origin = req.get('origin');
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ message: 'CORS origin blocked' });
  }
  return next();
});

app.use(express.json());

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const elapsedMs = Date.now() - start;
    console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`);
  });
  next();
});

let db;
let mongoClient;
let isShuttingDown = false;

const resolveDuplicateFieldName = (error) => {
  if (!error || error.code !== 11000) return null;
  const keyPattern = error.keyPattern || {};
  const keyFromPattern = Object.keys(keyPattern)[0];
  if (keyFromPattern) return keyFromPattern;

  const keyValue = error.keyValue || {};
  return Object.keys(keyValue)[0] || null;
};

const duplicateKeyErrorMessage = (error) => {
  const fieldName = resolveDuplicateFieldName(error);
  if (!fieldName) return null;

  const labels = {
    roomNumber: 'Room number',
    studentId: 'Student ID',
  };

  return `${labels[fieldName] || fieldName} already exists`;
};

const parseIntegerField = (value, fieldName, { min } = {}) => {
  const parsed = parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    return { error: `${fieldName} must be a valid number` };
  }
  if (min !== undefined && parsed < min) {
    return { error: `${fieldName} must be greater than or equal to ${min}` };
  }
  return { value: parsed };
};

const validateRoomPayload = (payload, { partial = false } = {}) => {
  const normalized = {};
  let hasAtLeastOneField = false;

  if (!partial || payload.roomNumber !== undefined) {
    hasAtLeastOneField = true;
    const roomNumber = String(payload.roomNumber || '').trim();
    if (!roomNumber) {
      return { error: 'roomNumber is required' };
    }
    normalized.roomNumber = roomNumber;
  }

  if (!partial || payload.floor !== undefined) {
    hasAtLeastOneField = true;
    const parsedFloor = parseIntegerField(payload.floor, 'floor', { min: 0 });
    if (parsedFloor.error) return { error: parsedFloor.error };
    normalized.floor = parsedFloor.value;
  }

  if (!partial || payload.totalBeds !== undefined) {
    hasAtLeastOneField = true;
    const parsedBeds = parseIntegerField(payload.totalBeds, 'totalBeds', { min: 1 });
    if (parsedBeds.error) return { error: parsedBeds.error };
    normalized.totalBeds = parsedBeds.value;
  }

  if (partial && !hasAtLeastOneField) {
    return { error: 'At least one updatable room field is required' };
  }

  return { value: normalized };
};

const validateStudentPayload = (payload, { partial = false } = {}) => {
  const normalized = {};
  let hasAtLeastOneField = false;

  if (!partial || payload.name !== undefined) {
    hasAtLeastOneField = true;
    const name = String(payload.name || '').trim();
    if (!name) {
      return { error: 'name is required' };
    }
    normalized.name = name;
  }

  if (!partial || payload.studentId !== undefined) {
    hasAtLeastOneField = true;
    const studentId = String(payload.studentId || '').trim();
    if (!studentId) {
      return { error: 'studentId is required' };
    }
    normalized.studentId = studentId;
  }

  if (!partial || payload.roomNumber !== undefined) {
    hasAtLeastOneField = true;
    const roomNumber = payload.roomNumber === null ? '' : String(payload.roomNumber || '').trim();
    normalized.roomNumber = roomNumber || null;
  }

  if (partial && !hasAtLeastOneField) {
    return { error: 'At least one updatable student field is required' };
  }

  return { value: normalized };
};

const validateRequestStatusPayload = (payload) => {
  const status = String(payload?.status || '').trim();
  if (!status) {
    return { error: 'status is required' };
  }
  if (!allowedRequestStatuses.has(status)) {
    return { error: `status must be one of: ${[...allowedRequestStatuses].join(', ')}` };
  }
  return { value: status };
};

const ensureIndexes = async () => {
  await Promise.all([
    db.collection('students').createIndex({ studentId: 1 }, { unique: true }),
    db.collection('rooms').createIndex({ roomNumber: 1 }, { unique: true }),
  ]);
};

// --- Room Management Endpoints ---

const getRoomsWithOccupancy = async (filter = {}) => {
  if (!db) throw new Error("Database not connected");

  return await db.collection('rooms').aggregate([
    { $match: filter },
    {
      $lookup: {
        from: 'students',
        localField: '_id',
        foreignField: 'room',
        as: 'occupants'
      }
    },
    {
      $addFields: {
        occupiedBeds: { $size: '$occupants' }
      }
    },
    { $sort: { floor: 1, roomNumber: 1 } }
  ]).toArray();
};

const resolveRoomIdFromRoomNumber = async (roomNumber) => {
  if (!roomNumber) return null;
  const roomDoc = await db.collection('rooms').findOne({ roomNumber: String(roomNumber).trim() });
  return roomDoc?._id || null;
};

const fetchStudentsWithRoomNumber = async () => {
  const students = await db.collection('students').aggregate([
    {
      $lookup: {
        from: 'rooms',
        localField: 'room',
        foreignField: '_id',
        as: 'roomDoc',
      },
    },
    {
      $addFields: {
        roomNumber: { $arrayElemAt: ['$roomDoc.roomNumber', 0] },
      },
    },
    {
      $project: {
        roomDoc: 0,
      },
    },
  ]).toArray();

  return students;
};

app.get('/health', async (_req, res) => {
  if (!db) {
    return res.status(503).json({
      ok: false,
      dbConnected: false,
      dbName,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: serverStartedAt.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }

  try {
    const pingStart = Date.now();
    await db.admin().command({ ping: 1 });
    const pingMs = Date.now() - pingStart;
    return res.status(200).json({
      ok: true,
      dbConnected: true,
      dbName,
      pingMs,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: serverStartedAt.toISOString(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      ok: false,
      dbConnected: false,
      dbName,
      error: error.message,
      uptimeSeconds: Math.floor(process.uptime()),
      startedAt: serverStartedAt.toISOString(),
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/api/rooms', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const rooms = await getRoomsWithOccupancy();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rooms', error: error.message });
  }
});

app.post('/api/rooms', async (req, res) => {
  if (!db) return res.status(503).send('Database not connected');
  try {
    const validation = validateRoomPayload(req.body, { partial: false });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }
    const { roomNumber, floor, totalBeds } = validation.value;

    const exists = await db.collection('rooms').findOne({ roomNumber });
    if (exists) {
      return res.status(409).json({ message: 'Room number already exists' });
    }

    const insertResult = await db.collection('rooms').insertOne({
      roomNumber,
      floor,
      totalBeds,
    });

    const createdRoom = await getRoomsWithOccupancy({ _id: insertResult.insertedId });
    return res.status(201).json(createdRoom[0]);
  } catch (error) {
    const duplicateMessage = duplicateKeyErrorMessage(error);
    if (duplicateMessage) {
      return res.status(409).json({ message: duplicateMessage });
    }
    return res.status(500).json({ message: 'Error creating room', error: error.message });
  }
});

// --- Dashboard Vacancy Endpoint (NEW) ---
app.get('/api/dashboard', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const rooms = await getRoomsWithOccupancy();
    const totalBeds = rooms.reduce((sum, room) => sum + room.totalBeds, 0);
    const occupiedBeds = rooms.reduce((sum, room) => sum + room.occupiedBeds, 0);
    const vacancy = totalBeds > 0 ? ((totalBeds - occupiedBeds) / totalBeds) * 100 : 0;

    res.json({
      totalBeds,
      occupiedBeds,
      vacancy: vacancy.toFixed(1) 
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
});

app.put('/api/rooms/:id', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Room ID format' });
    }
    const validation = validateRoomPayload(req.body, { partial: true });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }
    const updateFields = validation.value;

    if (updateFields.roomNumber) {
      const duplicateRoom = await db.collection('rooms').findOne({
        roomNumber: updateFields.roomNumber,
        _id: { $ne: new ObjectId(id) },
      });
      if (duplicateRoom) {
        return res.status(409).json({ message: 'Room number already exists' });
      }
    }

    if (updateFields.totalBeds !== undefined) {
      const occupiedBeds = await db.collection('students').countDocuments({ room: new ObjectId(id) });
      if (updateFields.totalBeds < occupiedBeds) {
        return res.status(400).json({ message: `totalBeds cannot be less than currently occupied beds (${occupiedBeds})` });
      }
    }

    const updateResult = await db.collection('rooms').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (updateResult.matchedCount === 0) {
        return res.status(404).json({ message: 'Room not found' });
    }
    
    const updatedRoom = await getRoomsWithOccupancy({ _id: new ObjectId(id) });
    res.status(200).json(updatedRoom[0]);

  } catch (error) {
    const duplicateMessage = duplicateKeyErrorMessage(error);
    if (duplicateMessage) {
      return res.status(409).json({ message: duplicateMessage });
    }
    res.status(500).json({ message: 'Error updating room', error: error.message });
  }
});

app.delete('/api/rooms/:id', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Room ID format' });
    }
    await db.collection('students').updateMany({ room: new ObjectId(id) }, { $unset: { room: "" } });
    const result = await db.collection('rooms').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Room not found' });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting room', error: error.message });
  }
});

// --- Student Management Endpoints ---

app.get('/api/students', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const students = await fetchStudentsWithRoomNumber();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching students', error: error.message });
  }
});

app.post('/api/students', async (req, res) => {
  if (!db) return res.status(503).send('Database not connected');
  try {
    const validation = validateStudentPayload(req.body, { partial: false });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }
    const { name, studentId, roomNumber } = validation.value;

    const studentIdExists = await db.collection('students').findOne({ studentId });
    if (studentIdExists) {
      return res.status(409).json({ message: 'Student ID already exists' });
    }

    const roomId = await resolveRoomIdFromRoomNumber(roomNumber);
    if (roomNumber && !roomId) {
      return res.status(404).json({ message: 'Assigned room not found' });
    }

    const insertResult = await db.collection('students').insertOne({
      name,
      studentId,
      ...(roomId ? { room: roomId } : {}),
    });

    const createdStudent = await db.collection('students').aggregate([
      { $match: { _id: insertResult.insertedId } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomDoc',
        },
      },
      {
        $addFields: {
          roomNumber: { $arrayElemAt: ['$roomDoc.roomNumber', 0] },
        },
      },
      { $project: { roomDoc: 0 } },
    ]).toArray();

    return res.status(201).json(createdStudent[0]);
  } catch (error) {
    const duplicateMessage = duplicateKeyErrorMessage(error);
    if (duplicateMessage) {
      return res.status(409).json({ message: duplicateMessage });
    }
    return res.status(500).json({ message: 'Error creating student', error: error.message });
  }
});

app.put('/api/students/:id', async (req, res) => {
  if (!db) return res.status(503).send('Database not connected');
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Student ID format' });
    }

    const validation = validateStudentPayload(req.body, { partial: true });
    if (validation.error) {
      return res.status(400).json({ message: validation.error });
    }
    const { name, studentId, roomNumber } = validation.value;
    const updateDoc = {};

    if (name !== undefined) {
      updateDoc.name = name;
    }
    if (studentId !== undefined) {
      const studentIdOwner = await db.collection('students').findOne({ studentId });
      if (studentIdOwner && studentIdOwner._id.toString() !== id) {
        return res.status(409).json({ message: 'Student ID already exists' });
      }
      updateDoc.studentId = studentId;
    }
    if (roomNumber !== undefined) {
      const roomId = await resolveRoomIdFromRoomNumber(roomNumber);
      if (roomNumber && !roomId) {
        return res.status(404).json({ message: 'Assigned room not found' });
      }

      if (roomId) {
        updateDoc.room = roomId;
      } else {
        updateDoc.room = null;
      }
    }

    const updateResult = await db.collection('students').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateDoc }
    );

    if (updateResult.matchedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updatedStudent = await db.collection('students').aggregate([
      { $match: { _id: new ObjectId(id) } },
      {
        $lookup: {
          from: 'rooms',
          localField: 'room',
          foreignField: '_id',
          as: 'roomDoc',
        },
      },
      {
        $addFields: {
          roomNumber: { $arrayElemAt: ['$roomDoc.roomNumber', 0] },
        },
      },
      { $project: { roomDoc: 0 } },
    ]).toArray();

    return res.status(200).json(updatedStudent[0]);
  } catch (error) {
    const duplicateMessage = duplicateKeyErrorMessage(error);
    if (duplicateMessage) {
      return res.status(409).json({ message: duplicateMessage });
    }
    return res.status(500).json({ message: 'Error updating student', error: error.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  if (!db) return res.status(503).send('Database not connected');
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Student ID format' });
    }

    const result = await db.collection('students').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(204).send();
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

// --- Request Management Endpoints ---

app.get('/api/requests', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const requests = await db.collection('requests').find({}).toArray();
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch requests" });
  }
});

app.put('/api/requests/:id', async (req, res) => {
  if (!db) return res.status(503).send("Database not connected");
  try {
    const { id } = req.params;
    const statusValidation = validateRequestStatusPayload(req.body);
    if (statusValidation.error) {
      return res.status(400).json({ message: statusValidation.error });
    }
    const status = statusValidation.value;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid Request ID format' });
    }

    const updateResult = await db.collection('requests').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { status } },
      { returnDocument: 'after' }
    );

    const updatedRequest = updateResult?.value || updateResult;
    if (!updatedRequest) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json(updatedRequest);
  } catch (error) {
    res.status(500).json({ error: "Failed to update request", message: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, _req, res, _next) => {
  const duplicateMessage = duplicateKeyErrorMessage(error);
  if (duplicateMessage) {
    return res.status(409).json({ message: duplicateMessage });
  }
  console.error('Unhandled server error:', error);
  res.status(500).json({ message: 'Internal server error' });
});


// --- Start Server ---
const startServer = async () => {
  try {
    mongoClient = await MongoClient.connect(mongoURI);
    db = mongoClient.db(dbName);
    await ensureIndexes();
    console.log('✅ Successfully connected to MongoDB Atlas!');

    app.listen(port, () => {
      console.log(`🚀 Server is running on http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Could not connect to MongoDB:', error);
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${signal} received. Shutting down gracefully...`);
  try {
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed.');
    }
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', () => {
  shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

startServer();
