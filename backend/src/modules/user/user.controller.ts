import bcrypt from "bcryptjs";
import type {
  Response,
} from "express";
import {
  prisma,
} from "../../config/database.ts";
import type {
  AppUserRole,
  AuthenticatedRequest,
} from "../auth/auth.types.ts";
const FULL_MANAGEMENT_ROLES: AppUserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
];
const CREATABLE_ROLES: AppUserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
  "INCHARGE_DIRECTOR",
];
const PUBLIC_USER_SELECT = {







  id: true,







  name: true,







  username: true,







  email: true,







  mobile: true,







  role: true,







  unitId: true,







  isActive: true,







  lastLoginAt: true,







  createdAt: true,







  updatedAt: true,







  unit: {







    select: {







      code: true,







      name: true,







    },







  },







} as const;





const SUPER_ADMIN_USER_SELECT = {



  ...PUBLIC_USER_SELECT,



  passwordChangedAt: true,



  passwordChangedBy: true,



} as const;











// ======================================================



// ACCESS HELPERS



// ======================================================







function hasFullUserManagementAccess(



  role: AppUserRole



): boolean {







  return FULL_MANAGEMENT_ROLES.includes(



    role



  );







}











function ensureAuthenticated(



  req: AuthenticatedRequest



) {







  const actor =



    req.authUser;











  if (



    !actor



  ) {







    throw new Error(



      "Authentication required"



    );







  }











  return actor;







}











function ensureFullManagementAccess(



  req: AuthenticatedRequest



) {







  const actor =



    ensureAuthenticated(



      req



    );











  if (



    !hasFullUserManagementAccess(



      actor.role



    )



  ) {







    throw new Error(



      "You do not have permission to manage users"



    );







  }











  return actor;







}











// ======================================================



// USER ID



// ======================================================







function getUserId(



  value: unknown



): number {







  const userId =



    Number(



      value



    );











  if (



    !Number.isInteger(



      userId



    ) ||



    userId <= 0



  ) {







    throw new Error(



      "Valid user ID is required"



    );







  }











  return userId;







}











// ======================================================



// EMAIL



// ======================================================







function isValidEmail(



  email: string



): boolean {







  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/



    .test(



      email



    );







}











// ======================================================



// MOBILE



// ======================================================







function normalizeMobile(



  value: unknown



): string {







  let digits =



    String(



      value ??



      ""



    )



      .replace(



        /\D/g,



        ""



      );











  if (



    digits.length === 12 &&



    digits.startsWith(



      "91"



    )



  ) {







    digits =



      digits.slice(



        2



      );







  }











  return digits;







}











function isValidMobile(



  mobile: string



): boolean {







  return /^[0-9]{10}$/



    .test(



      mobile



    );







}











// ======================================================



// ROLE



// ======================================================







function normalizeRole(



  value: unknown



): AppUserRole {







  return String(



    value ??



    ""



  )



    .trim()



    .toUpperCase() as AppUserRole;







}











// ======================================================



// USERNAME



// ======================================================







function normalizeUsername(



  value: unknown



): string {







  return String(



    value ??



    ""



  )



    .trim()



    .replace(



      /\s+/g,



      " "



    );







}











function validateUsername(



  username: string



) {







  if (



    !username



  ) {







    throw new Error(



      "Username is required"



    );







  }











  if (



    username.length >



    100



  ) {







    throw new Error(



      "Username is too long"



    );







  }







}











async function ensureUsernameAvailable(



  username: string,



  excludeUserId?: number



) {







  const existing =



    await prisma.user.findFirst({







      where: {







        username: {







          equals:



            username,







          mode:



            "insensitive",







        },







        ...(excludeUserId



          ? {







              id: {







                not:



                  excludeUserId,







              },







            }



          : {}),







      },







      select: {







        id:



          true,







      },







    });











  if (



    existing



  ) {







    throw new Error(



      "Username already exists"



    );







  }







}











