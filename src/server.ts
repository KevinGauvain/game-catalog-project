import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db } from "mongodb";
import nunjucks from "nunjucks";
import fetch from "node-fetch";
import cookie from "cookie";
import jose from "jose";

export function makeApp(db: Db): core.Express {
  const app = express();


  const authDomain = process.env.AUTH0_DOMAIN || "";
  const authClientID = process.env.AUTH0_CLIENT_ID || "";
  const authRedirectUri = process.env.AUTH0_REDIRECTURI || "";
  const authClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
  const jsonWebKeySet = process.env.AUTH0_JSON_WEB_KEY_SET || "";
  const authAudience = process.env.AUTH0_AUDIENCE || "";
  const authScope = process.env.AUTH0_SCOPES || "";

  const jwksUrl = new URL(jsonWebKeySet);

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

  app.get("/login", (request: Request, response: Response) => {
    response.redirect(
      `https://${authDomain}/authorize?response_type=code&client_id=${authClientID}&redirect_uri=${authRedirectUri}&audience=${authAudience}&scope=${authScope}`
    );
  });

  app.get("/logout", (request: Request, response: Response) => {
    const authClientID = process.env.AUTH0_CLIENT_ID || "";

    response.redirect(
      `https://${authDomain}/v2/logout?client_id=${authClientID}`
    );
  });

  app.get("/getToken", async (request: Request, response: Response) => {
    const resp = await fetch("https://dev-bq3ca7ko.eu.auth0.com/oauth/token", {
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=authorization_code&response_type=id_token&client_id=${authClientID}&client_secret=${authClientSecret}&code=${request.query.code}&redirect_uri=${authRedirectUri}`,
    });
    const tokenData = await resp.json();

    response.redirect("/");
  });

  return app;
}
