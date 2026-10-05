import {
  useEffect,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  FileText,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

import axios from "axios";

import api from "../services/api";

import "./DailyUploadPage.css";


// ======================================================
// TYPES
// ======================================================

type UnitOption = {
  id: number;
  code: string;
  name: string;
  isActive: boolean;
};


type UnitsResponse = {
  success?: boolean;
  total?: number;
  data?: UnitOption[];
  message?: string;
};


type UploadResponse = {
  success?: boolean;
  message?: string;
};


// ======================================================
// YESTERDAY DATE
// ======================================================

function getYesterdayDate(): string {

  const date =
    new Date();

  date.setDate(
    date.getDate() - 1
  );


  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return `${year}-${month}-${day}`;

}


// ======================================================
// PAGE
// ======================================================

function DailyUploadPage() {

  // ====================================================
  // ACTIVE UNITS
  // ====================================================

  const [
    units,
    setUnits,
  ] =
    useState<UnitOption[]>(
      []
    );


  const [
    unitsLoading,
    setUnitsLoading,
  ] =
    useState(
      true
    );


  const [
    unitsError,
    setUnitsError,
  ] =
    useState(
      ""
    );


  // ====================================================
  // FORM
  // ====================================================

  const [
    unitCode,
    setUnitCode,
  ] =
    useState("");


  const [
    businessDate,
    setBusinessDate,
  ] =
    useState(
      getYesterdayDate
    );


  const [
    ftdFile,
    setFtdFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    mtdFile,
    setMtdFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    lmtdFile,
    setLmtdFile,
  ] =
    useState<File | null>(
      null
    );


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState("");


  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");


  // ====================================================
  // LOAD ACTIVE UNITS
  //
  // GET /api/v1/units
  //
  // Only isActive = true units are returned by backend.
  // Future unit activation does not require frontend edit.
  // ====================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      const loadUnits =
        async () => {

          try {

            setUnitsLoading(
              true
            );

            setUnitsError(
              ""
            );


            const response =
              await api.get<UnitsResponse>(
                "/units",
                {
                  signal:
                    controller.signal,
                }
              );


            if (
              !active
            ) {

              return;

            }


            const activeUnits =
              Array.isArray(
                response.data.data
              )
                ? response.data.data
                : [];


            setUnits(
              activeUnits
            );


            // If selected unit is no longer active,
            // clear the selection.
            setUnitCode(
              (
                current
              ) => {

                if (
                  !current
                ) {

                  return current;

                }


                const exists =
                  activeUnits.some(
                    (
                      unit
                    ) =>
                      unit.code ===
                      current
                  );


                return exists
                  ? current
                  : "";

              }
            );

          }
          catch (
            error
          ) {

            if (
              !active
            ) {

              return;

            }


            if (
              axios.isCancel(
                error
              )
            ) {

              return;

            }


            if (
              axios.isAxiosError(
                error
              )
            ) {

              const data =
                error.response?.data as
                  | UnitsResponse
                  | undefined;


              setUnitsError(
                data?.message ||
                "Unable to load active units."
              );

            }
            else {

              setUnitsError(
                "Unable to load active units."
              );

            }


            setUnits(
              []
            );

          }
          finally {

            if (
              active
            ) {

              setUnitsLoading(
                false
              );

            }

          }

        };


      void loadUnits();


      return () => {

        active =
          false;

        controller.abort();

      };

    },
    []
  );


  // ====================================================
  // RESET FILES
  // ====================================================

  const resetFiles =
    () => {

      setFtdFile(
        null
      );

      setMtdFile(
        null
      );

      setLmtdFile(
        null
      );

    };


  // ====================================================
  // UPLOAD
  // ====================================================

  const handleUpload =
    async () => {

      setSuccessMessage(
        ""
      );

      setErrorMessage(
        ""
      );


      if (
        unitsLoading
      ) {

        setErrorMessage(
          "Please wait while active units are loading."
        );

        return;

      }


      if (
        unitsError
      ) {

        setErrorMessage(
          unitsError
        );

        return;

      }


      if (
        !unitCode
      ) {

        setErrorMessage(
          "Please select a unit."
        );

        return;

      }


      const selectedUnitIsActive =
        units.some(
          (
            unit
          ) =>
            unit.code ===
            unitCode
        );


      if (
        !selectedUnitIsActive
      ) {

        setErrorMessage(
          "Selected unit is not active."
        );

        setUnitCode(
          ""
        );

        return;

      }


      if (
        !businessDate
      ) {

        setErrorMessage(
          "Please select business date."
        );

        return;

      }


      if (
        !ftdFile ||
        !mtdFile ||
        !lmtdFile
      ) {

        setErrorMessage(
          "FTD, MTD and LMTD all three CSV files are required."
        );

        return;

      }


      const formData =
        new FormData();


      formData.append(
        "unitCode",
        unitCode
      );


      formData.append(
        "businessDate",
        businessDate
      );


      formData.append(
        "ftdFile",
        ftdFile
      );


      formData.append(
        "mtdFile",
        mtdFile
      );


      formData.append(
        "lmtdFile",
        lmtdFile
      );


      try {

        setLoading(
          true
        );


        const response =
          await api.post<UploadResponse>(
            "/revenue/upload-all",
            formData
          );


        setSuccessMessage(
          response.data.message ||
          "FTD, MTD and LMTD revenue files uploaded successfully."
        );


        resetFiles();

      }
      catch (
        error
      ) {

        if (
          axios.isAxiosError(
            error
          )
        ) {

          const data =
            error.response?.data as
              | UploadResponse
              | undefined;


          setErrorMessage(
            data?.message ||
            "Revenue upload failed."
          );

        }
        else {

          setErrorMessage(
            "Revenue upload failed."
          );

        }

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

    <div className="daily-upload-page">

      <div className="daily-upload-heading">

        <div>

          <p className="daily-upload-eyebrow">
            Aayush Group of Hospitals
          </p>

          <h1>
            Daily Revenue Upload
          </h1>

          <p className="daily-upload-subtitle">
            Upload FTD, MTD and LMTD revenue CSV files unit-wise.
          </p>

        </div>

      </div>


      <div className="daily-upload-card">

        <div className="daily-upload-section-heading">

          <div className="daily-upload-section-icon">

            <UploadCloud
              size={20}
            />

          </div>

          <div>

            <h2>
              Revenue Files
            </h2>

            <p>
              Select unit and business date, then upload all three files.
            </p>

          </div>

        </div>


        <div className="daily-upload-form-grid">

          <div className="daily-upload-field">

            <label>
              Unit
            </label>

            <select
              value={unitCode}
              disabled={
                unitsLoading ||
                loading ||
                Boolean(
                  unitsError
                )
              }
              onChange={
                (
                  event
                ) =>
                  setUnitCode(
                    event.target.value
                  )
              }
            >

              <option value="">

                {
                  unitsLoading
                    ? "Loading Units..."
                    : unitsError
                      ? "Unable to Load Units"
                      : units.length === 0
                        ? "No Active Units"
                        : "Select Unit"
                }

              </option>


              {
                units.map(
                  (
                    unit
                  ) => (

                    <option
                      key={unit.id}
                      value={unit.code}
                    >
                      {unit.code} - {unit.name}
                    </option>

                  )
                )
              }

            </select>

          </div>


          <div className="daily-upload-field">

            <label>
              Business Date
            </label>

            <div className="daily-upload-date">

              <CalendarDays
                size={17}
              />

              <input
                type="date"
                value={businessDate}
                onChange={
                  (
                    event
                  ) =>
                    setBusinessDate(
                      event.target.value
                    )
                }
              />

            </div>

          </div>

        </div>


        {
          unitsError && (

            <div className="daily-upload-message error">
              {unitsError}
            </div>

          )
        }


        <div className="daily-upload-files">

          <UploadFileBox
            title="FTD"
            description="Full Day Revenue"
            file={ftdFile}
            onChange={
              setFtdFile
            }
          />


          <UploadFileBox
            title="MTD"
            description="Month To Date Revenue"
            file={mtdFile}
            onChange={
              setMtdFile
            }
          />


          <UploadFileBox
            title="LMTD"
            description="Last Month To Date"
            file={lmtdFile}
            onChange={
              setLmtdFile
            }
          />

        </div>


        {
          errorMessage && (

            <div className="daily-upload-message error">

              {errorMessage}

            </div>

          )
        }


        {
          successMessage && (

            <div className="daily-upload-message success">

              <CheckCircle2
                size={18}
              />

              {successMessage}

            </div>

          )
        }


        <div className="daily-upload-actions">

          <button
            type="button"
            className="daily-upload-clear"
            onClick={
              resetFiles
            }
            disabled={
              loading
            }
          >

            Clear Files

          </button>


          <button
            type="button"
            className="daily-upload-submit"
            onClick={
              handleUpload
            }
            disabled={
              loading ||
              unitsLoading ||
              Boolean(
                unitsError
              ) ||
              units.length === 0
            }
          >

            {
              loading
                ? (
                  <>

                    <RefreshCw
                      size={17}
                      className="daily-upload-spin"
                    />

                    Uploading...

                  </>
                )
                : (
                  <>

                    <UploadCloud
                      size={17}
                    />

                    Upload Revenue

                  </>
                )
            }

          </button>

        </div>

      </div>

    </div>

  );

}


