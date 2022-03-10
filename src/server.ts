import express, { Request, Response } from "express";
import * as core from "express-serve-static-core";
import { Db } from "mongodb";
import nunjucks from "nunjucks";
import fetch from "node-fetch";
import cookie from "cookie";
import * as jose from "jose";

export function makeApp(db: Db): core.Express {
  const app = express();

  const authDomain = process.env.AUTH0_DOMAIN || "";
  const authClientID = process.env.AUTH0_CLIENT_ID || "";
  const authRedirectUri = process.env.AUTH0_REDIRECTURI || "";
  const authClientSecret = process.env.AUTH0_CLIENT_SECRET || "";
  const jsonWebKeySet = process.env.AUTH0_JSON_WEB_KEY_SET || "";
  const authAudience = process.env.AUTH0_AUDIENCE || "";
  const authScope = process.env.AUTH0_SCOPES || "";
  let jwksUrl: URL;
  if (jsonWebKeySet) {
    jwksUrl = new URL(jsonWebKeySet);
  }

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
    // console.log(platformObject);
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
    const undefinedTypesFilter = types.filter((game) => {
      if (game.genres.length <= 0) {
        return false;
      } else if (game.genres.length > 0) {
        return true;
      }
    });
    const type = undefinedTypesFilter.map((game) => {
      return game.genres;
    });
    const tableauGenres: string[] = [];
    for (let i = 0; i < type.length; i++) {
      type[i].forEach((genre: string) => {
        if (!tableauGenres.includes(genre.replace("/", ","))) {
          tableauGenres.push(genre.replace("/", ","));
        }
      });
    }
    // console.log(tableauGenres);
    response.render("types", { tableauGenres: tableauGenres });
  });

  app.get("/game/:slug", async (request: Request, response: Response) => {
    const gameSlug = request.params.slug;
    const gameInfo = await db.collection("games").findOne({ slug: gameSlug });
    response.render("gamesInfo", { gameInfo: gameInfo });
  });

  app.get("/types/:slug", async (request: Request, response: Response) => {
    const genreSlug = request.params.slug;
    const genres = await db
      .collection("games")
      .find({ genres: genreSlug.replace(",", "/") })
      .toArray();
    // console.log(genres);
    response.render("genres", { genres: genres });
  });

  app.get("/platform/:slug", async (request: Request, response: Response) => {
    const platformSlug = request.params.slug;
    const platforms = await db
      .collection("games")
      .find({ "platform.name": platformSlug })
      .toArray();
    // console.log(platforms);
    response.render("platformGame", { platforms: platforms });
  });

  app.get("/login", (request: Request, response: Response) => {
    response.redirect(
      `https://${authDomain}/authorize?response_type=code&client_id=${authClientID}&redirect_uri=${authRedirectUri}&audience=${authAudience}&scope=${authScope}`
    );
  });

  app.get("/logout", (request: Request, response: Response) => {
    response.setHeader(
      "Set-Cookie",
      cookie.serialize("token", "deleted", {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 0,
        path: "/",
      })
    );
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
    const jwksKeys = jose.createRemoteJWKSet(jwksUrl);

    await jose.jwtVerify(tokenData.access_token, jwksKeys);
    await jose.jwtVerify(tokenData.id_token, jwksKeys);

    response.setHeader(
      "Set-Cookie",
      cookie.serialize("token", tokenData.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== "development",
        maxAge: 60 * 60,
        sameSite: "strict",
        path: "/",
      })
    );
    response.redirect("/");
  });

  async function userSession(request: Request): Promise<boolean> {
    const token = cookie.parse(request.headers.cookie || "")["token"];

    try {
      if (!token) {
        return false;
      }
      const jwksKeys = jose.createRemoteJWKSet(jwksUrl);
      await jose.jwtVerify(token, jwksKeys);
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }
  app.get("/private", async (request: Request, response: Response) => {
    const isLogged: boolean = await userSession(request);

    if (!isLogged) {
      // Can't find the cookie
      response.redirect("/platforms");
      return;
    }
    response.redirect("/types");
  });

  return app;
}
