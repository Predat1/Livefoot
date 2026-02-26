import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  onDateChange?: (date: Date) => void;
  selectedDate?: Date;
}

const DatePicker = ({
  onDateChange,
  selectedDate: controlledDate,
}: DatePickerProps) => {
  const [internalDate, setInternalDate] = useState(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const selectedDate = controlledDate ?? internalDate;

  const handleDateChange = (date: Date) => {
    setInternalDate(date);
    onDateChange?.(date);
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


  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container py-4 sm:py-5">
        {/* Date selector */}
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevWeek}
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-1 flex-1 justify-center">
            {dates.map((date, index) => (
              <button
                key={index}
                onClick={() => handleDateChange(date)}
                className={cn(
                  "group flex min-w-[48px] sm:min-w-[72px] flex-col items-center rounded-lg sm:rounded-xl px-2 sm:px-3 py-2 sm:py-3 transition-all duration-300 flex-shrink-0",
                  isSelected(date)
                    ? "gradient-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                    : "hover:bg-muted"
                )}
              >
                <span className={cn(
                  "text-[9px] sm:text-[11px] font-semibold tracking-wide",
                  isSelected(date) ? "text-primary-foreground/90" : "text-muted-foreground",
                  isToday(date) && !isSelected(date) && "text-primary"
                )}>
                  {isToday(date) ? "TODAY" : formatDay(date)}
                </span>
                <span className={cn(
                  "text-lg sm:text-2xl font-black leading-tight mt-0.5",
                  !isSelected(date) && "text-foreground"
                )}>
                  {formatDate(date)}
                </span>
                <span className={cn(
                  "text-[8px] sm:text-[10px] font-medium tracking-wider",
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
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="hidden sm:block h-8 w-px bg-border mx-2" />

          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="flex h-8 w-8 sm:h-10 sm:w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
              >
                <CalendarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
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

      </div>
    </div>
  );
};

export default DatePicker;
