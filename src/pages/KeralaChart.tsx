import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home, Table as TableIcon, Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, getYear, getMonth, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import html2canvas from "html2canvas";
import { toast } from "sonner";

const MONTHS_FIRST_HALF = [0, 1, 2, 3, 4, 5]; // Jan - Jun
const MONTHS_SECOND_HALF = [6, 7, 8, 9, 10, 11]; // Jul - Dec

interface KeralaResult {
  date: string;
  result: string;
}

type ChartType = "6D" | "4D" | "3D";

const KeralaChart = () => {
  const [data, setData] = useState<KeralaResult[]>([]);
  const [year, setYear] = useState(new Date().getFullYear());
  const [isSecondHalf, setIsSecondHalf] = useState(new Date().getMonth() > 5);
  const [chartType, setChartType] = useState<ChartType>("6D");
  const [isLoading, setIsLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentMonths = isSecondHalf ? MONTHS_SECOND_HALF : MONTHS_FIRST_HALF;

  useEffect(() => {
    fetchData();
  }, [year, isSecondHalf]);

  const fetchData = async () => {
    setIsLoading(true);
    const startDate = format(new Date(year, currentMonths[0], 1), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, currentMonths[5], 1)), 'yyyy-MM-dd');

    const { data: results, error } = await supabase
      .from('kerala_results')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (error) {
      console.error("Error fetching Kerala results:", error);
    } else {
      setData(results || []);
    }
    setIsLoading(false);
  };

  const sliceResult = (res: string, type: ChartType) => {
    if (!res) return "";
    switch (type) {
      case "4D": return res.slice(-4);
      case "3D": return res.slice(-3);
      default: return res;
    }
  };

  const getResult = (day: number, monthIndex: number) => {
    const cellDate = new Date(year, monthIndex, day);
    if (cellDate.getMonth() !== monthIndex) return "******";
    
    const dateStr = format(cellDate, 'yyyy-MM-dd');
    const entry = data.find(d => d.date === dateStr);
    
    if (entry) return sliceResult(entry.result, chartType);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    
    // Future and Today: remain empty until result is entered
    if (cellDate >= today) return ""; 
    
    const placeholder = chartType === "6D" ? "******" :
                       chartType === "4D" ? "****" : "***";
    return placeholder;
  };

  const handleShareImage = async () => {
    if (!captureRef.current) return;
    
    setSharing(true);
    toast.info("Generating Image...");

    try {
      // Temporarily remove scrollbars and max-height for capture
      const container = captureRef.current;
      const tableContainer = container.querySelector('#kerala-table-container') as HTMLElement;
      
      const originalContainerStyle = container.getAttribute('style');
      const originalTableStyle = tableContainer?.getAttribute('style');
      
      // Disable sticky positioning for clean capture
      const stickyElements = container.querySelectorAll('.sticky');
      const originalStickyStyles: string[] = [];
      stickyElements.forEach((el, i) => {
        originalStickyStyles[i] = (el as HTMLElement).getAttribute('style') || '';
        (el as HTMLElement).style.position = 'static';
        (el as HTMLElement).style.zIndex = 'auto';
      });

      container.style.width = '1400px';
      container.style.height = 'auto';
      container.style.maxHeight = 'none';
      if (tableContainer) {
        tableContainer.style.maxHeight = 'none';
        tableContainer.style.overflow = 'visible';
      }

      const canvas = await html2canvas(container, {
        scale: 3, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1400,
        windowHeight: container.scrollHeight
      });

      // Restore original styles
      if (originalContainerStyle) {
        container.setAttribute('style', originalContainerStyle);
      } else {
        container.removeAttribute('style');
      }

      if (tableContainer) {
        if (originalTableStyle) {
          tableContainer.setAttribute('style', originalTableStyle);
        } else {
          tableContainer.removeAttribute('style');
        }
      }

      stickyElements.forEach((el, i) => {
        if (originalStickyStyles[i]) {
          (el as HTMLElement).setAttribute('style', originalStickyStyles[i]);
        } else {
          (el as HTMLElement).removeAttribute('style');
        }
      });

      const imageUrl = canvas.toDataURL("image/png");
      const blob = await (await fetch(imageUrl)).blob();
      const fileName = `Kerala_Chart_${chartType}_${year}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Kerala ${chartType} Chart ${year}`,
          text: `Kerala ${chartType} Chart results for ${year}`,
        });
        toast.success("Shared successfully!");
      } else {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = fileName;
        link.click();
        toast.success("Image downloaded!");
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast.error("Failed to generate image.");
    } finally {
      setSharing(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const chartOptions: { label: string, value: ChartType }[] = [
    { label: "6Digit Chart", value: "6D" },
    { label: "4Digit Chart", value: "4D" },
    { label: "3Digit Chart", value: "3D" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-2 sm:p-8">
      <div className="mx-auto max-w-[1400px] space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-6 bg-white p-3 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={() => navigate("/")}
                className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
              >
                <Home className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 leading-none truncate uppercase">
                  Kerala {chartType} Chart
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 mt-1 font-medium italic">Daily Results for {year}</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <div className="flex items-center justify-center gap-1 bg-slate-100 p-1 rounded-lg border w-full sm:w-auto">
                <Button 
                  variant={!isSecondHalf ? "default" : "ghost"}
                  onClick={() => setIsSecondHalf(false)}
                  className="flex-1 sm:flex-none px-3 py-1 h-7 sm:h-8 text-[10px] sm:text-sm font-bold uppercase transition-all"
                >
                  Jan-Jun
                </Button>
                <Button 
                  variant={isSecondHalf ? "default" : "ghost"}
                  onClick={() => setIsSecondHalf(true)}
                  className="flex-1 sm:flex-none px-3 py-1 h-7 sm:h-8 text-[10px] sm:text-sm font-bold uppercase transition-all"
                >
                  Jul-Dec
                </Button>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex items-center justify-center gap-2 bg-slate-50 p-1 rounded-lg border flex-1 sm:flex-none">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setYear(prev => prev - 1)}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                  >
                    {year - 1}
                  </Button>
                  <span className="font-bold text-sm sm:text-lg px-2 text-orange-600">{year}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setYear(prev => prev + 1)}
                    className="h-7 sm:h-8 px-2 sm:px-3 text-xs"
                  >
                    {year + 1}
                  </Button>
                </div>

                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleShareImage}
                  disabled={sharing}
                  className="h-9 sm:h-10 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-95 flex-none px-4 rounded-lg"
                >
                  {sharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Share Image</span>
                      <span className="sm:hidden">Share</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-center border-t pt-4">
            {chartOptions.map((opt) => (
              <Button
                key={opt.value}
                variant={chartType === opt.value ? "default" : "outline"}
                size="sm"
                onClick={() => setChartType(opt.value)}
                className={`whitespace-nowrap h-8 text-[10px] sm:text-xs font-bold ${chartType === opt.value ? 'bg-orange-600 hover:bg-orange-700 shadow-md transform scale-105' : 'hover:bg-orange-50 hover:text-orange-600'}`}
              >
                <TableIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                {opt.label}
              </Button>
            ))}
          </div>
        </div>

        <div ref={captureRef} className="bg-white p-2">
          {/* Chart Header - Matching Kerala Red Style */}
          <div className="bg-[#991b1b] text-white py-2 px-6 mb-1 flex justify-between items-center font-black text-sm sm:text-xl tracking-[0.2em] uppercase">
            <span>KERALA</span>
            <span>COMBINATION</span>
            <span>CHART</span>
            <span>{chartType === "6D" ? "6DIGIT" : chartType}</span>
          </div>

          <div id="kerala-table-container" className="overflow-x-auto border-[1.5px] border-black bg-white overflow-y-auto max-h-[75vh] relative custom-scrollbar" ref={tableRef}>
            <table className="min-w-max w-full border-collapse text-xs sm:text-sm">
              <thead className="bg-[#991b1b] text-white sticky top-0 z-30 font-black">
                <tr>
                  <th className="border-[1px] border-black py-2 sticky left-0 bg-[#fecaca] text-black z-40 min-w-[25px] sm:min-w-[40px] align-middle font-black leading-none" rowSpan={2}>D</th>
                  {currentMonths.map(monthIdx => (
                    <th 
                      key={monthIdx} 
                      className="border-[1px] border-black py-2 uppercase bg-[#fecaca] text-black align-middle font-black leading-none"
                    >
                      {format(new Date(year, monthIdx, 1), 'MMMM')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {days.map(day => (
                  <tr key={day} className="group">
                    <td className="border-[1px] border-black py-1 sm:py-2 text-center align-middle font-black bg-[#fecaca] text-black sticky left-0 z-20 leading-none">
                      {day}
                    </td>
                    {currentMonths.map((monthIdx, i) => {
                      const isEven = i % 2 === 0;
                      const cellBgColor = isEven ? '#ffffff' : '#fee2e2';
                      const result = getResult(day, monthIdx);
                      const date = new Date(year, monthIdx, day);
                      const isValidDay = date.getFullYear() === year && date.getMonth() === monthIdx && date.getDate() === day;
                      
                      return (
                        <td 
                          key={`${monthIdx}-${day}`}
                          className="border-[1px] border-black py-2.5 text-center align-middle font-black min-w-[80px] sm:min-w-[120px] text-black leading-none uppercase"
                          style={{ backgroundColor: cellBgColor }}
                        >
                          {isValidDay ? result : "-"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Chart Footer - Matching Kerala Style */}
          <div className="bg-[#991b1b] text-white py-2 px-6 mt-1 flex justify-between items-center font-black text-[10px] sm:text-xs tracking-wide">
            <span>KERALA {chartType === "6D" ? "6DIGIT" : chartType}</span>
            <span>Telegram: guessinggrp</span>
          </div>
        </div>

      </div>
    </main>
  );
};

export default KeralaChart;
