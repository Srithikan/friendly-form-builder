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
  const [firstNumber, setFirstNumber] = useState("");
  const [secondNumber, setSecondNumber] = useState("");
  const [errors, setErrors] = useState({ first: "", second: "" });

  const validateRange = (value: string, field: "first" | "second") => {
    if (value === "") {
      setErrors((prev) => ({ ...prev, [field]: "" }));
      return;
    }
    
    const rangePattern = /^\d+-\d+$/;
    if (!rangePattern.test(value)) {
      setErrors((prev) => ({ ...prev, [field]: "Use format: min-max (e.g., 1-99)" }));
      return;
    }
    
    const [min, max] = value.split("-").map(Number);
    if (min >= max) {
      setErrors((prev) => ({ ...prev, [field]: "Min must be less than max" }));
    } else {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleFirstRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9-]/g, "");
    setFirstNumber(value);
    validateRange(value, "first");
  };

  const handleSecondRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9-]/g, "");
    setSecondNumber(value);
    validateRange(value, "second");
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

        {/* Row 2: Two Numeric Inputs */}
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <label htmlFor="range1" className="form-label">
              Range 1
            </label>
            <input
              id="range1"
              type="text"
              inputMode="numeric"
              value={firstNumber}
              onChange={handleFirstRange}
              placeholder="1-99"
              className={`input-field ${errors.first ? "ring-2 ring-destructive ring-offset-2" : ""}`}
              aria-describedby={errors.first ? "error1" : undefined}
            />
            {errors.first && (
              <p id="error1" className="text-xs text-destructive mt-1">
                {errors.first}
              </p>
            )}
          </div>

          <div className="flex-1 space-y-1">
            <label htmlFor="range2" className="form-label">
              Range 2
            </label>
            <input
              id="range2"
              type="text"
              inputMode="numeric"
              value={secondNumber}
              onChange={handleSecondRange}
              placeholder="2-1000"
              className={`input-field ${errors.second ? "ring-2 ring-destructive ring-offset-2" : ""}`}
              aria-describedby={errors.second ? "error2" : undefined}
            />
            {errors.second && (
              <p id="error2" className="text-xs text-destructive mt-1">
                {errors.second}
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Index;
