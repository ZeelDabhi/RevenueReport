import {
  useState,
  type FormEvent,
} from "react";

import axios from "axios";

import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import api from "../services/api";

import "./ChangePasswordPage.css";


type PasswordChangedBy =
  | "SELF"
  | "ADMIN";


type ChangePasswordResponse = {
  success: boolean;
  message?: string;
  data?: {
    id: number;
    passwordChangedAt: string | null;
    passwordChangedBy: PasswordChangedBy | null;
  };
};


type ApiErrorResponse = {
  success?: boolean;
  message?: string;
};


type StoredUser = {
  id?: number;
  name?: string;
  username?: string;
  role?: string;
};


function getStoredUser(): StoredUser {

  try {

    const raw =
      localStorage.getItem(
        "revenue_user"
      );


    if (
      !raw
    ) {

      return {};

    }


    return JSON.parse(
      raw
    ) as StoredUser;

  }
  catch {

    return {};

  }

}


function getErrorMessage(
  error: unknown,
  fallback: string
): string {

  if (
    axios.isAxiosError(
      error
    )
  ) {

    const responseData =
      error.response?.data as
        | ApiErrorResponse
        | undefined;


    return (
      responseData?.message ??
      fallback
    );

  }


  return fallback;

}


function formatIndiaDateTime(
  value: string | null | undefined
): string {

  if (
    !value
  ) {

    return "-";

  }


  const date =
    new Date(
      value
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {

    return "-";

  }


  return new Intl.DateTimeFormat(
    "en-IN",
    {
      timeZone:
        "Asia/Kolkata",

      day:
        "2-digit",

      month:
        "2-digit",

      year:
        "numeric",

      hour:
        "2-digit",

      minute:
        "2-digit",

      second:
        "2-digit",

      hour12:
        true,
    }
  ).format(
    date
  );

}


function ChangePasswordPage() {

  const [
    user,
  ] =
    useState<StoredUser>(
      getStoredUser
    );


  const [
    currentPassword,
    setCurrentPassword,
  ] =
    useState("");


  const [
    newPassword,
    setNewPassword,
  ] =
    useState("");


  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");


  const [
    showCurrentPassword,
    setShowCurrentPassword,
  ] =
    useState(false);


  const [
    showNewPassword,
    setShowNewPassword,
  ] =
    useState(false);


  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    success,
    setSuccess,
  ] =
    useState("");


  const [
    changedAt,
    setChangedAt,
  ] =
    useState<string | null>(
      null
    );


  const [
    changedBy,
    setChangedBy,
  ] =
    useState<PasswordChangedBy | null>(
      null
    );


  const clearMessages =
    () => {

      setError(
        ""
      );

      setSuccess(
        ""
      );

    };


  const handleSubmit =
    async (
      event:
        FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();

      clearMessages();


      if (
        !currentPassword
      ) {

        setError(
          "Current password is required."
        );

        return;

      }


      if (
        newPassword.length <
        8
      ) {

        setError(
          "New password must be at least 8 characters."
        );

        return;

      }


      if (
        newPassword ===
        currentPassword
      ) {

        setError(
          "New password must be different from current password."
        );

        return;

      }


      if (
        newPassword !==
        confirmPassword
      ) {

        setError(
          "New password and confirm password do not match."
        );

        return;

      }


      try {

        setSaving(
          true
        );


        const response =
          await api.patch<ChangePasswordResponse>(
            "/users/me/password",
            {
              currentPassword,
              newPassword,
            }
          );


        setSuccess(
          response.data.message ??
          "Password changed successfully."
        );


        setChangedAt(
          response.data.data
            ?.passwordChangedAt ??
          null
        );


        setChangedBy(
          response.data.data
            ?.passwordChangedBy ??
          null
        );


        setCurrentPassword(
          ""
        );

        setNewPassword(
          ""
        );

        setConfirmPassword(
          ""
        );


        setShowCurrentPassword(
          false
        );

        setShowNewPassword(
          false
        );

        setShowConfirmPassword(
          false
        );

      }
      catch (
        changeError
      ) {

        setError(
          getErrorMessage(
            changeError,
            "Unable to change password."
          )
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  return (

    <div className="change-password-page">

      <div className="change-password-shell">

        <div className="change-password-header">

          <div className="change-password-header-icon">

            <KeyRound
              size={28}
            />

          </div>


          <div>

            <p className="change-password-eyebrow">

              Aayush Group of Hospitals

            </p>


            <h1>

              Change My Password

            </h1>


            <p>

              Change the password for your currently logged-in account.

            </p>

          </div>

        </div>


        <div className="change-password-user-card">

          <div>

            <span>
              Logged in as
            </span>

            <strong>

              {
                user.name ||
                user.username ||
                "Current User"
              }

            </strong>

          </div>


          {
            user.role && (

              <div>

                <span>
                  Role
                </span>

                <strong>

                  {
                    user.role
                      .replaceAll(
                        "_",
                        " "
                      )
                  }

                </strong>

              </div>

            )
          }

        </div>


        {
          error && (

            <div className="change-password-message error">

              {error}

            </div>

          )
        }


        {
          success && (

            <div className="change-password-message success">

              <CheckCircle2
                size={19}
              />

              <div>

                <strong>

                  {success}

                </strong>


                {
                  changedAt && (

                    <span>

                      Changed:
                      {" "}
                      {
                        formatIndiaDateTime(
                          changedAt
                        )
                      }
                      {" "}
                      IST

                      {
                        changedBy
                          ? ` · ${changedBy}`
                          : ""
                      }

                    </span>

                  )
                }

              </div>

            </div>

          )
        }


        <form
          className="change-password-form"
          onSubmit={
            handleSubmit
          }
        >

          <div className="change-password-field">

            <label
              htmlFor="current-password"
            >

              Current Password

            </label>


            <div className="change-password-input-wrap">

              <LockKeyhole
                size={18}
              />

              <input
                id="current-password"
                type={
                  showCurrentPassword
                    ? "text"
                    : "password"
                }
                value={
                  currentPassword
                }
                onChange={
                  (
                    event
                  ) =>
                    setCurrentPassword(
                      event.target.value
                    )
                }
                autoComplete="current-password"
                disabled={
                  saving
                }
                placeholder="Enter current password"
              />


              <button
                type="button"
                className="change-password-eye"
                onClick={
                  () =>
                    setShowCurrentPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                }
                aria-label={
                  showCurrentPassword
                    ? "Hide current password"
                    : "Show current password"
                }
              >

                {
                  showCurrentPassword
                    ? (
                      <EyeOff
                        size={18}
                      />
                    )
                    : (
                      <Eye
                        size={18}
                      />
                    )
                }

              </button>

            </div>

          </div>


          <div className="change-password-field">

            <label
              htmlFor="new-password"
            >

              New Password

            </label>


            <div className="change-password-input-wrap">

              <KeyRound
                size={18}
              />

              <input
                id="new-password"
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={
                  newPassword
                }
                onChange={
                  (
                    event
                  ) =>
                    setNewPassword(
                      event.target.value
                    )
                }
                autoComplete="new-password"
                disabled={
                  saving
                }
                minLength={8}
                placeholder="Minimum 8 characters"
              />


              <button
                type="button"
                className="change-password-eye"
                onClick={
                  () =>
                    setShowNewPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                }
                aria-label={
                  showNewPassword
                    ? "Hide new password"
                    : "Show new password"
                }
              >

                {
                  showNewPassword
                    ? (
                      <EyeOff
                        size={18}
                      />
                    )
                    : (
                      <Eye
                        size={18}
                      />
                    )
                }

              </button>

            </div>

          </div>


          <div className="change-password-field">

            <label
              htmlFor="confirm-password"
            >

              Confirm New Password

            </label>


            <div className="change-password-input-wrap">

              <ShieldCheck
                size={18}
              />

              <input
                id="confirm-password"
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={
                  confirmPassword
                }
                onChange={
                  (
                    event
                  ) =>
                    setConfirmPassword(
                      event.target.value
                    )
                }
                autoComplete="new-password"
                disabled={
                  saving
                }
                minLength={8}
                placeholder="Re-enter new password"
              />


              <button
                type="button"
                className="change-password-eye"
                onClick={
                  () =>
                    setShowConfirmPassword(
                      (
                        current
                      ) =>
                        !current
                    )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide confirm password"
                    : "Show confirm password"
                }
              >

                {
                  showConfirmPassword
                    ? (
                      <EyeOff
                        size={18}
                      />
                    )
                    : (
                      <Eye
                        size={18}
                      />
                    )
                }

              </button>

            </div>

          </div>


          <div className="change-password-security-note">

            <ShieldCheck
              size={19}
            />

            <div>

              <strong>
                Secure password handling
              </strong>

              <span>

                Your password is sent only to the protected API for verification and is not displayed or stored as plain text by this page.

              </span>

            </div>

          </div>


          <button
            type="submit"
            className="change-password-submit"
            disabled={
              saving
            }
          >

            {
              saving
                ? "Changing Password..."
                : "Change Password"
            }

          </button>

        </form>

      </div>

    </div>

  );

}


export default ChangePasswordPage;
