import "dotenv/config";

import app from "./app.ts";

import {
  connectDatabase,
  prisma,
} from "./config/database.ts";


const PORT =
  Number(
    process.env.PORT
  ) || 5000;


// ======================================================
// START SERVER
// ======================================================

async function startServer() {

  try {

    // ==================================================
    // DATABASE CONNECTION
    // ==================================================

    await connectDatabase();


    // ==================================================
    // HTTP SERVER
    // ==================================================

    const server =
      app.listen(
        PORT,
        () => {

          console.log(
            `Server running on http://localhost:${PORT}`
          );

        }
      );


    // ==================================================
    // SERVER SETTINGS
    // ==================================================

    server.keepAliveTimeout =
      65_000;


    server.headersTimeout =
      70_000;


    // ==================================================
    // GRACEFUL SHUTDOWN STATE
    // ==================================================

    let isShuttingDown =
      false;


    // ==================================================
    // GRACEFUL SHUTDOWN
    // ==================================================

    const shutdown =
      async (
        signal: string,
        exitCode = 0
      ) => {

        if (
          isShuttingDown
        ) {

          return;

        }


        isShuttingDown =
          true;


        console.log(
          `${signal} received. Shutting down server...`
        );


        // ==============================================
        // FORCE SHUTDOWN SAFETY
        //
        // If some connection never closes,
        // process will still exit after 10 seconds.
        // ==============================================

        const forceShutdownTimer =
          setTimeout(
            async () => {

              console.error(
                "Forced shutdown after timeout."
              );


              try {

                await prisma
                  .$disconnect();

              } catch (error) {

                console.error(
                  "Database disconnect error:",
                  error
                );

              }


              process.exit(
                1
              );

            },
            10_000
          );


        forceShutdownTimer
          .unref();


        // ==============================================
        // STOP ACCEPTING NEW REQUESTS
        // ==============================================

        server.close(
          async (
            error
          ) => {

            if (
              error
            ) {

              console.error(
                "Server close error:",
                error
              );

              exitCode =
                1;

            }


            try {

              await prisma
                .$disconnect();


              console.log(
                "Database disconnected"
              );

            } catch (disconnectError) {

              console.error(
                "Database disconnect error:",
                disconnectError
              );

              exitCode =
                1;

            }


            clearTimeout(
              forceShutdownTimer
            );


            console.log(
              "Server shutdown complete"
            );


            process.exit(
              exitCode
            );

          }
        );

      };


    // ==================================================
    // NORMAL TERMINATION SIGNALS
    // ==================================================

    process.on(
      "SIGINT",
      () => {

        void shutdown(
          "SIGINT"
        );

      }
    );


    process.on(
      "SIGTERM",
      () => {

        void shutdown(
          "SIGTERM"
        );

      }
    );


    // ==================================================
    // UNHANDLED PROMISE ERROR
    // ==================================================

    process.on(
      "unhandledRejection",
      (
        reason
      ) => {

        console.error(
          "Unhandled Promise Rejection:",
          reason
        );


        void shutdown(
          "unhandledRejection",
          1
        );

      }
    );


    // ==================================================
    // UNCAUGHT ERROR
    // ==================================================

    process.on(
      "uncaughtException",
      (
        error
      ) => {

        console.error(
          "Uncaught Exception:",
          error
        );


        void shutdown(
          "uncaughtException",
          1
        );

      }
    );


  } catch (error) {

    console.error(
      "Failed to start server:",
      error
    );


    try {

      await prisma
        .$disconnect();

    } catch (disconnectError) {

      console.error(
        "Database disconnect error:",
        disconnectError
      );

    }


    process.exit(
      1
    );

  }

}


void startServer();