async function generateUniqueUsername(



  email: string



): Promise<string> {







  const emailPrefix =



    email



      .split("@")[0]



      ?.trim()



      .toLowerCase() ??



    "user";











  let baseUsername =



    emailPrefix



      .replace(



        /[^a-z0-9.\_-]/g,



        ""



      )



      .replace(



        /^[.\_-]+|[.\_-]+$/g,



        ""



      );











  if (



    !baseUsername



  ) {







    baseUsername =



      "user";







  }











  baseUsername =



    baseUsername.slice(



      0,



      90



    );











  const existingUsers =



    await prisma.user.findMany({







      where: {







        username: {







          startsWith:



            baseUsername,







        },







      },







      select: {







        username:



          true,







      },







    });











  const existingUsernames =



    new Set(



      existingUsers.map(



        (



          user



        ) =>



          user.username



            .toLowerCase()



      )



    );











  if (



    !existingUsernames.has(



      baseUsername



    )



  ) {







    return baseUsername;







  }











  let suffix =



    2;











  while (



    true



  ) {







    const suffixText =



      String(



        suffix



      );











    const candidateBase =



      baseUsername.slice(



        0,



        100 -



          suffixText.length



      );











    const candidate =



      `${candidateBase}${suffixText}`;











    if (



      !existingUsernames.has(



        candidate



      )



    ) {







      return candidate;







    }











    suffix +=



      1;







  }







}











// ======================================================



// UNIT



// ======================================================







async function getUnitIdForRole(



  role: AppUserRole,



  unitCodeValue: unknown



): Promise<number | null> {







  if (



    role !==



    "INCHARGE_DIRECTOR"



  ) {







    return null;







  }











  const unitCode =



    String(



      unitCodeValue ??



      ""



    )



      .trim()



      .toUpperCase();











  if (



    !unitCode



  ) {







    throw new Error(



      "Unit is required for Incharge Director"



    );







  }











  const unit =



    await prisma.unit.findFirst({







      where: {







        code:



          unitCode,







        isActive:



          true,







      },







      select: {







        id:



          true,







      },







    });











  if (



    !unit



  ) {







    throw new Error(



      `Invalid or inactive unit: ${unitCode}`



    );







  }











  return unit.id;







}











// ======================================================



// DUPLICATE EMAIL



// ======================================================







async function ensureEmailAvailable(



  email: string,



  excludeUserId?: number



) {







  const existing =



    await prisma.user.findFirst({







      where: {







        email,







        ...(excludeUserId



          ? {







              id: {







                not:



                  excludeUserId,







              },







            }



          : {}),







      },







      select: {







        id:



          true,







      },







    });











  if (



    existing



  ) {







    throw new Error(



      "Email already exists"



    );







  }







}











// ======================================================



// DUPLICATE MOBILE



// ======================================================







async function ensureMobileAvailable(



  mobile: string,



  excludeUserId?: number



) {







  const existing =



    await prisma.user.findFirst({







      where: {







        mobile,







        ...(excludeUserId



          ? {







              id: {







                not:



                  excludeUserId,







              },







            }



          : {}),







      },







      select: {







        id:



          true,







      },







    });











  if (



    existing



  ) {







    throw new Error(



      "Mobile number already exists"



    );







  }







}











// ======================================================



// LAST ACTIVE SUPER ADMIN



// ======================================================







async function ensureAnotherActiveSuperAdminExists(



  targetUserId: number



) {







  const count =



    await prisma.user.count({







      where: {







        role:



          "SUPER_ADMIN",







        isActive:



          true,







        id: {







          not:



            targetUserId,







        },







      },







    });











  if (



    count === 0



  ) {







    throw new Error(



      "At least one active Super Admin must remain"



    );







  }







}











// ======================================================



// CREATE USER



// ======================================================







