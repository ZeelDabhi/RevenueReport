import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  RefreshCw,
  Save,
  Target,
} from "lucide-react";

import {
  useNavigate,
} from "react-router-dom";

import axios from "axios";

import api from "../services/api";

import "./TargetPage.css";


type UnitCode =
  | "MB"
  | "OS"
  | "SV"
  | "MS"
  | "BJ"
  | "JN"
  | "SM";


type UnitOption = {
  code: UnitCode;
  name: string;
};


type StoredUser = {
  role?: string;
};


type TargetRecord = {
  unitCode: string;
  unitName?: string;
  targetLakhs: number;
};


type TargetData = {
  year: number;
  month: number;
  totalUnits?: number;
  totalTargetLakhs?: number;
  targets: TargetRecord[];
};


type ApiEnvelope<T> = {
  success?: boolean;
  message?: string;
  data?: T;
};


const UNITS: UnitOption[] = [
  {
    code: "MB",
    name: "Morbi",
  },
  {
    code: "OS",
    name: "Oswal",
  },
  {
    code: "SV",
    name: "Surendranagar",
  },
  {
    code: "MS",
    name: "Mehsana",
  },
  {
    code: "BJ",
    name: "Bhuj",
  },
  {
    code: "JN",
    name: "Junagadh",
  },
  {
    code: "SM",
    name: "Samarpan",
  },
];


const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];


function createEmptyTargets():
  Record<UnitCode, string> {

  return {
    MB: "",
    OS: "",
    SV: "",
    MS: "",
    BJ: "",
    JN: "",
    SM: "",
  };

}


function getStoredUser(): StoredUser {

  const value =
    localStorage.getItem(
      "revenue_user"
    );


  if (
    !value
  ) {

    return {};

  }


  try {

    return JSON.parse(
      value
    ) as StoredUser;

  }
  catch {

    return {};

  }

}


function getCurrentYear(): number {

  return new Date()
    .getFullYear();

}


function getCurrentMonth(): number {

  return (
    new Date()
      .getMonth() + 1
  );

}


