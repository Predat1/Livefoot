import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const DatePicker = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());

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

  return (
    <div className="bg-card border-b border-border">
      <div className="container py-4">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1 overflow-x-auto">
            {dates.map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "flex min-w-[60px] flex-col items-center rounded-lg px-3 py-2 transition-all",
                  isSelected(date)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <span className="text-[10px] font-medium opacity-80">
                  {isToday(date) ? "TODAY" : formatDay(date)}
                </span>
                <span className="text-lg font-bold">{formatDate(date)}</span>
                <span className="text-[10px] font-medium opacity-80">
                  {formatMonth(date)}
                </span>
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <Calendar className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="mt-4 flex items-center justify-center gap-4">
          <button className="flex items-center gap-2 text-sm font-medium text-foreground">
            all
            <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">
              103
            </span>
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            televised
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              14
            </span>
          </button>
          <button className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            live
            <span className="rounded-full bg-live px-2 py-0.5 text-xs text-primary-foreground">
              1
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