export async function createUser(



  req: AuthenticatedRequest,



  res: Response



) {







  try {







    const actor =

      ensureFullManagementAccess(

        req

      );











    const name =



      String(



        req.body?.name ??



        ""



      ).trim();











    const requestedUsername =



      normalizeUsername(



        req.body?.username



      );











    const email =



      String(



        req.body?.email ??



        ""



      )



        .trim()



        .toLowerCase();











    const mobile =



      normalizeMobile(



        req.body?.mobile



      );











    const password =



      String(



        req.body?.password ??



        ""



      );











    const role =



      normalizeRole(



        req.body?.role



      );











    const requestedIsActive =



      req.body?.isActive;











    if (



      !name



    ) {







      throw new Error(



        "Name is required"



      );







    }











    if (



      name.length >



      150



    ) {







      throw new Error(



        "Name is too long"



      );







    }











    if (



      !email ||



      !isValidEmail(



        email



      )



    ) {







      throw new Error(



        "Valid email is required"



      );







    }











    if (



      email.length >



      150



    ) {







      throw new Error(



        "Email is too long"



      );







    }











    if (



      !isValidMobile(



        mobile



      )



    ) {







      throw new Error(



        "Mobile number must contain exactly 10 digits"



      );







    }











    if (



      password.length <



      8



    ) {







      throw new Error(



        "Password must be at least 8 characters"



      );







    }











    if (



      !CREATABLE_ROLES.includes(



        role



      )



    ) {







      throw new Error(



        "Invalid user role"



      );







    }











    if (



      requestedIsActive !==



        undefined &&



      typeof requestedIsActive !==



        "boolean"



    ) {







      throw new Error(



        "isActive must be true or false"



      );







    }











    if (



      requestedUsername



    ) {







      validateUsername(



        requestedUsername



      );







    }











    await Promise.all([







      ensureEmailAvailable(



        email



      ),







      ensureMobileAvailable(



        mobile



      ),







      ...(requestedUsername



        ? [







            ensureUsernameAvailable(



              requestedUsername



            ),







          ]



        : []),







    ]);











    const unitId =



      await getUnitIdForRole(



        role,



        req.body?.unitCode



      );











    const username =



      requestedUsername ||



      await generateUniqueUsername(



        email



      );











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







          email,







          mobile,







          passwordHash,





          passwordChangedAt:

            new Date(),





          passwordChangedBy:

            "ADMIN" as any,



          passwordChangedByUserId:

            actor.userId,







          role:



            role as any,







          unitId,







          isActive:



            requestedIsActive ??



            true,







        },







        select:



          PUBLIC_USER_SELECT,







      });











    return res



      .status(201)



      .json({







        success:



          true,







        message:



          "User created successfully",







        data:



          user,







      });







  }



  catch (



    error



  ) {







    const message =



      error instanceof Error



        ? error.message



        : "Unable to create user";











    const forbidden =



      message ===



      "You do not have permission to manage users";











    return res



      .status(



        forbidden



          ? 403



          : 400



      )



      .json({







        success:



          false,







        message,







      });







  }







}











// ======================================================



// LIST USERS



//



// FULL MANAGEMENT:



// ----------------



// SUPER ADMIN



// MASTER ADMIN



// ADMIN



// DIRECTOR



//



// -> ALL USERS



//



// INCHARGE DIRECTOR:



// ------------------



// Example logged user:



// MB - MORBI



//



// Return ONLY:



// role   = INCHARGE_DIRECTOR



// unitId = MB



//



// DOES NOT RETURN:



// Super Admin



// Master Admin



// Admin



// Director



// Other unit Incharge Directors



// ======================================================







export async function listUsers(



  req: AuthenticatedRequest,



  res: Response



) {







  try {







    const actor =



      ensureAuthenticated(



        req



      );











    const fullAccess =



      hasFullUserManagementAccess(



        actor.role



      );











    if (



      !fullAccess &&



      actor.role !==



        "INCHARGE_DIRECTOR"



    ) {







      return res



        .status(403)



        .json({







          success:



            false,







          message:



            "You do not have permission to view users",







        });







    }











    if (



      actor.role ===



      "INCHARGE_DIRECTOR"



    ) {







      if (



        !actor.unitId



      ) {







        return res



          .status(403)



          .json({







            success:



              false,







            message:



              "No unit is assigned to this Incharge Director",







          });







      }











      const users =



        await prisma.user.findMany({







          where: {







            role:



              "INCHARGE_DIRECTOR",







            unitId:



              actor.unitId,







          },







          select:



            PUBLIC_USER_SELECT,







          orderBy: [







            {







              isActive:



                "desc",







            },







            {







              name:



                "asc",







            },







          ],







        });











      return res



        .status(200)



        .json({







          success:



            true,







          total:



            users.length,







          data:



            users,







        });







    }











    // ==================================================



    // FULL MANAGEMENT USERS



    // ==================================================







    const users =



      await prisma.user.findMany({







        select:



          actor.role ===

            "SUPER_ADMIN"

            ? SUPER_ADMIN_USER_SELECT

            : PUBLIC_USER_SELECT,







        orderBy: [







          {







            isActive:



              "desc",







          },







          {







            name:



              "asc",







          },







        ],







      });











    return res



      .status(200)



      .json({







        success:



          true,







        total:



          users.length,







        data:



          users,







      });







  }



  catch (



    error



  ) {







    return res



      .status(500)



      .json({







        success:



          false,







        message:



          error instanceof Error



            ? error.message



            : "Unable to load users",







      });







  }







}











