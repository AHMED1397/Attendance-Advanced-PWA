import { ref, set, onValue, get, update, remove } from "firebase/database";
import database from "./firebase_initialize.jsx";

async function writeUserData(path, data) {
  const db = database;
  await set(ref(db, path), data);
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

async function updateQadrPlans(className, subject, data) {
  const db = database;
  const dbref = ref(db, `qadrPlans/${className}/${subject}`);
  await update(dbref, data);
}

async function addUsulFiqhForGr5() {
  const db = database;
  const dbref = ref(db, `qadrPlans/الصف الخامس/أصول الفقه`);
  await update(dbref, {
    book: "الوجيز في أصول الفقه",
    end: 85,
    id: "gr5_usul",
    midYearEnd: 45,
    start: 13,
    unitLabel: "صفحة",
    unitLabelEn: "Page"
  });
}

export { writeUserData, readUserData, updateUserData, deleteUserData, updateQadrPlans, addUsulFiqhForGr5 };
