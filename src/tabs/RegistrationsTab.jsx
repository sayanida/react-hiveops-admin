import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  InputAdornment,
  Pagination,
  Paper,
  Radio,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import SearchIcon from "@mui/icons-material/Search";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import {
  mockRegistrations,
  mockStaffRows,
} from "../mocks/staffAdminMockData.js";
import {
  normalizeList,
  DataTable,
  GhostButton,
  PageHeader,
  PanelCard,
} from "./shared.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────
const METHODS = [
  {
    key: "webcam_face",
    label: "Webcam Face Mock",
    description: "Simulated facial recognition via webcam",
  },
  {
    key: "qr_pin",
    label: "QR / PIN",
    description: "QR code scan or 4-digit PIN at station",
  },
];

const CONTRACT_LABELS = {
  FULL_TIME: "Full Time",
  PART_TIME: "Part Time",
  CASUAL: "Casual",
};

const ROLE_LABELS = {
  OFFICE_ADMIN: "Office Admin",
  MANAGER: "Manager / Supervisor",
  SUPERVISOR: "Manager / Supervisor",
  ROSTER_ADMIN: "Roster Admin",
  WORKER: "Worker",
};

const HEADER_BG = "#9b3440";
const ROWS_PER_PAGE = 10;

function getEmpCode(id) {
  return `EMP-${String(id).padStart(3, "0")}`;
}