// ======================================================



// EDIT DETAILS



//



// FULL MANAGEMENT:



// Can edit any user.



//



// INCHARGE DIRECTOR:



// Can edit ONLY:



//



// target.role = INCHARGE_DIRECTOR



// AND



// target.unitId = logged-in unitId



//



// Allowed fields:



// Name



// Username



// Email



// Mobile



// Password



//



// NOT ALLOWED:



// Role



// Unit



// Status



// ======================================================







export async function updateUserDetails(



  req: AuthenticatedRequest,



  res: Response



) {







  try {







    const actor =



      ensureAuthenticated(



        req



      );











    const userId =



      getUserId(



        req.params.id



      );











    const existingUser =



      await prisma.user.findUnique({







        where: {







          id:



            userId,







        },







        select: {







          id:



            true,







          username:



            true,







          role:



            true,







          unitId:



            true,







          isActive:



            true,







        },







      });











    if (



      !existingUser



    ) {







      return res



        .status(404)



        .json({







          success:



            false,







          message:



            "User not found",







        });







    }











    const fullAccess =



      hasFullUserManagementAccess(



        actor.role



      );











    // ==================================================



    // STRICT INCHARGE DIRECTOR ACCESS



    //



    // Must be:



    // - logged user = INCHARGE_DIRECTOR



    // - target = INCHARGE_DIRECTOR



    // - same unit



    // ==================================================







    const sameUnitInchargeAccess =



      actor.role ===



        "INCHARGE_DIRECTOR" &&



      actor.unitId !==



        null &&



      existingUser.role ===



        "INCHARGE_DIRECTOR" &&



      existingUser.unitId ===



        actor.unitId;











    if (



      !fullAccess &&



      !sameUnitInchargeAccess



    ) {







      return res



        .status(403)



        .json({







          success:



            false,







          message:



            "You can only edit Incharge Directors from your assigned unit",







        });







    }











    const hasName =



      req.body?.name !==



      undefined;











    const hasUsername =



      req.body?.username !==



      undefined;











    const hasEmail =



      req.body?.email !==



      undefined;











    const hasMobile =



      req.body?.mobile !==



      undefined;











    const hasPassword =



      req.body?.password !==



      undefined;











    const hasRole =



      req.body?.role !==



      undefined;











    const hasUnitCode =



      req.body?.unitCode !==



      undefined;











    const hasIsActive =



      req.body?.isActive !==



      undefined;











    if (



      !hasName &&



      !hasUsername &&



      !hasEmail &&



      !hasMobile &&



      !hasPassword &&



      !hasRole &&



      !hasUnitCode &&



      !hasIsActive



    ) {







      throw new Error(



        "No user details were provided"



      );







    }











    // ==================================================



    // INCHARGE DIRECTOR CANNOT CHANGE SECURITY FIELDS



    // ==================================================







    if (



      !fullAccess &&



      (



        hasRole ||



        hasUnitCode ||



        hasIsActive



      )



    ) {







      return res



        .status(403)



        .json({







          success:



            false,







          message:



            "Incharge Director can edit personal details only. Role, unit and status cannot be changed.",







        });







    }











    const data: {







      name?: string;







      username?: string;







      email?: string;







      mobile?: string;







      passwordHash?: string;





      passwordChangedAt?: Date;





      passwordChangedBy?:

        | "SELF"

        | "ADMIN";







      passwordChangedByUserId?: number;



      role?: AppUserRole;







      unitId?: number | null;







      isActive?: boolean;







    } = {};











    // ==================================================



    // NAME



    // ==================================================







    if (



      hasName



    ) {







      const name =



        String(



          req.body?.name ??



          ""



        ).trim();











      if (



        !name



      ) {







        throw new Error(



          "Name is required"



        );







      }











      if (



        name.length >



        150



      ) {







        throw new Error(



          "Name is too long"



        );







      }











      data.name =



        name;







    }











    // ==================================================



    // USERNAME



    // ==================================================







    if (



      hasUsername



    ) {







      const username =



        normalizeUsername(



          req.body?.username



        );











      validateUsername(



        username



      );











      if (



        username.toLocaleLowerCase() !==



        existingUser.username



          .toLocaleLowerCase()



      ) {







        await ensureUsernameAvailable(



          username,



          userId



        );







      }











      data.username =



        username;







    }











    // ==================================================



    // EMAIL



    // ==================================================







    if (



      hasEmail



    ) {







      const email =



        String(



          req.body?.email ??



          ""



        )



          .trim()



          .toLowerCase();











      if (



        !email ||



        !isValidEmail(



          email



        )



      ) {







        throw new Error(



          "Valid email is required"



        );







      }











      if (



        email.length >



        150



      ) {







        throw new Error(



          "Email is too long"



        );







      }











      await ensureEmailAvailable(



        email,



        userId



      );











      data.email =



        email;







    }











    // ==================================================



    // MOBILE



    // ==================================================







    if (



      hasMobile



    ) {







      const mobile =



        normalizeMobile(



          req.body?.mobile



        );











      if (



        !isValidMobile(



          mobile



        )



      ) {







        throw new Error(



          "Mobile number must contain exactly 10 digits"



        );







      }











      await ensureMobileAvailable(



        mobile,



        userId



      );











      data.mobile =



        mobile;







    }











    // ==================================================

    // PASSWORD

    //

    // Blank password = unchanged

    // Only SUPER_ADMIN can reset another user's password here.

    // ==================================================



    if (

      hasPassword

    ) {



      const password =

        String(

          req.body?.password ??

          ""

        );





      if (

        password.length >

        0

      ) {



        if (

          actor.role !==

          "SUPER_ADMIN"

        ) {



          return res

            .status(403)

            .json({



              success:

                false,



              message:

                "Only Super Admin can reset another user's password",



            });



        }





        if (

          password.length <

          8

        ) {



          throw new Error(

            "Password must be at least 8 characters"

          );



        }





        data.passwordHash =

          await bcrypt.hash(

            password,

            12

          );





        data.passwordChangedAt =

          new Date();





        data.passwordChangedBy =

          "ADMIN";



        data.passwordChangedByUserId =

          actor.userId;



      }



    }







    // ==================================================



    // FULL MANAGEMENT ONLY



    // ==================================================







    if (



      fullAccess



    ) {







      let nextRole =



        existingUser.role as



          AppUserRole;











      let nextIsActive =



        existingUser.isActive;











      // --------------------------------------------------



      // ROLE



      // --------------------------------------------------







      if (



        hasRole



      ) {







        const requestedRole =



          normalizeRole(



            req.body?.role



          );











        if (



          !CREATABLE_ROLES.includes(



            requestedRole



          )



        ) {







          throw new Error(



            "Invalid user role"



          );







        }











        nextRole =



          requestedRole;







      }











      // --------------------------------------------------



      // STATUS



      // --------------------------------------------------







      if (



        hasIsActive



      ) {







        if (



          typeof req.body?.isActive !==



          "boolean"



        ) {







          throw new Error(



            "isActive must be true or false"



          );







        }











        nextIsActive =



          req.body.isActive;







      }











      // --------------------------------------------------



      // CANNOT DEACTIVATE OWN ACCOUNT



      // --------------------------------------------------







      if (



        actor.userId ===



          userId &&



        existingUser.isActive &&



        nextIsActive ===



          false



      ) {







        throw new Error(



          "You cannot deactivate your own account"



        );







      }











      // --------------------------------------------------



      // LAST ACTIVE SUPER ADMIN



      // --------------------------------------------------







      const removingActiveSuperAdmin =



        existingUser.role ===



          "SUPER_ADMIN" &&



        existingUser.isActive &&



        (



          nextRole !==



            "SUPER_ADMIN" ||



          nextIsActive ===



            false



        );











      if (



        removingActiveSuperAdmin



      ) {







        await ensureAnotherActiveSuperAdminExists(



          existingUser.id



        );







      }











      if (



        hasRole



      ) {







        data.role =



          nextRole;







      }











      // --------------------------------------------------



      // UNIT



      // --------------------------------------------------







      if (



        hasRole ||



        hasUnitCode



      ) {







        if (



          nextRole ===



          "INCHARGE_DIRECTOR"



        ) {







          if (



            hasUnitCode &&



            String(



              req.body?.unitCode ??



              ""



            ).trim()



          ) {







            data.unitId =



              await getUnitIdForRole(



                nextRole,



                req.body?.unitCode



              );







          }



          else if (



            existingUser.role ===



              "INCHARGE_DIRECTOR" &&



            existingUser.unitId



          ) {







            data.unitId =



              existingUser.unitId;







          }



          else {







            throw new Error(



              "Unit is required for Incharge Director"



            );







          }







        }



        else {







          data.unitId =



            null;







        }







      }











      if (



        hasIsActive



      ) {







        data.isActive =



          nextIsActive;







      }







    }











    const updatedUser =



      await prisma.user.update({







        where: {







          id:



            userId,







        },







        data:



          data as any,







        select:



          PUBLIC_USER_SELECT,







      });











    return res



      .status(200)



      .json({







        success:



          true,







        message:



          "User details updated successfully",







        data:



          updatedUser,







      });







  }



  catch (



    error



  ) {







    const message =



      error instanceof Error



        ? error.message



        : "Unable to update user details";











    return res



      .status(400)



      .json({







        success:



          false,







        message,







      });







  }







}











