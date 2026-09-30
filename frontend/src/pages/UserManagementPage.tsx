import {
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type MouseEvent,
} from "react";

import axios from "axios";

import {
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  MoreVertical,
  Pencil,
  Power,
  RefreshCw,
  ShieldCheck,
  ShieldPlus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import api from "../services/api";

import "./UserManagementPage.css";


type UserRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR"
  | "HO_USER";


type SelectableUserRole =
  | "SUPER_ADMIN"
  | "MASTER_ADMIN"
  | "ADMIN"
  | "DIRECTOR"
  | "INCHARGE_DIRECTOR";


type UnitCode =
  | "MB"
  | "OS"
  | "SV"
  | "MS"
  | "BJ"
  | "JN"
  | "SM";


type UserUnit = {
  code: string;
  name: string;
} | null;


type UserRecord = {
  id: number;
  name: string;
  username: string;
  email: string | null;
  mobile: string | null;
  role: UserRole;
  unitId: number | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt?: string;
  unit: UserUnit;
};


type UsersResponse = {
  success: boolean;
  total: number;
  data: UserRecord[];
};


type CreateUserResponse = {
  success: boolean;
  message: string;
  data: UserRecord;
};


type PasswordChangedBy =
  | "SELF"
  | "ADMIN";


type PasswordStatusData = {
  id: number;
  name: string;
  username: string;
  passwordChangedAt: string | null;
  passwordChangedBy: PasswordChangedBy | null;
};


type PasswordStatusResponse = {
  success: boolean;
  data: PasswordStatusData;
};


type ResetPasswordResponse = {
  success: boolean;
  message: string;
  data: PasswordStatusData & {
    temporaryPassword: string;
  };
};


type StoredUser = {
  id?: number;
  name?: string;
  username?: string;
  email?: string | null;
  mobile?: string | null;
  role?: UserRole;
  unitId?: number | null;
  unit?: UserUnit;
};


type CreateFormState = {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: SelectableUserRole | "";
  unitCode: UnitCode | "";
  isActive: boolean;
};


type EditFormState = {
  name: string;
  username: string;
  email: string;
  mobile: string;
  role: SelectableUserRole | "";
  unitCode: UnitCode | "";
  isActive: boolean;
};


type ChangeRoleState = {
  role: SelectableUserRole | "";
  unitCode: UnitCode | "";
};


type ActionMenuPosition = {
  top: number;
  left: number;
  width: number;
};


const UNITS: {
  code: UnitCode;
  name: string;
}[] = [
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


const ROLE_OPTIONS: {
  value: SelectableUserRole;
  label: string;
}[] = [
  {
    value: "SUPER_ADMIN",
    label: "Super Admin",
  },
  {
    value: "MASTER_ADMIN",
    label: "Master Admin",
  },
  {
    value: "ADMIN",
    label: "Admin",
  },
  {
    value: "DIRECTOR",
    label: "Director",
  },
  {
    value: "INCHARGE_DIRECTOR",
    label: "Incharge Director",
  },
];


const FULL_MANAGEMENT_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "MASTER_ADMIN",
  "ADMIN",
  "DIRECTOR",
];


const ACTION_MENU_WIDTH =
  185;


const ACTION_MENU_HEIGHT =
  166;


const SUPER_ADMIN_ACTION_MENU_HEIGHT =
  206;


const ACTION_MENU_GAP =
  6;


const ACTION_MENU_HORIZONTAL_SHIFT =
  70;


// ======================================================
// EMPTY CREATE FORM
// ======================================================

function createEmptyForm(): CreateFormState {

  return {
    name: "",
    email: "",
    mobile: "",
    password: "",
    role: "",
    unitCode: "",
    isActive: true,
  };

}


// ======================================================
// EMPTY EDIT FORM
// ======================================================

function createEmptyEditForm(): EditFormState {

  return {
    name: "",
    username: "",
    email: "",
    mobile: "",
    role: "",
    unitCode: "",
    isActive: true,
  };

}


// ======================================================
// ROLE LABEL
// ======================================================

function getRoleLabel(
  role: UserRole
): string {

  if (
    role === "HO_USER"
  ) {

    return "Legacy User";

  }


  return (
    ROLE_OPTIONS.find(
      (
        option
      ) =>
        option.value ===
        role
    )?.label ??
    role
  );

}


// ======================================================
// DATE FORMAT
// ======================================================

function formatDateTime(
  value: string | null
): string {

  if (
    !value
  ) {

    return "Never";

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

      dateStyle:
        "medium",

      timeStyle:
        "short",
    }
  ).format(
    date
  );

}


// ======================================================
// MOBILE
// ======================================================

function normalizeMobileForForm(
  value: string | null
): string {

  if (
    !value
  ) {

    return "";

  }


  let digits =
    value.replace(
      /\D/g,
      ""
    );


  if (
    digits.length ===
      12 &&
    digits.startsWith(
      "91"
    )
  ) {

    digits =
      digits.slice(
        2
      );

  }


  return digits.slice(
    0,
    10
  );

}


function formatMobile(
  value: string | null
): string {

  const mobile =
    normalizeMobileForForm(
      value
    );


  if (
    mobile.length ===
    10
  ) {

    return `+91 ${mobile}`;

  }


  return value || "-";

}


// ======================================================
// API ERROR
// ======================================================

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
        | {
            message?: string;
          }
        | undefined;


    return (
      responseData?.message ??
      fallback
    );

  }


  return fallback;

}


// ======================================================
// STORED LOGIN USER
// ======================================================

function getStoredUser():
  StoredUser |
  null {

  try {

    const raw =
      localStorage.getItem(
        "revenue_user"
      );


    if (
      !raw
    ) {

      return null;

    }


    return JSON.parse(
      raw
    ) as StoredUser;

  }
  catch {

    return null;

  }

}


// ======================================================
// ROLE DROPDOWN
// ======================================================

type RoleDropdownProps = {
  value: SelectableUserRole | "";
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onSelect: (
    role: SelectableUserRole
  ) => void;
};


