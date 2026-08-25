import { ColDef } from "ag-grid-community";
import { MemberActionCell } from "../components/member-action-cell";
import { ICellRendererParams } from "ag-grid-community";

export const MemberColumn: ColDef[] = [
  {
    headerName: "Name",
    field: "name",
    flex: 1,
    minWidth: 200,
  },
  {
    headerName: "Email",
    field: "email",
    flex: 1,
    minWidth: 200,
  },
  {
    headerName: "Role",
    field: "role",
    width: 120,
    cellRenderer: (params: ICellRendererParams) => {
      const role = params.value;
      const color = role === "Member" ? "bg-amber-500/20 text-amber-500" : "bg-blue-500/20 text-blue-500";
      return (
        <div className="flex items-center h-full">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {role}
          </span>
        </div>
      );
    }
  },
  {
    headerName: "Status",
    field: "status",
    width: 120,
    cellRenderer: (params: ICellRendererParams) => {
      const status = params.value;
      const color = status === "Suspended" ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500";
      return (
        <div className="flex items-center h-full">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
            {status}
          </span>
        </div>
      );
    }
  },
  {
    headerName: "Account Type",
    field: "account_type_name",
    width: 150,
    valueFormatter: (params) => params.value || "Publik",
  },
  {
    headerName: "Subscription Plan",
    field: "subscription_plan_name",
    flex: 1,
    minWidth: 150,
    valueFormatter: (params) => params.value || "Publik",
  },
  {
    headerName: "Subs Status",
    field: "subscription_status",
    width: 120,
    valueFormatter: (params) => params.value || "-",
  },
  {
    headerName: "End Date",
    field: "membership_end_date",
    width: 150,
    valueFormatter: (params) => {
      if (!params.value) return params.data.subscription_status === "Active" ? "Lifetime" : "-";
      try {
        return new Intl.DateTimeFormat("id-ID", { 
          day: "2-digit", 
          month: "short", 
          year: "numeric" 
        }).format(new Date(params.value));
      } catch {
        return "-";
      }
    },
  },
  {
    headerName: "Aksi",
    field: "id",
    width: 120,
    cellRenderer: MemberActionCell,
    sortable: false,
    filter: false,
    pinned: "right",
  },
];
