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
    // console.log(platforms[0].platform);
    const tabMapped: any[] = [];
    const result = platforms.map((element) => tabMapped.push(element.platform));
    // console.log(tabMapped);
    const platformName: any[] = [];
    const platformObject: any[] = [];
    for (let i = 0; i < tabMapped.length; i++) {
      if (!platformName.includes(tabMapped[i].name)) {
        platformName.push(tabMapped[i].name);
        platformObject.push(tabMapped[i]);
      }
    }
    console.log(platformObject);
    response.render("platforms", { platformObject: platformObject });
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
    // console.log(types);
    response.render("types", { types: types });
  });

  return app;
}
