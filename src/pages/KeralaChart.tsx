import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home, Table as TableIcon, Share2, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, getYear, getMonth, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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
    // Ensure the date is valid for the month (e.g., handles Feb 30)
    if (cellDate.getMonth() !== monthIndex) return "XXXXXX";
    
    const dateStr = format(cellDate, 'yyyy-MM-dd');
    const entry = data.find(d => d.date === dateStr);
    
    if (entry) return sliceResult(entry.result, chartType);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    cellDate.setHours(0, 0, 0, 0);
    
    // Future and Today: remain empty until result is entered
    if (cellDate >= today) return ""; 
    
    const placeholder = chartType === "6D" ? "XXXXXX" :
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

      const chartLabel = chartType === "6D" ? "6DIGIT" : chartType === "4D" ? "4DIGIT" : "3DIGIT";
      
      // Fetch all year data to ensure 12 months are available in the PDF
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      const { data: yearData, error } = await supabase
        .from('kerala_results')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (error) throw error;
      const resultsData = yearData || [];

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // We want to show all 12 months in the PDF
      const allMonths = Array.from({ length: 12 }, (_, i) => i);
      const monthsToDisplay = allMonths.filter(m => new Date(year, m, 1) <= today);

      if (monthsToDisplay.length === 0) {
        toast.error("No data available for this year.");
        setSharing(false);
        return;
      }

      // Use the specific month naming style from the image (truncated or full)
      const getMonthLabel = (mIdx: number) => {
        const full = format(new Date(year, mIdx, 1), 'MMMM');
        if (full === "September") return "Sep";
        if (full === "August") return "Augu";
        return full.length > 5 ? full.slice(0, 4) : full;
      };

      const monthNames = monthsToDisplay.map(m => getMonthLabel(m));

      // Header configuration (Salmon color: #fecaca)
      const headRow: any[] = [
        { content: "Date", styles: { fillColor: [254, 202, 202], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" } },
        ...monthNames.map(name => ({
          content: name,
          styles: { halign: "center", fillColor: [254, 202, 202], textColor: [0, 0, 0], fontStyle: "bold" }
        }))
      ];

      // Build body rows
      const placeholder = chartType === "6D" ? "******" : chartType === "4D" ? "****" : "***";
      const bodyRows = Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        const row: any[] = [
          { content: String(day), styles: { fillColor: [254, 202, 202], textColor: [0, 0, 0], fontStyle: "bold", halign: "center" } }
        ];
        monthsToDisplay.forEach(monthIdx => {
          const cellDate = new Date(year, monthIdx, day);
          const isValidDay = cellDate.getMonth() === monthIdx && cellDate.getDate() === day;
          if (!isValidDay) {
            row.push("******");
          } else {
            const dateStr = format(cellDate, 'yyyy-MM-dd');
            const entry = resultsData.find(d => d.date === dateStr);
            if (entry) {
              row.push(sliceResult(entry.result, chartType));
            } else {
              const cd = new Date(cellDate);
              cd.setHours(0, 0, 0, 0);
              row.push(cd >= today ? "" : placeholder);
            }
          }
        });
        return row;
      }).filter(row => row.slice(1).some(cell => {
        const val = typeof cell === 'object' ? cell.content : cell;
        return val !== "" && val !== "******";
      }));

      // Top Banner (Dark Red: #991b1b)
      pdf.setFillColor(153, 27, 27);
      pdf.rect(10, 10, pageWidth - 20, 30, "F");
      pdf.setFontSize(16);
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      // Text removed as per user request

      // Calculate fonts for up to 13 columns (Date + 12 months)
      const dynamicFontSize = monthsToDisplay.length > 7 ? 7.5 : 10;
      const dynamicPadding = { top: 2, right: 2, bottom: 2, left: 2 };

      autoTable(pdf, {
        startY: 50,
        head: [headRow],
        body: bodyRows,
        theme: "grid",
        styles: { 
          fontSize: dynamicFontSize, 
          cellPadding: dynamicPadding, 
          halign: "center", 
          overflow: "hidden", 
          fontStyle: "bold",
          lineWidth: 0.5,
          lineColor: [100, 100, 100] // Darker borders
        },
        columnStyles: { 
          0: { fontStyle: "bold", cellWidth: 35 } 
        },
        margin: { top: 50, left: 10, right: 10, bottom: 40 },
        tableWidth: 'auto',
      });

      // Footer
      const finalY = (pdf as any).lastAutoTable.finalY + 10;
      const footerY = Math.max(finalY, pageHeight - 35);
      
      pdf.setFillColor(153, 27, 27);
      pdf.rect(10, footerY, pageWidth - 20, 25, "F");
      pdf.setFontSize(11);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`KERALA CHART ${chartLabel} - ${year}`, 30, footerY + 17);
      pdf.text(`Telegram: guessinggrp`, pageWidth - 30, footerY + 17, { align: "right" });

      const pdfBlob = pdf.output("blob");
      const fileName = `Kerala_${chartLabel}_${year}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Kerala ${chartLabel} Chart ${year}`,
          text: `Kerala ${chartLabel} Chart results for ${year}`,
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

        <div id="kerala-table-container" className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xl overflow-y-auto max-h-[75vh] relative custom-scrollbar" ref={tableRef}>
          <table className="min-w-max w-full border-collapse text-[10px] sm:text-[11px] lg:text-sm">
            <thead className="bg-orange-600 text-white sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="border border-white/20 p-1.5 sm:p-2 sticky left-0 bg-orange-600 z-40 min-w-[25px] sm:min-w-[40px]">D</th>
                {currentMonths.map(monthIdx => (
                  <th key={monthIdx} className="border border-white/20 p-1 sm:p-2 uppercase min-w-[80px] sm:min-w-[120px]">
                    {format(new Date(year, monthIdx, 1), 'MMM')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map(day => (
                <tr key={day} className="hover:bg-orange-50/30 transition-colors group">
                  <td className="border border-slate-200 p-1 text-center font-black bg-slate-50 sticky left-0 z-20 shadow-[1px_0_3px_rgba(0,0,0,0.1)] group-hover:bg-orange-50 transition-colors">
                    {day}
                  </td>
                  {currentMonths.map(monthIdx => {
                    const result = getResult(day, monthIdx);
                    // Optimized check for valid day of month
                    const date = new Date(year, monthIdx, day);
                    const isValidDay = date.getFullYear() === year && date.getMonth() === monthIdx && date.getDate() === day;
                    
                    return (
                      <td 
                        key={`${monthIdx}-${day}`}
                        className={`border border-slate-200 p-0.5 sm:p-1 text-center font-mono min-w-[80px] sm:min-w-[120px] ${!isValidDay ? 'bg-slate-100/50 text-slate-400' : ''}`}
                      >
                        <span className="scale-95 sm:scale-100 inline-block font-bold">
                          {isValidDay ? result : "-"}
                        </span>
                      </td>
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

export default KeralaChart;