function TargetPage() {

  const navigate =
    useNavigate();


  const [
    user,
  ] =
    useState<StoredUser>(
      getStoredUser
    );


  const [
    year,
    setYear,
  ] =
    useState(
      getCurrentYear
    );


  const [
    month,
    setMonth,
  ] =
    useState(
      getCurrentMonth
    );


  const [
    targets,
    setTargets,
  ] =
    useState<
      Record<UnitCode, string>
    >(
      createEmptyTargets
    );


  const [
    loading,
    setLoading,
  ] =
    useState(true);


  const [
    saving,
    setSaving,
  ] =
    useState(false);


  const [
    refreshKey,
    setRefreshKey,
  ] =
    useState(0);


  const [
    error,
    setError,
  ] =
    useState("");


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  // ======================================================
  // PERMISSION
  // ======================================================

  const canEdit =
    user.role ===
      "SUPER_ADMIN" ||
    user.role ===
      "MASTER_ADMIN" ||
    user.role ===
      "ADMIN";


  // ======================================================
  // MONTHLY GROUP TARGET
  //
  // Monthly Group Target =
  // Sum of all 7 Unit Targets
  // ======================================================

  const unitTargetTotal =
    UNITS.reduce(
      (
        total,
        unit
      ) => {

        const value =
          Number(
            targets[
              unit.code
            ]
          );


        return (
          total +
          (
            Number.isFinite(
              value
            )
              ? value
              : 0
          )
        );

      },
      0
    );


  const groupTarget =
    Number(
      unitTargetTotal.toFixed(
        2
      )
    );


  // ======================================================
  // LOAD UNIT TARGETS
  // ======================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      api.get<
        ApiEnvelope<TargetData>
      >(
        "/revenue/targets",
        {

          params: {
            year,
            month,
          },

          signal:
            controller.signal,

        }
      )
        .then(
          (
            response
          ) => {

            if (
              !active
            ) {

              return;

            }


            const payload =
              response.data.data ??
              (
                response.data as
                  unknown as
                  TargetData
              );


            const nextTargets =
              createEmptyTargets();


            for (
              const target
              of payload.targets ??
              []
            ) {

              const code =
                target.unitCode as
                  UnitCode;


              if (
                code in
                nextTargets
              ) {

                nextTargets[
                  code
                ] =
                  String(
                    target.targetLakhs
                  );

              }

            }


            setTargets(
              nextTargets
            );


            setError(
              ""
            );

          }
        )
        .catch(
          (
            err: unknown
          ) => {

            if (
              !active
            ) {

              return;

            }


            if (
              axios.isAxiosError(
                err
              )
            ) {

              if (
                err.code ===
                "ERR_CANCELED"
              ) {

                return;

              }


              if (
                err.response?.status ===
                401
              ) {

                navigate(
                  "/login",
                  {
                    replace:
                      true,
                  }
                );

                return;

              }


              const data =
                err.response?.data as
                  | {
                      message?: string;
                    }
                  | undefined;


              setError(
                data?.message ||
                "Unable to load targets."
              );

              return;

            }


            setError(
              "Unable to load targets."
            );

          }
        )
        .finally(
          () => {

            if (
              active
            ) {

              setLoading(
                false
              );

            }

          }
        );


      return () => {

        active =
          false;

        controller.abort();

      };

    },
    [
      year,
      month,
      refreshKey,
      navigate,
    ]
  );


  // ======================================================
  // CHANGE UNIT TARGET
  // ======================================================

  const handleTargetChange =
    (
      unitCode: UnitCode,
      value: string
    ) => {

      if (
        !canEdit
      ) {

        return;

      }


      setTargets(
        (
          current
        ) => ({

          ...current,

          [unitCode]:
            value,

        })
      );


      setSuccessMessage(
        ""
      );


      setError(
        ""
      );

    };


  // ======================================================
  // REFRESH
  // ======================================================

  const handleRefresh =
    () => {

      setLoading(
        true
      );


      setError(
        ""
      );


      setSuccessMessage(
        ""
      );


      setRefreshKey(
        (
          current
        ) =>
          current + 1
      );

    };


  // ======================================================
  // SAVE TARGETS
  // ======================================================

  const handleSave =
    async () => {

      if (
        !canEdit
      ) {

        return;

      }


      setError(
        ""
      );


      setSuccessMessage(
        ""
      );


      const targetPayload =
        UNITS.map(
          (
            unit
          ) => {

            const value =
              Number(
                targets[
                  unit.code
                ]
              );


            return {

              unitCode:
                unit.code,

              targetLakhs:
                value,

            };

          }
        );


      const invalidTarget =
        targetPayload.find(
          (
            item
          ) =>
            !Number.isFinite(
              item.targetLakhs
            ) ||
            item.targetLakhs <
              0
        );


      if (
        invalidTarget
      ) {

        setError(
          `Valid target is required for ${invalidTarget.unitCode}.`
        );

        return;

      }


      try {

        setSaving(
          true
        );


        // ==================================================
        // SAVE 7 UNIT TARGETS
        // ==================================================

        await api.post(
          "/revenue/targets",
          {

            year,

            month,

            targets:
              targetPayload,

          }
        );


        // ==================================================
        // SAVE AUTO MONTHLY GROUP TARGET
        // ==================================================

        await api.post(
          "/revenue/group-target",
          {

            year,

            month,

            groupTargetLakhs:
              groupTarget,

          }
        );


        // ==================================================
        // SUCCESS MESSAGE
        // ==================================================

        setSuccessMessage(
          `Targets saved successfully. Monthly Group Target: ₹ ${groupTarget.toLocaleString(
            "en-IN",
            {
              minimumFractionDigits:
                2,

              maximumFractionDigits:
                2,
            }
          )} L`
        );

      }
      catch (
        err
      ) {

        if (
          axios.isAxiosError(
            err
          )
        ) {

          const data =
            err.response?.data as
              | {
                  message?: string;
                }
              | undefined;


          setError(
            data?.message ||
            "Unable to save targets."
          );

        }
        else {

          setError(
            "Unable to save targets."
          );

        }

      }
      finally {

        setSaving(
          false
        );

      }

    };


  return (

    <div className="target-page">

      <div className="target-page-header">

        <div>

          <p className="target-page-eyebrow">
            Aayush Group of Hospitals
          </p>

          <h1>
            Revenue Targets
          </h1>

          <p className="target-page-subtitle">
            Enter monthly target for each unit. Monthly Group Target is calculated automatically.
          </p>

        </div>


        <button
          type="button"
          className="target-refresh-button"
          onClick={
            handleRefresh
          }
          disabled={
            loading ||
            saving
          }
        >

          <RefreshCw
            size={17}
            className={
              loading
                ? "target-spin"
                : ""
            }
          />

          Refresh

        </button>

      </div>


      <div className="target-filter-card">

        <div className="target-filter-icon">

          <CalendarDays
            size={20}
          />

        </div>


        <div className="target-filter-field">

          <label>
            Year
          </label>

          <select
            value={
              year
            }
            onChange={
              (
                event
              ) => {

                setLoading(
                  true
                );


                setSuccessMessage(
                  ""
                );


                setYear(
                  Number(
                    event.target.value
                  )
                );

              }
            }
          >

            {
              Array.from(
                {
                  length:
                    8,
                },
                (
                  _,
                  index
                ) =>
                  getCurrentYear() -
                  3 +
                  index
              ).map(
                (
                  item
                ) => (

                  <option
                    key={
                      item
                    }
                    value={
                      item
                    }
                  >
                    {item}
                  </option>

                )
              )
            }

          </select>

        </div>


        <div className="target-filter-field">

          <label>
            Month
          </label>

          <select
            value={
              month
            }
            onChange={
              (
                event
              ) => {

                setLoading(
                  true
                );


                setSuccessMessage(
                  ""
                );


                setMonth(
                  Number(
                    event.target.value
                  )
                );

              }
            }
          >

            {
              MONTHS.map(
                (
                  monthName,
                  index
                ) => (

                  <option
                    key={
                      monthName
                    }
                    value={
                      index + 1
                    }
                  >
                    {monthName}
                  </option>

                )
              )
            }

          </select>

        </div>


        <div className="target-filter-summary">

          <span>
            Monthly Group Target
          </span>

          <strong>

            ₹{" "}

            {
              groupTarget.toLocaleString(
                "en-IN",
                {
                  minimumFractionDigits:
                    2,

                  maximumFractionDigits:
                    2,
                }
              )
            }

            {" "}L

          </strong>

        </div>

      </div>


      {
        !canEdit && (

          <div className="target-view-notice">

            View only access. Target editing is available to Admin roles.

          </div>

        )
      }


      {
        error && (

          <div className="target-message error">

            {error}

          </div>

        )
      }


      {
        successMessage && (

          <div className="target-message success">

            <CheckCircle2
              size={18}
            />

            {successMessage}

          </div>

        )
      }


      {
        loading
          ? (

            <div className="target-loading">

              <RefreshCw
                size={24}
                className="target-spin"
              />

              Loading targets...

            </div>

          )
          : (

            <div className="target-content-grid">

              <div className="target-unit-card">

                <div className="target-card-heading">

                  <div className="target-heading-icon">

                    <Target
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Monthly Group Target
                    </h2>

                    <p>
                      Enter monthly target for each unit. Monthly Group Target is calculated automatically.
                    </p>

                  </div>

                </div>


                <div className="target-unit-list">

                  {
                    UNITS.map(
                      (
                        unit
                      ) => (

                        <div
                          key={
                            unit.code
                          }
                          className="target-unit-row"
                        >

                          <div className="target-unit-name">

                            <span>
                              {
                                unit.code
                              }
                            </span>

                            <strong>
                              {
                                unit.name
                              }
                            </strong>

                          </div>


                          <div className="target-input-wrap">

                            <span>
                              ₹
                            </span>

                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={
                                targets[
                                  unit.code
                                ]
                              }
                              disabled={
                                !canEdit ||
                                saving
                              }
                              onChange={
                                (
                                  event
                                ) =>
                                  handleTargetChange(
                                    unit.code,
                                    event.target.value
                                  )
                              }
                              placeholder="0.00"
                            />

                            <span>
                              L
                            </span>

                          </div>

                        </div>

                      )
                    )
                  }

                </div>


                <div className="target-total-row">

                  <span>
                    Monthly Group Target
                  </span>

                  <strong>

                    ₹{" "}

                    {
                      groupTarget.toLocaleString(
                        "en-IN",
                        {
                          minimumFractionDigits:
                            2,

                          maximumFractionDigits:
                            2,
                        }
                      )
                    }

                    {" "}L

                  </strong>

                </div>

              </div>


              <div className="target-group-card">

                <div className="target-card-heading">

                  <div className="target-heading-icon group">

                    <Target
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Monthly Group Target
                    </h2>

                    <p>
                      Automatically calculated from all 7 Unit Targets.
                    </p>

                  </div>

                </div>


                <div className="target-group-body">

                  <label>
                    Monthly Group Target
                  </label>


                  <div className="target-group-input">

                    <span>
                      ₹
                    </span>

                    <input
                      type="text"
                      value={
                        groupTarget.toLocaleString(
                          "en-IN",
                          {
                            minimumFractionDigits:
                              2,

                            maximumFractionDigits:
                              2,
                          }
                        )
                      }
                      readOnly
                    />

                    <span>
                      L
                    </span>

                  </div>


                  <div className="target-independent-note">

                    Monthly Group Target is automatically calculated from the total of all 7 Unit Targets.

                  </div>

                </div>


                {
                  canEdit && (

                    <button
                      type="button"
                      className="target-save-button"
                      onClick={
                        handleSave
                      }
                      disabled={
                        saving
                      }
                    >

                      {
                        saving
                          ? (

                            <>

                              <RefreshCw
                                size={17}
                                className="target-spin"
                              />

                              Saving...

                            </>

                          )
                          : (

                            <>

                              <Save
                                size={17}
                              />

                              Save Targets

                            </>

                          )
                      }

                    </button>

                  )
                }

              </div>

            </div>

          )
      }

    </div>

  );

}


export default TargetPage;