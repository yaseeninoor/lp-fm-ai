const { GoogleAuth } = require("google-auth-library");

const FIREBASE_JSON =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

const WHATSAPP_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_TO =
  process.env.WHATSAPP_TO;

const COLLECTION =
  process.env.FIRESTORE_COLLECTION || "materials";

if (!FIREBASE_JSON) {
  throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is missing");
}

if (!WHATSAPP_TOKEN) {
  throw new Error("WHATSAPP_ACCESS_TOKEN is missing");
}

if (!PHONE_NUMBER_ID) {
  throw new Error("WHATSAPP_PHONE_NUMBER_ID is missing");
}

if (!WHATSAPP_TO) {
  throw new Error("WHATSAPP_TO is missing");
}


// ================================
// FIREBASE SERVICE ACCOUNT
// ================================

const serviceAccount =
  JSON.parse(FIREBASE_JSON);

const PROJECT_ID =
  serviceAccount.project_id;


// ================================
// GET FIRESTORE ACCESS TOKEN
// ================================

async function getFirebaseToken() {

  const auth = new GoogleAuth({
    credentials: serviceAccount,
    scopes: [
      "https://www.googleapis.com/auth/datastore"
    ]
  });

  const client =
    await auth.getClient();

  const token =
    await client.getAccessToken();

  return token.token;
}


// ================================
// GET FIRESTORE MATERIALS
// ================================

async function getMaterials() {

  const token =
    await getFirebaseToken();

  const url =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION}?pageSize=1000`;

  const response =
    await fetch(url, {
      headers: {
        Authorization:
          `Bearer ${token}`
      }
    });

  if (!response.ok) {

    const error =
      await response.text();

    throw new Error(
      `Firestore error: ${error}`
    );
  }

  const data =
    await response.json();

  return data.documents || [];
}


// ================================
// FIRESTORE VALUE CONVERTER
// ================================

function value(field) {

  if (!field) {
    return null;
  }

  if (field.stringValue !== undefined) {
    return field.stringValue;
  }

  if (field.integerValue !== undefined) {
    return Number(field.integerValue);
  }

  if (field.doubleValue !== undefined) {
    return Number(field.doubleValue);
  }

  if (field.booleanValue !== undefined) {
    return field.booleanValue;
  }

  return null;
}


// ================================
// FIND LOW STOCK
// ================================

function getAlerts(documents) {

  const alerts = [];

  for (const document of documents) {

    const fields =
      document.fields || {};

    const code =
      value(fields.code) || "-";

    const description =
      value(fields.description) || "-";

    const stock =
      Number(value(fields.stock) || 0);

    const minimum =
      Number(value(fields.minimum) || 0);

    const unit =
      value(fields.unit) || "";

    const storage =
      value(fields.storage) || "";

    // ZERO STOCK
    if (stock <= 0) {

      alerts.push({
        type: "ZERO",
        code,
        description,
        stock,
        minimum,
        unit,
        storage
      });

      continue;
    }

    // LOW STOCK
    if (
      minimum > 0 &&
      stock <= minimum
    ) {

      alerts.push({
        type: "LOW",
        code,
        description,
        stock,
        minimum,
        unit,
        storage
      });

    }

  }

  return alerts;
}


// ================================
// CREATE WHATSAPP MESSAGE
// ================================

function createMessage(alerts) {

  const today =
    new Date().toLocaleDateString(
      "en-GB",
      {
        timeZone:
          "Asia/Dubai"
      }
    );

  let message =
`🚨 LP-FM MATERIAL STOCK ALERT

📅 Date: ${today}

Total Alerts: ${alerts.length}

`;

  alerts.forEach(
    (item, index) => {

      const icon =
        item.type === "ZERO"
          ? "🔴"
          : "🟠";

      message +=
`${icon} ${index + 1}. ${item.code}
Material: ${item.description}
Stock: ${item.stock} ${item.unit}
Minimum: ${item.minimum}
Storage: ${item.storage}

`;

    }
  );

  message +=
`Please arrange replenishment as required.

LP-FM Inventory
LP-Store`;

  return message;
}


// ================================
// SEND WHATSAPP
// ================================

async function sendWhatsApp(message) {

  const url =
    `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`;

  const body = {

    messaging_product:
      "whatsapp",

    recipient_type:
      "individual",

    to:
      WHATSAPP_TO,

    type:
      "text",

    text: {
      preview_url:
        false,

      body:
        message
    }

  };

  const response =
    await fetch(
      url,
      {
        method:
          "POST",

        headers: {

          Authorization:
            `Bearer ${WHATSAPP_TOKEN}`,

          "Content-Type":
            "application/json"

        },

        body:
          JSON.stringify(body)
      }
    );

  const result =
    await response.json();

  if (!response.ok) {

    throw new Error(
      "WhatsApp API error: " +
      JSON.stringify(result)
    );

  }

  console.log(
    "WhatsApp message sent:",
    JSON.stringify(result)
  );

}


// ================================
// MAIN
// ================================

async function main() {

  console.log(
    "Loading LP-FM inventory..."
  );

  const documents =
    await getMaterials();

  console.log(
    `Found ${documents.length} materials`
  );

  const alerts =
    getAlerts(documents);

  console.log(
    `Found ${alerts.length} stock alerts`
  );

  if (alerts.length === 0) {

    console.log(
      "No zero/low stock materials. No WhatsApp message sent."
    );

    return;
  }

  const message =
    createMessage(alerts);

  console.log(
    message
  );

  await sendWhatsApp(
    message
  );

}

main().catch(
  error => {

    console.error(
      error
    );

    process.exit(1);

  }
);
