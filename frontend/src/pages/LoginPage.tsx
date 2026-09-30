import {
  useEffect,
  useMemo,
  useState,
} from "react";

import axios from "axios";

import {
  ArrowRight,
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  Eye,
  EyeOff,
  LockKeyhole,
  ShieldCheck,
  TrendingUp,
  UserRound,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

import "./LoginPage.css";


// ======================================================
// TYPES
// ======================================================

type LoginRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR";


type LoginUser = {
  id: number;
  name: string;
  username: string;
  email?: string | null;
  mobile?: string | null;
  role: LoginRole;
  unitId?: number | null;

  unit?: {
    id?: number;
    code?: string;
    name?: string;
  } | null;
};


type LoginResponse = {
  success: boolean;

  message?: string;

  data?: {
    token: string;
    user: LoginUser;
  };
};


type ApiErrorResponse = {
  message?: string;
};


// ======================================================
// ROLE OPTIONS
// ======================================================

const ROLE_OPTIONS: Array<{
  value: LoginRole;
  label: string;
  description: string;
}> = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
    description: "Complete system access",
  },
  {
    value: "MASTER_ADMIN",
    label: "Master Admin",
    description: "Administrative access",
  },
  {
    value: "ADMIN",
    label: "Admin",
    description: "System administration",
  },
  {
    value: "DIRECTOR",
    label: "Director",
    description: "Group-level reporting access",
  },
  {
    value: "INCHARGE_DIRECTOR",
    label: "Incharge Director",
    description: "Unit-level reporting access",
  },
];


// ======================================================
// LOGIN PAGE
// ======================================================

