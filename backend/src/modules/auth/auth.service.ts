import bcrypt from "bcryptjs";

import jwt, {
  type SignOptions,
} from "jsonwebtoken";

import {
  prisma,
} from "../../config/database.ts";

import type {
  AppUserRole,
  AuthUser,
} from "./auth.types.ts";

const VALID_USER_ROLES: AppUserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
];

function getJwtSecret(): string {

  const secret =
    String(
      process.env.JWT_SECRET ??
      ""
    ).trim();


  if (
    !secret
  ) {

    throw new Error(
      "JWT_SECRET is not configured"
    );

  }

  return secret;

}

export function createAuthToken(
  user: AuthUser
): string {

  const secret =
    getJwtSecret();


  const expiresIn =
    (
      process.env.JWT_EXPIRES_IN ||
      "12h"
    ) as SignOptions["expiresIn"];

  return jwt.sign(
    {

      userId:
        user.userId,

      username:
        user.username,

      role:
        user.role,

      unitId:
        user.unitId,

    },
    secret,
    {

      expiresIn,

    }
  );

}

export function verifyAuthToken(
  token: string
): AuthUser {

  const decoded =
    jwt.verify(
      token,
      getJwtSecret()
    );


  if (
    typeof decoded ===
    "string"
  ) {

    throw new Error(
      "Invalid authentication token"
    );

  }

  const userId =
    Number(
      decoded.userId
    );


  const username =
    String(
      decoded.username ??
      ""
    ).trim();

  const role =
    String(
      decoded.role ??
      ""
    )
      .trim()
      .toUpperCase() as AppUserRole;

  const unitId =
    decoded.unitId === null ||
    decoded.unitId === undefined
      ? null
      : Number(
          decoded.unitId
        );


  if (
    !Number.isInteger(
      userId
    ) ||
    userId <= 0
  ) {

    throw new Error(
      "Invalid authentication token"
    );

  }


  if (
    !username
  ) {

    throw new Error(
      "Invalid authentication token"
    );

  }


  if (
    !VALID_USER_ROLES.includes(
      role
    )
  ) {

    throw new Error(
      "Invalid authentication token"
    );

  }


  if (
    unitId !== null &&
    (
      !Number.isInteger(
        unitId
      ) ||
      unitId <= 0
    )
  ) {

    throw new Error(
      "Invalid authentication token"
    );

  }


  if (
    role ===
      "INCHARGE_DIRECTOR" &&
    unitId ===
      null
  ) {

    throw new Error(
      "Invalid authentication token"
    );

  }

  return {

    userId,

    username,

    role,

    unitId,

  };

}

function normalizeUsername(
  usernameInput: unknown
): string {

  return String(
    usernameInput ??
    ""
  )
    .trim()
    .replace(
      /\s+/g,
      " "
    );

}

export async function loginUser(
  usernameInput: unknown,
  passwordInput: unknown
) {

  const username =
    normalizeUsername(
      usernameInput
    );


  const password =
    String(
      passwordInput ??
      ""
    );


  if (
    !username
  ) {

    throw new Error(
      "Username is required"
    );

  }


  if (
    !password
  ) {

    throw new Error(
      "Password is required"
    );

  }

  const user =
    await prisma.user.findFirst({

      where: {

        username: {

          equals:
            username,

          mode:
            "insensitive",

        },

      },

      select: {

        id:
          true,

        name:
          true,

        username:
          true,

        email:
          true,

        mobile:
          true,

        passwordHash:
          true,

        role:
          true,

        unitId:
          true,

        isActive:
          true,

        lastLoginAt:
          true,

        unit: {

          select: {

            id:
              true,

            code:
              true,

            name:
              true,

          },

        },

      },

    });


  if (
    !user
  ) {

    throw new Error(
      "Invalid username or password"
    );

  }


  if (
    !user.isActive
  ) {

    throw new Error(
      "Your user account is inactive"
    );

  }


  const userRole =
    user.role as AppUserRole;


  if (
    !VALID_USER_ROLES.includes(
      userRole
    )
  ) {

    throw new Error(
      "Invalid user role"
    );

  }


  if (
    userRole ===
      "INCHARGE_DIRECTOR" &&
    !user.unitId
  ) {

    throw new Error(
      "No unit is assigned to this Incharge Director"
    );

  }


  const passwordMatch =
    await bcrypt.compare(
      password,
      user.passwordHash
    );


  if (
    !passwordMatch
  ) {

    throw new Error(
      "Invalid username or password"
    );

  }


  const authUser: AuthUser = {

    userId:
      user.id,

    username:
      user.username,

    role:
      userRole,

    unitId:
      user.unitId,

  };


  const token =
    createAuthToken(
      authUser
    );


  const loginTime =
    new Date();


  await prisma.user.update({

    where: {

      id:
        user.id,

    },

    data: {

      lastLoginAt:
        loginTime,

    },

  });


  return {

    token,

    tokenType:
      "Bearer",

    user: {

      id:
        user.id,

      name:
        user.name,

      username:
        user.username,

      email:
        user.email,

      mobile:
        user.mobile,

      role:
        userRole,

      unitId:
        user.unitId,

      unit:
        user.unit,

      isActive:
        user.isActive,

      lastLoginAt:
        loginTime,

    },

  };

}