// ======================================================
// UPLOAD FILE BOX
// ======================================================

type UploadFileBoxProps = {

  title:
    string;

  description:
    string;

  file:
    File | null;

  onChange:
    (
      file: File | null
    ) => void;

};


function UploadFileBox(
  {
    title,
    description,
    file,
    onChange,
  }: UploadFileBoxProps
) {

  const inputId =
    `file-${title.toLowerCase()}`;


  return (

    <div className="daily-upload-file-box">

      <div className="daily-upload-file-header">

        <div>

          <strong>
            {title}
          </strong>

          <span>
            {description}
          </span>

        </div>

      </div>


      <label
        htmlFor={inputId}
        className={
          file
            ? "daily-upload-drop-zone selected"
            : "daily-upload-drop-zone"
        }
      >

        {
          file
            ? (
              <>

                <CheckCircle2
                  size={24}
                />

                <strong>
                  File Selected
                </strong>

                <span>
                  {file.name}
                </span>

              </>
            )
            : (
              <>

                <FileText
                  size={24}
                />

                <strong>
                  Select CSV File
                </strong>

                <span>
                  Click to browse
                </span>

              </>
            )
        }


        <input
          id={inputId}
          type="file"
          accept=".csv,text/csv"
          onChange={
            (
              event
            ) => {

              const selectedFile =
                event.target.files
                  ?.[0] ??
                null;


              onChange(
                selectedFile
              );

            }
          }
        />

      </label>

    </div>

  );

}


export default DailyUploadPage;