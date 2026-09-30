import {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  FileSpreadsheet,
  UploadCloud,
  X,
} from "lucide-react";

import {
  Navigate,
} from "react-router-dom";

import axios from "axios";

import api
  from "../services/api";

import "./LMUploadPage.css";


// ======================================================
// TYPES
// ======================================================

type UserRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR"
  | "HO_USER";


type StoredUser = {

  role?:
    UserRole;

  unit?: {

    code?:
      string;

    name?:
      string;

  } | null;

};


type UnitCode =
  | "MB"
  | "OS"
  | "SV"
  | "MS"
  | "BJ"
  | "JN"
  | "SM";


type ApiErrorResponse = {

  success?:
    boolean;

  message?:
    string;

};


// ======================================================
// UNITS
// ======================================================

const UNITS:
  UnitCode[] = [

  "MB",
  "OS",
  "SV",
  "MS",
  "BJ",
  "JN",
  "SM",

];


// ======================================================
// LM UPLOAD ACCESS
// Keep aligned with backend revenue upload roles.
// ======================================================

const LM_UPLOAD_ROLES:
  UserRole[] = [

  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "HO_USER",

];


// ======================================================
// STORED USER
// ======================================================

function getStoredUser():
  StoredUser {

  const rawUser =
    localStorage.getItem(
      "revenue_user"
    );

  if (
    !rawUser
  ) {

    return {};

  }

  try {

    return JSON.parse(
      rawUser
    ) as StoredUser;

  }
  catch {

    return {};

  }

}


// ======================================================
// DEFAULT TARGET MONTH
//
// T = month shown in Speciality Revenue.
// Example:
// Current month September 2026
// Default target month = September 2026
// LM source month      = August 2026
// ======================================================