// ======================================================

// CHANGE OWN PASSWORD

// ======================================================



export async function changeOwnPassword(

  req: AuthenticatedRequest,

  res: Response

) {



  try {



    const actor =

      ensureAuthenticated(

        req

      );





    const currentPassword =

      String(

        req.body?.currentPassword ??

        ""

      );





    const newPassword =

      String(

        req.body?.newPassword ??

        ""

      );





    if (

      !currentPassword

    ) {



      throw new Error(

        "Current password is required"

      );



    }





    if (

      newPassword.length <

      8

    ) {



      throw new Error(

        "New password must be at least 8 characters"

      );



    }





    const user =

      await prisma.user.findUnique({



        where: {

          id:

            actor.userId,

        },



        select: {

          id:

            true,



          passwordHash:

            true,



          isActive:

            true,

        },



      });





    if (

      !user ||

      !user.isActive

    ) {



      return res

        .status(404)

        .json({



          success:

            false,



          message:

            "Active user account not found",



        });



    }





    const currentPasswordMatches =

      await bcrypt.compare(

        currentPassword,

        user.passwordHash

      );





    if (

      !currentPasswordMatches

    ) {



      return res

        .status(400)

        .json({



          success:

            false,



          message:

            "Current password is incorrect",



        });



    }





    const sameAsCurrent =

      await bcrypt.compare(

        newPassword,

        user.passwordHash

      );





    if (

      sameAsCurrent

    ) {



      throw new Error(

        "New password must be different from current password"

      );



    }





    const passwordHash =

      await bcrypt.hash(

        newPassword,

        12

      );





    const updatedUser =

      await prisma.user.update({



        where: {

          id:

            actor.userId,

        },



        data: {

          passwordHash,



          passwordChangedAt:

            new Date(),



          passwordChangedBy:

            "SELF" as any,



          passwordChangedByUserId:

            actor.userId,

        },



        select: {

          id:

            true,



          passwordChangedAt:

            true,



          passwordChangedBy:

            true,

        },



      });





    return res

      .status(200)

      .json({



        success:

          true,



        message:

          "Password changed successfully",



        data:

          updatedUser,



      });



  }

  catch (

    error

  ) {



    return res

      .status(400)

      .json({



        success:

          false,



        message:

          error instanceof Error

            ? error.message

            : "Unable to change password",



      });



  }



}





