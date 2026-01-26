import { useEffect, useState } from "react";
import { Filter, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getFaculties, getDepartments } from "@/lib/api";
import type { ActiveFilters } from "@/lib/types";

type FilterDialogProps = {
  userId: string;
  filters: ActiveFilters;
  onFiltersChange: (filters: ActiveFilters) => void;
};

const DOCUMENT_TYPES = ["Skripsi", "Tesis", "Disertasi", "Jurnal"];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 30 }, (_, i) => currentYear - i);

export default function FilterDialog({
  userId,
  filters,
  onFiltersChange,
}: FilterDialogProps) {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ActiveFilters>(filters);
  const [faculties, setFaculties] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loadingFaculties, setLoadingFaculties] = useState(false);
  const [loadingDepartments, setLoadingDepartments] = useState(false);
  const [useYearRange, setUseYearRange] = useState(
    filters.year_range.start !== null || filters.year_range.end !== null
  );

  // Load master data when dialog opens
  useEffect(() => {
    if (open) {
      if (faculties.length === 0) {
        loadFaculties();
      }
      if (departments.length === 0) {
        loadDepartments();
      }
    }
  }, [open]);

  const loadFaculties = async () => {
    setLoadingFaculties(true);
    try {
      const data = await getFaculties(userId);
      setFaculties(data);
    } catch (error) {
      console.error("Failed to load faculties:", error);
    } finally {
      setLoadingFaculties(false);
    }
  };

  const loadDepartments = async () => {
    setLoadingDepartments(true);
    try {
      const data = await getDepartments(userId);
      setDepartments(data);
    } catch (error) {
      console.error("Failed to load departments:", error);
    } finally {
      setLoadingDepartments(false);
    }
  };

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const emptyFilters: ActiveFilters = {
      faculty: null,
      department: null,
      document_type: null,
      year: null,
      year_range: {
        start: null,
        end: null,
      },
    };
    setLocalFilters(emptyFilters);
    setUseYearRange(false);
  };

  const handleYearRangeToggle = (checked: boolean) => {
    setUseYearRange(checked);
    if (checked) {
      setLocalFilters({
        ...localFilters,
        year: null, // Clear single year when using range
      });
    } else {
      setLocalFilters({
        ...localFilters,
        year_range: { start: null, end: null }, // Clear range when using single year
      });
    }
  };

  const activeFilterCount = [
    filters.faculty,
    filters.department,
    filters.document_type,
    filters.year,
    filters.year_range.start,
    filters.year_range.end,
  ].filter((v) => v !== null).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="relative h-10 gap-2 border-slate-300"
        >
          <Filter className="h-4 w-4" />
          <span>Filter</span>
          {activeFilterCount > 0 && (
            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Filter Pencarian</DialogTitle>
          <DialogDescription>
            Pilih filter untuk mempersempit hasil pencarian dokumen.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Faculty Filter */}
          <div className="grid gap-2">
            <Label htmlFor="faculty">Fakultas</Label>
            {loadingFaculties ? (
              <div className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat fakultas...</span>
              </div>
            ) : (
              <Select
                value={localFilters.faculty ?? "__all__"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    faculty: value === "__all__" ? null : value,
                  })
                }
              >
                <SelectTrigger id="faculty">
                  <SelectValue placeholder="Pilih fakultas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Fakultas</SelectItem>
                  {faculties.map((faculty) => (
                    <SelectItem key={faculty} value={faculty}>
                      {faculty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {localFilters.faculty && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-fit px-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setLocalFilters({ ...localFilters, faculty: null })
                }
              >
                <X className="mr-1 h-3 w-3" />
                Hapus filter fakultas
              </Button>
            )}
          </div>

          {/* Department Filter */}
          <div className="grid gap-2">
            <Label htmlFor="department">Departemen</Label>
            {loadingDepartments ? (
              <div className="flex h-10 items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-50 text-sm text-slate-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Memuat departemen...</span>
              </div>
            ) : (
              <Select
                value={localFilters.department ?? "__all__"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    department: value === "__all__" ? null : value,
                  })
                }
              >
                <SelectTrigger id="department">
                  <SelectValue placeholder="Pilih departemen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Departemen</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department} value={department}>
                      {department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {localFilters.department && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-fit px-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setLocalFilters({ ...localFilters, department: null })
                }
              >
                <X className="mr-1 h-3 w-3" />
                Hapus filter departemen
              </Button>
            )}
          </div>

          {/* Document Type Filter */}
          <div className="grid gap-2">
            <Label htmlFor="document_type">Tipe Dokumen</Label>
            <Select
              value={localFilters.document_type ?? "__all__"}
              onValueChange={(value) =>
                setLocalFilters({
                  ...localFilters,
                  document_type: value === "__all__" ? null : value,
                })
              }
            >
              <SelectTrigger id="document_type">
                <SelectValue placeholder="Pilih tipe dokumen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Semua Tipe</SelectItem>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {localFilters.document_type && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-fit px-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setLocalFilters({ ...localFilters, document_type: null })
                }
              >
                <X className="mr-1 h-3 w-3" />
                Hapus filter tipe dokumen
              </Button>
            )}
          </div>

          {/* Year Filter */}
          <div className="grid gap-3">
            <Label>Tahun</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="use-year-range"
                checked={useYearRange}
                onChange={(e) => handleYearRangeToggle(e.target.checked)}
              />
              <Label
                htmlFor="use-year-range"
                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Gunakan rentang tahun
              </Label>
            </div>

            {useYearRange ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="year-start" className="text-xs text-slate-600">
                    Tahun Mulai
                  </Label>
                  <Select
                    value={localFilters.year_range.start?.toString() ?? "__none__"}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        year_range: {
                          ...localFilters.year_range,
                          start: value === "__none__" ? null : parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger id="year-start">
                      <SelectValue placeholder="Dari" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Tidak ada</SelectItem>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="year-end" className="text-xs text-slate-600">
                    Tahun Akhir
                  </Label>
                  <Select
                    value={localFilters.year_range.end?.toString() ?? "__none__"}
                    onValueChange={(value) =>
                      setLocalFilters({
                        ...localFilters,
                        year_range: {
                          ...localFilters.year_range,
                          end: value === "__none__" ? null : parseInt(value),
                        },
                      })
                    }
                  >
                    <SelectTrigger id="year-end">
                      <SelectValue placeholder="Sampai" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Tidak ada</SelectItem>
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <Select
                value={localFilters.year?.toString() ?? "__all__"}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    year: value === "__all__" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tahun" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Semua Tahun</SelectItem>
                  {YEARS.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {(localFilters.year ||
              localFilters.year_range.start ||
              localFilters.year_range.end) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-fit px-2 text-xs text-slate-500 hover:text-slate-700"
                onClick={() =>
                  setLocalFilters({
                    ...localFilters,
                    year: null,
                    year_range: { start: null, end: null },
                  })
                }
              >
                <X className="mr-1 h-3 w-3" />
                Hapus filter tahun
              </Button>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleReset}
            className="border-slate-300"
          >
            Reset
          </Button>
          <Button onClick={handleApply}>Terapkan Filter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

