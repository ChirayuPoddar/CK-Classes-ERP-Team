const mongoose = require('mongoose');
const path = require('path');

// Require separate MONGO_URI injection to prevent accidental execution
const MONGO_URI = process.env.MIGRATION_MONGO_URI;

const Tenant = require('../../models/Tenant');
const AttendanceOverrideHistory = require('../../models/AttendanceOverrideHistory');
const ExamMark = require('../../models/ExamMark');
const PromotionHistory = require('../../models/PromotionHistory');
const TimetableVersion = require('../../models/TimetableVersion');

async function run() {
  if (!MONGO_URI) {
    console.error('[Guardrail] FATAL: MIGRATION_MONGO_URI is not set. Refusing to run.');
    process.exit(1);
  }

  console.log('[Migration] Connecting to MongoDB...');
  
  const parsedUri = new URL(MONGO_URI);
  const targetHost = parsedUri.host;
  let targetDbName = 'ck_classes';
  
  // Rule: Print the exact resolved database name and connection host to console FIRST
  console.log(`[Guardrail] Target Connection: ${parsedUri.protocol}//${targetHost}/${targetDbName}`);

  await mongoose.connect(MONGO_URI, { dbName: 'ck_classes' });
  
  const defaultTenant = await Tenant.findOne({ slug: 'ck-classes-main' });
  if (!defaultTenant) {
    console.error('[Migration] Default tenant not found! Cannot backfill.');
    process.exit(1);
  }
  
  const filter = { $or: [{ tenantId: null }, { tenantId: { $exists: false } }] };
  const update = { $set: { tenantId: defaultTenant._id } };
  
  const att = await AttendanceOverrideHistory.updateMany(filter, update);
  console.log(`Updated AttendanceOverrideHistory: ${att.modifiedCount} document(s)`);
  
  const ex = await ExamMark.updateMany(filter, update);
  console.log(`Updated ExamMark: ${ex.modifiedCount} document(s)`);
  
  const promo = await PromotionHistory.updateMany(filter, update);
  console.log(`Updated PromotionHistory: ${promo.modifiedCount} document(s)`);
  
  const tt = await TimetableVersion.updateMany(filter, update);
  console.log(`Updated TimetableVersion: ${tt.modifiedCount} document(s)`);
  
  process.exit(0);
}
run();
