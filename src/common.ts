import dotenv from "dotenv";
import Mailgun from "mailgun-js";
import { Collection, MongoClient } from "mongodb";

dotenv.config();
export const mongouri = process.env.DB_URI || "mongodb://localhost"; //mongo connection string
export const LINKS_DOMAIN = process.env.LINKS_DOMAIN;
export const client = new MongoClient(mongouri);
export const secret = process.env.recaptchasecret || ""; //recaptcha secret used to cerify recaptcha tokens
/**
 * get difference in seconds between now and a time string
 */
export function timediff(sdate: string) {
    const startDate = new Date(sdate);
    const endDate = new Date();
    const diff = endDate.getTime() - startDate.getTime();
    return diff / 1000;
}

/*
arr: [
  {
    id: 1,
    name: "1",
    ...
  },
  {
    id: 3,
    name: "3",
    ...
  },
  ...
]
return obj: {
  1: {
    name: "1",
    ...
  }
  3: {
    name: "3",
    ...
  }
}
*/
export function arrtoobj(arr: any[]) {
    const obj: any = {};
    arr.forEach((item: any) => {
        obj[item.id] = item;
        delete obj[item.id].id;
    });
    return obj;
}

/*
reverted process of above
*/
export function objtoarr(obj: any): any[] {
    const arr: any = [];
    Object.entries(obj).forEach((item: any) => {
        const o = item[1];
        o.id = Number(item[0]);
        arr.push(o);
    });
    return arr;
}

export const domain = process.env.domain?.startsWith(".")
    ? process.env.domain?.replace(".", "")
    : process.env.domain;

export function allequal(arr: any[]) {
    const first = arr[0];
    for (const i of arr) {
        if (i !== first) return false;
    }
    return true;
}
export const db = client.db("metahkg");

export const threadCl = db.collection("thread");
export const usersCl: Collection = db.collection("users");
export const limitCl = db.collection("limit");
export const imagesCl = db.collection("images");
export const verificationCl = db.collection("verification");
export const categoryCl = db.collection("category");
export const votesCl = db.collection("votes");
export const linksCl = db.collection("links");
export const notificationsCl = db.collection("notifications");
export const inviteCl = db.collection("invite");

export const mgDomain = process.env.mailgun_domain || process.env.domain || "metahkg.org";

export const mg = Mailgun({
    apiKey: process.env.mailgun_key || "",
    domain: mgDomain,
});