// ======================================================

// PASSWORD STATUS

// ======================================================



export async function getUserPasswordStatus(

  req: AuthenticatedRequest,

  res: Response

) {



  try {

    ensureFullManagementAccess(
      req
    );





    const userId =

      getUserId(

        req.params.id

      );





    const user =

      await prisma.user.findUnique({



        where: {

          id:

            userId,

        },



        select: {

          id:

            true,



          name:

            true,



          username:

            true,



          passwordChangedAt:

            true,



          passwordChangedBy:

            true,



          passwordChangedByUser:

            {

              select: {

                id: true,

                name: true,

                username: true,

                role: true,

              },

            },

        },



      });





    if (

      !user

    ) {



      return res

        .status(404)

        .json({



          success:

            false,



          message:

            "User not found",



        });



    }





    return res

      .status(200)

      .json({



        success:

          true,



        data:

          user,



      });



  }

  catch (

    error

  ) {



    return res

      .status(400)

      .json({



        success:

          false,



        message:

          error instanceof Error

            ? error.message

            : "Unable to load password status",



      });



  }



}





// ======================================================
// RESET PASSWORD
//
// FULL MANAGEMENT ONLY:
// SUPER_ADMIN
// MASTER_ADMIN
// ADMIN
// DIRECTOR
//
// Body:
// {
//   "newPassword": "new password",
//   "confirmPassword": "new password"
// }
//
// Minimum 6 characters.
// Password may contain letters, numbers, symbols or spaces.
// Database stores only the bcrypt hash.
// ======================================================

