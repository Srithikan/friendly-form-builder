import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Download, Table as TableIcon, Filter, Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getYear, getMonth, isSameDay } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const MONTHS_FIRST_HALf = [0, 1, 2, 3, 4, 5]; // Jan - Jun
const MONTHS_SECOND_HALF = [6, 7, 8, 9, 10, 11]; // Jul - Dec

interface ResultData {
  date: string;
  time_slot: string;
  result: string;
}

type ChartType = "5D" | "4D" | "3D";
type TimeFilter = "All" | "1PM" | "6PM" | "8PM";

const DearChart = () => {
  const [year, setYear] = useState(getYear(new Date()));
  const [isSecondHalf, setIsSecondHalf] = useState(getMonth(new Date()) > 5);
  const [chartType, setChartType] = useState<ChartType>("5D");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("All");
  const [data, setData] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const currentMonths = isSecondHalf ? MONTHS_SECOND_HALF : MONTHS_FIRST_HALf;

  useEffect(() => {
    fetchData();
  }, [year, isSecondHalf]);

  const fetchData = async () => {
    setLoading(true);
    const startDate = format(new Date(year, currentMonths[0], 1), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(year, currentMonths[5], 1)), 'yyyy-MM-dd');

    try {
      const { data: dbData, error } = await supabase
        .from('dear_results')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      if (dbData) {
        setData(dbData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const sliceResult = (res: string, type: ChartType) => {
    if (!res) return "";
    switch (type) {
      case "4D": return res.slice(-4);
      case "3D": return res.slice(-3);
      default: return res;
    }
  };

  const getResult = (day: number, monthIndex: number, timeSlot: string) => {
    const cellDate = new Date(year, monthIndex, day);
    const dateStr = format(cellDate, 'yyyy-MM-dd');
    const entry = data.find(d => d.date === dateStr && d.time_slot === timeSlot);
    
    if (entry) return sliceResult(entry.result, chartType);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    
    // Future and Today: remain empty until result is entered
    if (cellDate >= today) return ""; 
    
    const placeholder = chartType === "5D" ? "XXXXX" : 
                       chartType === "4D" ? "XXXX" : "XXX";
    return placeholder;
  };

  const handleShare = async () => {
    setSharing(true);
    toast.info("Generating PDF...");

    try {
      const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.width;
      const pageHeight = pdf.internal.pageSize.height;

      const chartLabel = chartType === "5D" ? "COMBINATION 5DIGIT" : chartType === "4D" ? "4DIGIT" : "3DIGIT";
      const timeLabel = timeFilter === "All" ? "Full Chart" : timeFilter;

      // Header configuration
      const timeSlots: ("1PM" | "6PM" | "8PM")[] = [];
      if (timeFilter === "All" || timeFilter === "1PM") timeSlots.push("1PM");
      if (timeFilter === "All" || timeFilter === "6PM") timeSlots.push("6PM");
      if (timeFilter === "All" || timeFilter === "8PM") timeSlots.push("8PM");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const monthsToDisplay = currentMonths.filter(m => new Date(year, m, 1) <= today);

      if (monthsToDisplay.length === 0) {
        toast.error("No past or current months to display in this half.");
        setSharing(false);
        return;
      }

      const monthNames = monthsToDisplay.map(m => format(new Date(year, m, 1), 'MMMM').toUpperCase());

      // Build double header
      const headRow1: any[] = [
        { content: "D", styles: { fillColor: [253, 240, 1], textColor: [0, 0, 0] } }
      ];
      const headRow2: any[] = [
        { content: "", styles: { fillColor: [30, 64, 175] } }
      ];

      monthsToDisplay.forEach((_, i) => {
        headRow1.push({
          content: monthNames[i],
          colSpan: timeSlots.length,
          styles: { halign: "center", fillColor: [253, 240, 1], textColor: [0, 0, 0], fontStyle: "bold" }
        });
        timeSlots.forEach(slot => {
          headRow2.push({
            content: slot,
            styles: { halign: "center", fillColor: [30, 64, 175], textColor: [255, 255, 255], fontStyle: "bold" }
          });
        });
      });

      // Build body rows
      const placeholder = chartType === "5D" ? "XXXXX" : chartType === "4D" ? "XXXX" : "XXX";
      const bodyRows = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const row: any[] = [
          { content: String(day), styles: { fillColor: [253, 240, 1], textColor: [0, 0, 0], fontStyle: "bold" } }
        ];
        monthsToDisplay.forEach(monthIdx => {
          const cellDate = new Date(year, monthIdx, day);
          const isValidDay = cellDate.getMonth() === monthIdx && cellDate.getDate() === day;
          timeSlots.forEach(slot => {
            if (!isValidDay) {
              row.push("-");
            } else {
              const dateStr = format(cellDate, 'yyyy-MM-dd');
              const entry = data.find(d => d.date === dateStr && d.time_slot === slot);
              if (entry) {
                row.push(sliceResult(entry.result, chartType));
              } else {
                const cd = new Date(cellDate);
                cd.setHours(0,0,0,0);
                row.push(cd >= today ? "" : placeholder);
              }
            }
          });
        });
        return row;
      }).filter(row => row.slice(1).some(cell => {
        const val = typeof cell === 'object' ? cell.content : cell;
        return val !== "" && val !== "-";
      }));

      // Top Banner
      pdf.setFillColor(30, 64, 175);
      pdf.rect(10, 10, pageWidth - 20, 25, "F");
      pdf.setFontSize(13);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.text(`DEAR             COMBINATION             CHART             ${chartType === "5D" ? "5DIGIT" : chartType}`, pageWidth / 2, 27, { align: "center" });

      const dynamicFontSize = monthsToDisplay.length <= 3 ? 10 : 8;
      const dynamicPadding = monthsToDisplay.length <= 3 
        ? { top: 2, right: 3, bottom: 2, left: 3 } 
        : { top: 1, right: 2, bottom: 1, left: 2 };

      autoTable(pdf, {
        startY: 40,
        head: [headRow1, headRow2],
        body: bodyRows,
        theme: "grid",
        styles: { 
          fontSize: dynamicFontSize, 
          cellPadding: dynamicPadding, 
          halign: "center", 
          overflow: "hidden", 
          fontStyle: "bold",
          lineWidth: 0.5,
          lineColor: [200, 200, 200]
        },
        columnStyles: { 
          0: { fontStyle: "bold", cellWidth: 25 } 
        },
        margin: { top: 40, left: 10, right: 10, bottom: 40 },
        tableWidth: 'auto',
      });

      // Footer
      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      const footerY = Math.max(finalY, pageHeight - 35);
      
      pdf.setFillColor(30, 64, 175);
      pdf.rect(10, footerY, pageWidth - 20, 25, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${chartLabel}`, 30, footerY + 17);
      pdf.text(`Telegram: guessinggrp`, pageWidth - 30, footerY + 17, { align: "right" });

      const pdfBlob = pdf.output("blob");
      const fileName = `Dear_${chartLabel}_${year}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Dear ${chartLabel} Chart ${year}`,
          text: `Dear ${chartLabel} Chart results for ${year}`,
        });
        toast.success("Shared successfully!");
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        link.click();
        toast.success("PDF downloaded!");
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF.");
    } finally {
      setSharing(false);
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const chartOptions: { label: string, value: ChartType }[] = [
    { label: "5Digit Chart", value: "5D" },
    { label: "4Digit Chart", value: "4D" },
    { label: "3Digit Chart", value: "3D" },
  ];

  const timeOptions: { label: string, value: TimeFilter }[] = [
    { label: "Full Chart", value: "All" },
    { label: "1PM Only", value: "1PM" },
    { label: "6PM Only", value: "6PM" },
    { label: "8PM Only", value: "8PM" },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-2 sm:p-8">
      <div className="mx-auto max-w-[1200px] space-y-4 sm:space-y-6">
        <div className="flex flex-col gap-4 sm:gap-6 bg-white p-3 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
            <div className="flex items-center gap-3 sm:gap-4 w-full md:w-auto">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="h-8 w-8 sm:h-10 sm:w-10">
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-900 uppercase truncate">
                  DEAR {chartType === "5D" ? "COMBINATION" : chartType}
                </h1>
                <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Daily Results for {year}</p>
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
                    className="h-7 sm:h-8 px-2 text-xs font-bold"
                  >
                    {year - 1}
                  </Button>
                  <span className="font-bold text-sm sm:text-base px-2 text-indigo-600">{year}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setYear(prev => prev + 1)}
                    className="h-7 sm:h-8 px-2 text-xs font-bold"
                  >
                    {year + 1}
                  </Button>
                </div>
                
                <Button 
                  variant="default"
                  size="sm"
                  onClick={handleShare}
                  disabled={sharing}
                  className="h-9 sm:h-10 bg-green-600 hover:bg-green-700 text-white shadow-md transition-all active:scale-95 flex-none px-4 rounded-lg"
                >
                  {sharing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Share2 className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">Share PDF</span>
                      <span className="sm:hidden">Share</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-center">
              {chartOptions.map((opt) => (
                <Button
                  key={opt.value}
                  variant={chartType === opt.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setChartType(opt.value)}
                  className={`whitespace-nowrap h-8 text-[10px] sm:text-xs font-bold ${chartType === opt.value ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md transform scale-105' : 'hover:bg-indigo-50 hover:text-indigo-600'}`}
                >
                  <TableIcon className="mr-1 h-3 w-3 sm:h-4 sm:w-4" />
                  {opt.label}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar justify-start sm:justify-center">
              <span className="hidden sm:inline text-[10px] font-bold text-slate-400 uppercase mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filter:
              </span>
              <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-full border border-slate-200">
                {timeOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant={timeFilter === opt.value ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setTimeFilter(opt.value)}
                    className={`whitespace-nowrap h-7 px-4 text-[10px] sm:text-xs font-bold rounded-full transition-all ${timeFilter === opt.value ? 'bg-white shadow-sm text-indigo-700 border-slate-200' : 'text-slate-500 hover:text-indigo-600'}`}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div id="dear-table-container" className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xl overflow-y-auto max-h-[75vh] relative custom-scrollbar" ref={tableRef}>
          <table className="min-w-max w-full border-collapse text-[8px] sm:text-xs">
            <thead className="bg-[#1e40af] text-white sticky top-0 z-30 shadow-sm font-bold">
              <tr>
                <th className="border border-white/20 p-1.5 sm:p-2 sticky left-0 bg-[#1e40af] z-40 min-w-[25px] sm:min-w-[40px]" rowSpan={2}>D</th>
                {currentMonths.map(monthIdx => (
                  <th 
                    key={monthIdx} 
                    className="border border-white/20 p-1 sm:p-2 uppercase" 
                    colSpan={timeFilter === "All" ? 3 : 1}
                  >
                    {format(new Date(year, monthIdx, 1), 'MMM')}
                  </th>
                ))}
              </tr>
              <tr className="bg-[#1d4ed8]">
                {currentMonths.map(monthIdx => (
                  <React.Fragment key={monthIdx}>
                    {(timeFilter === "All" || timeFilter === "1PM") && (
                      <th className="border border-white/20 p-1 min-w-[35px] sm:min-w-[55px]">1P</th>
                    )}
                    {(timeFilter === "All" || timeFilter === "6PM") && (
                      <th className="border border-white/20 p-1 min-w-[35px] sm:min-w-[55px]">6P</th>
                    )}
                    {(timeFilter === "All" || timeFilter === "8PM") && (
                      <th className="border border-white/20 p-1 min-w-[35px] sm:min-w-[55px]">8P</th>
                    )}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="border border-slate-200 p-1 text-center font-black bg-slate-50 sticky left-0 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.1)] group-hover:bg-indigo-50 transition-colors">
                    {day}
                  </td>
                  {currentMonths.map(monthIdx => {
                    // Optimized check for valid day of month
                    const date = new Date(year, monthIdx, day);
                    const isValidDay = date.getFullYear() === year && date.getMonth() === monthIdx && date.getDate() === day;
                    
                    return (
                      <React.Fragment key={`${monthIdx}-${day}`}>
                        {(timeFilter === "All" || timeFilter === "1PM") && (
                          <td className={`border border-slate-200 p-0.5 sm:p-1 text-center font-mono min-w-[35px] sm:min-w-[55px] ${!isValidDay ? 'bg-slate-100/50' : ''}`}>
                            <span className="scale-95 sm:scale-100 inline-block font-bold">
                              {isValidDay ? getResult(day, monthIdx, "1PM") : "-"}
                            </span>
                          </td>
                        )}
                        {(timeFilter === "All" || timeFilter === "6PM") && (
                          <td className={`border border-slate-200 p-0.5 sm:p-1 text-center font-mono min-w-[35px] sm:min-w-[55px] ${!isValidDay ? 'bg-slate-100/50' : ''}`}>
                            <span className="scale-95 sm:scale-100 inline-block font-bold">
                              {isValidDay ? getResult(day, monthIdx, "6PM") : "-"}
                            </span>
                          </td>
                        )}
                        {(timeFilter === "All" || timeFilter === "8PM") && (
                          <td className={`border border-slate-200 p-0.5 sm:p-1 text-center font-mono min-w-[35px] sm:min-w-[55px] ${!isValidDay ? 'bg-slate-100/50' : ''}`}>
                            <span className="scale-95 sm:scale-100 inline-block font-bold">
                              {isValidDay ? getResult(day, monthIdx, "8PM") : "-"}
                            </span>
                          </td>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
};

export default DearChart;
