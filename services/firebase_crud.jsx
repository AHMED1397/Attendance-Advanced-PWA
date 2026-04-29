import { ref, set, onValue, get, update, remove } from "firebase/database";
import database from "./firebase_initialize.jsx";

async function writeUserData(path, data) {
  const db = database;
  set(ref(db, path), data);
}

async function updateUserData(userName, id, updatedAttendance) {
  const db = database;
  const dbref = ref(db, `attendanceDetails/${userName}/${id}`);
  await update(dbref, updatedAttendance);
}

async function readUserData(value) {
  const db = database;
  const dataref = ref(db, value);
  try {
    const snapshot = await get(dataref);
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No data available");
    }
  } catch (error) {
    console.error("Error reading data:", error);
  }
}

async function deleteUserData(path) {
  const db = database;
  const dbref = ref(db, path);
  await remove(dbref);
}

export { writeUserData, readUserData, updateUserData, deleteUserData };
