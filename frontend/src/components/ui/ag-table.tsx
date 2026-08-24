"use client";

import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import type { ColDef, GridOptions } from "ag-grid-community";
import { useTheme } from "next-themes";
import { useMemo, useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

ModuleRegistry.registerModules([AllCommunityModule]);

interface AgTableProps<T> {
  rowData: T[];
  columnDefs: ColDef<T>[];
  gridOptions?: GridOptions<T>;
  height?: string | number;
}

export default function AgTable<T>({
  rowData,
  columnDefs,
  gridOptions,
}: AgTableProps<T>) {
  const { theme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  const myTheme = themeQuartz.withPart(colorSchemeDark).withParams({
    headerBackgroundColor: "#111111",
    headerTextColor: "#D4AF37",
    headerFontWeight: "bold",
    textColor: "#e5e5e5",
    backgroundColor: "#0a0a0a",
    borderColor: "rgba(212, 175, 55, 0.2)",
    oddRowBackgroundColor: "rgba(255, 255, 255, 0.02)",
    rowHoverColor: "rgba(212, 175, 55, 0.1)",
    accentColor: "#D4AF37",
  });

  const defaultColDef = useMemo<ColDef>(() => {
    return {
      filter: true,
      sortable: true,
      resizable: true,
      minWidth: 150,
      flex: 1,
    };
  }, []);

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="flex size-full items-center justify-center">
        <BeatLoader color="var(--primary)" />
      </div>
    );
  }

  return (
    <div className="size-full">
      <AgGridReact
        theme={myTheme}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 20, 50, 100]}
        {...gridOptions}
      />
    </div>
  );
}
