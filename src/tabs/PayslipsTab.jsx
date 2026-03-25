import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi as api } from "../utils/api.js";
import {
  normalizeList,
  DataTable,
  errMsg,
  InlineFields,
  PageHeader,
  PanelCard,
  PrimaryButton,
} from "./shared.jsx";

export default function PayslipsTab({ showToast }) {
  const [filter, setFilter] = useState({ staffId: "", from: "", to: "" });
  const [loadKey, setLoadKey] = useState(null);

  const { data: payslipRows = [], isFetching } = useQuery({
    queryKey: ["payslips", loadKey],
    queryFn: () => {
      const { staffId, from, to } = loadKey;
      const qs = `?staffId=${encodeURIComponent(staffId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      return api.get(`/payslips${qs}`).then((r) => normalizeList(r.data));
    },
    enabled: loadKey !== null,
    onError: (err) => showToast(errMsg(err, "Failed to load payslips"), true),
  });

  return (
    <div>
      <PageHeader
        title="Pay Slips"
        description="Search and review payslip summaries."
      />
      <PanelCard>
        <InlineFields>
          <input
            type="text"
            placeholder="Staff ID"
            value={filter.staffId}
            onChange={(e) =>
              setFilter((f) => ({ ...f, staffId: e.target.value }))
            }
          />
          <input
            type="date"
            value={filter.from}
            onChange={(e) => setFilter((f) => ({ ...f, from: e.target.value }))}
          />
          <input
            type="date"
            value={filter.to}
            onChange={(e) => setFilter((f) => ({ ...f, to: e.target.value }))}
          />
          <PrimaryButton
            onClick={() => setLoadKey({ ...filter })}
            disabled={isFetching}
          >
            {isFetching ? "Loading..." : "Load"}
          </PrimaryButton>
        </InlineFields>
        <DataTable rows={payslipRows} />
      </PanelCard>
    </div>
  );
}
