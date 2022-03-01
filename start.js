require("dotenv").config();
const { exit } = require("process");
if (
  !(
    process.env.DB_URI &&
    process.env.mailgun_key &&
    process.env.domain &&
    process.env.port &&
    process.env.hcaptchasecret &&
    process.env.s3Bucket &&
    process.env.awsRegion
  )
) {
  console.error(
    "Please config .env properly according to templates/template.env!"
  );
  console.log("Aborting!");
  exit(1);
}
exit(0);
