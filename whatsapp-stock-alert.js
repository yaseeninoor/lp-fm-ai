const admin = require("firebase-admin");

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "{}"
);

if (!serviceAccount.project_id) {
  throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON GitHub secret.");
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const collectionName =
  process.env.FIRESTORE_COLLECTION || "materials";

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const recipient = process.env.WHATSAPP_TO;

if (!token || !phoneNumberId || !recipient) {
  throw new Error(
    "Missing WhatsApp configuration. Check WHATSAPP_ACCESS_TOKEN secret and WHATSAPP_PHONE_NUMBER_ID / WHATSAPP_TO variables."
  );
}

const templateName =
  process.env.WHATSAPP_TEMPLATE_NAME || "";

const templateLang =
  process.env.WHATSAPP_TEMPLATE_LANG || "en_US";

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function cleanPhone(value) {
  return String(value).replace(/[^\d]/g, "");
}

async function sendWhatsAppText(text) {
  const url =
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanPhone(recipient),
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `WhatsApp API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

/*
  If WHATSAPP_TEMPLATE_NAME is configured, send a template message.
  Expected template body variables:
    {{1}} Material Code
    {{2}} Description
    {{3}} Current Stock
    {{4}} Minimum Stock
    {{5}} Unit
    {{6}} Storage
*/
async function sendWhatsAppTemplate(item) {
  const url =
    `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`;

  const components = [
    {
      type: "body",
      parameters: [
        { type: "text", text: String(item.code || "-") },
        { type: "text", text: String(item.description || "-") },
        { type: "text", text: String(item.stock) },
        { type: "text", text: String(item.minimum) },
        { type: "text", text: String(item.unit || "-") },
        { type: "text", text: String(item.storage || "-") },
      ],
    },
  ];

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: cleanPhone(recipient),
      type: "template",
      template: {
        name: templateName,
        language: { code: templateLang },
        components,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      `WhatsApp template API error ${response.status}: ${JSON.stringify(data)}`
    );
  }

  return data;
}

function makeText(item) {
  const zero = item.stock <= 0;

  return [
    zero
      ? "🚨 LP-FM ZERO STOCK ALERT"
      : "⚠️ LP-FM LOW STOCK ALERT",
    "",
    `Material Code: ${item.code || "-"}`,
    `Description: ${item.description || "-"}`,
    `Current Stock: ${item.stock} ${item.unit || ""}`.trim(),
    `Minimum Stock: ${item.minimum} ${item.unit || ""}`.trim(),
    `Storage: ${item.storage || "-"}`,
    "",
    zero
      ? "Please arrange replenishment immediately."
      : "Please arrange material replenishment.",
    "",
    "LP-FM Inventory System",
  ].join("\n");
}

async function main() {
  console.log(`Reading Firestore collection: ${collectionName}`);

  const snapshot = await db.collection(collectionName).get();

  let alerts = 0;
  let cleared = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();

    const stock = number(data.stock);
    const minimum = number(data.minimum);

    if (!data.code && !data.description) {
      continue;
    }

    const isLow = stock <= minimum;
    const alreadySent = Boolean(data.whatsappAlertSent);

    if (isLow && !alreadySent) {
      const item = {
        code: data.code || docSnap.id,
        description: data.description || "",
        stock,
        minimum,
        unit: data.unit || "",
        storage: data.storage || "",
      };

      console.log(
        `Alerting: ${item.code} | stock=${stock} | minimum=${minimum}`
      );

      if (templateName) {
        await sendWhatsAppTemplate(item);
      } else {
        await sendWhatsAppText(makeText(item));
      }

      await docSnap.ref.update({
        whatsappAlertSent: true,
        whatsappAlertSentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      alerts++;
    }

    // Reset the flag once stock becomes healthy again.
    if (!isLow && alreadySent) {
      await docSnap.ref.update({
        whatsappAlertSent: false,
        whatsappAlertClearedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      cleared++;
    }
  }

  console.log(`Alerts sent: ${alerts}`);
  console.log(`Alert flags cleared: ${cleared}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
