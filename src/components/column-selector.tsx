'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Settings2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export interface ColumnOption {
    id: string;
    label: string;
}

interface ColumnSelectorProps {
    columns: ColumnOption[];
    selectedColumns: string[];
    onSelectionChange: (selectedIds: string[]) => void;
}

export function ColumnSelector({
    columns,
    selectedColumns,
    onSelectionChange,
}: ColumnSelectorProps) {
    const [open, setOpen] = React.useState(false);

    const toggleColumn = (columnId: string) => {
        const newSelection = selectedColumns.includes(columnId)
            ? selectedColumns.filter((id) => id !== columnId)
            : [...selectedColumns, columnId];
        onSelectionChange(newSelection);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-[250px] justify-between"
                >
                    <div className="flex items-center gap-2">
                        <Settings2 className="h-4 w-4" />
                        <span>Customize Columns</span>
                    </div>
                    {selectedColumns.length > 0 && (
                        <Badge variant="secondary" className="ml-2 h-5 rounded-sm px-1 text-xs">
                            {selectedColumns.length}
                        </Badge>
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[250px] p-0">
                <Command>
                    <CommandInput placeholder="Search columns..." />
                    <CommandList>
                        <CommandEmpty>No column found.</CommandEmpty>
                        <CommandGroup>
                            {columns.map((column) => (
                                <CommandItem
                                    key={column.id}
                                    value={column.label}
                                    onSelect={() => toggleColumn(column.id)}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedColumns.includes(column.id)
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    {column.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
