import {
  prisma,
} from "../../config/database.ts";

export async function saveGroupTarget(
  year: number,
  month: number,
  groupTargetLakhs: number
) {

  const saved =
    await prisma
      .groupRevenueTarget
      .upsert({

        where: {

          year_month: {
            year,
            month,
          },
        },
        update: {
          groupTargetLakhs,
        },
        create: {
          year,
          month,
          groupTargetLakhs,

        },
      });
  return {
    id:
      saved.id,
    year:
      saved.year,
    month:
      saved.month,
    groupTargetLakhs:
      Number(
        saved.groupTargetLakhs
      ),
    createdAt:
      saved.createdAt,
    updatedAt:
      saved.updatedAt,
  };
}
export async function getGroupTarget(
  year: number,
  month: number
) {

  const record =
    await prisma
      .groupRevenueTarget
      .findUnique({

        where: {

          year_month: {
            year,
            month,
          },
        },
      });

  if (!record) {
    return {
      year,
      month,
      groupTargetLakhs:
        0,
      found:
        false,
    };
  }
  return {

    id:
      record.id,

    year:
      record.year,

    month:
      record.month,

    groupTargetLakhs:
      Number(
        record.groupTargetLakhs
      ),

    found:
      true,

    createdAt:
      record.createdAt,

    updatedAt:
      record.updatedAt,
  };
}