function getDefaultTargetMonth():
  string {

  const date =
    new Date();

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() +
      1
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}`;

}


// ======================================================
// PREVIOUS MONTH
//
// Input : 2026-09
// Output: 2026-08
//
// Input : 2027-01
// Output: 2026-12
// ======================================================

function getPreviousMonth(
  targetMonth:
    string
): string {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        targetMonth
      );

  if (
    !match
  ) {

    return "";

  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const date =
    new Date(
      year,
      month - 2,
      1
    );

  return `${date.getFullYear()}-${String(
    date.getMonth() +
    1
  ).padStart(
    2,
    "0"
  )}`;

}



// ======================================================
// MONTH END DATE
//
// Input : 2026-08
// Output: 2026-08-31
// ======================================================

function getMonthEndDate(
  selectedMonth:
    string
): string {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        selectedMonth
      );

  if (
    !match
  ) {

    return "";

  }

  const year =
    Number(
      match[1]
    );

  const month =
    Number(
      match[2]
    );

  const lastDay =
    new Date(
      year,
      month,
      0
    )
      .getDate();

  return `${year}-${String(
    month
  ).padStart(
    2,
    "0"
  )}-${String(
    lastDay
  ).padStart(
    2,
    "0"
  )}`;

}


// ======================================================
// DISPLAY MONTH
// ======================================================

function formatMonth(
  value:
    string
): string {

  const match =
    /^(\d{4})-(\d{2})$/
      .exec(
        value
      );

  if (
    !match
  ) {

    return value ||
      "-";

  }

  return new Intl.DateTimeFormat(
    "en-IN",
    {

      month:
        "long",

      year:
        "numeric",

    }
  ).format(
    new Date(
      Number(
        match[1]
      ),
      Number(
        match[2]
      ) -
      1,
      1
    )
  );

}


// ======================================================
// DISPLAY DATE
// ======================================================

function formatDate(
  value:
    string
): string {

  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/
      .exec(
        value
      );

  if (
    !match
  ) {

    return value ||
      "-";

  }

  return `${match[3]}/${match[2]}/${match[1]}`;

}


// ======================================================
// PAGE
// ======================================================

function LMUploadPage() {

  const [
    user,
  ] =
    useState<StoredUser>(
      getStoredUser
    );


  const unitDropdownRef =
    useRef<HTMLDivElement | null>(
      null
    );


  const canUpload =
    Boolean(
      user.role &&
      LM_UPLOAD_ROLES.includes(
        user.role
      )
    );


  const storedUnit =
    user.unit?.code
      ?.trim()
      .toUpperCase() as
        | UnitCode
        | undefined;


  const initialUnit =
    storedUnit &&
    UNITS.includes(
      storedUnit
    )
      ? storedUnit
      : "MB";


  const [
    selectedUnit,
    setSelectedUnit,
  ] =
    useState<UnitCode>(
      initialUnit
    );


  // IMPORTANT:
  // selectedMonth is TARGET MONTH.
  // Example: selectedMonth = September 2026.
  // LM source will automatically become August 2026.

  const [
    selectedMonth,
    setSelectedMonth,
  ] =
    useState(
      getDefaultTargetMonth
    );


  const [
    unitDropdownOpen,
    setUnitDropdownOpen,
  ] =
    useState(
      false
    );


  const [
    file,
    setFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    uploading,
    setUploading,
  ] =
    useState(
      false
    );


  const [
    error,
    setError,
  ] =
    useState(
      ""
    );


  const [
    success,
    setSuccess,
  ] =
    useState(
      ""
    );


  const [
    inputKey,
    setInputKey,
  ] =
    useState(
      0
    );


  // ====================================================
  // OUTSIDE CLICK
  // ====================================================

  useEffect(
    () => {

      const handleOutsideClick =
        (
          event:
            MouseEvent
        ) => {

          if (
            unitDropdownRef.current &&
            !unitDropdownRef.current.contains(
              event.target as Node
            )
          ) {

            setUnitDropdownOpen(
              false
            );

          }

        };


      document.addEventListener(
        "mousedown",
        handleOutsideClick
      );


      return () => {

        document.removeEventListener(
          "mousedown",
          handleOutsideClick
        );

      };

    },
    []
  );


  if (
    !canUpload
  ) {

    return (

      <Navigate
        to="/dashboard"
        replace
      />

    );

  }


  // ====================================================
  // T-1 MONTH LOGIC
  //
  // Target Month = September 2026
  // Source Month = August 2026
  // businessDate = 31/08/2026
  // reportType   = LM
  // ====================================================

  const sourceMonth =
    getPreviousMonth(
      selectedMonth
    );


  const businessDate =
    getMonthEndDate(
      sourceMonth
    );


  // ====================================================
  // SEPTEMBER 2026 MASTER LM MODE
  //
  // September only:
  // One MASTER_DATE_FORMULA.xlsx contains all unit sheets.
  //
  // October onward:
  // Existing unit-wise previous-month CSV upload continues.
  // ====================================================

  const useMasterLmExcel =
    selectedMonth ===
    "2026-09";


  // ====================================================
  // UNIT
  // ====================================================

  const handleUnitSelect =
    (
      unit:
        UnitCode
    ) => {

      setSelectedUnit(
        unit
      );

      setUnitDropdownOpen(
        false
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

    };


  // ====================================================
  // TARGET MONTH CHANGE
  //
  // Clear already selected file so an August file cannot
  // accidentally be uploaded after changing target month.
  // ====================================================

  const handleTargetMonthChange =
    (
      value:
        string
    ) => {

      setSelectedMonth(
        value
      );

      setFile(
        null
      );

      setInputKey(
        (
          current
        ) =>
          current +
          1
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

    };


  // ====================================================
  // FILE
  // ====================================================

  const handleFileChange =
    (
      nextFile:
        File |
        null
    ) => {

      setError(
        ""
      );

      setSuccess(
        ""
      );

      if (
        !nextFile
      ) {

        setFile(
          null
        );

        return;

      }

      const lowerName =
        nextFile.name
          .toLowerCase();


      const validFile =
        useMasterLmExcel
          ? (
              lowerName.endsWith(
                ".xlsx"
              ) ||
              lowerName.endsWith(
                ".xls"
              )
            )
          : lowerName.endsWith(
              ".csv"
            );


      if (
        !validFile
      ) {

        setFile(
          null
        );

        setError(
          useMasterLmExcel
            ? "Please select MASTER_DATE_FORMULA Excel file (.xlsx or .xls)."
            : "Please select a CSV file."
        );

        return;

      }

      setFile(
        nextFile
      );

    };


  // ====================================================
  // REMOVE FILE
  // ====================================================

  const removeSelectedFile =
    () => {

      setFile(
        null
      );

      setError(
        ""
      );

      setSuccess(
        ""
      );

      setInputKey(
        (
          current
        ) =>
          current +
          1
      );

    };


  // ====================================================
  // UPLOAD
  //
  // TARGET MONTH       = September 2026
  // SOURCE CSV MONTH   = August 2026
  // BUSINESS DATE      = 2026-08-31
  // REPORT TYPE        = LM
  //
  // The backend Speciality Revenue report then reads
  // previousMonthEnd + reportType LM for every September
  // date.
  // ====================================================

  const handleUpload =
    async () => {

      setError(
        ""
      );

      setSuccess(
        ""
      );

      if (
        !selectedMonth ||
        !sourceMonth ||
        !businessDate
      ) {

        setError(
          "Please select the target month."
        );

        return;

      }

      if (
        !file
      ) {

        setError(
          useMasterLmExcel
            ? "Please select MASTER_DATE_FORMULA.xlsx."
            : `Please select the full-month ${formatMonth(
                sourceMonth
              )} revenue CSV.`
        );

        return;

      }

      try {

        setUploading(
          true
        );


        const formData =
          new FormData();


        if (
          useMasterLmExcel
        ) {

          formData.append(
            "targetMonth",
            selectedMonth
          );


          formData.append(
            "file",
            file
          );


          await api.post(
            "/speciality/master-lm-upload",
            formData
          );


          setSuccess(
            "September 2026 Master LM uploaded successfully for MB, OS, SV, MS, BJ, JN and SM."
          );

        }
        else {

          formData.append(
            "unitCode",
            selectedUnit
          );


          formData.append(
            "reportType",
            "LM"
          );


          formData.append(
            "businessDate",
            businessDate
          );


          formData.append(
            "file",
            file
          );


          await api.post(
            "/revenue/upload",
            formData
          );


          setSuccess(
            `${selectedUnit} - ${formatMonth(
              sourceMonth
            )} full-month LM uploaded successfully for ${formatMonth(
              selectedMonth
            )} Speciality Revenue.`
          );

        }


        setFile(
          null
        );


        setInputKey(
          (
            current
          ) =>
            current +
            1
        );

      }
      catch (
        err:
          unknown
      ) {

        if (
          axios.isAxiosError(
            err
          )
        ) {

          const response =
            err.response?.data as
              | ApiErrorResponse
              | undefined;


          setError(
            response?.message ||
            "LM upload failed."
          );


          return;

        }


        setError(
          "LM upload failed."
        );

      }
      finally {

        setUploading(
          false
        );

      }

    };


  return (

    <div className="lm-upload-page">

      {/* ==================================================
          PAGE HEADER
          ================================================== */}

      <section className="lm-header">

        <div>

          <p>
            Aayush Group of Hospitals
          </p>

          <h1>
            Last Month Revenue Upload
          </h1>

          <span>
            {
              useMasterLmExcel
                ? "Upload MASTER_DATE_FORMULA Excel. Only LM data will be used for September Speciality Revenue."
                : "Select the target month and upload last month full-month revenue for Speciality Revenue."
            }
          </span>

        </div>


        <div className="lm-header-icon">

          <UploadCloud
            size={27}
          />

        </div>

      </section>


      {/* ==================================================
          MAIN CARD
          ================================================== */}

      <section className="lm-upload-card">

        <div className="lm-card-heading">

          <div className="lm-card-heading-icon">

            <FileSpreadsheet
              size={20}
            />

          </div>


          <div>

            <h2>
              {
                useMasterLmExcel
                  ? "September Master LM Excel"
                  : "Last Month Revenue CSV"
              }
            </h2>


          </div>

        </div>


        {/* ==================================================
            CONTROLS
            ================================================== */}

        <div className="lm-controls">

          {
            !useMasterLmExcel && (

          <div className="lm-field lm-unit-field">

            <label>
              UNIT
            </label>


            <div
              className="lm-custom-select"
              ref={
                unitDropdownRef
              }
            >

              <button
                type="button"
                className={
                  unitDropdownOpen
                    ? "lm-select-trigger open"
                    : "lm-select-trigger"
                }
                onClick={
                  () =>
                    setUnitDropdownOpen(
                      (
                        current
                      ) =>
                        !current
                    )
                }
              >

                <Building2
                  size={15}
                />


                <strong>
                  {selectedUnit}
                </strong>


                <ChevronDown
                  size={15}
                  className={
                    unitDropdownOpen
                      ? "lm-select-chevron open"
                      : "lm-select-chevron"
                  }
                />

              </button>


              {
                unitDropdownOpen && (

                  <div className="lm-select-menu">

                    <div className="lm-select-menu-label">
                      Select Unit
                    </div>


                    <div className="lm-unit-grid">

                      {
                        UNITS.map(
                          (
                            unit
                          ) => (

                            <button
                              key={
                                unit
                              }
                              type="button"
                              className={
                                unit ===
                                  selectedUnit
                                  ? "lm-unit-option active"
                                  : "lm-unit-option"
                              }
                              onClick={
                                () =>
                                  handleUnitSelect(
                                    unit
                                  )
                              }
                            >

                              {unit}


                              {
                                unit ===
                                  selectedUnit && (

                                  <Check
                                    size={12}
                                  />

                                )
                              }

                            </button>

                          )
                        )
                      }

                    </div>

                  </div>

                )
              }

            </div>

          </div>

            )
          }


          {/* TARGET MONTH */}

          <div className="lm-field lm-month-field">

            <label>
              TARGET MONTH
            </label>


            <div className="lm-month-control">

              <CalendarDays
                size={15}
              />


              <input
                type="month"
                value={
                  selectedMonth
                }
                onChange={
                  (
                    event
                  ) =>
                    handleTargetMonthChange(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

        </div>


        {/* ==================================================
            FILE AREA
            ================================================== */}

        <div className="lm-upload-section">

          <label>
            LAST MONTH REVENUE CSV
          </label>


          {
            !file
              ? (

                <label className="lm-file-picker">

                  <div className="lm-file-icon">

                    <UploadCloud
                      size={22}
                    />

                  </div>


                  <div className="lm-file-copy">

                    <strong>
                      {
                        useMasterLmExcel
                          ? "Select MASTER_DATE_FORMULA.xlsx"
                          : `Select Full ${formatMonth(
                              sourceMonth
                            )} CSV`
                      }
                    </strong>


                    <span>
                      {
                        useMasterLmExcel
                          ? "All units · Only Department + LM will be used"
                          : `${selectedUnit} · ${formatMonth(
                              sourceMonth
                            )} → LM for ${formatMonth(
                              selectedMonth
                            )}`
                      }
                    </span>

                  </div>


                  <span className="lm-browse-button">
                    Browse File
                  </span>


                  <input
                    key={
                      inputKey
                    }
                    type="file"
                    accept={
                      useMasterLmExcel
                        ? ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        : ".csv,text/csv"
                    }
                    onChange={
                      (
                        event
                      ) =>
                        handleFileChange(
                          event.target.files?.[0] ??
                          null
                        )
                    }
                  />

                </label>

              )
              : (

                <div className="lm-selected-file">

                  <div className="lm-selected-file-icon">

                    <FileSpreadsheet
                      size={20}
                    />

                  </div>


                  <div className="lm-selected-file-copy">

                    <strong>
                      {file.name}
                    </strong>


                    <span>
                      {
                        useMasterLmExcel
                          ? "Master LM · All units · September 2026"
                          : `${formatMonth(
                              sourceMonth
                            )} full month → ${formatMonth(
                              selectedMonth
                            )} LM`
                      }
                    </span>

                  </div>


                  <button
                    type="button"
                    className="lm-remove-file"
                    onClick={
                      removeSelectedFile
                    }
                    aria-label="Remove selected file"
                  >

                    <X
                      size={16}
                    />

                  </button>

                </div>

              )
          }

        </div>


        {/* ==================================================
            MESSAGES
            ================================================== */}

        {
          error && (

            <div className="lm-message error">
              {error}
            </div>

          )
        }


        {
          success && (

            <div className="lm-message success">

              <CheckCircle2
                size={17}
              />

              {success}

            </div>

          )
        }


        {/* ==================================================
            FOOTER
            ================================================== */}

        <div className="lm-card-footer">

          <div className="lm-footer-note">

            {
              useMasterLmExcel
                ? "September only: Master Excel LM will be saved for all units. Revenue Report FTD / MTD / LMTD remain unchanged."
                : `Saved as LM with source month-end ${formatDate(
                    businessDate
                  )}. It will be used throughout ${formatMonth(
                    selectedMonth
                  )}.`
            }

          </div>


          <button
            type="button"
            className="lm-upload-button"
            disabled={
              uploading ||
              !file
            }
            onClick={
              handleUpload
            }
          >

            <UploadCloud
              size={17}
            />


            {
              uploading
                ? "Uploading..."
                : useMasterLmExcel
                  ? "Upload Master LM"
                  : "Upload LM Revenue"
            }

          </button>

        </div>

      </section>

    </div>

  );

}


export default LMUploadPage;
