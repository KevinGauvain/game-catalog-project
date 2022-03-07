import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";

export function makeApp(db: Db): core.Express {
  const databaseUrl = process.env.MONGO_URL || "";
  const client = new MongoClient(databaseUrl);
  const app = express();

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

  app.set("view engine", "njk");

  app.get("/", (request: Request, response: Response) => {
    response.render("index");
  });

  app.get("/plateform", (request: Request, response: Response) => {
    response.render("platform");
  });

  app.get("/home", (request: Request, response: Response) => {
    client.connect().then(async () => {
      const database = client.db();
      const games = await database.collection("games").find().toArray();
      // console.log(games);
      response.render("home", { games: games });
    });
  });

  return app;
}
