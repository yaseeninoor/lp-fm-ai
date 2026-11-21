const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

function callerRole(token) {
  return token.role || (token.superadmin === true ? "superadmin" : token.admin === true ? "admin" : "user");
}

exports.setNoorUserRole = onCall({ region: "us-central1" }, async (request) => {
  if (!request.auth || callerRole(request.auth.token) !== "superadmin") {
    throw new HttpsError("permission-denied", "Super Admin அனுமதி தேவை.");
  }
  const uid = typeof request.data?.uid === "string" ? request.data.uid.trim() : "";
  const role = request.data?.role;
  if (!uid || !["user", "admin", "superadmin"].includes(role)) {
    throw new HttpsError("invalid-argument", "சரியான User UID மற்றும் Role தேவை.");
  }
  if (uid === request.auth.uid && role !== "superadmin") {
    throw new HttpsError("failed-precondition", "உங்கள் சொந்த Super Admin அனுமதியை இங்கே மாற்ற முடியாது.");
  }
  const auth = getAuth();
  const target = await auth.getUser(uid);
  const claims = { ...(target.customClaims || {}) };
  delete claims.superadmin;
  delete claims.admin;
  delete claims.role;
  if (role === "admin") {
    claims.admin = true;
    claims.role = "admin";
  } else if (role === "superadmin") {
    claims.admin = true;
    claims.superadmin = true;
    claims.role = "superadmin";
  } else {
    claims.role = "user";
  }
  await auth.setCustomUserClaims(uid, claims);
  await getFirestore().collection("users").doc(uid).set({
    role,
    updatedAt: FieldValue.serverTimestamp()
  }, { merge: true });
  return { success: true, uid, role, message: "Role மாற்றப்பட்டது. பயனர் மீண்டும் Login செய்ய வேண்டும்." };
});