function RoleDropdown(
  {
    value,
    open,
    disabled = false,
    onToggle,
    onSelect,
  }: RoleDropdownProps
) {

  const selected =
    ROLE_OPTIONS.find(
      (
        option
      ) =>
        option.value ===
        value
    );


  return (

    <div className="users-custom-select">

      <button
        type="button"
        className={
          open
            ? "users-select-trigger open"
            : "users-select-trigger"
        }
        disabled={
          disabled
        }
        onClick={
          onToggle
        }
      >

        <span>

          {
            selected
              ? selected.label
              : "Select Role"
          }

        </span>


        <ChevronDown
          size={17}
          className={
            open
              ? "users-select-chevron open"
              : "users-select-chevron"
          }
        />

      </button>


      {
        open && (

          <div className="users-select-menu role">

            {
              ROLE_OPTIONS.map(
                (
                  option
                ) => {

                  const active =
                    option.value ===
                    value;


                  return (

                    <button
                      key={
                        option.value
                      }
                      type="button"
                      className={
                        active
                          ? "users-select-option selected"
                          : "users-select-option"
                      }
                      onClick={
                        () =>
                          onSelect(
                            option.value
                          )
                      }
                    >

                      <span>
                        {option.label}
                      </span>


                      {
                        active && (

                          <Check
                            size={16}
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

  );

}


// ======================================================
// UNIT DROPDOWN
// ======================================================

type UnitDropdownProps = {
  role: SelectableUserRole | "";
  value: UnitCode | "";
  open: boolean;
  disabled?: boolean;
  onToggle: () => void;
  onSelect: (
    unitCode: UnitCode
  ) => void;
};


function UnitDropdown(
  {
    role,
    value,
    open,
    disabled = false,
    onToggle,
    onSelect,
  }: UnitDropdownProps
) {

  const selected =
    UNITS.find(
      (
        unit
      ) =>
        unit.code ===
        value
    );


  if (
    !role
  ) {

    return (

      <button
        type="button"
        className="users-select-trigger disabled"
        disabled
      >

        <span>
          Select Role First
        </span>

      </button>

    );

  }


  if (
    role !==
    "INCHARGE_DIRECTOR"
  ) {

    return (

      <button
        type="button"
        className="users-select-trigger disabled"
        disabled
      >

        <span>
          All Units
        </span>

      </button>

    );

  }


  return (

    <div className="users-custom-select">

      <button
        type="button"
        className={
          open
            ? "users-select-trigger open"
            : "users-select-trigger"
        }
        disabled={
          disabled
        }
        onClick={
          onToggle
        }
      >

        <span>

          {
            selected
              ? `${selected.code} - ${selected.name}`
              : "Select Unit"
          }

        </span>


        <ChevronDown
          size={17}
          className={
            open
              ? "users-select-chevron open"
              : "users-select-chevron"
          }
        />

      </button>


      {
        open && (

          <div className="users-select-menu unit">

            {
              UNITS.map(
                (
                  unit
                ) => {

                  const active =
                    unit.code ===
                    value;


                  return (

                    <button
                      key={
                        unit.code
                      }
                      type="button"
                      className={
                        active
                          ? "users-select-option selected"
                          : "users-select-option"
                      }
                      onClick={
                        () =>
                          onSelect(
                            unit.code
                          )
                      }
                    >

                      <span>
                        {unit.code} - {unit.name}
                      </span>


                      {
                        active && (

                          <Check
                            size={16}
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

  );

}


// ======================================================
// PAGE
// ======================================================

function UserManagementPage() {

  const [
    users,
    setUsers,
  ] =
    useState<UserRecord[]>(
      []
    );


  const [
    form,
    setForm,
  ] =
    useState<CreateFormState>(
      createEmptyForm
    );


  const [
    editForm,
    setEditForm,
  ] =
    useState<EditFormState>(
      createEmptyEditForm
    );


  const [
    changeRoleForm,
    setChangeRoleForm,
  ] =
    useState<ChangeRoleState>({
      role: "",
      unitCode: "",
    });


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
    actionUserId,
    setActionUserId,
  ] =
    useState<number | null>(
      null
    );


  const [
    actionMenuPosition,
    setActionMenuPosition,
  ] =
    useState<ActionMenuPosition | null>(
      null
    );


  const [
    showCreateModal,
    setShowCreateModal,
  ] =
    useState(false);


  const [
    editingUser,
    setEditingUser,
  ] =
    useState<UserRecord | null>(
      null
    );


  const [
    roleUser,
    setRoleUser,
  ] =
    useState<UserRecord | null>(
      null
    );


  const [
    deleteUserTarget,
    setDeleteUserTarget,
  ] =
    useState<UserRecord | null>(
      null
    );


  const [
    createRoleOpen,
    setCreateRoleOpen,
  ] =
    useState(false);


  const [
    createUnitOpen,
    setCreateUnitOpen,
  ] =
    useState(false);


  const [
    editRoleOpen,
    setEditRoleOpen,
  ] =
    useState(false);


  const [
    editUnitOpen,
    setEditUnitOpen,
  ] =
    useState(false);


  const [
    changeRoleOpen,
    setChangeRoleOpen,
  ] =
    useState(false);


  const [
    changeUnitOpen,
    setChangeUnitOpen,
  ] =
    useState(false);


  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);


  const [
    passwordUser,
    setPasswordUser,
  ] =
    useState<UserRecord | null>(
      null
    );


  const [
    passwordStatus,
    setPasswordStatus,
  ] =
    useState<PasswordStatusData | null>(
      null
    );


  const [
    temporaryPassword,
    setTemporaryPassword,
  ] =
    useState("");


  const [
    passwordStatusLoading,
    setPasswordStatusLoading,
  ] =
    useState(false);


  const [
    passwordSaving,
    setPasswordSaving,
  ] =
    useState(false);


  const [
    showTemporaryPassword,
    setShowTemporaryPassword,
  ] =
    useState(false);


  const [
    passwordCopied,
    setPasswordCopied,
  ] =
    useState(false);


  const [
    passwordModalError,
    setPasswordModalError,
  ] =
    useState("");


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
  // REAL LOGIN USER
  //
  // IMPORTANT:
  // No localhost Super Admin bypass.
  // ======================================================

  const storedUser =
    getStoredUser();


  const currentRole:
    UserRole |
    null =
    storedUser?.role ??
    null;


  const hasFullManagement =
    currentRole
      ? FULL_MANAGEMENT_ROLES.includes(
          currentRole
        )
      : false;


  const isInchargeDirector =
    currentRole ===
    "INCHARGE_DIRECTOR";


  const currentUnitLabel =
    storedUser?.unit
      ? `${storedUser.unit.code} - ${storedUser.unit.name}`
      : null;


  // ======================================================
  // COUNTERS
  // ======================================================

  const totalActiveUsers =
    useMemo(
      () =>
        users.filter(
          (
            user
          ) =>
            user.isActive
        ).length,
      [
        users,
      ]
    );


  // ======================================================
  // CLOSE ACTION MENU
  // ======================================================

  useEffect(
    () => {

      const closeMenu =
        () => {

          setActionUserId(
            null
          );


          setActionMenuPosition(
            null
          );

        };


      window.addEventListener(
        "resize",
        closeMenu
      );


      window.addEventListener(
        "scroll",
        closeMenu,
        true
      );


      return () => {

        window.removeEventListener(
          "resize",
          closeMenu
        );


        window.removeEventListener(
          "scroll",
          closeMenu,
          true
        );

      };

    },
    []
  );


  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(
    () => {

      let active =
        true;


      const controller =
        new AbortController();


      api.get<UsersResponse>(
        "/users",
        {
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


            setUsers(
              response.data.data ??
              []
            );

          }
        )
        .catch(
          (
            loadError: unknown
          ) => {

            if (
              !active
            ) {

              return;

            }


            if (
              axios.isAxiosError(
                loadError
              ) &&
              loadError.code ===
                "ERR_CANCELED"
            ) {

              return;

            }


            setError(
              getErrorMessage(
                loadError,
                "Unable to load users."
              )
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
    []
  );


  // ======================================================
  // COMMON
  // ======================================================

  const refreshUsers =
    async () => {

      const response =
        await api.get<UsersResponse>(
          "/users"
        );


      setUsers(
        response.data.data ??
        []
      );

    };


  const clearMessages =
    () => {

      setError(
        ""
      );


      setSuccessMessage(
        ""
      );

    };


  const closeActionMenu =
    () => {

      setActionUserId(
        null
      );


      setActionMenuPosition(
        null
      );

    };


  const handleMobileValue =
    (
      value: string
    ) => {

      return value
        .replace(
          /\D/g,
          ""
        )
        .slice(
          0,
          10
        );

    };


  // ======================================================
  // ACTION MENU POSITION
  // ======================================================

  const handleMoreButtonClick =
    (
      event: MouseEvent<HTMLButtonElement>,
      userId: number
    ) => {

      event.stopPropagation();


      if (
        actionUserId ===
        userId
      ) {

        closeActionMenu();

        return;

      }


      const rect =
        event.currentTarget
          .getBoundingClientRect();


      const availableWidth =
        Math.max(
          150,
          window.innerWidth -
            16
        );


      const menuWidth =
        Math.min(
          ACTION_MENU_WIDTH,
          availableWidth
        );


      let left =
        rect.right -
        menuWidth +
        ACTION_MENU_HORIZONTAL_SHIFT;


      if (
        left <
        8
      ) {

        left =
          8;

      }


      if (
        left +
          menuWidth >
        window.innerWidth -
          8
      ) {

        left =
          window.innerWidth -
          menuWidth -
          8;

      }


      const spaceBelow =
        window.innerHeight -
        rect.bottom;


      const spaceAbove =
        rect.top;


      let top:
        number;


      const actualMenuHeight =
        currentRole ===
          "SUPER_ADMIN"
          ? SUPER_ADMIN_ACTION_MENU_HEIGHT
          : hasFullManagement
            ? ACTION_MENU_HEIGHT
            : 48;


      if (
        spaceBelow <
          actualMenuHeight +
            ACTION_MENU_GAP &&
        spaceAbove >
          spaceBelow
      ) {

        top =
          rect.top -
          actualMenuHeight -
          ACTION_MENU_GAP;

      }
      else {

        top =
          rect.bottom +
          ACTION_MENU_GAP;

      }


      top =
        Math.max(
          8,
          Math.min(
            top,
            window.innerHeight -
              actualMenuHeight -
              8
          )
        );


      setActionMenuPosition({

        top,

        left,

        width:
          menuWidth,

      });


      setActionUserId(
        userId
      );

    };


  // ======================================================
  // CREATE
  // ======================================================

  const openCreateModal =
    () => {

      if (
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();

      closeActionMenu();


      setForm(
        createEmptyForm()
      );


      setCreateRoleOpen(
        false
      );


      setCreateUnitOpen(
        false
      );


      setShowPassword(
        false
      );


      setShowCreateModal(
        true
      );

    };


  const closeCreateModal =
    () => {

      if (
        saving
      ) {

        return;

      }


      setShowCreateModal(
        false
      );


      setCreateRoleOpen(
        false
      );


      setCreateUnitOpen(
        false
      );

    };


  const handleCreateUser =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();


      if (
        !form.name.trim()
      ) {

        setError(
          "Name is required."
        );

        return;

      }


      if (
        !form.email.trim()
      ) {

        setError(
          "Email is required."
        );

        return;

      }


      if (
        form.mobile.length !==
        10
      ) {

        setError(
          "Mobile number must contain exactly 10 digits."
        );

        return;

      }


      if (
        form.password.length <
        8
      ) {

        setError(
          "Password must be at least 8 characters."
        );

        return;

      }


      if (
        !form.role
      ) {

        setError(
          "Role is required."
        );

        return;

      }


      if (
        form.role ===
          "INCHARGE_DIRECTOR" &&
        !form.unitCode
      ) {

        setError(
          "Unit is required for Incharge Director."
        );

        return;

      }


      try {

        setSaving(
          true
        );


        const response =
          await api.post<CreateUserResponse>(
            "/users",
            {

              name:
                form.name.trim(),

              email:
                form.email
                  .trim()
                  .toLowerCase(),

              mobile:
                form.mobile,

              password:
                form.password,

              role:
                form.role,

              unitCode:
                form.role ===
                  "INCHARGE_DIRECTOR"
                  ? form.unitCode
                  : "",

              isActive:
                form.isActive,

            }
          );


        await refreshUsers();


        setShowCreateModal(
          false
        );


        setSuccessMessage(
          `${response.data.data.name} created successfully.`
        );

      }
      catch (
        createError
      ) {

        setError(
          getErrorMessage(
            createError,
            "Unable to create user."
          )
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ======================================================
  // OPEN EDIT
  // ======================================================

  const openEditModal =
    (
      user: UserRecord
    ) => {

      clearMessages();

      closeActionMenu();


      let role:
        SelectableUserRole |
        "" =
        "";


      if (
        user.role !==
        "HO_USER"
      ) {

        role =
          user.role;

      }


      let unitCode:
        UnitCode |
        "" =
        "";


      if (
        user.unit &&
        UNITS.some(
          (
            item
          ) =>
            item.code ===
            user.unit?.code
        )
      ) {

        unitCode =
          user.unit.code as
            UnitCode;

      }


      setEditForm({

        name:
          user.name,

        username:
          user.username,

        email:
          user.email ??
          "",

        mobile:
          normalizeMobileForForm(
            user.mobile
          ),

        role,

        unitCode,

        isActive:
          user.isActive,

      });


      setEditRoleOpen(
        false
      );


      setEditUnitOpen(
        false
      );


      setEditingUser(
        user
      );

    };


  const closeEditModal =
    () => {

      if (
        saving
      ) {

        return;

      }


      setEditingUser(
        null
      );


      setEditRoleOpen(
        false
      );


      setEditUnitOpen(
        false
      );


      setEditForm(
        createEmptyEditForm()
      );

    };


  // ======================================================
  // SAVE EDIT
  // ======================================================

  const handleEditUser =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !editingUser
      ) {

        return;

      }


      clearMessages();


      if (
        !editForm.name.trim()
      ) {

        setError(
          "Name is required."
        );

        return;

      }


      if (
        !editForm.email.trim()
      ) {

        setError(
          "Email is required."
        );

        return;

      }


      if (
        editForm.mobile.length !==
        10
      ) {

        setError(
          "Mobile number must contain exactly 10 digits."
        );

        return;

      }


      if (
        hasFullManagement &&
        !editForm.role
      ) {

        setError(
          "Role is required."
        );

        return;

      }


      if (
        hasFullManagement &&
        editForm.role ===
          "INCHARGE_DIRECTOR" &&
        !editForm.unitCode
      ) {

        setError(
          "Unit is required for Incharge Director."
        );

        return;

      }


      try {

        setSaving(
          true
        );


        const payload: {

          name: string;

          email: string;

          mobile: string;

          role?: SelectableUserRole;

          unitCode?: string;

          isActive?: boolean;

        } = {name:
            editForm.name.trim(),

          email:
            editForm.email
              .trim()
              .toLowerCase(),

          mobile:
            editForm.mobile,

        };


        // ==================================================
        // ONLY FULL MANAGEMENT CAN SEND:
        // ROLE / UNIT / STATUS
        // ==================================================

        if (
          hasFullManagement &&
          editForm.role
        ) {

          payload.role =
            editForm.role;


          payload.unitCode =
            editForm.role ===
              "INCHARGE_DIRECTOR"
              ? editForm.unitCode
              : "";


          payload.isActive =
            editForm.isActive;

        }


        await api.patch(
          `/users/${editingUser.id}`,
          payload
        );


        await refreshUsers();


        setEditingUser(
          null
        );


        setEditRoleOpen(
          false
        );


        setEditUnitOpen(
          false
        );


        setSuccessMessage(
          "User details updated successfully."
        );

      }
      catch (
        editError
      ) {

        setError(
          getErrorMessage(
            editError,
            "Unable to update user details."
          )
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ======================================================
  // STATUS
  // ======================================================

  const handleStatusChange =
    async (
      user: UserRecord
    ) => {

      if (
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();

      closeActionMenu();


      try {

        setSaving(
          true
        );


        const nextStatus =
          !user.isActive;


        await api.patch(
          `/users/${user.id}/status`,
          {

            isActive:
              nextStatus,

          }
        );


        await refreshUsers();


        setSuccessMessage(
          nextStatus
            ? `${user.name} activated successfully.`
            : `${user.name} deactivated successfully.`
        );

      }
      catch (
        statusError
      ) {

        setError(
          getErrorMessage(
            statusError,
            "Unable to update user status."
          )
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ======================================================
  // CHANGE ROLE
  // ======================================================

  const openChangeRoleModal =
    (
      user: UserRecord
    ) => {

      if (
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();

      closeActionMenu();


      const role:
        SelectableUserRole |
        "" =
        user.role ===
          "HO_USER"
          ? ""
          : user.role;


      let unitCode:
        UnitCode |
        "" =
        "";


      if (
        user.unit &&
        UNITS.some(
          (
            unit
          ) =>
            unit.code ===
            user.unit?.code
        )
      ) {

        unitCode =
          user.unit.code as
            UnitCode;

      }


      setChangeRoleForm({

        role,

        unitCode,

      });


      setChangeRoleOpen(
        false
      );


      setChangeUnitOpen(
        false
      );


      setRoleUser(
        user
      );

    };


  const closeChangeRoleModal =
    () => {

      if (
        saving
      ) {

        return;

      }


      setRoleUser(
        null
      );


      setChangeRoleOpen(
        false
      );


      setChangeUnitOpen(
        false
      );

    };


  const handleChangeRole =
    async (
      event: FormEvent<HTMLFormElement>
    ) => {

      event.preventDefault();


      if (
        !roleUser ||
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();


      if (
        !changeRoleForm.role
      ) {

        setError(
          "Role is required."
        );

        return;

      }


      if (
        changeRoleForm.role ===
          "INCHARGE_DIRECTOR" &&
        !changeRoleForm.unitCode
      ) {

        setError(
          "Unit is required for Incharge Director."
        );

        return;

      }


      try {

        setSaving(
          true
        );


        await api.patch(
          `/users/${roleUser.id}/role`,
          {

            role:
              changeRoleForm.role,

            unitCode:
              changeRoleForm.role ===
                "INCHARGE_DIRECTOR"
                ? changeRoleForm.unitCode
                : "",

          }
        );


        await refreshUsers();


        setRoleUser(
          null
        );


        setSuccessMessage(
          "User role updated successfully."
        );

      }
      catch (
        roleError
      ) {

        setError(
          getErrorMessage(
            roleError,
            "Unable to change user role."
          )
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ======================================================
  // PASSWORD RESET - SUPER ADMIN ONLY
  // ======================================================

  const openPasswordResetModal =
    async (
      user: UserRecord
    ) => {

      if (
        currentRole !==
        "SUPER_ADMIN"
      ) {

        return;

      }


      clearMessages();

      closeActionMenu();


      setPasswordUser(
        user
      );

      setPasswordStatus(
        null
      );

      setTemporaryPassword(
        ""
      );

      setShowTemporaryPassword(
        false
      );

      setPasswordCopied(
        false
      );

      setPasswordModalError(
        ""
      );

      setPasswordStatusLoading(
        true
      );


      try {

        const response =
          await api.get<PasswordStatusResponse>(
            `/users/${user.id}/password-status`
          );


        setPasswordStatus(
          response.data.data
        );

      }
      catch (
        statusError
      ) {

        setPasswordModalError(
          getErrorMessage(
            statusError,
            "Unable to load password status."
          )
        );

      }
      finally {

        setPasswordStatusLoading(
          false
        );

      }

    };


  const closePasswordResetModal =
    () => {

      if (
        passwordSaving
      ) {

        return;

      }


      setPasswordUser(
        null
      );

      setPasswordStatus(
        null
      );

      setTemporaryPassword(
        ""
      );

      setShowTemporaryPassword(
        false
      );

      setPasswordCopied(
        false
      );

      setPasswordModalError(
        ""
      );

    };


  const handleResetPassword =
    async () => {

      if (
        !passwordUser ||
        currentRole !==
          "SUPER_ADMIN"
      ) {

        return;

      }


      setPasswordModalError(
        ""
      );

      setPasswordCopied(
        false
      );


      try {

        setPasswordSaving(
          true
        );


        const response =
          await api.post<ResetPasswordResponse>(
            `/users/${passwordUser.id}/reset-password`
          );


        setTemporaryPassword(
          response.data.data.temporaryPassword
        );

        setShowTemporaryPassword(
          true
        );

        setPasswordStatus({
          id:
            response.data.data.id,

          name:
            response.data.data.name,

          username:
            response.data.data.username,

          passwordChangedAt:
            response.data.data.passwordChangedAt,

          passwordChangedBy:
            response.data.data.passwordChangedBy,
        });

      }
      catch (
        resetError
      ) {

        setPasswordModalError(
          getErrorMessage(
            resetError,
            "Unable to reset password."
          )
        );

      }
      finally {

        setPasswordSaving(
          false
        );

      }

    };


  const copyTemporaryPassword =
    async () => {

      if (
        !temporaryPassword
      ) {

        return;

      }


      try {

        await navigator.clipboard.writeText(
          temporaryPassword
        );


        setPasswordCopied(
          true
        );

      }
      catch {

        setPasswordModalError(
          "Unable to copy password. Please select and copy it manually."
        );

      }

    };


  // ======================================================
  // DELETE
  // ======================================================

  const openDeleteModal =
    (
      user: UserRecord
    ) => {

      if (
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();

      closeActionMenu();


      setDeleteUserTarget(
        user
      );

    };


  const closeDeleteModal =
    () => {

      if (
        saving
      ) {

        return;

      }


      setDeleteUserTarget(
        null
      );

    };


  const handleDeleteUser =
    async () => {

      if (
        !deleteUserTarget ||
        !hasFullManagement
      ) {

        return;

      }


      clearMessages();


      try {

        setSaving(
          true
        );


        const userName =
          deleteUserTarget.name;


        await api.delete(
          `/users/${deleteUserTarget.id}`
        );


        await refreshUsers();


        setDeleteUserTarget(
          null
        );


        setSuccessMessage(
          `${userName} deleted successfully.`
        );

      }
      catch (
        deleteError
      ) {

        setError(
          getErrorMessage(
            deleteError,
            "Unable to delete user."
          )
        );

      }
      finally {

        setSaving(
          false
        );

      }

    };


  // ======================================================
  // ACTION VISIBILITY
  //
  // FULL MANAGEMENT:
  // all visible users.
  //
  // INCHARGE DIRECTOR:
  // all visible same-unit users.
  //
  // Backend is the final security check.
  // ======================================================

  const canShowActionMenu =
    () => {

      return (
        hasFullManagement ||
        isInchargeDirector
      );

    };


  const handleActionContainerClick =
    (
      event: MouseEvent<HTMLDivElement>
    ) => {

      event.stopPropagation();

    };


  // ======================================================
  // PAGE
  // ======================================================

  return (

    <div
      className="users-page"
      onClick={
        closeActionMenu
      }
    >

      {/* ==================================================
          HEADER
          ================================================== */}

      <div className="users-page-header">

        <div>

          <p className="users-eyebrow">

            Aayush Group of Hospitals

          </p>


          <h1>

            User Management

          </h1>


          <p className="users-subtitle">

            {
              isInchargeDirector &&
              currentUnitLabel
                ? `Manage users assigned to ${currentUnitLabel}.`
                : "Manage Revenue Report users and unit access."
            }

          </p>

        </div>


        <div className="users-header-actions">

          {
            hasFullManagement && (

              <button
                type="button"
                className="users-new-button"
                onClick={
                  (
                    event
                  ) => {

                    event.stopPropagation();

                    openCreateModal();

                  }
                }
              >

                <UserPlus
                  size={17}
                />

                New User

              </button>

            )
          }


          <button
            type="button"
            className="users-refresh-button"
            disabled={
              loading
            }
            onClick={
              async (
                event
              ) => {

                event.stopPropagation();


                setLoading(
                  true
                );


                clearMessages();


                try {

                  await refreshUsers();

                }
                catch (
                  refreshError
                ) {

                  setError(
                    getErrorMessage(
                      refreshError,
                      "Unable to load users."
                    )
                  );

                }
                finally {

                  setLoading(
                    false
                  );

                }

              }
            }
          >

            <RefreshCw
              size={17}
              className={
                loading
                  ? "users-spin"
                  : ""
              }
            />

            Refresh

          </button>

        </div>

      </div>


      {/* ==================================================
          SUMMARY
          ================================================== */}

      <div className="users-summary-grid">

        <div className="users-summary-card">

          <div className="users-summary-icon">

            <Users
              size={21}
            />

          </div>


          <div>

            <span>

              {
                isInchargeDirector
                  ? "Unit Users"
                  : "Total Users"
              }

            </span>

            <strong>
              {users.length}
            </strong>

          </div>

        </div>


        <div className="users-summary-card">

          <div className="users-summary-icon">

            <CheckCircle2
              size={21}
            />

          </div>


          <div>

            <span>
              Active Users
            </span>

            <strong>
              {totalActiveUsers}
            </strong>

          </div>

        </div>


        <div className="users-summary-card">

          <div className="users-summary-icon">

            <ShieldCheck
              size={21}
            />

          </div>


          <div>

            <span>
              Inactive Users
            </span>

            <strong>

              {
                users.length -
                totalActiveUsers
              }

            </strong>

          </div>

        </div>

      </div>


      {/* ==================================================
          MESSAGE
          ================================================== */}

      {
        successMessage && (

          <div className="users-message success">

            <CheckCircle2
              size={18}
            />

            {successMessage}

          </div>

        )
      }


      {
        error &&
        !showCreateModal &&
        !editingUser &&
        !roleUser &&
        !deleteUserTarget && (

          <div className="users-message error">

            {error}

          </div>

        )
      }


      {/* ==================================================
          USER LIST
          ================================================== */}

      <section className="users-list-card">

        <div className="users-card-heading">

          <div className="users-card-heading-icon">

            <Users
              size={20}
            />

          </div>


          <div>

            <h2>
              Users
            </h2>

            <p>

              {
                isInchargeDirector &&
                currentUnitLabel
                  ? `${currentUnitLabel} users only.`
                  : "All Revenue Report users."
              }

            </p>

          </div>

        </div>


        {
          loading
            ? (

              <div className="users-loading">

                <RefreshCw
                  size={23}
                  className="users-spin"
                />

                Loading users...

              </div>

            )
            : (

              <div className="users-table-wrap">

                <table className="users-table">

                  <thead>

                    <tr>

                      <th>User</th>

                      <th>Role</th>

                      <th>Unit Access</th>

                      <th>Mobile</th>

                      <th>Last Login</th>

                      <th>Status</th>

                      <th>Action</th>

                    </tr>

                  </thead>


                  <tbody>

                    {
                      users.map(
                        (
                          user
                        ) => {

                          const showActions =
                            canShowActionMenu();


                          return (

                            <tr
                              key={
                                user.id
                              }
                            >

                              <td>

                                <div className="users-person">

                                  <strong>

                                    {user.name}

                                  </strong>


                                  <span>

                                    {
                                      user.email ||
                                      user.username
                                    }

                                  </span>


                                  <small>

                                    @{user.username}

                                  </small>

                                </div>

                              </td>


                              <td>

                                <span className="users-role-badge">

                                  {
                                    getRoleLabel(
                                      user.role
                                    )
                                  }

                                </span>

                              </td>


                              <td>

                                {
                                  user.unit
                                    ? `${user.unit.code} - ${user.unit.name}`
                                    : "All Units"
                                }</td>


                              <td>

                                {
                                  formatMobile(
                                    user.mobile
                                  )
                                }

                              </td>


                              <td>

                                {
                                  formatDateTime(
                                    user.lastLoginAt
                                  )
                                }

                              </td>


                              <td>

                                <span
                                  className={
                                    user.isActive
                                      ? "users-status active"
                                      : "users-status inactive"
                                  }
                                >

                                  {
                                    user.isActive
                                      ? "Active"
                                      : "Inactive"
                                  }

                                </span>

                              </td>


                              <td>

                                {
                                  showActions
                                    ? (

                                      <div
                                        className="users-action-wrap"
                                        onClick={
                                          handleActionContainerClick
                                        }
                                      >

                                        <button
                                          type="button"
                                          className="users-more-button"
                                          aria-label="User actions"
                                          onClick={
                                            (
                                              event
                                            ) =>
                                              handleMoreButtonClick(
                                                event,
                                                user.id
                                              )
                                          }
                                        >

                                          <MoreVertical
                                            size={18}
                                          />

                                        </button>


                                        {
                                          actionUserId ===
                                            user.id &&
                                          actionMenuPosition && (

                                            <div
                                              className="users-action-menu"
                                              style={{

                                                top:
                                                  actionMenuPosition.top,

                                                left:
                                                  actionMenuPosition.left,

                                                width:
                                                  actionMenuPosition.width,

                                              }}
                                            >

                                              {/* ==========================
                                                  EVERY ALLOWED ROLE:
                                                  EDIT DETAILS
                                                  ========================== */}

                                              <button
                                                type="button"
                                                onClick={
                                                  () =>
                                                    openEditModal(
                                                      user
                                                    )
                                                }
                                              >

                                                <Pencil
                                                  size={15}
                                                />

                                                Edit Details

                                              </button>


                                              {/* ==========================
                                                  FULL MANAGEMENT ONLY
                                                  ========================== */}

                                              {
                                                hasFullManagement && (

                                                  <>

                                                    <button
                                                      type="button"
                                                      onClick={
                                                        () =>
                                                          void handleStatusChange(
                                                            user
                                                          )
                                                      }
                                                    >

                                                      <Power
                                                        size={15}
                                                      />

                                                      {
                                                        user.isActive
                                                          ? "Deactivate"
                                                          : "Activate"
                                                      }

                                                    </button>


                                                    <button
                                                      type="button"
                                                      onClick={
                                                        () =>
                                                          openChangeRoleModal(
                                                            user
                                                          )
                                                      }
                                                    >

                                                      <ShieldPlus
                                                        size={15}
                                                      />

                                                      Change Role

                                                    </button>


                                                    {
                                                      currentRole ===
                                                        "SUPER_ADMIN" && (

                                                        <button
                                                          type="button"
                                                          onClick={
                                                            () =>
                                                              void openPasswordResetModal(
                                                                user
                                                              )
                                                          }
                                                        >

                                                          <KeyRound
                                                            size={15}
                                                          />

                                                          Reset Password

                                                        </button>

                                                      )
                                                    }


                                                    <div className="users-action-divider" />


                                                    <button
                                                      type="button"
                                                      className="danger"
                                                      onClick={
                                                        () =>
                                                          openDeleteModal(
                                                            user
                                                          )
                                                      }
                                                    >

                                                      <Trash2
                                                        size={15}
                                                      />

                                                      Delete User

                                                    </button>

                                                  </>

                                                )
                                              }

                                            </div>

                                          )
                                        }

                                      </div>

                                    )
                                    : "-"
                                }

                              </td>

                            </tr>

                          );

                        }
                      )
                    }

                  </tbody>

                </table>

              </div>

            )
        }

      </section>


      {/* ==================================================
          NEW USER MODAL
          ================================================== */}

      {
        showCreateModal &&
        hasFullManagement && (

          <div
            className="users-modal-backdrop"
            onClick={
              closeCreateModal
            }
          >

            <div
              className="users-modal"
              onClick={
                (
                  event
                ) =>
                  event.stopPropagation()
              }
            >

              <div className="users-modal-header">

                <div className="users-card-heading">

                  <div className="users-card-heading-icon create">

                    <UserPlus
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      New User
                    </h2>

                    <p>
                      Create a new Revenue Report user.
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="users-modal-close"
                  onClick={
                    closeCreateModal
                  }
                >

                  <X
                    size={20}
                  />

                </button>

              </div>


              {
                error && (

                  <div className="users-modal-message">

                    <div className="users-message error">

                      {error}

                    </div>

                  </div>

                )
              }


              <form
                className="users-form"
                onSubmit={
                  handleCreateUser
                }
                autoComplete="off"
              >

                <input
                  className="users-autofill-decoy"
                  type="text"
                  name="fake_username"
                  autoComplete="username"
                />


                <input
                  className="users-autofill-decoy"
                  type="password"
                  name="fake_password"
                  autoComplete="current-password"
                />


                <label>

                  <span>
                    Name
                  </span>

                  <input
                    type="text"
                    value={
                      form.name
                    }
                    placeholder="Enter full name"
                    autoComplete="off"
                    onChange={
                      (
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            name:
                              event.target.value,
                          })
                        )
                    }
                  />

                </label>


                <label>

                  <span>
                    Email
                  </span>

                  <input
                    type="email"
                    value={
                      form.email
                    }
                    placeholder="Enter email address"
                    autoComplete="off"
                    onChange={
                      (
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            email:
                              event.target.value,
                          })
                        )
                    }
                  />

                </label>


                <label>

                  <span>
                    Mobile Number
                  </span>


                  <div className="users-mobile-field">

                    <div className="users-mobile-prefix">

                      +91

                    </div>


                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={10}
                      value={
                        form.mobile
                      }
                      placeholder="Enter 10 digit number"
                      onChange={
                        (
                          event
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              mobile:
                                handleMobileValue(
                                  event.target.value
                                ),
                            })
                          )
                      }
                    />

                  </div>

                </label>


                <label>

                  <span>
                    Password
                  </span>


                  <div className="users-password-field">

                    <input
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      value={
                        form.password
                      }
                      placeholder="Minimum 8 characters"
                      autoComplete="new-password"
                      onChange={
                        (
                          event
                        ) =>
                          setForm(
                            (
                              current
                            ) => ({
                              ...current,

                              password:
                                event.target.value,
                            })
                          )
                      }
                    />


                    <button
                      type="button"
                      onClick={
                        () =>
                          setShowPassword(
                            (
                              current
                            ) =>
                              !current
                          )
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

                </label>


                <div className="users-form-field">

                  <span className="users-form-label">

                    Role

                  </span>


                  <RoleDropdown
                    value={
                      form.role
                    }
                    open={
                      createRoleOpen
                    }
                    onToggle={
                      () => {

                        setCreateUnitOpen(
                          false
                        );


                        setCreateRoleOpen(
                          (
                            current
                          ) =>
                            !current
                        );

                      }
                    }
                    onSelect={
                      (
                        role
                      ) => {

                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            role,

                            unitCode:
                              "",
                          })
                        );


                        setCreateRoleOpen(
                          false
                        );

                      }
                    }
                  />

                </div>


                <div className="users-form-field unit-field">

                  <span className="users-form-label">

                    Unit

                  </span>


                  <UnitDropdown
                    role={
                      form.role
                    }
                    value={
                      form.unitCode
                    }
                    open={
                      createUnitOpen
                    }
                    onToggle={
                      () => {

                        setCreateRoleOpen(
                          false
                        );


                        setCreateUnitOpen(
                          (
                            current
                          ) =>
                            !current
                        );

                      }
                    }
                    onSelect={
                      (
                        unitCode
                      ) => {

                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            unitCode,
                          })
                        );


                        setCreateUnitOpen(
                          false
                        );

                      }
                    }
                  />

                </div>


                <label className="users-active-field">

                  <input
                    type="checkbox"
                    checked={
                      form.isActive
                    }
                    onChange={
                      (
                        event
                      ) =>
                        setForm(
                          (
                            current
                          ) => ({
                            ...current,

                            isActive:
                              event.target.checked,
                          })
                        )
                    }
                  />


                  <span>
                    User Active
                  </span>

                </label>


                <div className="users-modal-actions">

                  <button
                    type="button"
                    className="users-cancel-button"
                    onClick={
                      closeCreateModal
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="submit"
                    className="users-create-button"
                    disabled={
                      saving
                    }
                  >

                    <UserPlus
                      size={17}
                    />


                    {
                      saving
                        ? "Creating..."
                        : "Create User"
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {/* ==================================================
          EDIT DETAILS
          ================================================== */}

      {
        editingUser && (

          <div
            className="users-modal-backdrop"
            onClick={
              closeEditModal
            }
          >

            <div
              className="users-modal users-edit-modal"
              onClick={
                (
                  event
                ) =>
                  event.stopPropagation()
              }
            >

              <div className="users-modal-header">

                <div className="users-card-heading">

                  <div className="users-card-heading-icon create">

                    <Pencil
                      size={19}
                    />

                  </div>


                  <div>

                    <h2>
                      Edit Details
                    </h2>

                    <p>
                      {editingUser.name}
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="users-modal-close"
                  onClick={
                    closeEditModal
                  }
                  disabled={
                    saving
                  }
                >

                  <X
                    size={20}
                  />

                </button>

              </div>


              {
                error && (

                  <div className="users-modal-message">

                    <div className="users-message error">

                      {error}

                    </div>

                  </div>

                )
              }


              <form
                className="users-edit-form"
                onSubmit={
                  handleEditUser
                }
                autoComplete="off"
              >

                <div className="users-edit-grid">


                  {/* NAME */}

                  <label>

                    <span>
                      Name
                    </span>

                    <input
                      type="text"
                      value={
                        editForm.name
                      }
                      disabled={
                        saving
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,

                              name:
                                event.target.value,
                            })
                          )
                      }
                    />

                  </label>


                  {/* USERNAME */}

                  <label>

                    <span>
                      Username
                    </span>


                    <div className="users-readonly-field">

                      <input
                        type="text"
                        value={
                          editForm.username
                        }
                        readOnly
                        disabled
                      />


                      <span className="users-readonly-badge">

                        Read Only

                      </span>

                    </div>

                  </label>


                  {/* EMAIL */}

                  <label>

                    <span>
                      Email
                    </span>

                    <input
                      type="email"
                      value={
                        editForm.email
                      }
                      disabled={
                        saving
                      }
                      onChange={
                        (
                          event
                        ) =>
                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,

                              email:
                                event.target.value,
                            })
                          )
                      }
                    />

                  </label>


                  {/* MOBILE */}

                  <label>

                    <span>
                      Mobile Number
                    </span>


                    <div className="users-mobile-field">

                      <div className="users-mobile-prefix">

                        +91

                      </div>


                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={
                          editForm.mobile
                        }
                        disabled={
                          saving
                        }
                        onChange={
                          (
                            event
                          ) =>
                            setEditForm(
                              (
                                current
                              ) => ({
                                ...current,

                                mobile:
                                  handleMobileValue(
                                    event.target.value
                                  ),
                              })
                            )
                        }
                      />

                    </div>

                  </label>

                  {/* ROLE */}

                  <div className="users-edit-field">

                    <span className="users-form-label">

                      Role

                    </span>


                    <RoleDropdown
                      value={
                        editForm.role
                      }
                      open={
                        editRoleOpen
                      }
                      disabled={
                        saving ||
                        !hasFullManagement
                      }
                      onToggle={
                        () => {

                          if (
                            !hasFullManagement
                          ) {

                            return;

                          }


                          setEditUnitOpen(
                            false
                          );


                          setEditRoleOpen(
                            (
                              current
                            ) =>
                              !current
                          );

                        }
                      }
                      onSelect={
                        (
                          role
                        ) => {

                          setEditForm(
                            (
                              current
                            ) => ({

                              ...current,

                              role,

                              unitCode:
                                role ===
                                  "INCHARGE_DIRECTOR"
                                  ? current.unitCode
                                  : "",

                            })
                          );


                          setEditRoleOpen(
                            false
                          );

                        }
                      }
                    />


                    {
                      !hasFullManagement && (

                        <small className="users-field-helper">

                          Role is read only.

                        </small>

                      )
                    }

                  </div>


                  {/* UNIT */}

                  <div className="users-edit-field">

                    <span className="users-form-label">

                      Unit

                    </span>


                    <UnitDropdown
                      role={
                        editForm.role
                      }
                      value={
                        editForm.unitCode
                      }
                      open={
                        editUnitOpen
                      }
                      disabled={
                        saving ||
                        !hasFullManagement
                      }
                      onToggle={
                        () => {

                          if (
                            !hasFullManagement
                          ) {

                            return;

                          }


                          setEditRoleOpen(
                            false
                          );


                          setEditUnitOpen(
                            (
                              current
                            ) =>
                              !current
                          );

                        }
                      }
                      onSelect={
                        (
                          unitCode
                        ) => {

                          setEditForm(
                            (
                              current
                            ) => ({
                              ...current,

                              unitCode,
                            })
                          );


                          setEditUnitOpen(
                            false
                          );

                        }
                      }
                    />


                    {
                      !hasFullManagement && (

                        <small className="users-field-helper">

                          Unit is read only.

                        </small>

                      )
                    }

                  </div>


                  {/* STATUS */}

                  <div className="users-edit-field users-edit-status-column">

                    <span className="users-form-label">

                      Status

                    </span>


                    <div
                      className={
                        hasFullManagement
                          ? "users-status-selector"
                          : "users-status-selector disabled"
                      }
                    >

                      <button
                        type="button"
                        disabled={
                          saving ||
                          !hasFullManagement
                        }
                        className={
                          editForm.isActive
                            ? "active selected"
                            : "active"
                        }
                        onClick={
                          () =>
                            setEditForm(
                              (
                                current
                              ) => ({
                                ...current,

                                isActive:
                                  true,
                              })
                            )
                        }
                      >

                        <CheckCircle2
                          size={15}
                        />

                        Active

                      </button>


                      <button
                        type="button"
                        disabled={
                          saving ||
                          !hasFullManagement
                        }
                        className={
                          !editForm.isActive
                            ? "inactive selected"
                            : "inactive"
                        }
                        onClick={
                          () =>
                            setEditForm(
                              (
                                current
                              ) => ({
                                ...current,

                                isActive:
                                  false,
                              })
                            )
                        }
                      >

                        <Power
                          size={15}
                        />

                        Inactive

                      </button>

                    </div>


                    {
                      !hasFullManagement && (

                        <small className="users-field-helper">

                          Status is read only.

                        </small>

                      )
                    }

                  </div>

                </div>


                <div className="users-edit-actions">

                  <button
                    type="button"
                    className="users-cancel-button"
                    onClick={
                      closeEditModal
                    }
                    disabled={
                      saving
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="submit"
                    className="users-create-button"
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
                                className="users-spin"
                              />

                              Saving...

                            </>

                          )
                        : (

                            <>

                              <Check
                                size={17}
                              />

                              Save Changes

                            </>

                          )
                    }

                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {/* ==================================================
          CHANGE ROLE
          ================================================== */}

      {
        roleUser &&
        hasFullManagement && (

          <div
            className="users-modal-backdrop"
            onClick={
              closeChangeRoleModal
            }
          >

            <div
              className="users-modal users-small-modal"
              onClick={
                (
                  event
                ) =>
                  event.stopPropagation()
              }
            >

              <div className="users-modal-header">

                <div className="users-card-heading">

                  <div className="users-card-heading-icon create">

                    <ShieldPlus
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Change Role
                    </h2>

                    <p>
                      {roleUser.name}
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="users-modal-close"
                  onClick={
                    closeChangeRoleModal
                  }
                >

                  <X
                    size={20}
                  />

                </button>

              </div>


              {
                error && (

                  <div className="users-modal-message">

                    <div className="users-message error">

                      {error}

                    </div>

                  </div>

                )
              }


              <form
                className="users-form"
                onSubmit={
                  handleChangeRole
                }
              >

                <div className="users-form-field">

                  <span className="users-form-label">

                    Role

                  </span>


                  <RoleDropdown
                    value={
                      changeRoleForm.role
                    }
                    open={
                      changeRoleOpen
                    }
                    onToggle={
                      () => {

                        setChangeUnitOpen(
                          false
                        );


                        setChangeRoleOpen(
                          (
                            current
                          ) =>
                            !current
                        );

                      }
                    }
                    onSelect={
                      (
                        role
                      ) => {

                        setChangeRoleForm({

                          role,

                          unitCode:
                            "",

                        });


                        setChangeRoleOpen(
                          false
                        );

                      }
                    }
                  />

                </div>


                <div className="users-form-field unit-field">

                  <span className="users-form-label">

                    Unit

                  </span>


                  <UnitDropdown
                    role={
                      changeRoleForm.role
                    }
                    value={
                      changeRoleForm.unitCode
                    }
                    open={
                      changeUnitOpen
                    }
                    onToggle={
                      () => {

                        setChangeRoleOpen(
                          false
                        );


                        setChangeUnitOpen(
                          (
                            current
                          ) =>
                            !current
                        );

                      }
                    }
                    onSelect={
                      (
                        unitCode
                      ) => {

                        setChangeRoleForm(
                          (
                            current
                          ) => ({
                            ...current,

                            unitCode,
                          })
                        );


                        setChangeUnitOpen(
                          false
                        );

                      }
                    }
                  />

                </div>


                <div className="users-modal-actions">

                  <button
                    type="button"
                    className="users-cancel-button"
                    onClick={
                      closeChangeRoleModal
                    }
                  >

                    Cancel

                  </button>


                  <button
                    type="submit"
                    className="users-create-button"
                    disabled={
                      saving
                    }
                  >

                    <ShieldPlus
                      size={17}
                    />

                    Update Role

                  </button>

                </div>

              </form>

            </div>

          </div>

        )
      }


      {/* ==================================================
          PASSWORD RESET - SUPER ADMIN ONLY
          ================================================== */}

      {
        passwordUser &&
        currentRole ===
          "SUPER_ADMIN" && (

          <div
            className="users-modal-backdrop"
            onClick={
              closePasswordResetModal
            }
          >

            <div
              className="users-modal users-small-modal"
              onClick={
                (
                  event
                ) =>
                  event.stopPropagation()
              }
            >

              <div className="users-modal-header">

                <div className="users-card-heading">

                  <div className="users-card-heading-icon create">

                    <KeyRound
                      size={20}
                    />

                  </div>


                  <div>

                    <h2>
                      Reset Password
                    </h2>

                    <p>
                      {passwordUser.name}
                    </p>

                  </div>

                </div>


                <button
                  type="button"
                  className="users-modal-close"
                  onClick={
                    closePasswordResetModal
                  }
                  disabled={
                    passwordSaving
                  }
                >

                  <X
                    size={20}
                  />

                </button>

              </div>


              <div className="users-form">

                {
                  passwordModalError && (

                    <div className="users-message error">

                      {passwordModalError}

                    </div>

                  )
                }


                {
                  passwordStatusLoading
                    ? (

                      <div className="users-loading">

                        <RefreshCw
                          size={19}
                          className="users-spin"
                        />

                        Loading password status...

                      </div>

                    )
                    : (

                      <>

                        <label>

                          <span>
                            Last Password Change
                          </span>

                          <input
                            type="text"
                            readOnly
                            value={
                              passwordStatus?.passwordChangedAt
                                ? formatDateTime(
                                    passwordStatus.passwordChangedAt
                                  )
                                : "Never"
                            }
                          />

                        </label>


                        <label>

                          <span>
                            Changed By
                          </span>

                          <input
                            type="text"
                            readOnly
                            value={
                              passwordStatus?.passwordChangedBy ??
                              "Not Available"
                            }
                          />

                        </label>

                      </>

                    )
                }


                {
                  temporaryPassword && (

                    <label>

                      <span>
                        Temporary Password
                      </span>


                      <div className="users-password-field">

                        <input
                          type={
                            showTemporaryPassword
                              ? "text"
                              : "password"
                          }
                          readOnly
                          value={
                            temporaryPassword
                          }
                          autoComplete="off"
                        />


                        <button
                          type="button"
                          onClick={
                            () =>
                              setShowTemporaryPassword(
                                (
                                  current
                                ) =>
                                  !current
                              )
                          }
                        >

                          {
                            showTemporaryPassword
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


                      <small className="users-field-helper">

                        This password is shown only in this reset response.
                        Copy it before closing this window.

                      </small>

                    </label>

                  )
                }


                <div className="users-modal-actions">

                  <button
                    type="button"
                    className="users-cancel-button"
                    onClick={
                      closePasswordResetModal
                    }
                    disabled={
                      passwordSaving
                    }
                  >

                    Close

                  </button>


                  {
                    temporaryPassword && (

                      <button
                        type="button"
                        className="users-cancel-button"
                        onClick={
                          () =>
                            void copyTemporaryPassword()
                        }
                      >

                        <Copy
                          size={16}
                        />

                        {
                          passwordCopied
                            ? "Copied"
                            : "Copy Password"
                        }

                      </button>

                    )
                  }


                  <button
                    type="button"
                    className="users-create-button"
                    disabled={
                      passwordSaving ||
                      passwordStatusLoading
                    }
                    onClick={
                      () =>
                        void handleResetPassword()
                    }
                  >

                    {
                      passwordSaving
                        ? (

                          <>

                            <RefreshCw
                              size={17}
                              className="users-spin"
                            />

                            Resetting...

                          </>

                        )
                        : (

                          <>

                            <KeyRound
                              size={17}
                            />

                            {
                              temporaryPassword
                                ? "Reset Again"
                                : "Generate Temporary Password"
                            }

                          </>

                        )
                    }

                  </button>

                </div>

              </div>

            </div>

          </div>

        )
      }


      {/* ==================================================
          DELETE
          ================================================== */}

      {
        deleteUserTarget &&
        hasFullManagement && (

          <div
            className="users-modal-backdrop"
            onClick={
              closeDeleteModal
            }
          >

            <div
              className="users-delete-modal"
              onClick={
                (
                  event
                ) =>
                  event.stopPropagation()
              }
            >

              <div className="users-delete-icon">

                <Trash2
                  size={24}
                />

              </div>


              <h3>

                Delete User?

              </h3>


              <p>

                Are you sure you want to delete{" "}

                <strong>

                  {deleteUserTarget.name}

                </strong>

                ? This action cannot be undone.

              </p>


              {
                error && (

                  <div className="users-message error">

                    {error}

                  </div>

                )
              }


              <div className="users-modal-actions">

                <button
                  type="button"
                  className="users-cancel-button"
                  onClick={
                    closeDeleteModal
                  }
                >

                  Cancel

                </button>


                <button
                  type="button"
                  className="users-delete-button"
                  disabled={
                    saving
                  }
                  onClick={
                    () =>
                      void handleDeleteUser()
                  }
                >

                  <Trash2
                    size={16}
                  />

                  Delete User

                </button>

              </div>

            </div>

          </div>

        )
      }

    </div>

  );

}


export default UserManagementPage;