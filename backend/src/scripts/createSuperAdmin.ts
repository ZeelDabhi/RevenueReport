import bcrypt from "bcryptjs";

import {
  connectDatabase,
  prisma,
} from "../config/database.ts";


async function main() {

  await connectDatabase();


  const name =
    String(
      process.env.BOOTSTRAP_ADMIN_NAME ?? ""
    ).trim();


  const username =
    String(
      process.env.BOOTSTRAP_ADMIN_USERNAME ?? ""
    )
      .trim()
      .toLowerCase();


  const password =
    String(
      process.env.BOOTSTRAP_ADMIN_PASSWORD ?? ""
    );


  if (!name) {
    throw new Error(
      "BOOTSTRAP_ADMIN_NAME is required"
    );
  }


  if (!username) {
    throw new Error(
      "BOOTSTRAP_ADMIN_USERNAME is required"
    );
  }


  if (password.length < 8) {
    throw new Error(
      "BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters"
    );
  }


  const existingUser =
    await prisma.user.findUnique({

      where: {
        username,
      },

      select: {
        id: true,
        username: true,
        role: true,
      },

    });


  if (existingUser) {

    console.log(
      `User "${username}" already exists.`
    );

    console.log(
      existingUser
    );

    return;

  }


  const passwordHash =
    await bcrypt.hash(
      password,
      12
    );


  const user =
    await prisma.user.create({

      data: {

        name,

        username,

        passwordHash,

        role: "SUPER_ADMIN",

        isActive: true,

      },

      select: {

        id: true,

        name: true,

        username: true,

        role: true,

        isActive: true,

        createdAt: true,

      },

    });


  console.log(
    "SUPER_ADMIN created successfully:"
  );

  console.log(
    user
  );

}

main()
  .catch(
    (error) => {

      console.error(
        error
      );

      process.exitCode = 1;

    }
  )
  .finally(
    async () => {

      await prisma.$disconnect();

    }
  );