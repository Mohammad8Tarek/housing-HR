import fs from "fs";

const content = fs.readFileSync("dist/public/assets/index-CngW3-Bw.js", "utf8");
console.log("File size:", content.length);

// Look for component names or strings
const searchTerms = [
  "settings", "whatsapp", "profiles", "reports", "ReportPrintStudio",
  "DailyOperations", "BuildingCapacity", "Housekeeping", "InHouse"
];

for (const term of searchTerms) {
  const count = (content.match(new RegExp(term, "gi")) || []).length;
  console.log(`${term}: ${count} occurrences`);
}

// Find export or default
console.log("First 300 chars:", content.substring(0, 300));
console.log("Last 300 chars:", content.substring(content.length - 300));
