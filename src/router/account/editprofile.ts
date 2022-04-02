import { Router } from "express";
import body_parser from "body-parser";
import { Type } from "@sinclair/typebox";
import { ajv } from "../lib/ajv";
import { getuser } from "../lib/users";
import { error400 } from "../lib/errors/400";
import { error404 } from "../lib/errors/404";
import { client } from "../../common";
const router = Router();
router.post(
  "/api/account/editprofile",
  body_parser.json(),
  async (req: {
    body: {
      user?: string;
      sex?: "M" | "F";
    },
    cookies: {
      key?: string;
    }
  }, res) => {
    const schema = Type.Object(
      {
        user: Type.Optional(Type.String()),
        sex: Type.Optional(Type.Union([Type.Literal("M"), Type.Literal("F")])),
      },
      { additionalProperties: false }
    );
    if (!ajv.validate(schema, req.body) || !Object.keys(req.body).length) {
      error400(res);
      return;
    }
    const user = await getuser(req.cookies.key);
    if (!user) {
      error404(res);
      return;
    }
    const users = client.db("metahkg-users").collection("users");
    const limit = client.db("metahkg-users").collection("limit");
    const summary = client.db("metahkg-threads").collection("summary");
    const threadusers = client.db("metahkg-threads").collection("users");
    await summary.updateMany(
      { op: user.user },
      { $set: { op: req.body.user, sex: req.body.sex } }
    );
    await threadusers.updateMany(
      {
        [user.id]: {
          name: user.user,
          sex: user.sex,
        },
      },
      {
        $set: {
          [user.id]: {
            name: req.body.user || user.user,
            sex: req.body.sex || user.sex,
          },
        },
      }
    );
    await users.updateOne({ key: req.cookies.key }, { $set: req.body });
    res.send({ response: "ok" });
  }
);
export default router;
