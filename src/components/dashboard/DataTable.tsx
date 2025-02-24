import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
    Header,
    HeaderGroup,
    Row,
    Cell,
} from "@tanstack/react-table";
import { useTheme } from "@/contexts/useTheme";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const { language } = useTheme();
    const isRTL = language === 'he';

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
    });

    return (
        <div>
            {searchKey && (
                <div className="flex items-center py-4">
                    <Input
                        placeholder="Search"
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className={`max-w-sm ${isRTL ? 'text-right' : 'text-left'}`}
                        dir={isRTL ? 'rtl' : 'ltr'}
                    />
                </div>
            )}
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup: HeaderGroup<TData>) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header: Header<TData, unknown>) => {
                                    return (
                                        <TableHead 
                                            key={header.id}
                                            className={isRTL ? 'text-right' : 'text-left'}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                        </TableHead>
                                    );
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row: Row<TData>) => (
                                <TableRow
                                    key={row.id}
                                    data-state={row.getIsSelected() && "selected"}
                                >
                                    {row.getVisibleCells().map((cell: Cell<TData, unknown>) => (
                                        <TableCell 
                                            key={cell.id}
                                            className={isRTL ? 'text-right' : 'text-left'}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    No results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
            <div className={`flex items-center justify-end space-x-2 py-4 ${isRTL ? 'flex-row-reverse space-x-reverse' : ''}`}>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                    className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    {isRTL ? <ChevronRight className="h-4 w-4 ml-2" /> : <ChevronLeft className="h-4 w-4 mr-2" />}
                    {isRTL ? 'הקודם' : 'Previous'}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                    className={`flex items-center ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                    {isRTL ? 'הבא' : 'Next'}
                    {isRTL ? <ChevronLeft className="h-4 w-4 mr-2" /> : <ChevronRight className="h-4 w-4 ml-2" />}
                </Button>
            </div>
        </div>
    );
} 