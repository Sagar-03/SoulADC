const path = require("path");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const SharedContent = require("../src/models/SharedContent");

const TARGET_ID = "692c2b2f9e576c0e46b846ed"; // your sharedContentId

const WEEK_NUMBER = 2;

const assetIds = [
  "69b73fefc8f901eb75196444",
  "69b73ff1bf83f6c336edc6a1",
  "69b73ff1dc37184fc7bab2dc",
  "69b73ff2dc37184fc7bab2e8",
  "69b73ff3dc37184fc7bab2f4",
  "69b73ff3c8f901eb75196491",
"69b73ff4bf83f6c336edc6cc",
"69b73ff5dc37184fc7bab30e",
"69b73ff5dc37184fc7bab326",
"69b73ff0dc37184fc7bab2c2"


];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("✔ Connected");

  for (let i = 0; i < assetIds.length; i++) {
    const day = i + 1;
    const asset_id = assetIds[i];

    const videoObject = {
      type: "video",
      title: `Week ${WEEK_NUMBER} Day ${day}`,
      asset_id,
      duration: 0
    };

    // Duplicate check
    const exists = await SharedContent.findOne({
      _id: TARGET_ID,
      "weeks.weekNumber": WEEK_NUMBER,
      "weeks.days.dayNumber": day,
      "weeks.days.contents.asset_id": asset_id
    });

    if (exists) {
      console.log(`⚠ Duplicate skipped → Day ${day}`);
      continue;
    }

    const result = await SharedContent.updateOne(
      {
        _id: TARGET_ID,
        "weeks.weekNumber": WEEK_NUMBER
      },
      {
        $push: {
          "weeks.$.days.$[d].contents": videoObject
        }
      },
      {
        arrayFilters: [{ "d.dayNumber": day }]
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`✔ Inserted → Day ${day}`);
    } else {
      console.log(`⚠ Day ${day} not found in DB`);
    }
  }

  await mongoose.disconnect();
  console.log("✔ Done");
}

run();