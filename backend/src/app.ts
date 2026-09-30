import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";

import cors from "cors";
import helmet from "helmet";

import routes from "./routes/index.ts";


const app =
  express();


// ======================================================
// BASIC SECURITY
// ======================================================

app.disable(
  "x-powered-by"
);

app.use(
  helmet()
);


// ======================================================
// CORS
//
// Development:
// CORS_ORIGIN blank હોય તો all origins allow.
//
// Production example:
//
// CORS_ORIGIN=https://yourfrontend.com
//
// Multiple origins:
//
// CORS_ORIGIN=https://site1.com,https://site2.com
// ======================================================

const allowedOrigins =
  String(
    process.env.CORS_ORIGIN ??
    ""
  )
    .split(",")
    .map(
      (origin) =>
        origin.trim()
    )
    .filter(
      Boolean
    );


app.use(
  cors({

    origin:
      allowedOrigins.length === 0
        ? true
        : (
            origin,
            callback
          ) => {

            // ------------------------------------------------
            // Allow requests without Origin
            //
            // Example:
            // PowerShell
            // curl
            // server-to-server
            // ------------------------------------------------

            if (
              !origin
            ) {

              return callback(
                null,
                true
              );

            }


            if (
              allowedOrigins.includes(
                origin
              )
            ) {

              return callback(
                null,
                true
              );

            }


            return callback(
              new Error(
                "CORS origin not allowed"
              )
            );

          },

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

  })
);


// ======================================================
// BODY PARSERS
//
// Revenue CSV upload uses multipart/multer,
// therefore these JSON limits do not affect CSV uploads.
// ======================================================

app.use(
  express.json({
    limit: "2mb",
  })
);


app.use(
  express.urlencoded({

    extended: true,

    limit: "2mb",

  })
);


// ======================================================
// API ROUTES
// ======================================================

app.use(
  "/api/v1",
  routes
);


// ======================================================
// API 404 HANDLER
//
// Unknown API route should return clean JSON
// instead of HTML "Cannot GET" response.
// ======================================================

app.use(
  (
    req: Request,
    res: Response
  ) => {

    return res
      .status(404)
      .json({

        success: false,

        message:
          `API route not found: ${req.method} ${req.originalUrl}`,

      });

  }
);


// ======================================================
// GLOBAL ERROR HANDLER
//
// Last safety layer.
// Existing controllers can still return their own errors.
// ======================================================

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction
  ) => {

    console.error(
      "Unhandled API error:",
      error
    );


    const message =
      error instanceof Error
        ? error.message
        : "Internal server error";


    return res
      .status(500)
      .json({

        success: false,

        message,

      });

  }
);


export default app;