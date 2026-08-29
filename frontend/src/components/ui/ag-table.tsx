"use client";

import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";
import type { ColDef, GridOptions } from "ag-grid-community";

import { useMemo } from "react";

ModuleRegistry.registerModules([AllCommunityModule]);

interface AgTableProps<T> {
  rowData?: T[] | undefined;
  columnDefs: ColDef<T>[];
  gridOptions?: GridOptions<T>;
  height?: string | number;
  loading?: boolean;
  loadingOverlayComponent?: GridOptions<T>["loadingOverlayComponent"];
  noRowsOverlayComponent?: GridOptions<T>["noRowsOverlayComponent"];
}

export default function AgTable<T>({
  rowData,
  columnDefs,
  gridOptions,
  loading,
  loadingOverlayComponent,
  noRowsOverlayComponent,
}: AgTableProps<T>) {

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
        loading={loading}
        loadingOverlayComponent={loadingOverlayComponent}
        noRowsOverlayComponent={noRowsOverlayComponent}
        {...gridOptions}
      />
    </div>
  );
}
