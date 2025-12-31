import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const options = ["Option 1", "Option 2", "Option 3", "Option 4"];

const Index = () => {
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [name, setName] = useState("");
  const [startRange, setStartRange] = useState("");
  const [endRange, setEndRange] = useState("");
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

        {/* Row 2: Start Range - End Range */}
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1">
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

          <div className="flex-1 space-y-1">
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
        </div>

        {error && (
          <p className="text-xs text-destructive -mt-3">{error}</p>
        )}
      </div>
    </main>
  );
};

export default Index;
