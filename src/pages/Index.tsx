import { useState } from "react";
import { ChevronDown, CornerDownLeft } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const options = ["60", "4D", "AB", "BC", "AC", "A", "B", "C"];

const Index = () => {
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [name, setName] = useState("");
  const [startRange, setStartRange] = useState("");
  const [endRange, setEndRange] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [records, setRecords] = useState<string[]>([]);
  const [error, setError] = useState("");

  const validateRange = (start: string, end: string) => {
    if (start === "" || end === "") {
      setError("");
      return;
    }

    const startNum = parseInt(start, 10);
    const endNum = parseInt(end, 10);

    if (startNum >= endNum) {
      setError("Start must be less than end");
    } else {
      setError("");
    }
  };

  const handleStartRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setStartRange(value);
    validateRange(value, endRange);
  };

  const handleEndRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setEndRange(value);
    validateRange(startRange, value);
  };

  const handleNumericValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setNumericValue(value);
  };

  const handleAddRecord = () => {
    if (!startRange || !numericValue) {
      setError("Please enter Start and Value");
      return;
    }

    const start = parseInt(startRange, 10);
    let end = parseInt(endRange, 10);

    if (isNaN(start)) {
      setError("Start range must be a number");
      return;
    }

    if (isNaN(end) || end < start) {
      end = start;
    }

    const newRecords: string[] = [];
    for (let i = start; i <= end; i++) {
      newRecords.push(`${selectedOption}-${i}-${numericValue}`);
      newRecords.push(`GT-${numericValue}`);
    }

    setRecords((prev) => [...prev, ...newRecords]);
    setNumericValue("");
    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddRecord();
    }
  };

  const handleClear = () => {
    setRecords([]);
    setStartRange("");
    setEndRange("");
    setNumericValue("");
    setError("");
  };

  const handleSend = () => {
    const message = `${name}\n${records.join("\n")}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, "_blank");
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-md space-y-5">
        {/* Row 1: Dropdown + Name Input */}
        <div className="flex gap-3">
          {/* Dropdown Menu */}
          <div className="shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger className="dropdown-trigger w-28 sm:w-32">
                <span className="truncate text-foreground">{selectedOption}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="dropdown-content w-28 sm:w-32">
                {options.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    className="dropdown-item"
                    onClick={() => setSelectedOption(option)}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Name Input */}
          <div className="flex-1">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter name"
              className="input-field"
              aria-label="Name"
            />
          </div>
        </div>

        {/* Row 2: Start Range - End Range - Value */}
        <div className="flex items-end gap-3">
          <div className="w-24 space-y-1">
            <label htmlFor="startRange" className="form-label">
              Start
            </label>
            <input
              id="startRange"
              type="text"
              inputMode="numeric"
              value={startRange}
              onChange={handleStartRange}
              placeholder="1"
              className="input-field"
              aria-label="Start of range"
            />
          </div>

          <span className="pb-3 text-muted-foreground font-medium">—</span>

          <div className="w-24 space-y-1">
            <label htmlFor="endRange" className="form-label">
              End
            </label>
            <input
              id="endRange"
              type="text"
              inputMode="numeric"
              value={endRange}
              onChange={handleEndRange}
              placeholder="99"
              className="input-field"
              aria-label="End of range"
            />
          </div>

          <div className="w-24 space-y-1">
            <label htmlFor="numericValue" className="form-label">
              Value
            </label>
            <input
              id="numericValue"
              type="text"
              inputMode="numeric"
              value={numericValue}
              onChange={handleNumericValue}
              onKeyDown={handleKeyDown}
              placeholder="10"
              className="input-field"
              aria-label="Numeric Value"
            />
          </div>

          <Button
            size="icon"
            className="mb-0.5 shrink-0"
            onClick={handleAddRecord}
            aria-label="Enter Value"
          >
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <p className="text-xs text-destructive -mt-3">{error}</p>
        )}

        {/* Records Display */}
        <div className="pt-2">
          <div className="space-y-1">
            {records.map((record, index) => (
              <div key={index} className={`text-sm font-medium ${record.startsWith("GT-") ? "font-bold" : ""}`}>
                {record}
              </div>
            ))}
          </div>
        </div>

        {records.length > 0 && (
          <div className="flex gap-3 mt-4">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleSend}
            >
              Send
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={handleClear}
            >
              Clear
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
