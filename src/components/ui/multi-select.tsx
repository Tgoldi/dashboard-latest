import * as React from "react";
import { Check, ChevronsUpDown, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Option {
    label: string;
    value: string;
}

interface MultiSelectProps {
    options: Option[];
    value: string[];
    onChange: (value: string[]) => void;
    placeholder?: string;
    className?: string;
}

export function MultiSelect({
    options = [],
    value = [],
    onChange,
    placeholder = "Select items",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState("");

    // Ensure value is always an array
    const safeValue = Array.isArray(value) ? value : [];
    
    // Ensure options is always an array
    const safeOptions = Array.isArray(options) ? options : [];

    const selectedLabels = safeValue.map(
        (v) => safeOptions.find((opt) => opt.value === v)?.label || v
    ).filter(Boolean);

    // Filter options based on search query
    const filteredOptions = safeOptions.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between",
                        !selectedLabels.length && "text-muted-foreground",
                        className
                    )}
                >
                    <div className="flex gap-1 flex-wrap">
                        {selectedLabels.length ? (
                            selectedLabels.map((label) => (
                                <Badge
                                    variant="secondary"
                                    key={label}
                                    className="mr-1 mb-1"
                                >
                                    {label}
                                    <span
                                        role="button"
                                        tabIndex={0}
                                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer inline-flex"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            const newValue = safeValue.filter(
                                                (v) =>
                                                    safeOptions.find((opt) => opt.value === v)?.label !==
                                                    label
                                            );
                                            onChange(newValue);
                                        }}
                                    >
                                        <X className="h-3 w-3" />
                                    </span>
                                </Badge>
                            ))
                        ) : (
                            <span>{placeholder}</span>
                        )}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-2" align="start">
                <div className="flex items-center border rounded-md px-3 mb-2">
                    <Search className="h-4 w-4 text-muted-foreground mr-2" />
                    <Input
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                    />
                </div>
                <ScrollArea className="h-[200px]">
                    {filteredOptions.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            No items found.
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {filteredOptions.map((option) => (
                                <div
                                    key={option.value}
                                    className={cn(
                                        "flex items-center rounded-md px-2 py-1.5 cursor-pointer text-sm",
                                        "hover:bg-accent hover:text-accent-foreground",
                                        safeValue.includes(option.value) && "bg-accent/50"
                                    )}
                                    onClick={() => {
                                        const newValue = safeValue.includes(option.value)
                                            ? safeValue.filter((v) => v !== option.value)
                                            : [...safeValue, option.value];
                                        onChange(newValue);
                                        setOpen(true);
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            safeValue.includes(option.value) ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
} 