export async function resetUserPassword(
  req: AuthenticatedRequest,
  res: Response
) {

  try {

    const actor =
      ensureFullManagementAccess(
        req
      );

    const userId =
      getUserId(
        req.params.id
      );

    const target =
      await prisma.user.findUnique({

        where: {
          id:
            userId,
        },

        select: {
          id:
            true,

          name:
            true,

          username:
            true,

          passwordHash:
            true,

          isActive:
            true,
        },

      });

    if (
      !target
    ) {

      return res
        .status(404)
        .json({

          success:
            false,

          message:
            "User not found",

        });

    }

    const newPassword =
      String(
        req.body?.newPassword ??
        ""
      );

    const confirmPassword =
      String(
        req.body?.confirmPassword ??
        ""
      );

    if (
      !newPassword ||
      !newPassword.trim()
    ) {

      throw new Error(
        "New password is required"
      );

    }

    if (
      newPassword.length <
      6
    ) {

      throw new Error(
        "New password must be at least 6 characters"
      );

    }

    if (
      newPassword.length >
      128
    ) {

      throw new Error(
        "New password must not exceed 128 characters"
      );

    }

    if (
      newPassword !==
      confirmPassword
    ) {

      throw new Error(
        "New password and confirm password do not match"
      );

    }

    const sameAsCurrentPassword =
      await bcrypt.compare(
        newPassword,
        target.passwordHash
      );

    if (
      sameAsCurrentPassword
    ) {

      throw new Error(
        "New password must be different from current password"
      );

    }

    const passwordHash =
      await bcrypt.hash(
        newPassword,
        12
      );

    const changedAt =
      new Date();

    const updatedUser =
      await prisma.user.update({

        where: {
          id:
            userId,
        },

        data: {
          passwordHash,

          passwordChangedAt:
            changedAt,

          passwordChangedBy:
            "ADMIN" as any,

          passwordChangedByUserId:
            actor.userId,
        },

        select: {
          id:
            true,

          name:
            true,

          username:
            true,

          passwordChangedAt:
            true,

          passwordChangedBy:
            true,

          passwordChangedByUser: {
            select: {
              id: true,
              name: true,
              username: true,
              role: true,
            },
          },
        },

      });

    return res
      .status(200)
      .json({

        success:
          true,

        message:
          "Password reset successfully",

        data:
          updatedUser,

      });

  }
  catch (
    error
  ) {

    return res
      .status(400)
      .json({

        success:
          false,

        message:
          error instanceof Error
            ? error.message
            : "Unable to reset password",

      });

  }

}


// ======================================================



// ACTIVE / INACTIVE



//



// FULL MANAGEMENT ONLY



// ======================================================







export async function updateUserStatus(



  req: AuthenticatedRequest,



  res: Response



) {







  try {







    const actor =



      ensureFullManagementAccess(



        req



      );











    const userId =



      getUserId(



        req.params.id



      );











    const isActive =



      req.body?.isActive;











    if (



      typeof isActive !==



      "boolean"



    ) {







      throw new Error(



        "isActive must be true or false"



      );







    }











    if (



      actor.userId ===



        userId &&



      isActive ===



        false



    ) {







      throw new Error(



        "You cannot deactivate your own account"



      );







    }











    const target =



      await prisma.user.findUnique({







        where: {







          id:



            userId,







        },







        select: {







          id:



            true,







          role:



            true,







          isActive:



            true,







        },







      });











    if (



      !target



    ) {







      return res



        .status(404)



        .json({







          success:



            false,







          message:



            "User not found",







        });







    }











    if (



      target.role ===



        "SUPER_ADMIN" &&



      target.isActive &&



      isActive ===



        false



    ) {







      await ensureAnotherActiveSuperAdminExists(



        target.id



      );







    }











    const updatedUser =



      await prisma.user.update({







        where: {







          id:



            userId,







        },







        data: {







          isActive,







        },







        select:



          PUBLIC_USER_SELECT,







      });











    return res



      .status(200)



      .json({







        success:



          true,







        message:



          isActive



            ? "User activated successfully"



            : "User deactivated successfully",







        data:



          updatedUser,







      });







  }



  catch (



    error



  ) {







    const message =



      error instanceof Error



        ? error.message



        : "Unable to update user status";











    const forbidden =



      message ===



      "You do not have permission to manage users";











    return res



      .status(



        forbidden



          ? 403



          : 400



      )



      .json({







        success:



          false,







        message,







      });







  }







}











