import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db } from "mongodb";
import nunjucks from "nunjucks";

export function makeApp(db: Db): core.Express {
  const app = express();

  app.use(express.static("static"));

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

  app.set("view engine", "njk");

  app.get("/platforms", async (request: Request, response: Response) => {
    const platforms = await db.collection("games").find().toArray();
    // console.log(games);
    response.render("platforms", { platforms: platforms });
  });

  app.get("/", async (request: Request, response: Response) => {
    const games = await db
      .collection("games")
      .aggregate([{ $limit: 20 }])
      .toArray();
    // console.log(games);
    response.render("home", { games: games });
  });

  app.get("/types", async (request: Request, response: Response) => {
    const types = await db.collection("games").find().toArray();
    // console.log(games);
    response.render("types", { types: types });
  });

  return app;
}