function generatePin() {
  return Array.from({ length: 4 }, () => Math.floor(Math.random() * 10));
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function RegistrationsTab({ showToast }) {
  const [localRegs, setLocalRegs] = useState(() =>
    normalizeList(mockRegistrations).map((r) => ({
      ...r,
      active: r.active !== false,
    })),
  );
  const [tempPins, setTempPins] = useState({});
  const [modal, setModal] = useState({ type: null, staff: null });
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [generatedPin, setGeneratedPin] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const staffRows = useMemo(() => normalizeList(mockStaffRows), []);

  // ─── Filtering / pagination ─────────────────────────────────────────────────
  const keyword = search.trim().toLowerCase();
  const filtered = keyword
    ? staffRows.filter(
        (s) =>
          String(s.id).includes(keyword) ||
          String(s.name ?? "")
            .toLowerCase()
            .includes(keyword),
      )
    : staffRows;

  const pageCount = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  // ─── Helpers ────────────────────────────────────────────────────────────────
  function getActiveReg(staffId) {
    return (
      localRegs.find(
        (r) => r.active && String(r.staffId) === String(staffId),
      ) ?? null
    );
  }

  function getTempPin(staffId) {
    const pin = tempPins[String(staffId)];
    if (!pin) return null;
    if (new Date() > new Date(pin.expiresAt)) return null;
    return pin;
  }

  // ─── Modal openers ──────────────────────────────────────────────────────────
  const openRegister = (staff) => {
    setSelectedMethod(null);
    setModal({ type: "register", staff });
  };

  const openReregister = (staff) => {
    setSelectedMethod(null);
    setModal({ type: "reregister", staff });
  };

  const openTempPin = (staff) => {
    setGeneratedPin(generatePin());
    setModal({ type: "tempPin", staff });
  };

  const closeModal = () => {
    setModal({ type: null, staff: null });
    setSelectedMethod(null);
    setGeneratedPin(null);
  };

  // ─── Confirm handlers ───────────────────────────────────────────────────────
  const handleRegister = () => {
    if (!selectedMethod || !modal.staff) return;
    const method = METHODS.find((m) => m.key === selectedMethod);
    setLocalRegs((prev) => [
      ...prev,
      {
        id: Date.now(),
        staffId: modal.staff.id,
        method: method.label,
        identifier: `${selectedMethod.toUpperCase()}-${Date.now()}`,
        reason: "New staff",
        active: true,
      },
    ]);
    showToast?.(`${method.label} registered for ${modal.staff.name}.`);
    closeModal();
  };

  const handleReregister = () => {
    if (!selectedMethod || !modal.staff) return;
    const method = METHODS.find((m) => m.key === selectedMethod);
    setLocalRegs((prev) =>
      prev
        .map((r) =>
          r.active && String(r.staffId) === String(modal.staff.id)
            ? { ...r, active: false }
            : r,
        )
        .concat({
          id: Date.now(),
          staffId: modal.staff.id,
          method: method.label,
          identifier: `${selectedMethod.toUpperCase()}-${Date.now()}`,
          reason: "Re-register",
          active: true,
        }),
    );
    setTempPins((prev) => {
      const next = { ...prev };
      delete next[String(modal.staff.id)];
      return next;
    });
    showToast?.(`Re-registered ${method.label} for ${modal.staff.name}.`);
    closeModal();
  };

  const handleIssuePin = () => {
    if (!modal.staff || !generatedPin) return;
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
    setTempPins((prev) => ({
      ...prev,
      [String(modal.staff.id)]: {
        pin: generatedPin,
        expiresAt,
        issuedAt: new Date().toISOString(),
      },
    }));
    showToast?.(`Temporary PIN issued for ${modal.staff.name}.`);
    closeModal();
  };

  // ─── Table rows ─────────────────────────────────────────────────────────────
  const tableRows = paged.map((staff) => {
    const reg = getActiveReg(staff.id);
    const tempPin = getTempPin(staff.id);

    const idMethodCell = reg ? (
      <Typography variant="body2">{reg.method}</Typography>
    ) : (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );

    const statusCell = reg ? (
      <Chip size="small" label="Registered" color="success" />
    ) : tempPin ? (
      <Chip size="small" label="Temp PIN" color="warning" />
    ) : (
      <Chip size="small" label="Not Registered" variant="outlined" />
    );

    const actionCell = reg ? (
      <Stack direction="row" spacing={1}>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          sx={{ textTransform: "none", fontSize: 12 }}
          onClick={() => openReregister(staff)}
        >
          Re-register
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="inherit"
          sx={{ textTransform: "none", fontSize: 12 }}
          onClick={() => openTempPin(staff)}
        >
          Issue Temp PIN
        </Button>
      </Stack>
    ) : (
      <Button
        size="small"
        variant="contained"
        disableElevation
        sx={{
          textTransform: "none",
          fontSize: 12,
          bgcolor: HEADER_BG,
          "&:hover": { bgcolor: "#7d2834" },
        }}
        onClick={() => openRegister(staff)}
      >
        Register
      </Button>
    );

    return {
      "Staff ID": getEmpCode(staff.id),
      Name: staff.name ?? "",
      Contract: CONTRACT_LABELS[staff.contractType] ?? staff.contractType ?? "",
      "ID Method": idMethodCell,
      Status: statusCell,
      Action: actionCell,
    };
  });

  // ─── Shared modal data ──────────────────────────────────────────────────────
  const modalStaff = modal.staff;
  const currentReg = modalStaff ? getActiveReg(modalStaff.id) : null;
  const currentMethodKey = currentReg
    ? (METHODS.find((m) => m.label === currentReg.method)?.key ?? null)
    : null;

  // ─── Shared dialog header style ─────────────────────────────────────────────
  const headerSx = {
    bgcolor: HEADER_BG,
    color: "common.white",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    py: 1.5,
    px: 2.5,
  };

  const paperProps = { sx: { borderRadius: 2, overflow: "hidden" } };

  const confirmBtnSx = {
    textTransform: "none",
    fontWeight: 700,
    bgcolor: HEADER_BG,
    "&:hover": { bgcolor: "#7d2834" },
  };

  // ─── Method radio card ──────────────────────────────────────────────────────
  function MethodCard({ m, isSelected, isDisabled }) {
    return (
      <Paper
        variant="outlined"
        onClick={() => !isDisabled && setSelectedMethod(m.key)}
        sx={{
          px: 2,
          py: 1.5,
          cursor: isDisabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          borderColor: isSelected ? HEADER_BG : "divider",
          bgcolor: isDisabled
            ? "action.disabledBackground"
            : isSelected
              ? "rgba(155,52,64,0.04)"
              : "background.paper",
          opacity: isDisabled ? 0.7 : 1,
        }}
      >
        <Radio
          checked={isSelected}
          disabled={isDisabled}
          onChange={() => setSelectedMethod(m.key)}
          size="small"
          sx={{ "&.Mui-checked": { color: HEADER_BG } }}
        />
        <Box>
          <Typography
            variant="body2"
            sx={{
              fontWeight: 700,
              color: isDisabled ? "text.disabled" : "text.primary",
            }}
          >
            {m.label}
          </Typography>
          <Typography
            variant="caption"
            color={isDisabled ? "text.disabled" : "text.secondary"}
          >
            {isDisabled
              ? "Currently active — choose a different method"
              : m.description}
          </Typography>
        </Box>
      </Paper>
    );
  }

  // ─── Staff info block ───────────────────────────────────────────────────────
  function StaffInfo({ staff, extra }) {
    return (
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {staff.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {getEmpCode(staff.id)} · {ROLE_LABELS[staff.role] ?? staff.role}
        </Typography>
        {extra}
        <Divider sx={{ mt: 1.5 }} />
      </Box>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <PageHeader
        title="Identification Registration"
        description="Register and manage identification methods for staff."
      />

      <PanelCard>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 1.5,
          }}
        >
          <TextField
            placeholder="Search by name or staff ID"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ width: 280 }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <DataTable rows={tableRows} />

        <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
          <Pagination
            count={pageCount}
            page={page}
            onChange={(_, v) => setPage(v)}
            color="primary"
            shape="rounded"
          />
        </Box>
      </PanelCard>

      {/* ─── Register Modal ─────────────────────────────────────────────────── */}
      <Dialog
        open={modal.type === "register"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        PaperProps={paperProps}
      >
        <DialogTitle sx={headerSx}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Register Identification Method
          </Typography>
          <IconButton onClick={closeModal} sx={{ color: "common.white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5 }}>
          {modalStaff && <StaffInfo staff={modalStaff} />}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
            Select Identification Method
          </Typography>
          <Stack spacing={1.25}>
            {METHODS.map((m) => (
              <MethodCard
                key={m.key}
                m={m}
                isSelected={selectedMethod === m.key}
                isDisabled={false}
              />
            ))}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <GhostButton onClick={closeModal}>Cancel</GhostButton>
          <Button
            variant="contained"
            disableElevation
            disabled={!selectedMethod}
            onClick={handleRegister}
            sx={confirmBtnSx}
          >
            Register Method
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Re-register Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={modal.type === "reregister"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        PaperProps={paperProps}
      >
        <DialogTitle sx={headerSx}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Re-register Identification Method
          </Typography>
          <IconButton onClick={closeModal} sx={{ color: "common.white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5 }}>
          {modalStaff && (
            <StaffInfo
              staff={modalStaff}
              extra={
                currentReg && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 1,
                      mt: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      Current method
                    </Typography>
                    <Chip
                      size="small"
                      label={currentReg.method}
                      color="success"
                    />
                    <Typography variant="body2" color="text.secondary">
                      — will be deactivated on save
                    </Typography>
                  </Box>
                )
              }
            />
          )}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.25 }}>
            Select New Method
          </Typography>
          <Stack spacing={1.25}>
            {METHODS.map((m) => (
              <MethodCard
                key={m.key}
                m={m}
                isSelected={selectedMethod === m.key}
                isDisabled={currentMethodKey === m.key}
              />
            ))}
          </Stack>

          {selectedMethod && currentReg && (
            <Alert
              severity="warning"
              icon={<WarningAmberOutlinedIcon fontSize="small" />}
              sx={{ mt: 2, borderRadius: 1 }}
            >
              Current <strong>{currentReg.method}</strong> is deactivated
              immediately on save.
            </Alert>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <GhostButton onClick={closeModal}>Cancel</GhostButton>
          <Button
            variant="contained"
            disableElevation
            disabled={!selectedMethod}
            onClick={handleReregister}
            sx={confirmBtnSx}
          >
            Save New Method
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Issue Temp PIN Modal ────────────────────────────────────────────── */}
      <Dialog
        open={modal.type === "tempPin"}
        onClose={closeModal}
        fullWidth
        maxWidth="sm"
        PaperProps={paperProps}
      >
        <DialogTitle sx={headerSx}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Issue Temporary PIN
          </Typography>
          <IconButton onClick={closeModal} sx={{ color: "common.white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent dividers sx={{ pt: 2.5 }}>
          {modalStaff && <StaffInfo staff={modalStaff} />}

          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
            Generated Temporary PIN
          </Typography>

          <Stack direction="row" spacing={2} alignItems="center">
            <Stack direction="row" spacing={1}>
              {(generatedPin ?? [0, 0, 0, 0]).map((digit, i) => (
                <Paper
                  key={i}
                  variant="outlined"
                  sx={{
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {digit}
                  </Typography>
                </Paper>
              ))}
            </Stack>

            <Paper
              variant="outlined"
              sx={{ px: 2, py: 1.5, flex: 1, bgcolor: "action.hover" }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                Valid for 72 hours
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Expires:{" "}
                {new Date(Date.now() + 72 * 60 * 60 * 1000).toLocaleString(
                  "en-AU",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )}
              </Typography>
            </Paper>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, justifyContent: "space-between" }}>
          <GhostButton onClick={closeModal}>Cancel</GhostButton>
          <Button
            variant="contained"
            disableElevation
            onClick={handleIssuePin}
            sx={confirmBtnSx}
          >
            Confirm &amp; Issue PIN
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
