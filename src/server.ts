import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db, MongoClient } from "mongodb";
import nunjucks from "nunjucks";
import fetch from "node-fetch";
import cookie from "cookie";
import jose from "jose";

export function makeApp(db: Db): core.Express {
  const databaseUrl = process.env.MONGO_URL || "";
  const client = new MongoClient(databaseUrl);
  const app = express();

  const authDomain = process.env.AUTH0_DOMAIN || "";
  const authClientID = process.env.AUTH0_CLIENT_ID || "";
  const authRedirectUri = process.env.AUTH0_REDIRECTURI || "";
  const authClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
  const jsonWebKeySet = process.env.AUTH0_JSON_WEB_KEY_SET || "";
  const authAudience = process.env.AUTH0_AUDIENCE || "";
  const authScope = process.env.AUTH0_SCOPES || "";

  const jwksUrl = new URL(jsonWebKeySet);

  nunjucks.configure("views", {
    autoescape: true,
    express: app,
  });

  app.set("view engine", "njk");

  app.get("/", (request: Request, response: Response) => {
    response.render("index");
  });

  app.get("/platform", (request: Request, response: Response) => {
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

  app.get("/type", (request: Request, response: Response) => {
    client.connect().then(async () => {
      const database = client.db();
      const games = await database.collection("games").find().toArray();
      // console.log(games);
      response.render("type", { games: games });
    });
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
    console.log("code : ----------", request.query);
    const resp = await fetch("https://dev-bq3ca7ko.eu.auth0.com/oauth/token", {
      method: "post",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=authorization_code&response_type=id_token&client_id=${authClientID}&client_secret=${authClientSecret}&code=${request.query.code}&redirect_uri=${authRedirectUri}`,
    });
    const data = await resp.json();
    console.log(data);

    response.redirect("home");
  });

  return app;
}
