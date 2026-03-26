import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Admin = () => {
  // Dear Chart State
  const [dearDate, setDearDate] = useState<Date | undefined>(new Date());
  const [dearTime, setDearTime] = useState("1PM");
  const [dearResult, setDearResult] = useState("");
  const [isSubmittingDear, setIsSubmittingDear] = useState(false);

  // Kerala Chart State
  const [keralaDate, setKeralaDate] = useState<Date | undefined>(new Date());
  const [keralaResult, setKeralaResult] = useState("");
  const [isSubmittingKerala, setIsSubmittingKerala] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    // Legacy results fetching removed
  }, []);



  const handleSaveDearResult = async () => {
    if (!dearDate || !dearResult) {
      toast({
        title: "Error",
        description: "Please select a date and enter a result.",
        variant: "destructive",
      });
      return;
    }

    if (dearResult.length !== 5) {
      toast({
        title: "Error",
        description: "Result must be exactly 5 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingDear(true);
    try {
      const { error } = await supabase
        .from('dear_results')
        .upsert([
          { 
            date: format(dearDate, 'yyyy-MM-dd'), 
            time_slot: dearTime, 
            result: dearResult 
          }
        ], { onConflict: 'date,time_slot' });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Dear result for ${dearTime} saved!`,
      });
      setDearResult("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save result to Supabase.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingDear(false);
    }
  };

  const handleSaveKeralaResult = async () => {
    if (!keralaDate || !keralaResult) {
      toast({
        title: "Error",
        description: "Please select a date and enter a result.",
        variant: "destructive",
      });
      return;
    }

    if (keralaResult.length !== 6) {
      toast({
        title: "Error",
        description: "Kerala result must be exactly 6 digits.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingKerala(true);
    try {
      const { error } = await supabase
        .from('kerala_results')
        .upsert([
          { 
            date: format(keralaDate, 'yyyy-MM-dd'), 
            result: keralaResult 
          }
        ], { onConflict: 'date' });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Kerala result for ${format(keralaDate, 'PPP')} saved!`,
      });
      setKeralaResult("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save Kerala result.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingKerala(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground">Admin Panel</h1>
        </div>



        {/* Dear Chart Update Section */}
        <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm">
          <h2 className="text-xl font-bold text-foreground">Update Dear Chart</h2>
          
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dearDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dearDate ? format(dearDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dearDate}
                    onSelect={setDearDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Select Time</label>
              <Select value={dearTime} onValueChange={setDearTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1PM">1PM</SelectItem>
                  <SelectItem value="6PM">6PM</SelectItem>
                  <SelectItem value="8PM">8PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Result (5 Digits)</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter 5-digit result"
                value={dearResult}
                onChange={(e) => setDearResult(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-lg text-center tracking-widest font-mono"
              />
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700 font-bold h-12"
              onClick={handleSaveDearResult}
              disabled={isSubmittingDear}
            >
              {isSubmittingDear ? "Saving..." : "Save to Dear Chart"}
            </Button>
          </div>
        </div>

        {/* Kerala Chart Update Section */}
        <div className="space-y-6 rounded-lg border bg-card p-6 shadow-sm border-orange-200">
          <h2 className="text-xl font-bold text-foreground">Update Kerala Chart</h2>
          
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !keralaDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {keralaDate ? format(keralaDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={keralaDate}
                    onSelect={setKeralaDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Result (6 Digits)</label>
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="Enter 6-digit result"
                value={keralaResult}
                onChange={(e) => setKeralaResult(e.target.value.replace(/\D/g, ""))}
                className="h-12 text-lg text-center tracking-widest font-mono"
              />
            </div>

            <Button 
              className="w-full bg-orange-600 hover:bg-orange-700 font-bold h-12"
              onClick={handleSaveKeralaResult}
              disabled={isSubmittingKerala}
            >
              {isSubmittingKerala ? "Saving..." : "Save to Kerala Chart"}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Admin;