// ======================================================



// CHANGE ROLE



//



// FULL MANAGEMENT ONLY



// ======================================================







export async function changeUserRole(



  req: AuthenticatedRequest,



  res: Response



) {







  try {







    ensureFullManagementAccess(



      req



    );











    const userId =



      getUserId(



        req.params.id



      );











    const role =



      normalizeRole(



        req.body?.role



      );











    if (



      !CREATABLE_ROLES.includes(



        role



      )



    ) {







      throw new Error(



        "Invalid user role"



      );







    }











    const target =



      await prisma.user.findUnique({







        where: {







          id:



            userId,







        },







        select: {







          id:



            true,







          role:



            true,







          unitId:



            true,







          isActive:



            true,







        },







      });











    if (



      !target



    ) {







      return res



        .status(404)



        .json({







          success:



            false,







          message:



            "User not found",







        });







    }











    if (



      target.role ===



        "SUPER_ADMIN" &&



      target.isActive &&



      role !==



        "SUPER_ADMIN"



    ) {







      await ensureAnotherActiveSuperAdminExists(



        target.id



      );







    }











    let unitId:



      number |



      null;











    if (



      role ===



      "INCHARGE_DIRECTOR"



    ) {







      const unitCode =



        String(



          req.body?.unitCode ??



          ""



        ).trim();











      if (



        unitCode



      ) {







        unitId =



          await getUnitIdForRole(



            role,



            unitCode



          );







      }



      else if (



        target.role ===



          "INCHARGE_DIRECTOR" &&



        target.unitId



      ) {







        unitId =



          target.unitId;







      }



      else {







        throw new Error(



          "Unit is required for Incharge Director"



        );







      }







    }



    else {







      unitId =



        null;







    }











    const updatedUser =



      await prisma.user.update({







        where: {







          id:



            userId,







        },







        data: {







          role:



            role as any,







          unitId,







        },







        select:



          PUBLIC_USER_SELECT,







      });











    return res



      .status(200)



      .json({







        success:



          true,







        message:



          "User role updated successfully",







        data:



          updatedUser,







      });







  }



  catch (



    error



  ) {







    const message =



      error instanceof Error



        ? error.message



        : "Unable to change user role";











    const forbidden =



      message ===



      "You do not have permission to manage users";
    return res
      .status(
        forbidden
          ? 403
          : 400
      )
      .json({
        success:
          false,
        message,
      });
  }
}
export async function deleteUser(
  req: AuthenticatedRequest,
  res: Response
) {
  try {
    const actor =
      ensureFullManagementAccess(
        req
      );
    const userId =
      getUserId(
        req.params.id
      );
    if (
      actor.userId ===
      userId
    ) {
      throw new Error(
        "You cannot delete your own account"
      );
    }
    const target =
      await prisma.user.findUnique({
        where: {
          id:
            userId,
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











    if (



      !target



    ) {







      return res



        .status(404)



        .json({







          success:



            false,







          message:



            "User not found",







        });







    }











    if (



      target.role ===



        "SUPER_ADMIN" &&



      target.isActive



    ) {







      await ensureAnotherActiveSuperAdminExists(



        target.id



      );







    }











    await prisma.user.delete({







      where: {







        id:



          userId,







      },







    });











    return res



      .status(200)



      .json({







        success:



          true,







        message:



          "User deleted successfully",







        data: {







          id:



            target.id,







          name:



            target.name,







          username:



            target.username,







        },



      });


  }



  catch (


    error

  ) {

    const message =



      error instanceof Error


        ? error.message


        : "Unable to delete user";


    const forbidden =

      message ===


      "You do not have permission to manage users";

    return res



      .status(



        forbidden



          ? 403



          : 400



      )



      .json({







        success:



          false,







        message,







      });







  }







}
