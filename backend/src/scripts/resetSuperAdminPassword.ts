import bcrypt from "bcryptjs";

import {
  connectDatabase,
  prisma,
} from "../config/database.ts";


async function main() {

  await connectDatabase();


  // ======================================================
  // USERNAME
  // ======================================================

  const username =
    String(
      process.env.RESET_ADMIN_USERNAME ??
      "superadmin"
    )
      .trim()
      .toLowerCase();


  // ======================================================
  // NEW PASSWORD
  // ======================================================

  const newPassword =
    String(
      process.env.RESET_ADMIN_PASSWORD ??
      ""
    );


  if (!username) {

    throw new Error(
      "RESET_ADMIN_USERNAME is required"
    );

  }


  if (
    newPassword.length < 8
  ) {

    throw new Error(
      "RESET_ADMIN_PASSWORD must be at least 8 characters"
    );

  }


  // ======================================================
  // FIND USER
  // ======================================================

  const user =
    await prisma.user.findUnique({

      where: {
        username,
      },

      select: {

        id:
          true,

        name:
          true,

        username:
          true,

        role:
          true,

        isActive:
          true,

      },

    });


  if (!user) {

    throw new Error(
      `User "${username}" not found`
    );

  }


  // ======================================================
  // SAFETY
  //
  // This script is only for SUPER_ADMIN reset.
  // ======================================================

  if (
    user.role !==
    "SUPER_ADMIN"
  ) {

    throw new Error(
      `User "${username}" is not a SUPER_ADMIN`
    );

  }


  // ======================================================
  // HASH NEW PASSWORD
  // ======================================================

  const passwordHash =
    await bcrypt.hash(
      newPassword,
      12
    );


  // ======================================================
  // UPDATE PASSWORD
  // ======================================================

  const updatedUser =
    await prisma.user.update({

      where: {
        id:
          user.id,
      },

      data: {

        passwordHash,

        isActive:
          true,

      },

      select: {

        id:
          true,

        name:
          true,

        username:
          true,

        role:
          true,

        isActive:
          true,

        updatedAt:
          true,

      },

    });


  console.log(
    "SUPER_ADMIN password reset successfully:"
  );

  console.log(
    updatedUser
  );

}


main()
  .catch(
    (
      error
    ) => {

      console.error(
        error
      );

      process.exitCode =
        1;

    }
  )
  .finally(
    async () => {

      await prisma
        .$disconnect();

    }
  );