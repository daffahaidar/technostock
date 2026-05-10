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
    setMounted(true);
  }, []);

  const currentTheme = theme === "system" ? systemTheme : theme;
  const isDark = currentTheme === "dark";

  // AG Grid v32+ uses the theme prop instead of CSS classes
  const myTheme = themeQuartz.withPart(colorSchemeDark).withParams({
    headerBackgroundColor: isDark ? "var(--muted)" : "var(--primary)",
    headerTextColor: isDark ? "var(--primary)" : "var(--background)",
    headerFontWeight: "bold",
    textColor: "var(--foreground)",
    backgroundColor: "var(--sidebar)",
    borderColor: "var(--border)",
    oddRowBackgroundColor: "var(--accent)",
    rowHoverColor: "var(--accent)",
    accentColor: "var(--accent)",
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
