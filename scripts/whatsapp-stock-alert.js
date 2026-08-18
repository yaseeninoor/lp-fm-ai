'use strict';

const admin = require('firebase-admin');

// ============================================================
// CONFIGURATION
// ============================================================

const FIRESTORE_COLLECTION =
  process.env.FIRESTORE_COLLECTION || 'materials';

const WHATSAPP_ACCESS_TOKEN =
  process.env.WHATSAPP_ACCESS_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID =
  process.env.WHATSAPP_PHONE_NUMBER_ID;

const WHATSAPP_TO =
  process.env.WHATSAPP_TO;

const FIREBASE_SERVICE_ACCOUNT_JSON =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

// WhatsApp Cloud API
const WHATSAPP_API_URL =
  `https://graph.facebook.com/v23.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

// WhatsApp text limit
const MAX_WHATSAPP_LENGTH = 4000;

// ============================================================
// VALIDATE ENVIRONMENT
// ============================================================

function validateEnvironment() {
  const missing = [];

  if (!FIREBASE_SERVICE_ACCOUNT_JSON) {
    missing.push('FIREBASE_SERVICE_ACCOUNT_JSON');
  }

  if (!WHATSAPP_ACCESS_TOKEN) {
    missing.push('WHATSAPP_ACCESS_TOKEN');
  }

  if (!WHATSAPP_PHONE_NUMBER_ID) {
    missing.push('WHATSAPP_PHONE_NUMBER_ID');
  }

  if (!WHATSAPP_TO) {
    missing.push('WHATSAPP_TO');
  }

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// ============================================================
// FIREBASE INITIALIZATION
// ============================================================

function initializeFirebase() {
  let serviceAccount;

  try {
    serviceAccount =
      JSON.parse(FIREBASE_SERVICE_ACCOUNT_JSON);
  } catch (error) {
    throw new Error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.'
    );
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  return admin.firestore();
}

// ============================================================
// HELPERS
// ============================================================

function getFirstValue(data, fieldNames) {
  for (const field of fieldNames) {
    if (
      Object.prototype.hasOwnProperty.call(data, field) &&
      data[field] !== undefined &&
      data[field] !== null &&
      data[field] !== ''
    ) {
      return data[field];
    }
  }

  return null;
}

function normalizeNumber(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const cleaned = String(value)
    .replace(/,/g, '')
    .trim();

  const number = Number(cleaned);

  return Number.isFinite(number) ? number : null;
}

function cleanText(value, fallback = '-') {
  if (value === null || value === undefined) {
    return fallback;
  }

  const text = String(value).trim();

  return text || fallback;
}

// ============================================================
// FIELD MAPPING
// ============================================================

function parseMaterial(doc) {
  const data = doc.data() || {};

  const materialCode = getFirstValue(data, [
    'materialCode',
    'material_code',
    'materialNo',
    'materialNumber',
    'materialNumberCode',
    'matnr',
    'matkl',
    'code',
    'material',
    'Material Code',
    'MaterialCode',
    'Matkl',
  ]);

  const description = getFirstValue(data, [
    'materialDescription',
    'material_description',
    'description',
    'materialDesc',
    'materialName',
    'name',
    'Material Description',
    'MaterialDescription',
    'Material',
  ]);

  const stockRaw = getFirstValue(data, [
    'stock',
    'currentStock',
    'current_stock',
    'availableStock',
    'available_stock',
    'quantity',
    'qty',
    'balance',
    'onHand',
    'on_hand',
    'Stock',
  ]);

  const minimumRaw = getFirstValue(data, [
    'minimumStock',
    'minimum_stock',
    'minStock',
    'min_stock',
    'minimum',
    'min',
    'reorderLevel',
    'reorder_level',
    'reorderPoint',
    'reorder_point',
    'Minimum',
  ]);

  const storage = getFirstValue(data, [
    'storageLocation',
    'storage_location',
    'storage',
    'location',
    'store',
    'Storage Location',
    'Storage',
  ]);

  const unit = getFirstValue(data, [
    'baseUnit',
    'base_unit',
    'unit',
    'uom',
    'UOM',
    'Base Unit',
  ]);

  const stock = normalizeNumber(stockRaw);
  const minimum = normalizeNumber(minimumRaw);

  return {
    id: doc.id,
    materialCode: cleanText(materialCode),
    description: cleanText(description, doc.id),
    stock,
    minimum,
    storage: cleanText(storage),
    unit: cleanText(unit),
    raw: data,
  };
}

// ============================================================
// LOAD INVENTORY
// ============================================================

async function loadInventory(db) {
  console.log('Loading LP-FM inventory...');

  const snapshot = await db
    .collection(FIRESTORE_COLLECTION)
    .get();

  console.log(`Found ${snapshot.size} materials`);

  const materials = [];

  snapshot.forEach((doc) => {
    materials.push(parseMaterial(doc));
  });

  return materials;
}

// ============================================================
// STOCK ALERT LOGIC
// ============================================================

function findStockAlerts(materials) {
  const alerts = [];

  let skipped = 0;

  for (const material of materials) {
    // IMPORTANT:
    // Do NOT convert missing values to zero.
    // Missing stock/minimum means we cannot safely calculate an alert.
    if (
      material.stock === null ||
      material.minimum === null
    ) {
      skipped++;

      console.log(
        `Skipping ${material.description}: ` +
        `stock=${material.stock}, minimum=${material.minimum}`
      );

      continue;
    }

    if (material.stock <= material.minimum) {
      alerts.push(material);
    }
  }

  console.log(`Found ${alerts.length} stock alerts`);

  if (skipped > 0) {
    console.log(
      `Skipped ${skipped} materials because stock/minimum ` +
      `fields were missing or invalid.`
    );
  }

  return alerts;
}

// ============================================================
// DATE
// ============================================================

function getDateString() {
  const now = new Date();

  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Dubai',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(now);
}

// ============================================================
// CREATE ALERT MESSAGE
// ============================================================

function createAlertMessage(alerts) {
  const lines = [];

  lines.push('🚨 LP-FM MATERIAL STOCK ALERT');
  lines.push('');
  lines.push(`📅 Date: ${getDateString()}`);
  lines.push('');
  lines.push(`Total Alerts: ${alerts.length}`);
  lines.push('');

  alerts.forEach((item, index) => {
    const status =
      item.stock === 0
        ? '🔴'
        : '🟠';

    lines.push(
      `${status} ${index + 1}. ${item.materialCode}`
    );

    lines.push(
      `Material: ${item.description}`
    );

    lines.push(
      `Stock: ${item.stock} ${item.unit !== '-' ? item.unit : ''}`.trim()
    );

    lines.push(
      `Minimum: ${item.minimum} ${item.unit !== '-' ? item.unit : ''}`.trim()
    );

    lines.push(
      `Storage: ${item.storage}`
    );

    lines.push('');
  });

  lines.push(
    'Please arrange replenishment as required.'
  );

  lines.push('');
  lines.push('LP-FM Inventory');
  lines.push('LP-Store');

  return lines.join('\n');
}

// ============================================================
// SPLIT WHATSAPP MESSAGE
// ============================================================

function splitMessage(text, maxLength = MAX_WHATSAPP_LENGTH) {
  if (text.length <= maxLength) {
    return [text];
  }

  const messages = [];
  let current = '';

  const lines = text.split('\n');

  for (const line of lines) {
    const candidate =
      current.length === 0
        ? line
        : `${current}\n${line}`;

    if (candidate.length <= maxLength) {
      current = candidate;
      continue;
    }

    if (current.length > 0) {
      messages.push(current);
      current = '';
    }

    // If one individual line is too long,
    // split it safely.
    if (line.length > maxLength) {
      let remaining = line;

      while (remaining.length > maxLength) {
        messages.push(
          remaining.slice(0, maxLength)
        );

        remaining =
          remaining.slice(maxLength);
      }

      current = remaining;
    } else {
      current = line;
    }
  }

  if (current.length > 0) {
    messages.push(current);
  }

  return messages;
}

// ============================================================
// SEND WHATSAPP MESSAGE
// ============================================================

async function sendWhatsApp(message) {
  console.log('Sending WhatsApp message...');

  const response = await fetch(
    WHATSAPP_API_URL,
    {
      method: 'POST',

      headers: {
        'Authorization':
          `Bearer ${WHATSAPP_ACCESS_TOKEN}`,

        'Content-Type':
          'application/json',
      },

      body: JSON.stringify({
        messaging_product: 'whatsapp',

        recipient_type: 'individual',

        to: WHATSAPP_TO,

        type: 'text',

        text: {
          preview_url: false,
          body: message,
        },
      }),
    }
  );

  const responseText =
    await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    result = {
      raw: responseText,
    };
  }

  if (!response.ok) {
    console.error(
      'WhatsApp API response:',
      JSON.stringify(result, null, 2)
    );

    if (
      result &&
      result.error &&
      result.error.code === 190
    ) {
      throw new Error(
        'WhatsApp Authentication Error (code 190). ' +
        'Your WHATSAPP_ACCESS_TOKEN is invalid, expired, ' +
        'revoked, or does not have permission.'
      );
    }

    throw new Error(
      `WhatsApp API error: ${responseText}`
    );
  }

  console.log(
    '✅ WhatsApp message sent successfully.'
  );

  if (result.messages) {
    console.log(
      'Message ID:',
      result.messages[0]?.id || '-'
    );
  }

  return result;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  try {
    validateEnvironment();

    const db =
      initializeFirebase();

    const materials =
      await loadInventory(db);

    if (materials.length === 0) {
      console.log(
        'No materials found.'
      );

      return;
    }

    const alerts =
      findStockAlerts(materials);

    if (alerts.length === 0) {
      console.log(
        '✅ No stock alerts found.'
      );

      return;
    }

    const message =
      createAlertMessage(alerts);

    console.log('');
    console.log(message);
    console.log('');

    const messages =
      splitMessage(message);

    console.log(
      `Prepared ${messages.length} WhatsApp message(s).`
    );

    for (
      let i = 0;
      i < messages.length;
      i++
    ) {
      console.log(
        `Sending WhatsApp message ${i + 1}/${messages.length}...`
      );

      await sendWhatsApp(messages[i]);

      // Small delay between messages
      if (i < messages.length - 1) {
        await new Promise(
          resolve => setTimeout(resolve, 1000)
        );
      }
    }

    console.log('');
    console.log(
      '✅ LP-FM stock alert completed successfully.'
    );
  } catch (error) {
    console.error('');
    console.error(
      '❌ ERROR:',
      error.message
    );
    console.error('');

    process.exit(1);
  }
}

main();