const listing = require("./store.config.json");

module.exports = () => {
  const contact = {};
  for (const [field, variable] of Object.entries({
    firstName: "APP_REVIEW_FIRST_NAME",
    lastName: "APP_REVIEW_LAST_NAME",
    email: "APP_REVIEW_EMAIL",
    phone: "APP_REVIEW_PHONE",
  })) {
    const value = process.env[variable]?.trim();
    if (!value) throw new Error(`Provide ${variable} privately before publishing reviewer instructions.`);
    contact[field] = value;
  }
  return {
    ...listing,
    apple: {
      ...listing.apple,
      review: {
        ...contact,
        notes: "FitCheck Coach is a fitness logging app with Sign in with Apple and account sync. Use Sign in with Apple to create a review account; there is no separate email/password login. Keep any existing device logs separate if prompted, then complete goal onboarding.\n\nUse fictional records in Today to log weight, calories, protein, steps, and workouts. Progress, Training, and Goals summarize those records. Blank metrics are optional and are not counted as zero. Account provides sync, backup export, sign-out, and account deletion. Deletion requires fresh Apple confirmation and removes the cloud account and its active records; original device logs and previously exported backups are retained.\n\nThe app uses rule-based coaching, not OpenAI. It contains no advertising, purchases, or medical diagnosis. Internet access is required for initial sign-in and cloud operations. Previously verified accounts can access cached records offline when the stored session and offline permission remain valid; expired or rejected sessions may require reconnection.",
      },
    },
  };
};
