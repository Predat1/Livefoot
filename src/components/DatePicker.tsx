import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, Tv, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DatePicker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [activeFilter, setActiveFilter] = useState("all");

  const generateDates = () => {
    const dates = [];
    for (let i = -3; i <= 3; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
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
    { id: "all", label: "All", mobileLabel: "All", count: 103, icon: null },
    { id: "tv", label: "Televised", mobileLabel: "TV", count: 14, icon: Tv },
    { id: "live", label: "Live Now", mobileLabel: "Live", count: 1, icon: Radio, isLive: true },
  ];

  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="container py-4 sm:py-5">
        {/* Date selector */}
        <div className="flex items-center justify-center gap-1 sm:gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 flex-shrink-0"
          >
            <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-hide py-1 px-1 flex-1 justify-center">
            {dates.map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
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
            className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg sm:rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300 flex-shrink-0"
          >
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          <div className="hidden sm:block h-8 w-px bg-border mx-2" />

          <Button
            variant="ghost"
            size="icon"
            className="hidden sm:flex h-10 w-10 rounded-xl text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-300"
          >
            <Calendar className="h-5 w-5" />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="mt-4 sm:mt-5 flex items-center justify-center gap-1.5 sm:gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={cn(
                "flex items-center gap-1 sm:gap-2 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300",
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
                "rounded-full px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-bold",
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
