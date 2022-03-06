import dotenv from "dotenv";
import express from "express";
import cookieParser from "cookie-parser";
import { autodecrement } from "./router/menu/autodecrement";
import router from "./router";
dotenv.config();
const app = express();
/**
 * Decrease count by one in collection "hottest" every 2 hours
 */
setInterval(() => {
  setTimeout(() => {
    autodecrement();
  }, 7200 * 1000);
}, 7200 * 1000);
app.disable("x-powered-by");
/**
 * Get client ip from cloudflare
 */
app.set("trust proxy", true);
/**
* Set content security policy
* sa.wcyat.engineer, analytics.wcyat.me, 
  static.cloudflareinsights.com: analytics
* cdnjs.cloudflare.com: deliver axios
  for usage in the browser console
*/
app.use(function (req, res, next) {
  res.setHeader(
    "Content-Security-Policy",
    "script-src 'self' https://www.gstatic.com/recaptcha/ https://www.google.com/recaptcha/ https://sa.wcyat.engineer https://analytics.wcyat.me https://static.cloudflareinsights.com https://cdnjs.cloudflare.com"
  );
  return next();
});
app.use(cookieParser());
/*
* If there's a path specified in router
  for the request, the request is responded
  by the api
* Otherwise the React app would be served
*/
app.use(router);
app.use(async (req, res, next) => {
  if (req.path.startsWith("/api")) {
    res.status(404);
    res.send({ error: "Route not found." });
    return;
  }
  return next();
});

/*
 * The port can be modified in .env
 */
app.listen(Number(process.env.port) || 3200, () => {
  console.log(`listening at port ${process.env.port || 3200}`);
});
