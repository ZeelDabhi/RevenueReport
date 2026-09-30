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


// ======================================================
// VALID APPLICATION ROLES
// ======================================================

const VALID_USER_ROLES: AppUserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
  "HO_USER",
];


// ======================================================
// JWT SECRET
// ======================================================

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


// ======================================================
// CREATE TOKEN
// ======================================================

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


// ======================================================
// VERIFY TOKEN
// ======================================================

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


  // ==================================================
  // USER ID
  // ==================================================

  const userId =
    Number(
      decoded.userId
    );


  // ==================================================
  // USERNAME
  // ==================================================

  const username =
    String(
      decoded.username ??
      ""
    ).trim();


  // ==================================================
  // ROLE
  // ==================================================

  const role =
    String(
      decoded.role ??
      ""
    )
      .trim()
      .toUpperCase() as AppUserRole;


  // ==================================================
  // UNIT ID
  // ==================================================

  const unitId =
    decoded.unitId === null ||
    decoded.unitId === undefined
      ? null
      : Number(
          decoded.unitId
        );


  // ==================================================
  // VALIDATE TOKEN PAYLOAD
  // ==================================================

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


  // ==================================================
  // INCHARGE DIRECTOR MUST HAVE UNIT
  // ==================================================

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


// ======================================================
// LOGIN
// ======================================================

export async function loginUser(
  usernameInput: unknown,
  passwordInput: unknown
) {

  // ==================================================
  // USERNAME
  //
  // Usernames may contain spaces and capital letters.
  // Login matching is case-insensitive.
  // ==================================================

  const username =
    String(
      usernameInput ??
      ""
    )
      .trim()
      .replace(
        /\s+/g,
        " "
      );


  // ==================================================
  // PASSWORD
  // ==================================================

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


  // ==================================================
  // FIND USER
  //
  // findFirst + mode insensitive allows usernames such as:
  // "Zeel Dabhi"
  // "Punit Joshi"
  // ==================================================

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


  // ==================================================
  // USER NOT FOUND
  // ==================================================

  if (
    !user
  ) {

    throw new Error(
      "Invalid username or password"
    );

  }


  // ==================================================
  // ACTIVE CHECK
  // ==================================================

  if (
    !user.isActive
  ) {

    throw new Error(
      "Your user account is inactive"
    );

  }


  // ==================================================
  // ROLE CHECK
  // ==================================================

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


  // ==================================================
  // INCHARGE DIRECTOR UNIT CHECK
  // ==================================================

  if (
    userRole ===
      "INCHARGE_DIRECTOR" &&
    !user.unitId
  ) {

    throw new Error(
      "No unit is assigned to this Incharge Director"
    );

  }


  // ==================================================
  // PASSWORD CHECK
  // ==================================================

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


  // ==================================================
  // AUTH USER
  // ==================================================

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


  // ==================================================
  // CREATE JWT
  // ==================================================

  const token =
    createAuthToken(
      authUser
    );


  // ==================================================
  // LAST LOGIN
  // ==================================================

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


  // ==================================================
  // RESPONSE
  // ==================================================

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
