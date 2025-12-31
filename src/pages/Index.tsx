import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const options = ["60:", "4D:", "AB:", "BC:", "AC:", "A:", "B:", "C:"];

const Index = () => {
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [name, setName] = useState("");
  const [showRange, setShowRange] = useState(false);
  const [startRange, setStartRange] = useState("");
  const [endRange, setEndRange] = useState("");
  const [numericValue, setNumericValue] = useState("1");
  const [stepValue, setStepValue] = useState("1");
  const [records, setRecords] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
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

  const handleStepValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    setStepValue(value);
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
    const padLength = startRange.length;

    // Determine the padding length from 'startRange'.
    // If start is '021' (length 3), we want '021', '022', '023'.

    const step = parseInt(stepValue, 10) || 1;

    for (let i = start; i <= end; i += step) {
      const paddedNumber = String(i).padStart(padLength, "0");
      newRecords.push(`${selectedOption}-${paddedNumber}-${numericValue}`);
    }
    const count = Math.floor((end - start) / step) + 1;
    const value = parseInt(numericValue, 10) || 0;
    const totalValue = count * value;
    newRecords.push(`GT-${totalValue}`);

    setRecords((prev) => [...prev, ...newRecords]);
    setNumericValue("1");
    if (showRange) {
      setShowRange(false);
      setEndRange("");
      setStepValue("1");
      setStartRange("");
    }
    // Note: I am also clearing startRange if it was a range input, 
    // to ensure a clean slate for the next 'No' (single) input. 
    // If user was in single mode (showRange false), startRange is NOT cleared by this specific block, 
    // preserving typical behaviors unless I decide to clear it always.
    // However, to be consistent with 'closing', I'll clear fields used in that mode.
    // Actually, let's just clear startRange always if that's desired? 
    // Previous code didn't clear startRange. 
    // If I switch from Range -> Single, I probably want to clear Start too.
    // If I am in Single, I stay in Single.
    // Let's refine the logic to match "close the count".

    // Simpler approach requested by thought process:
    setShowRange(false);
    setEndRange("");
    setStepValue("");
    // setStartRange(""); // Optional, but let's leave it to keep previous behavior for single mode?
    // If I leave startRange, and switch to single mode, it's fine.

    setError("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAddRecord();
    }
  };

  const handleClear = () => {
    setRecords([]);
    setSelectedIndices(new Set());
    setStartRange("");
    setEndRange("");
    setNumericValue("1");
    setStepValue("1");
    setError("");
  };

  const toggleSelection = (index: number) => {
    const newSelected = new Set(selectedIndices);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedIndices(newSelected);
  };

  const deleteSelected = () => {
    const filteredRecords = records.filter((_, index) => !selectedIndices.has(index));

    const updatedRecords: string[] = [];
    let currentBatchSum = 0;

    for (const record of filteredRecords) {
      if (record.startsWith("GT-")) {
        updatedRecords.push(`GT-${currentBatchSum}`);
        currentBatchSum = 0;
      } else {
        const parts = record.split("-");
        const val = parseInt(parts[2], 10) || 0;
        currentBatchSum += val;
        updatedRecords.push(record);
      }
    }

    setRecords(updatedRecords);
    setSelectedIndices(new Set());
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
              {showRange ? "Start" : "No"}
            </label>
            <input
              id="startRange"
              type="text"
              inputMode="numeric"
              value={startRange}
              onChange={handleStartRange}
              className="input-field"
              aria-label="Start of range"
            />
          </div>

          {showRange && (
            <>
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
                  className="input-field"
                  aria-label="End of range"
                />
              </div>

              <div className="w-24 space-y-1">
                <label htmlFor="stepValue" className="form-label">
                  &nbsp;
                </label>
                <input
                  id="stepValue"
                  type="text"
                  inputMode="numeric"
                  value={stepValue}
                  onChange={handleStepValue}
                  className="input-field"
                  aria-label="Step Value"
                />
              </div>
            </>
          )}

          <div className="w-24 space-y-1">
            <label htmlFor="numericValue" className="form-label">
              Count
            </label>
            <input
              id="numericValue"
              type="text"
              inputMode="numeric"
              value={numericValue}
              onChange={handleNumericValue}
              onKeyDown={handleKeyDown}
              className="input-field"
              aria-label="Numeric Value"
            />
          </div>

          <div className="flex flex-col gap-2 shrink-0 ml-auto">
            <Button
              variant={showRange ? "default" : "secondary"}
              onClick={() => setShowRange(!showRange)}
              className={`h-10 w-24 font-bold ${showRange ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
            >
              Pointer
            </Button>
            <Button
              className="h-10 w-24 bg-blue-600 hover:bg-blue-700"
              onClick={handleAddRecord}
              aria-label="Enter Value"
            >
              Ok
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-destructive -mt-3">{error}</p>
        )}

        {/* Records Display */}
        <div className="pt-2">
          {records.length > 0 && (
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground font-medium">
                  <tr>
                    <th className="px-3 py-2">Option</th>
                    <th className="px-3 py-2">Number</th>
                    <th className="px-3 py-2">Count</th>
                    <th className="px-3 py-2 w-10">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((record, index) => {
                    const isGT = record.startsWith("GT-");
                    const parts = record.split("-");

                    if (isGT) {
                      return (
                        <tr key={index} className="bg-muted/50 font-bold">
                          <td className="px-3 py-2">GT</td>
                          <td className="px-3 py-2 text-center">-</td>
                          <td className="px-3 py-2">{parts[1]}</td>
                          <td className="px-3 py-2 text-center">
                            <input
                              type="checkbox"
                              checked={selectedIndices.has(index)}
                              onChange={() => toggleSelection(index)}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                          </td>
                        </tr>
                      );
                    }

                    // Standard record: Option-Number-Count
                    return (
                      <tr key={index}>
                        <td className="px-3 py-2">{parts[0]}</td>
                        <td className="px-3 py-2">{parts[1]}</td>
                        <td className="px-3 py-2">{parts[2]}</td>
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIndices.has(index)}
                            onChange={() => toggleSelection(index)}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
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

        {selectedIndices.size > 0 && (
          <div className="mt-2">
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={deleteSelected}
            >
              Delete Selected ({selectedIndices.size})
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
