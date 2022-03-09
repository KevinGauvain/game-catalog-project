import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";

export function makeApp(db: Db): core.Express {
  const databaseUrl = process.env.MONGO_URL || "";
  const client = new MongoClient(databaseUrl);
  const app = express();

  app.use(express.static("static"));

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

  app.set("view engine", "njk");

  app.get("/platforms", (request: Request, response: Response) => {
    client.connect().then(async () => {
      const database = client.db();
      const platforms = await database.collection("games").find().toArray();
      // console.log(games);
      response.render("platforms", { platforms: platforms });
    });
  });

  app.get("/", (request: Request, response: Response) => {
    client.connect().then(async () => {
      const database = client.db();
      const games = await database
        .collection("games")
        .aggregate([{ $limit: 20 }])
        .toArray();
      // console.log(games);
      response.render("home", { games: games });
    });
  });

  app.get("/types", (request: Request, response: Response) => {
    client.connect().then(async () => {
      const database = client.db();
      const types = await database.collection("games").find().toArray();
      // console.log(games);
      response.render("types", { types: types });
    });
  });

  return app;
}
