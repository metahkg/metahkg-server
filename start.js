require("dotenv").config();
const { exit } = require("process");
const fs = require("fs");
if (
  !(
    process.env.DB_URI &&
    process.env.mailgun_key &&
    process.env.domain &&
    process.env.port &&
    process.env.recaptchasecret &&
    process.env.jwtKey &&
    process.env.LINKS_DOMAIN
  )
) {
  console.error(
    "Please config .env properly according to templates/template.env!"
  );
  console.log("Aborting!");
  exit(1);
}
fs.readFile(".env", "utf8", (err, data) => {
  if (err) {
    console.error(err);
    exit(1);
  }
  const d = data.split("\n");
  d.forEach((i, index) => {
    i.startsWith("root") && d.splice(index, 1);
  });
  d.push(`root=${__dirname}`);
  console.log("writing root to .env...");
  fs.writeFile(".env", d.join("\n"), async (err) => {
    if (err) {
      console.error(err);
      exit(1);
    }
    console.log("successfully written.");
  });
});