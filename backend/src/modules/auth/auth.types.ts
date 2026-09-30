import type {
  Request,
} from "express";


export type AppUserRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR"
  | "HO_USER";


export interface AuthUser {

  userId: number;

  username: string;

  role: AppUserRole;

  unitId: number | null;

}


export interface AuthenticatedRequest
  extends Request {

  authUser?: AuthUser;

}