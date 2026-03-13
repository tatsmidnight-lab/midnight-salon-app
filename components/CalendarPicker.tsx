"use client";

import { DayPicker } from "react-day-picker";
import { cn, AVAILABLE_TIMES, formatTime } from "@/lib/utils";
import { addDays, isBefore, startOfDay } from "date-fns";

interface CalendarPickerProps {
  selectedDate: Date | undefined;
  selectedTime: string | undefined;
  onDateChange: (date: Date | undefined) => void;
  onTimeChange: (time: string) => void;
}

export default function CalendarPicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
}: CalendarPickerProps) {
  const today = startOfDay(new Date());
  const minDate = today;
  const maxDate = addDays(today, 60);

  return (
    <div className="space-y-6">
      {/* Calendar */}
      <div className="flex justify-center">
        <div className="bg-midnight-900 border border-midnight-700 rounded-xl p-4">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onDateChange}
            disabled={[
              { before: minDate },
              { after: maxDate },
              { dayOfWeek: [0] }, // No Sundays
            ]}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium text-white",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-midnight-200 hover:text-gold-400 transition-colors"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-midnight-500 rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: cn(
                "h-9 w-9 text-center text-sm p-0 relative",
                "[&:has([aria-selected].day-range-end)]:rounded-r-md",
                "[&:has([aria-selected].day-outside)]:bg-accent/50",
                "[&:has([aria-selected])]:bg-midnight-800",
                "first:[&:has([aria-selected])]:rounded-l-md",
                "last:[&:has([aria-selected])]:rounded-r-md",
                "focus-within:relative focus-within:z-20"
              ),
              day: cn(
                "h-9 w-9 p-0 font-normal aria-selected:opacity-100 text-midnight-200 hover:bg-midnight-700 hover:text-white rounded-md transition-colors"
              ),
              day_range_end: "day-range-end",
              day_selected:
                "bg-gold-500 text-midnight-950 hover:bg-gold-400 hover:text-midnight-950 focus:bg-gold-500 focus:text-midnight-950 font-semibold",
              day_today: "bg-midnight-700 text-white font-semibold",
              day_outside:
                "day-outside text-midnight-600 opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
              day_disabled: "text-midnight-700 opacity-30 cursor-not-allowed",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </div>
      </div>

      {/* Time slots */}
      {selectedDate && (
        <div>
          <h4 className="text-white font-medium mb-3 text-sm">
            Available Times
          </h4>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {AVAILABLE_TIMES.map((time) => (
              <button
                key={time}
                onClick={() => onTimeChange(time)}
                className={cn(
                  "py-2 px-3 rounded-lg text-sm font-medium transition-all border",
                  selectedTime === time
                    ? "bg-gold-500 text-midnight-950 border-gold-500 font-semibold"
                    : "bg-midnight-900 text-midnight-200 border-midnight-700 hover:border-gold-500/50 hover:text-white"
                )}
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
