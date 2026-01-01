import { useState, useRef } from "react";
import { ChevronDown, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

const initialOptions = ["60", "4D", "AB", "BC", "AC", "A", "B", "C"];

const initialOptionLengths: Record<string, number> = {
  "60": 3,
  "4D": 4,
  "AB": 2,
  "BC": 2,
  "AC": 2,
  "A": 1,
  "B": 1,
  "C": 1,
};

const Index = () => {
  const [options, setOptions] = useState(initialOptions);
  const [optionLengths, setOptionLengths] = useState(initialOptionLengths);

  const [selectedOption, setSelectedOption] = useState(options[0]);
  const [name, setName] = useState("");
  const [showRange, setShowRange] = useState(false);
  const [startRange, setStartRange] = useState("");
  const [endRange, setEndRange] = useState("");
  const [numericValue, setNumericValue] = useState("");
  const [stepValue, setStepValue] = useState("");
  const [records, setRecords] = useState<string[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  // Add Option Dialog State
  const [isAddOptionOpen, setIsAddOptionOpen] = useState(false);
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionLength, setNewOptionLength] = useState("");

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
    const maxLen = optionLengths[selectedOption];
    if (value.length <= maxLen) {
      setStartRange(value);
      validateRange(value, endRange);

      if (value.length === maxLen) {
        if (showRange) {
          document.getElementById("endRange")?.focus();
        } else {
          document.getElementById("numericValue")?.focus();
        }
      }
    }
  };

  const handleEndRange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "");
    const maxLen = optionLengths[selectedOption];
    if (value.length <= maxLen) {
      setEndRange(value);
      validateRange(startRange, value);

      if (value.length === maxLen) {
        document.getElementById("stepValue")?.focus();
      }
    }
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

    const requiredLength = optionLengths[selectedOption];
    if (startRange.length !== requiredLength) {
      setError(`Start number must be ${requiredLength} digits`);
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
      newRecords.push(`${selectedOption}:${paddedNumber}-${numericValue}`);
    }

    setRecords((prev) => {
      // 1. Remove any existing GT rows from previous records
      const cleanPrev = prev.filter(r => !r.startsWith("GT-"));
      // 2. Combine clean previous records with new data records
      const allDataRecords = [...cleanPrev, ...newRecords];

      // 3. Calculate total sum
      let totalSum = 0;
      for (const record of allDataRecords) {
        // Expected format: Option:Number-Count
        const parts = record.split("-");
        const val = parseInt(parts[parts.length - 1], 10) || 0;
        totalSum += val;
      }

      // 4. Append single cumulative GT
      return [...allDataRecords, `GT-${totalSum}`];
    });

    setNumericValue("");
    setStartRange("");
    if (showRange) {
      setEndRange("");
      setStepValue("");
    }

    // Simpler approach requested by thought process:
    setShowRange(false);
    setEndRange("");
    setStepValue("");
    // setStartRange(""); // Optional, but let's leave it to keep previous behavior for single mode?
    // If I leave startRange, and switch to single mode, it's fine.

    setError("");
    document.getElementById("startRange")?.focus();
  };


  const getPermutations = (str: string): string[] => {
    if (str.length <= 1) return [str];
    const results: string[] = [];
    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      const remainingChars = str.slice(0, i) + str.slice(i + 1);
      const remainingPermutations = getPermutations(remainingChars);
      for (const permutation of remainingPermutations) {
        results.push(char + permutation);
      }
    }
    return [...new Set(results)]; // Return unique permutations
  };

  const handleBox = () => {
    if (!startRange || !numericValue) {
      setError("Please enter No (Start) and Count");
      return;
    }

    const requiredLength = optionLengths[selectedOption];
    if (startRange.length !== requiredLength) {
      setError(`Start number must be ${requiredLength} digits`);
      return;
    }

    const perms = getPermutations(startRange);
    const newRecords: string[] = [];

    for (const p of perms) {
      newRecords.push(`${selectedOption}:${p}-${numericValue}`);
    }

    setRecords((prev) => {
      // 1. Remove any existing GT rows
      const cleanPrev = prev.filter((r) => !r.startsWith("GT-"));
      // 2. Combine
      const allDataRecords = [...cleanPrev, ...newRecords];

      // 3. Calculate total sum
      let totalSum = 0;
      for (const record of allDataRecords) {
        // Expected format: Option:Number-Count, splitting by "-" yields ["Option:Number", "Count"]
        const parts = record.split("-");
        const val = parseInt(parts[parts.length - 1], 10) || 0;
        totalSum += val;
      }

      // 4. Append GT
      return [...allDataRecords, `GT-${totalSum}`];
    });

    // Clear inputs similar to Add Record
    setNumericValue("");
    setStartRange("");
    if (showRange) {
      setShowRange(false);
      setEndRange("");
      setStepValue("");
    }
    setError("");
  };

  const handleAll = () => {
    if (!startRange || !numericValue) {
      setError("Please enter No (Start) and Count");
      return;
    }

    const inputLength = startRange.length;
    const matchingOptions = options.filter(opt => optionLengths[opt] === inputLength);

    if (matchingOptions.length === 0) {
      setError(`No options found for ${inputLength} digit number`);
      return;
    }

    const newRecords: string[] = [];
    for (const opt of matchingOptions) {
      newRecords.push(`${opt}:${startRange}-${numericValue}`);
    }

    setRecords((prev) => {
      // 1. Remove any existing GT rows
      const cleanPrev = prev.filter((r) => !r.startsWith("GT-"));
      // 2. Combine
      const allDataRecords = [...cleanPrev, ...newRecords];

      // 3. Calculate total
      let totalSum = 0;
      for (const record of allDataRecords) {
        const parts = record.split("-");
        const val = parseInt(parts[parts.length - 1], 10) || 0;
        totalSum += val;
      }

      // 4. Append GT
      return [...allDataRecords, `GT-${totalSum}`];
    });

    // Clear Inputs
    setNumericValue("");
    setStartRange("");
    setError("");
  };

  const handleTriples = () => {
    if (!numericValue) {
      setError("Please enter Count");
      return;
    }

    const newRecords: string[] = [];
    for (let i = 0; i <= 9; i++) {
      const triple = String(i).repeat(3); // "000", "111", etc.
      newRecords.push(`${selectedOption}:${triple}-${numericValue}`);
    }

    setRecords((prev) => {
      // 1. Remove any existing GT rows
      const cleanPrev = prev.filter((r) => !r.startsWith("GT-"));
      // 2. Combine
      const allDataRecords = [...cleanPrev, ...newRecords];

      // 3. Calculate total sum
      let totalSum = 0;
      for (const record of allDataRecords) {
        const parts = record.split("-");
        const val = parseInt(parts[parts.length - 1], 10) || 0;
        totalSum += val;
      }

      // 4. Append GT
      return [...allDataRecords, `GT-${totalSum}`];
    });

    setNumericValue("");
    setError("");
  };

  const handleAddOption = () => {
    if (!newOptionName.trim()) {
      return; // Or show internal dialog error
    }
    const len = parseInt(newOptionLength, 10);
    if (isNaN(len) || len < 1) {
      return;
    }

    const name = newOptionName.trim().toUpperCase(); // Normalize
    if (options.includes(name)) {
      // Already exists, just select it
      setSelectedOption(name);
      setIsAddOptionOpen(false);
      return;
    }

    setOptions([...options, name]);
    setOptionLengths({ ...optionLengths, [name]: len });
    setSelectedOption(name);

    // Reset and close
    setNewOptionName("");
    setNewOptionLength("");
    setIsAddOptionOpen(false);
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
    setNumericValue("");
    setStepValue("");
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
    // 1. Filter out selected records
    const remainingRecords = records.filter((_, index) => !selectedIndices.has(index));

    // 2. Filter out ANY GT rows (we will rebuild the single GT)
    const dataRecords = remainingRecords.filter(r => !r.startsWith("GT-"));

    // 3. If no data records left, just clear everything
    if (dataRecords.length === 0) {
      setRecords([]);
      setSelectedIndices(new Set());
      return;
    }

    // 4. Recalculate Total
    let totalSum = 0;
    for (const record of dataRecords) {
      const parts = record.split("-");
      const val = parseInt(parts[parts.length - 1], 10) || 0;
      totalSum += val;
    }

    // 5. Set new records with new GT
    setRecords([...dataRecords, `GT-${totalSum}`]);
    setSelectedIndices(new Set());
  };

  const handleSend = () => {
    const formattedRecords = records.map((record) => {
      if (record.startsWith("GT-")) {
        return record.replace("GT-", "GT - ");
      }
      const [left, count] = record.split("-");
      const [option, number] = left.split(":");
      return `${option} - ${number} = ${count}`;
    });
    const message = `${name}\n${formattedRecords.join("\n")}`;
    const encodedMessage = encodeURIComponent(message);
    window.open(`whatsapp://send?text=${encodedMessage}`, "_blank");
    handleClear();
  };

  const getDisplayRecords = () => {
    const indexedRecords = records.map((r, i) => ({ r, i }));
    const dataRecords = indexedRecords
      .filter((item) => !item.r.startsWith("GT-"))
      .reverse();
    const gtRecords = indexedRecords.filter((item) =>
      item.r.startsWith("GT-")
    );
    return [...dataRecords, ...gtRecords];
  };

  const displayRecords = getDisplayRecords();

  const handleDeleteOption = (optionToDelete: string) => {
    const newOptions = options.filter((opt) => opt !== optionToDelete);
    // Don't allow deleting the last option for safety, or handle empty state if you prefer
    if (newOptions.length === 0) {
      alert("Cannot delete the last option.");
      return;
    }

    // Remove from lengths map
    const newLengths = { ...optionLengths };
    delete newLengths[optionToDelete];

    setOptions(newOptions);
    setOptionLengths(newLengths);

    // If selected was deleted, switch to the first available
    if (selectedOption === optionToDelete) {
      setSelectedOption(newOptions[0]);
      // Reset inputs as potentially different length
      setStartRange("");
      setEndRange("");
    }
  };

  // Long press logic
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (option: string) => {
    longPressTimerRef.current = setTimeout(() => {
      // Long press detected
      if (window.confirm(`Delete option "${option}"?`)) {
        handleDeleteOption(option);
      }
    }, 800); // 800ms wait time
  };

  const handlePointerUpOrLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
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
                    className="dropdown-item select-none"
                    onClick={() => {
                      setSelectedOption(option);
                      setStartRange("");
                      setEndRange("");
                      setError("");
                    }}
                    onPointerDown={() => handlePointerDown(option)}
                    onPointerUp={handlePointerUpOrLeave}
                    onPointerLeave={handlePointerUpOrLeave}
                    // Prevent default context menu on long press
                    onContextMenu={(e) => e.preventDefault()}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="dropdown-item flex items-center gap-2 text-primary font-bold cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setIsAddOptionOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add New...
                </DropdownMenuItem>
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
          <div className="w-40 space-y-1">
            <label htmlFor="startRange" className="form-label">
              {showRange ? "Start" : "No"}
            </label>
            <input
              id="startRange"
              type="text"
              inputMode="numeric"
              value={startRange}
              onChange={handleStartRange}
              className="input-field px-2"
              aria-label="Start of range"
            />
          </div>

          {showRange && (
            <>
              <div className="w-40 space-y-1">
                <label htmlFor="endRange" className="form-label">
                  End
                </label>
                <input
                  id="endRange"
                  type="text"
                  inputMode="numeric"
                  value={endRange}
                  onChange={handleEndRange}
                  className="input-field px-2"
                  aria-label="End of range"
                />
              </div>

              <div className="w-40 space-y-1">
                <label htmlFor="stepValue" className="form-label">
                  &nbsp;
                </label>
                <input
                  id="stepValue"
                  type="text"
                  inputMode="numeric"
                  value={stepValue}
                  onChange={handleStepValue}
                  className="input-field px-2"
                  aria-label="Step Value"
                />
              </div>
            </>
          )}

          <div className="w-40 space-y-1">
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
              className="input-field px-2"
              aria-label="Numeric Value"
            />
          </div>

          <div className="flex flex-col gap-2 shrink-0 ml-auto">
            <div className="flex gap-2 items-start">
              {!showRange && (
                <Button
                  className="h-[88px] w-16 bg-pink-600 hover:bg-pink-700 font-bold whitespace-normal leading-tight px-1"
                  onClick={handleTriples}
                  aria-label="Add Triples"
                >
                  000
                  <br />-
                  <br />
                  999
                </Button>
              )}
              <div className="flex flex-col gap-2">
                <Button
                  className={`h-10 bg-indigo-600 hover:bg-indigo-700 font-bold w-16`}
                  onClick={handleAll}
                  aria-label="Add All"
                >
                  All
                </Button>
                <Button
                  variant={showRange ? "default" : "secondary"}
                  onClick={() => setShowRange(!showRange)}
                  className={`h-10 font-bold w-16 ${showRange ? "bg-purple-600 hover:bg-purple-700 text-[10px]" : "bg-blue-600 hover:bg-blue-700 text-xs text-white"}`}
                >
                  Pointer
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                className={`h-10 bg-emerald-600 hover:bg-emerald-700 w-16`}
                onClick={handleAddRecord}
                aria-label="Enter Value"
              >
                Ok
              </Button>
              {!showRange && (
                <Button
                  className={`h-10 bg-amber-600 hover:bg-amber-700 w-16`}
                  onClick={handleBox}
                  aria-label="Box Permutations"
                >
                  Box
                </Button>
              )}
            </div>
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
                  {displayRecords.map(({ r: record, i: index }) => {
                    const isGT = record.startsWith("GT-");
                    const parts = record.split("-");

                    if (isGT) {
                      const count = record.split("-")[1];
                      return (
                        <tr key={index} className="bg-muted/50 font-bold">
                          <td className="px-3 py-2">GT</td>
                          <td className="px-3 py-2 text-center">-</td>
                          <td className="px-3 py-2">{count}</td>
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

                    // Standard record: Option:Number-Count
                    // Example: "60:123-1" -> split("-") -> ["60:123", "1"]
                    const [leftPart, count] = record.split("-");
                    const [option, number] = leftPart.split(":");

                    return (
                      <tr key={index}>
                        <td className="px-3 py-2">{option}</td>
                        <td className="px-3 py-2">{number}</td>
                        <td className="px-3 py-2">{count}</td>
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

      {/* Add Option Dialog */}
      <Dialog open={isAddOptionOpen} onOpenChange={setIsAddOptionOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Option</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="optionName" className="text-right">
                RS
              </Label>
              <input
                id="optionName"
                value={newOptionName}
                onChange={(e) => setNewOptionName(e.target.value)}
                placeholder="e.g. XYZ"
                className="col-span-3 input-field"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="optionLength" className="text-right">
                Digit
              </Label>
              <input
                id="optionLength"
                type="number"
                value={newOptionLength}
                onChange={(e) => setNewOptionLength(e.target.value)}
                placeholder="e.g. 3"
                className="col-span-3 input-field"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleAddOption}>
              Add Option
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Index;
