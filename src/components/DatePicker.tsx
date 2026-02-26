import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Tv, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  onDateChange?: (date: Date) => void;
  onFilterChange?: (filter: string) => void;
  matchCounts?: { all: number; tv: number; live: number };
  selectedDate?: Date;
  activeFilter?: string;
}

const DatePicker = ({
  onDateChange,
  onFilterChange,
  matchCounts = { all: 0, tv: 0, live: 0 },
  selectedDate: controlledDate,
  activeFilter: controlledFilter,
}: DatePickerProps) => {
  const [internalDate, setInternalDate] = useState(new Date());
  const [internalFilter, setInternalFilter] = useState("all");
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDate = controlledDate ?? internalDate;
  const activeFilter = controlledFilter ?? internalFilter;

  const handleDateChange = (date: Date) => {
    setInternalDate(date);
    onDateChange?.(date);
  };

  const handleFilterChange = (filter: string) => {
    setInternalFilter(filter);
    onFilterChange?.(filter);
  };

  const generateDates = () => {
    const dates = [];
    const baseOffset = weekOffset * 7;
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i + baseOffset);
      dates.push(date);
    }
    return dates;
  };

  const handlePrevWeek = () => {
    setWeekOffset((prev) => prev - 1);
  };

  const handleNextWeek = () => {
    setWeekOffset((prev) => prev + 1);
  };

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      handleDateChange(date);
      // Recalculate week offset so the selected date appears in the visible range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const selected = new Date(date);
      selected.setHours(0, 0, 0, 0);
      const diffDays = Math.round((selected.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      setWeekOffset(Math.round(diffDays / 7));
      setCalendarOpen(false);
    }
  };

  const dates = generateDates();

  const formatDay = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  };

  const formatDate = (date: Date) => {
    return date.getDate().toString().padStart(2, "0");
  };

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const filters = [
    { id: "all", label: "All", mobileLabel: "All", count: matchCounts.all, icon: null },
    { id: "tv", label: "Televised", mobileLabel: "TV", count: matchCounts.tv, icon: Tv },
    { id: "live", label: "Live Now", mobileLabel: "Live", count: matchCounts.live, icon: Radio, isLive: true },
  ];

  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container py-2 sm:py-5">
        {/* Date selector */}
        <div className="flex items-center justify-center gap-0.5 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevWeek}
            className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 flex-shrink-0"
          >
            <ChevronLeft className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex items-center gap-0.5 sm:gap-2 overflow-x-auto scrollbar-hide py-0.5 sm:py-1 px-0.5 sm:px-1 flex-1 justify-center">
            {dates.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateChange(date)}
                className={cn(
                  "group flex min-w-[40px] sm:min-w-[72px] flex-col items-center rounded-lg sm:rounded-xl px-1.5 sm:px-3 py-1.5 sm:py-3 transition-all duration-300 flex-shrink-0",
                  isSelected(date)
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    : "hover:bg-muted"
                )}
              >
                <span className={cn(
                  "text-[8px] sm:text-[11px] font-semibold tracking-wide leading-none",
                  isSelected(date) ? "text-primary-foreground/90" : "text-muted-foreground",
                  isToday(date) && !isSelected(date) && "text-primary"
                )}>
                  {isToday(date) ? "TODAY" : formatDay(date)}
                </span>
                <span className={cn(
                  "text-base sm:text-2xl font-black leading-tight",
                  !isSelected(date) && "text-foreground"
                )}>
                  {formatDate(date)}
                </span>
                <span className={cn(
                  "text-[7px] sm:text-[10px] font-medium tracking-wider leading-none",
                  isSelected(date) ? "text-primary-foreground/80" : "text-muted-foreground"
                )}>
                  {formatMonth(date)}
                </span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNextWeek}
            className="h-7 w-7 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 flex-shrink-0"
          >
            <ChevronRight className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
          </Button>

          <div className="hidden sm:block h-8 w-px bg-border mx-2" />

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex h-7 w-7 sm:h-10 sm:w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              >
                <CalendarIcon className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleCalendarSelect}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Filter tabs */}
        <div className="mt-2 sm:mt-5 flex items-center justify-center gap-1 sm:gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => handleFilterChange(filter.id)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 rounded-full px-2.5 sm:px-4 py-1 sm:py-2 text-[11px] sm:text-sm font-medium transition-all duration-300",
                activeFilter === filter.id
                  ? filter.isLive 
                    ? "bg-live text-primary-foreground shadow-lg shadow-live/30"
                    : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {filter.icon && (
                <filter.icon className={cn(
                  "h-3 w-3 sm:h-4 sm:w-4",
                  filter.isLive && activeFilter === filter.id && "animate-pulse"
                )} />
              )}
              <span className="hidden sm:inline">{filter.label}</span>
              <span className="sm:hidden">{filter.mobileLabel}</span>
              <span className={cn(
                "rounded-full px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-xs font-bold",
                activeFilter === filter.id
                  ? "bg-white/20"
                  : filter.isLive 
                    ? "bg-live/20 text-live"
                    : "bg-primary/10 text-primary"
              )}>
                {filter.count}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
