/**
 * Sync existing Gumlet assets (uploaded via dashboard) into MongoDB.
 *
 * HOW TO USE:
 * ─────────────────────────────────────────────────────────────────
 * 1. Open your Gumlet dashboard → Copy the asset_id of each video.
 * 2. Edit the ASSET_MAP array below with:
 *      { asset_id, weekNumber, dayNumber, title }
 *    title is optional — if omitted, the script fetches it from Gumlet.
 * 3. Run dry-run first (safe, no writes):
 *      node src/utils/syncGumletToMongo.js
 * 4. When satisfied, run with --execute to write to MongoDB:
 *      node src/utils/syncGumletToMongo.js --execute
 *
 * The script skips any entry that already has the same asset_id stored,
 * so it is safe to re-run.
 * ─────────────────────────────────────────────────────────────────
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { getAsset } = require("../services/gumlet.service");
const Course = require("../models/Course");
const SharedContent = require("../models/SharedContent");
const dbConnect = require("../config/dbConnect");

const DRY_RUN = !process.argv.includes("--execute");

// =================================================================
//  FILL THIS IN — one entry per video you want to import
// =================================================================
const ASSET_MAP = [
  // { asset_id: "69b92445dc37184fc7e3f0df", weekNumber: 1, dayNumber: 1, title: "Introduction" },
  // { asset_id: "69b92445dc37184fc7e3f0e0", weekNumber: 1, dayNumber: 2 },  // title optional
  // Add more entries here...
];
// =================================================================

// ─────────────────────────────────────────────────────────────────
// Insert into Course or SharedContent via $push + arrayFilters
// ─────────────────────────────────────────────────────────────────
async function insertIntoDocument(Model, filter, weekNumber, dayNumber, contentDoc, label) {
  if (DRY_RUN) {
    console.log(
      `  [DRY-RUN] Would push into ${label} -> week ${weekNumber} day ${dayNumber}:`,
      JSON.stringify(contentDoc)
    );
    return true;
  }

  const result = await Model.updateOne(
    {
      ...filter,
      "weeks.weekNumber": weekNumber,
    },
    {
      $push: {
        "weeks.$[week].days.$[day].contents": contentDoc,
      },
    },
    {
      arrayFilters: [
        { "week.weekNumber": weekNumber },
        { "day.dayNumber": dayNumber },
      ],
    }
  );

  return result.modifiedCount > 0;
}

// ─────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────
async function main() {
  console.log("=".repeat(60));
  console.log("  Gumlet -> MongoDB Sync Utility");
  console.log("  Mode:", DRY_RUN ? "DRY-RUN (no writes)" : "EXECUTE (will write to DB)");
  console.log("=".repeat(60));

  if (ASSET_MAP.length === 0) {
    console.log("\nASSET_MAP is empty.");
    console.log("  Edit syncGumletToMongo.js and fill in the ASSET_MAP array with your");
    console.log("  Gumlet asset IDs and their week/day positions, then re-run.");
    process.exit(0);
  }

  // 1. Verify each asset_id against Gumlet API
  console.log(`\n> Verifying ${ASSET_MAP.length} asset(s) with Gumlet API...`);
  const verified = [];

  for (const entry of ASSET_MAP) {
    if (!entry.asset_id) {
      console.log(`  [SKIP] Entry missing asset_id:`, JSON.stringify(entry));
      continue;
    }
    try {
      const asset = await getAsset(entry.asset_id);

      if (asset.status !== "ready") {
        console.log(
          `  [SKIP] status=${asset.status}: asset_id=${entry.asset_id} - not ready yet`
        );
        continue;
      }

      verified.push({
        asset_id: entry.asset_id,
        weekNumber: entry.weekNumber,
        dayNumber: entry.dayNumber,
        title:
          entry.title ||
          asset.title ||
          `Week ${entry.weekNumber} Day ${entry.dayNumber} Video`,
        duration: asset.duration || 0,
        status: asset.status,
      });
      console.log(
        `  [OK] asset_id=${entry.asset_id}  status=ready` +
          `  title="${entry.title || asset.title || "(no title)"}"` +
          `  -> week=${entry.weekNumber} day=${entry.dayNumber}`
      );
    } catch (err) {
      console.log(
        `  [FAIL] (${err.response?.status || err.message}): asset_id=${entry.asset_id}`
      );
    }
  }

  console.log(
    `\n  ${verified.length} / ${ASSET_MAP.length} asset(s) verified and ready to sync`
  );

  if (verified.length === 0) {
    console.log("  Nothing to sync.");
    process.exit(0);
  }

  // 2. Connect to MongoDB
  console.log("\n> Connecting to MongoDB...");
  await dbConnect();

  // 3. Load Courses and SharedContent for duplicate checking
  const [courses, sharedContents] = await Promise.all([
    Course.find({}).lean(),
    SharedContent.find({}).lean(),
  ]);
  console.log(
    `  Loaded ${courses.length} Course(s) and ${sharedContents.length} SharedContent(s)`
  );

  // 4. Process each verified asset
  console.log("\n-- Processing ------------------------------------------");

  let inserted = 0;
  let skippedDuplicate = 0;
  let skippedNoTarget = 0;

  for (const { asset_id, weekNumber, dayNumber, title, duration } of verified) {
    const label = `"${title}" (${asset_id})  week=${weekNumber} day=${dayNumber}`;
    const contentDoc = { type: "video", title, asset_id, duration };
    let synced = false;

    // SharedContent first (most courses share one)
    for (const sc of sharedContents) {
      const week = sc.weeks.find((w) => w.weekNumber === weekNumber);
      if (!week) continue;
      const day = week.days.find((d) => d.dayNumber === dayNumber);
      if (!day) continue;

      if (day.contents.some((c) => c.asset_id === asset_id)) {
        console.log(`  [SKIP-DUP] Already in SharedContent "${sc.name}": ${label}`);
        skippedDuplicate++;
        synced = true;
        break;
      }

      const ok = await insertIntoDocument(
        SharedContent,
        { _id: sc._id },
        weekNumber,
        dayNumber,
        contentDoc,
        `SharedContent "${sc.name}"`
      );

      if (ok) {
        console.log(
          `  [OK] ${DRY_RUN ? "[DRY-RUN] " : ""}Inserted into SharedContent "${sc.name}": ${label}`
        );
        inserted++;
        synced = true;
        break;
      }
    }

    if (synced) continue;

    // Direct Course weeks (standalone courses without sharedContentId)
    for (const course of courses) {
      if (course.sharedContentId) continue;
      const week = (course.weeks || []).find((w) => w.weekNumber === weekNumber);
      if (!week) continue;
      const day = week.days.find((d) => d.dayNumber === dayNumber);
      if (!day) continue;

      if (day.contents.some((c) => c.asset_id === asset_id)) {
        console.log(`  [SKIP-DUP] Already in Course "${course.title}": ${label}`);
        skippedDuplicate++;
        synced = true;
        break;
      }

      const ok = await insertIntoDocument(
        Course,
        { _id: course._id },
        weekNumber,
        dayNumber,
        contentDoc,
        `Course "${course.title}"`
      );

      if (ok) {
        console.log(
          `  [OK] ${DRY_RUN ? "[DRY-RUN] " : ""}Inserted into Course "${course.title}": ${label}`
        );
        inserted++;
        synced = true;
        break;
      }
    }

    if (!synced) {
      console.log(`  [NO TARGET] ${label}`);
      console.log(
        `    Make sure week ${weekNumber} / day ${dayNumber} exists in a Course or SharedContent first.`
      );
      skippedNoTarget++;
    }
  }

  // 5. Summary
  console.log("\n-- Summary ---------------------------------------------");
  console.log(`  Entries in ASSET_MAP:    ${ASSET_MAP.length}`);
  console.log(`  Verified with Gumlet:    ${verified.length}`);
  console.log(`  Already in DB (skip):    ${skippedDuplicate}`);
  console.log(`  No matching week/day:    ${skippedNoTarget}`);
  console.log(`  ${DRY_RUN ? "Would insert" : "Inserted"}:             ${inserted}`);

  if (DRY_RUN && inserted > 0) {
    console.log(
      "\n  Run with --execute to apply:\n  node src/utils/syncGumletToMongo.js --execute"
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  mongoose.disconnect();
  process.exit(1);
});