function LoginPage() {

  const navigate =
    useNavigate();


  const [
    selectedRole,
    setSelectedRole,
  ] =
    useState<LoginRole>(
      "SUPER_ADMIN"
    );


  const [
    username,
    setUsername,
  ] =
    useState("");


  const [
    password,
    setPassword,
  ] =
    useState("");


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);


  const [
    roleDropdownOpen,
    setRoleDropdownOpen,
  ] =
    useState(false);


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  // ====================================================
  // CURRENT ROLE
  // ====================================================

  const selectedRoleData =
    useMemo(
      () =>
        ROLE_OPTIONS.find(
          (
            role
          ) =>
            role.value ===
            selectedRole
        ) ??
        ROLE_OPTIONS[0],
      [
        selectedRole,
      ]
    );


  // ====================================================
  // EXISTING LOGIN
  // ====================================================

  useEffect(
    () => {

      const token =
        localStorage.getItem(
          "revenue_token"
        );


      const storedUser =
        localStorage.getItem(
          "revenue_user"
        );


      if (
        token &&
        storedUser
      ) {

        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

      }

    },
    [
      navigate,
    ]
  );


  // ====================================================
  // CLOSE ROLE DROPDOWN
  // ====================================================

  useEffect(
    () => {

      const handleClickOutside =
        (
          event: MouseEvent
        ) => {

          const target =
            event.target as HTMLElement;


          if (
            !target.closest(
              ".login-role-select"
            )
          ) {

            setRoleDropdownOpen(
              false
            );

          }

        };


      document.addEventListener(
        "mousedown",
        handleClickOutside
      );


      return () => {

        document.removeEventListener(
          "mousedown",
          handleClickOutside
        );

      };

    },
    []
  );


  // ====================================================
  // LOGIN
  // ====================================================

  const handleLogin =
    async (
      event: React.FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      setErrorMessage("");


      const cleanUsername =
        username.trim();


      if (
        !cleanUsername
      ) {

        setErrorMessage(
          "Please enter your username."
        );

        return;

      }


      if (
        !password
      ) {

        setErrorMessage(
          "Please enter your password."
        );

        return;

      }


      try {

        setLoading(
          true
        );


        const response =
          await api.post<LoginResponse>(
            "/auth/login",
            {
              username:
                cleanUsername,

              password,
            }
          );


        const loginData =
          response.data;


        if (
          !loginData.success ||
          !loginData.data?.token ||
          !loginData.data?.user
        ) {

          setErrorMessage(
            loginData.message ??
            "Unable to sign in."
          );

          return;

        }


        const actualRole =
          loginData.data.user.role;


        if (
          actualRole !==
          selectedRole
        ) {

          const actualRoleData =
            ROLE_OPTIONS.find(
              (
                role
              ) =>
                role.value ===
                actualRole
            );


          setErrorMessage(
            `This account is registered as ${
              actualRoleData?.label ??
              actualRole
            }. Please select the correct Login As role.`
          );

          return;

        }


        localStorage.setItem(
          "revenue_token",
          loginData.data.token
        );


        localStorage.setItem(
          "revenue_user",
          JSON.stringify(
            loginData.data.user
          )
        );


        navigate(
          "/dashboard",
          {
            replace: true,
          }
        );

      }
      catch (
        error: unknown
      ) {

        const message =
          axios.isAxiosError<ApiErrorResponse>(
            error
          )
            ? error.response?.data?.message
            : undefined;


        setErrorMessage(
          typeof message ===
            "string"
            ? message
            : "Invalid username or password."
        );

      }
      finally {

        setLoading(
          false
        );

      }

    };


  // ====================================================
  // UI
  // ====================================================

  return (

    <main className="premium-login-page">

      {/* ==================================================
          BACKGROUND DECORATION
          ================================================== */}

      <div className="login-background-glow login-background-glow-one" />

      <div className="login-background-glow login-background-glow-two" />


      {/* ==================================================
          LOGIN SHELL
          ================================================== */}

      <section className="premium-login-shell">

        {/* ==================================================
            LEFT BRAND PANEL
            ================================================== */}

        <div className="login-brand-panel">

          <div className="login-brand-pattern login-brand-pattern-one" />

          <div className="login-brand-pattern login-brand-pattern-two" />


          <div className="login-brand-content">

            {/* LOGO */}

            <div className="login-brand-logo-row">

              <div className="login-agh-logo">

                <span>
                  AGH
                </span>

                <div />

              </div>


              <div className="login-brand-small-title">

                <strong>
                  AAYUSH GROUP
                </strong>

                <span>
                  OF HOSPITALS
                </span>

              </div>

            </div>


            {/* HERO */}

            <div className="login-brand-hero">

              <div className="login-brand-eyebrow">

                <span />

                AAYUSH GROUP OF HOSPITALS

              </div>


              <h1>

                Revenue

                <br />

                <span>
                  Report
                </span>

              </h1>


              <p>

                A secure platform for daily revenue
                monitoring, unit-wise performance
                and management reporting across
                Aayush Group of Hospitals.

              </p>

            </div>


            {/* FEATURE CARDS */}

            <div className="login-brand-features">

              <div className="login-brand-feature">

                <div className="login-brand-feature-icon">

                  <BarChart3
                    size={18}
                  />

                </div>

                <div>

                  <strong>
                    Revenue Reports
                  </strong>

                  <span>
                    Daily & historical performance
                  </span>

                </div>

              </div>


              <div className="login-brand-feature">

                <div className="login-brand-feature-icon">

                  <Building2
                    size={18}
                  />

                </div>

                <div>

                  <strong>
                    Unit-wise Control
                  </strong>

                  <span>
                    Secure access by assigned unit
                  </span>

                </div>

              </div>


              <div className="login-brand-feature">

                <div className="login-brand-feature-icon">

                  <TrendingUp
                    size={18}
                  />

                </div>

                <div>

                  <strong>
                    Performance View
                  </strong>

                  <span>
                    Fast management reporting
                  </span>

                </div>

              </div>

            </div>


            {/* LEFT FOOTER */}

            <div className="login-brand-footer">

              <ShieldCheck
                size={16}
              />

              <span>
                Secure Internal Management Portal
              </span>

            </div>

          </div>

        </div>


        {/* ==================================================
            RIGHT LOGIN PANEL
            ================================================== */}

        <div className="login-form-panel">

          <div className="login-form-wrapper">

            {/* SECURITY BADGE */}

            <div className="login-security-badge">

              <ShieldCheck
                size={15}
              />

              SECURE ACCESS

            </div>


            {/* ICON */}

            <div className="login-form-icon">

              <LockKeyhole
                size={27}
              />

            </div>


            {/* TITLE */}

            <div className="login-form-heading">

              <h2>
                Welcome Back
              </h2>

              <p>
                Sign in with your authorized credentials
              </p>

            </div>


            {/* FORM */}

            <form
              className="premium-login-form"
              onSubmit={
                handleLogin
              }
            >

              {/* ==============================================
                  LOGIN ROLE
                  ============================================== */}

              <div className="login-field-group">

                <label>
                  Login As
                </label>


                <div className="login-role-select">

                  <button
                    type="button"
                    className={
                      roleDropdownOpen
                        ? "login-role-trigger open"
                        : "login-role-trigger"
                    }
                    onClick={
                      () =>
                        setRoleDropdownOpen(
                          (
                            current
                          ) =>
                            !current
                        )
                    }
                  >

                    <div className="login-role-trigger-left">

                      <div className="login-input-icon">

                        <ShieldCheck
                          size={17}
                        />

                      </div>


                      <div className="login-role-trigger-text">

                        <strong>

                          {
                            selectedRoleData.label
                          }

                        </strong>

                        <span>

                          {
                            selectedRoleData.description
                          }

                        </span>

                      </div>

                    </div>


                    <ChevronDown
                      size={18}
                      className={
                        roleDropdownOpen
                          ? "rotate"
                          : ""
                      }
                    />

                  </button>


                  {
                    roleDropdownOpen && (

                      <div className="login-role-menu">

                        {
                          ROLE_OPTIONS.map(
                            (
                              role
                            ) => {

                              const active =
                                role.value ===
                                selectedRole;


                              return (

                                <button
                                  key={
                                    role.value
                                  }
                                  type="button"
                                  className={
                                    active
                                      ? "login-role-option active"
                                      : "login-role-option"
                                  }
                                  onClick={
                                    () => {

                                      setSelectedRole(
                                        role.value
                                      );

                                      setRoleDropdownOpen(
                                        false
                                      );

                                      setErrorMessage(
                                        ""
                                      );

                                    }
                                  }
                                >

                                  <div className="login-role-option-icon">

                                    <ShieldCheck
                                      size={17}
                                    />

                                  </div>


                                  <div className="login-role-option-content">

                                    <strong>
                                      {
                                        role.label
                                      }
                                    </strong>

                                    <span>
                                      {
                                        role.description
                                      }
                                    </span>

                                  </div>


                                  {
                                    active && (

                                      <CheckCircle2
                                        size={18}
                                        className="login-role-check"
                                      />

                                    )
                                  }

                                </button>

                              );

                            }
                          )
                        }

                      </div>

                    )
                  }

                </div>

              </div>


              {/* ==============================================
                  USERNAME
                  ============================================== */}

              <div className="login-field-group">

                <label
                  htmlFor="login-username"
                >
                  Username
                </label>


                <div className="login-input-wrapper">

                  <div className="login-input-icon">

                    <UserRound
                      size={17}
                    />

                  </div>


                  <input
                    id="login-username"
                    type="text"
                    value={
                      username
                    }
                    onChange={
                      (
                        event
                      ) => {

                        setUsername(
                          event.target.value
                        );

                        if (
                          errorMessage
                        ) {

                          setErrorMessage(
                            ""
                          );

                        }

                      }
                    }
                    placeholder="Enter your username"
                    autoComplete="username"
                    spellCheck={false}
                  />

                </div>

              </div>


              {/* ==============================================
                  PASSWORD
                  ============================================== */}

              <div className="login-field-group">

                <div className="login-label-row">

                  <label
                    htmlFor="login-password"
                  >
                    Password
                  </label>


                  <span className="login-protected-label">

                    <LockKeyhole
                      size={12}
                    />

                    Protected

                  </span>

                </div>


                <div className="login-input-wrapper">

                  <div className="login-input-icon">

                    <LockKeyhole
                      size={17}
                    />

                  </div>


                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    value={
                      password
                    }
                    onChange={
                      (
                        event
                      ) => {

                        setPassword(
                          event.target.value
                        );

                        if (
                          errorMessage
                        ) {

                          setErrorMessage(
                            ""
                          );

                        }

                      }
                    }
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />


                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={
                      () =>
                        setShowPassword(
                          (
                            current
                          ) =>
                            !current
                        )
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >

                    {
                      showPassword
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


              {/* ==============================================
                  ERROR
                  ============================================== */}

              {
                errorMessage && (

                  <div
                    className="login-error-message"
                    role="alert"
                  >

                    <span>
                      !
                    </span>

                    <p>
                      {
                        errorMessage
                      }
                    </p>

                  </div>

                )
              }


              {/* ==============================================
                  SIGN IN
                  ============================================== */}

              <button
                type="submit"
                className="premium-signin-button"
                disabled={
                  loading
                }
              >

                {
                  loading
                    ? (

                        <>

                          <span className="login-spinner" />

                          Signing in...

                        </>

                      )
                    : (

                        <>

                          Continue to Dashboard

                          <ArrowRight
                            size={18}
                          />

                        </>

                      )
                }

              </button>

            </form>


            {/* FORM FOOTER */}

            <div className="login-form-footer">

              <div>

                <ShieldCheck
                  size={14}
                />

                Protected access

              </div>


              <span />


              <p>
                Authorized Aayush Group users only
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>

  );

}


export default LoginPage;