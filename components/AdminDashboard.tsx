import React, { useState } from 'react';
import { AttendanceRequest, Staff, ShiftAssignment, ViewMode, TimeSlot, ParentCode } from '../types';
import { Users, Calendar as CalendarIcon, Settings, Wand2, Printer, Plus, Trash2, LogOut, X, Smile, Baby, Clock, Menu, ArrowLeft, Check, Smartphone, Monitor, FileText, Minus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Grid, List, PenTool, Eraser, MousePointerClick, Key } from 'lucide-react';
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, endOfWeek, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, addWeeks, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';
import { generateAutoSchedule } from '../services/geminiService';

interface AdminDashboardProps {
  requests: AttendanceRequest[];
  setRequests: React.Dispatch<React.SetStateAction<AttendanceRequest[]>>;
  staffList: Staff[];
  setStaffList: React.Dispatch<React.SetStateAction<Staff[]>>;
  shifts: ShiftAssignment[];
  setShifts: React.Dispatch<React.SetStateAction<ShiftAssignment[]>>;
  parentCodes: ParentCode[];
  setParentCodes: React.Dispatch<React.SetStateAction<ParentCode[]>>;
  onLogout: () => void;
}

interface PrintConfig {
  orientation: 'landscape' | 'portrait';
  scale: number;
  grayscale: boolean;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  requests,
  setRequests,
  staffList, 
  setStaffList, 
  shifts, 
  setShifts, 
  parentCodes,
  setParentCodes,
  onLogout 
}) => {
  const [activeTab, setActiveTab] = useState<'schedule' | 'requests' | 'staff' | 'codes'>('schedule');
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  
  // Delete Confirmation State
  const [requestToDelete, setRequestToDelete] = useState<AttendanceRequest | null>(null);
  
  // Staff Tab States
  const [staffTabMode, setStaffTabMode] = useState<'list' | 'table'>('list');
  const [staffTablePeriod, setStaffTablePeriod] = useState<'month' | 'week'>('month');
  const [manualShiftData, setManualShiftData] = useState<Record<string, string>>({}); // Key: staffId-YYYY-MM-DD
  const [activeCell, setActiveCell] = useState<{staffId: string, dateStr: string} | null>(null);
  
  // Print Configuration State
  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    orientation: 'landscape',
    scale: 1.0,
    grayscale: false,
  });
  
  // Staff Management State
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffSchedule, setNewStaffSchedule] = useState('');

  // Parent Code Management State
  const [newCode, setNewCode] = useState('');
  const [newChildName, setNewChildName] = useState('');
  const [newPickupLoc, setNewPickupLoc] = useState('');
  const [newDropOffLoc, setNewDropOffLoc] = useState('');
  const [codeToDelete, setCodeToDelete] = useState<ParentCode | null>(null);

  // Child Records View State
  const [selectedChildForRecords, setSelectedChildForRecords] = useState<ParentCode | null>(null);
  const [recordsMonth, setRecordsMonth] = useState(new Date());
  const [printConfirmType, setPrintConfirmType] = useState<'record' | 'schedule' | null>(null);

  const handleUpdateParentCode = (code: string, field: keyof ParentCode, value: string) => {
    setParentCodes(prev => prev.map(c => c.code === code ? { ...c, [field]: value } : c));
  };

  const handleAddParentCode = () => {
    if (!newCode || !newChildName) {
      alert("コードとお子様名は必須です。");
      return;
    }
    if (parentCodes.some(c => c.code === newCode)) {
      alert("このコードは既に使用されています。");
      return;
    }
    const newEntry: ParentCode = {
      code: newCode,
      childName: newChildName,
      defaultPickupLocation: newPickupLoc,
      defaultDropOffLocation: newDropOffLoc
    };
    setParentCodes([...parentCodes, newEntry]);
    setNewCode('');
    setNewChildName('');
    setNewPickupLoc('');
    setNewDropOffLoc('');
  };

  const handleDeleteParentCode = (code: string) => {
    const codeObj = parentCodes.find(c => c.code === code);
    if (codeObj) {
      setCodeToDelete(codeObj);
    }
  };

  const executeDeleteParentCode = () => {
    if (codeToDelete) {
      setParentCodes(parentCodes.filter(c => c.code !== codeToDelete.code));
      setCodeToDelete(null);
    }
  };

  // Shift Generation Handler
  const handleAutoGenerate = async () => {
    if (staffList.length === 0 || requests.length === 0) {
      alert("スタッフと登園希望データが必要です。");
      return;
    }
    
    setIsGenerating(true);
    try {
      const generatedShifts = await generateAutoSchedule(requests, staffList);
      setShifts(generatedShifts);
      alert("シフト表を自動作成しました！");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrintClick = () => {
    // Reset config on open
    setPrintConfig({
      orientation: 'landscape',
      scale: 1.0,
      grayscale: false,
    });
    setShowPrintPreview(true);
  };

  const executePrint = () => {
    const printContent = document.getElementById('print-preview-content');
    if (!printContent) {
      alert("印刷データが見つかりません。");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("ポップアップがブロックされました。ブラウザの設定で許可してください。");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <title>シフト表印刷 - ハッピースマイル</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Zen Maru Gothic', sans-serif; 
              background: white;
            }
            input {
               background: transparent;
            }
            @media print {
              @page { size: ${printConfig.orientation}; margin: 5mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
              input { border: none !important; } /* Hide input borders in print for clean look */
            }
            /* Hide elements marked as no-print */
            .no-print { display: none !important; }
            .print-border { border: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div style="
            width: ${printConfig.orientation === 'landscape' ? '297mm' : '210mm'};
            transform: scale(${printConfig.scale}); 
            transform-origin: top left; 
            ${printConfig.grayscale ? 'filter: grayscale(100%);' : ''}
          ">
            ${printContent.innerHTML}
          </div>
          <script>
            // Tailwind CSS takes a moment to process classes after loading
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 1000);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const handleDayPrint = (date: Date) => {
    const { dayRequests, dayShifts } = getDayData(date);
    const uniqueStaff = Array.from(new Set(dayShifts.map(s => s.staffName)));
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("ポップアップがブロックされました。ブラウザの設定で許可してください。");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ja">
        <head>
          <meta charset="UTF-8" />
          <title>日別詳細レポート</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap" rel="stylesheet">
          <style>
            body { 
              font-family: 'Zen Maru Gothic', sans-serif; 
              background: white;
            }
            @media print {
              @page { size: A4 portrait; margin: 10mm; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body class="p-8">
          <div class="max-w-2xl mx-auto border-4 border-double border-orange-200 p-8 rounded-xl">
             <div class="text-center border-b-2 border-orange-300 pb-4 mb-6">
               <h1 class="text-2xl font-bold text-gray-800 mb-1">
                 ${format(date, 'yyyy年 M月 d日 (eee)', { locale: ja })}
               </h1>
               <p class="text-gray-500 text-sm">日別詳細レポート</p>
             </div>

             <div class="mb-8">
               <h2 class="text-lg font-bold text-white bg-orange-500 px-3 py-1 rounded inline-block mb-3">
                 登園予定 (${dayRequests.length}名)
               </h2>
               ${dayRequests.length > 0 ? `
                 <table class="w-full text-sm text-left text-gray-700">
                   <thead class="bg-orange-50 text-orange-800 uppercase font-bold">
                     <tr>
                       <th class="px-3 py-2">お名前</th>
                       <th class="px-3 py-2">時間</th>
                       <th class="px-3 py-2">送迎</th>
                       <th class="px-3 py-2">備考</th>
                     </tr>
                   </thead>
                   <tbody class="divide-y divide-gray-200 border-b border-gray-200">
                     ${dayRequests.map(req => `
                       <tr>
                         <td class="px-3 py-3 font-bold text-base">${req.childName}</td>
                         <td class="px-3 py-3 whitespace-nowrap">
                           <span class="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-xs font-bold border border-orange-200">
                             ${req.arrivalTime && req.departureTime ? `${req.arrivalTime}〜${req.departureTime}` : (req.timeSlot ? req.timeSlot.split(' ')[0] : '-')}
                           </span>
                         </td>
                         <td class="px-3 py-3 text-xs">
                            ${req.pickup ? `<div class="flex flex-col"><span class="text-orange-600 font-bold">迎え</span>${req.pickupLocation ? `<span class="text-[8px] text-gray-500">(${req.pickupLocation})</span>` : ''}</div>` : ''}
                            ${req.dropOff ? `<div class="flex flex-col"><span class="text-blue-600 font-bold">送り</span>${req.dropOffLocation ? `<span class="text-[8px] text-gray-500">(${req.dropOffLocation})</span>` : ''}</div>` : ''}
                            ${!req.pickup && !req.dropOff ? '-' : ''}
                         </td>
                         <td class="px-3 py-3 text-gray-600">${req.notes || '-'}</td>
                       </tr>
                     `).join('')}
                   </tbody>
                 </table>
               ` : '<p class="text-gray-400 italic p-2">予定なし</p>'}
             </div>

             <div>
               <h2 class="text-lg font-bold text-white bg-green-600 px-3 py-1 rounded inline-block mb-3">
                 担当スタッフ (${uniqueStaff.length}名)
               </h2>
               ${uniqueStaff.length > 0 ? `
                 <div class="flex flex-wrap gap-3">
                   ${uniqueStaff.map((name: any) => `
                     <div class="flex items-center gap-2 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                       <div class="w-6 h-6 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold text-xs">
                         ${name.charAt(0)}
                       </div>
                       <span class="font-bold text-gray-800">${name}</span>
                     </div>
                   `).join('')}
                 </div>
               ` : '<p class="text-gray-400 italic p-2">シフト未作成</p>'}
             </div>

             <div class="mt-12 text-right text-xs text-gray-400">
               作成日: ${format(new Date(), 'yyyy/MM/dd HH:mm')}
             </div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const addStaff = () => {
    if (!newStaffName) return;
    const newStaff: Staff = {
      id: Date.now().toString(),
      name: newStaffName,
      role: 'スタッフ',
      isAvailable: true,
      workSchedule: newStaffSchedule
    };
    setStaffList([...staffList, newStaff]);
    setNewStaffName('');
    setNewStaffSchedule('');
  };

  const toggleStaffAvailability = (id: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, isAvailable: !s.isAvailable } : s));
  };

  const updateStaffSchedule = (id: string, schedule: string) => {
    setStaffList(staffList.map(s => s.id === id ? { ...s, workSchedule: schedule } : s));
  };

  const removeStaff = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id));
  };

  const confirmDeleteRequest = (req: AttendanceRequest) => {
    setRequestToDelete(req);
  };

  const executeDeleteRequest = () => {
    if (!requestToDelete) return;
    
    setRequests(prev => prev.filter(r => r.id !== requestToDelete.id));
      
    // Also remove associated shift assignment
    setShifts(prev => prev.filter(s => 
      !(s.date === requestToDelete.date && s.childName === requestToDelete.childName)
    ));
    
    setRequestToDelete(null);
  };

  // --- Helper to get data for a specific date ---
  const getDayData = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayRequests = requests.filter(r => r.date === dateStr);
    const dayShifts = shifts.filter(s => s.date === dateStr);
    return { dateStr, dayRequests, dayShifts };
  };
  
  // --- Staff Shift Table Helper ---
  const handleManualShiftChange = (staffId: string, dateStr: string, val: string) => {
    setManualShiftData(prev => ({ ...prev, [`${staffId}-${dateStr}`]: val }));
  };

  const handleCellClick = (staffId: string, dateStr: string) => {
    setActiveCell({ staffId, dateStr });
  };

  const applyShiftMark = (mark: string) => {
    if (!activeCell) return;
    handleManualShiftChange(activeCell.staffId, activeCell.dateStr, mark);
  };

  const getStaffShiftValue = (staffId: string, dateStr: string, staffName: string) => {
    const key = `${staffId}-${dateStr}`;
    // 1. Manual override exists
    if (manualShiftData[key] !== undefined) {
      return manualShiftData[key];
    }
    // 2. AI Assigned
    const isAssigned = shifts.some(s => s.staffName === staffName && s.date === dateStr);
    if (isAssigned) return '○';
    
    return '';
  };

  // --- Render Components ---

  const renderDeleteConfirmModal = () => {
    if (!requestToDelete) return null;
    
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">本当に削除しますか？</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              <span className="font-bold text-gray-800">{requestToDelete.childName}</span> さんの<br/>
              {format(parseISO(requestToDelete.date), 'M/d')} の登園希望を削除します。<br/>
              <span className="text-red-500 text-xs mt-2 block bg-red-50 py-1 px-2 rounded">※関連するシフトも同時に削除されます</span>
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setRequestToDelete(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                いいえ
              </button>
              <button 
                onClick={executeDeleteRequest}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-colors"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStaffShiftTable = () => {
    let days: Date[] = [];
    
    if (staffTablePeriod === 'month') {
        const start = startOfMonth(currentDate);
        const end = endOfMonth(currentDate);
        days = eachDayOfInterval({ start, end });
    } else {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        days = eachDayOfInterval({ start, end });
    }

    // Quick Input Toolbar (Only visible when a cell is active and not printing)
    const renderEditToolbar = () => {
        if (!activeCell || showPrintPreview) return null;
        const staff = staffList.find(s => s.id === activeCell.staffId);
        if (!staff) return null;

        return (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 md:absolute md:bottom-auto md:top-2 md:left-auto md:right-2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200 shadow-2xl rounded-2xl">
            <div className="bg-white/95 backdrop-blur border-2 border-orange-400 p-2 rounded-2xl flex items-center gap-2">
              <div className="hidden md:block px-2 text-xs font-bold text-orange-800 border-r border-orange-200 mr-1 min-w-[80px]">
                 <div className="text-gray-500">{format(parseISO(activeCell.dateStr), 'M/d (eee)', {locale:ja})}</div>
                 <div className="truncate w-24">{staff.name}</div>
              </div>
              
              <button 
                onClick={() => applyShiftMark('◎')}
                className="flex flex-col items-center justify-center w-12 h-12 bg-orange-100 hover:bg-orange-200 text-orange-700 rounded-xl transition-colors active:scale-95 shadow-sm border border-orange-200"
                title="出勤 (◎)"
              >
                <span className="text-xl font-bold">◎</span>
                <span className="text-[10px] font-bold">出勤</span>
              </button>

              <button 
                onClick={() => applyShiftMark('○')}
                className="flex flex-col items-center justify-center w-12 h-12 bg-green-100 hover:bg-green-200 text-green-700 rounded-xl transition-colors active:scale-95 shadow-sm border border-green-200"
                title="通常 (○)"
              >
                <span className="text-xl font-bold">○</span>
                <span className="text-[10px] font-bold">通常</span>
              </button>

              <button 
                 onClick={() => applyShiftMark('休')}
                 className="flex flex-col items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors active:scale-95 shadow-sm border border-gray-200"
                 title="休み"
              >
                <span className="font-bold">休</span>
                <span className="text-[10px]">休み</span>
              </button>

              <div className="w-px h-8 bg-gray-300 mx-1"></div>

              <button 
                 onClick={() => applyShiftMark('')}
                 className="flex flex-col items-center justify-center w-12 h-12 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition-colors active:scale-95 shadow-sm border border-red-100"
                 title="消去"
              >
                <Eraser size={20} />
                <span className="text-[10px]">消去</span>
              </button>
            </div>
          </div>
        );
    };

    return (
      <div className="bg-white rounded-xl overflow-hidden relative">
        {/* Render Toolbar */}
        {renderEditToolbar()}

        {/* Controls (Hidden in Print) */}
        {!showPrintPreview && (
          <div className="bg-orange-50 p-3 flex flex-wrap justify-between items-center gap-4 mb-4 rounded-lg border border-orange-100">
             <div className="flex items-center gap-2">
               <button 
                 onClick={() => setStaffTablePeriod('month')}
                 className={`px-3 py-1.5 rounded-lg font-bold text-sm ${staffTablePeriod === 'month' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-orange-100'}`}
               >
                 月表示
               </button>
               <button 
                 onClick={() => setStaffTablePeriod('week')}
                 className={`px-3 py-1.5 rounded-lg font-bold text-sm ${staffTablePeriod === 'week' ? 'bg-orange-500 text-white' : 'bg-white text-gray-600 hover:bg-orange-100'}`}
               >
                 週表示
               </button>
             </div>

             <div className="flex items-center bg-white rounded-lg shadow-sm border border-gray-200 px-2 py-1">
                <button 
                  onClick={() => setCurrentDate(staffTablePeriod === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                >
                  <ChevronLeft size={20}/>
                </button>
                <span className="font-bold text-lg mx-3 w-32 text-center text-gray-800">
                  {staffTablePeriod === 'month' ? format(currentDate, 'M月', {locale:ja}) : format(days[0], 'M/d', {locale:ja}) + '週'}
                </span>
                <button 
                  onClick={() => setCurrentDate(staffTablePeriod === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
                  className="p-1 hover:bg-gray-100 rounded text-gray-600"
                >
                  <ChevronRight size={20}/>
                </button>
             </div>

             <button 
                onClick={handlePrintClick}
                className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-sm"
             >
                <Printer size={16} /> 印刷
             </button>
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto border border-gray-300 rounded-lg pb-10 md:pb-0">
          <table className="w-full text-sm border-collapse bg-white">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-100 p-2 min-w-[100px] text-left sticky left-0 z-10 w-32 font-bold text-gray-700">
                  スタッフ名
                </th>
                {days.map((day, i) => (
                  <th key={i} className={`border border-gray-300 p-1 text-center min-w-[35px] ${['日','土'].includes(format(day, 'eee', {locale:ja})) ? 'bg-gray-50' : 'bg-white'}`}>
                    <div className={`text-xs ${format(day, 'eee') === 'Sun' ? 'text-red-500' : format(day, 'eee') === 'Sat' ? 'text-blue-500' : 'text-gray-700'}`}>
                      {format(day, 'eee', {locale:ja})}
                    </div>
                    <div className="font-bold">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.map(staff => (
                <tr key={staff.id}>
                  <td className="border border-gray-300 p-2 bg-gray-50 font-bold text-gray-700 sticky left-0 z-10 whitespace-nowrap">
                    {staff.name}
                  </td>
                  {days.map((day, i) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const val = getStaffShiftValue(staff.id, dateStr, staff.name);
                    const isActive = activeCell?.staffId === staff.id && activeCell?.dateStr === dateStr;
                    
                    return (
                      <td 
                        key={i} 
                        className={`border border-gray-300 p-0 h-10 text-center relative group ${isActive ? 'z-20' : ''}`}
                        onClick={() => !showPrintPreview && handleCellClick(staff.id, dateStr)}
                      >
                         {isActive && !showPrintPreview && (
                            <div className="absolute inset-0 border-2 border-orange-400 pointer-events-none z-10 shadow-sm bg-orange-50/20"></div>
                         )}
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => handleManualShiftChange(staff.id, dateStr, e.target.value)}
                          className={`w-full h-full text-center outline-none bg-transparent font-medium ${val === '◎' ? 'text-orange-600 font-bold text-lg' : val === '○' ? 'text-green-600' : val === '休' ? 'text-red-400' : 'text-gray-800'}`}
                          placeholder="" 
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
              {/* Empty rows for manual addition in print */}
              {showPrintPreview && Array.from({ length: 3 }).map((_, idx) => (
                 <tr key={`empty-${idx}`}>
                   <td className="border border-gray-300 p-2 bg-gray-50 font-bold text-gray-400 sticky left-0 z-10">
                     (予備)
                   </td>
                   {days.map((_, i) => (
                     <td key={i} className="border border-gray-300 p-0 h-10"></td>
                   ))}
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!showPrintPreview && (
          <p className="mt-2 text-xs text-gray-400 text-right no-print flex items-center justify-end gap-1">
             <MousePointerClick size={14} /> 
             セルをクリックすると「出勤ボタン」が表示されます
          </p>
        )}
      </div>
    );
  };

  const renderStaffManagement = () => (
    <div className={`bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-orange-100 ${showPrintPreview ? 'shadow-none border-0' : ''}`}>
      
      {/* Sub-Tabs for List vs Shift Table */}
      <div className="flex justify-between items-center mb-6 no-print">
        <h3 className="text-xl font-bold text-gray-700 flex items-center gap-2">
          <Users className="text-orange-500" />
          スタッフ管理
        </h3>
        
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button 
            onClick={() => setStaffTabMode('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${staffTabMode === 'list' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <List size={16} /> 名簿・設定
          </button>
          <button 
            onClick={() => setStaffTabMode('table')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${staffTabMode === 'table' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Grid size={16} /> シフト表作成
          </button>
        </div>
      </div>

      {/* Show Title in Print Only */}
      {showPrintPreview && (
         <div className="mb-4 text-center print:block hidden">
            <h2 className="text-xl font-bold border-b-2 border-orange-400 inline-block pb-1">
              {staffTabMode === 'list' ? 'スタッフ名簿' : `${format(currentDate, 'yyyy年 M月', {locale:ja})} スタッフシフト表`}
            </h2>
         </div>
      )}
      
      {/* Render Content based on Sub-Tab */}
      {staffTabMode === 'list' ? (
        <>
          {!showPrintPreview && (
            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-200 no-print">
              <h4 className="font-bold text-gray-600 mb-2">新規スタッフ追加</h4>
              <div className="flex flex-col md:flex-row gap-2">
                <input 
                  type="text" 
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="氏名 (例: 佐藤 花子)"
                  className="flex-1 p-3 border border-gray-300 rounded-lg text-base"
                />
                <input 
                  type="text" 
                  value={newStaffSchedule}
                  onChange={(e) => setNewStaffSchedule(e.target.value)}
                  placeholder="勤務形態 (例: 毎週火曜休み)"
                  className="flex-[2] p-3 border border-gray-300 rounded-lg text-base"
                />
                <button onClick={addStaff} className="bg-green-500 text-white px-6 py-3 md:py-2 rounded-lg hover:bg-green-600 flex items-center justify-center gap-2 font-bold whitespace-nowrap active:scale-95 transition-transform">
                  <Plus size={20} /> 追加
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map(staff => (
              <div key={staff.id} className={`p-4 rounded-xl border-2 flex flex-col gap-3 ${staff.isAvailable ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50 opacity-75'} print:border-gray-300 print:bg-white print:break-inside-avoid`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-lg">{staff.name}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${staff.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} print:border print:border-gray-300`}>
                      {staff.isAvailable ? '出勤可' : '休み(長期)'}
                    </span>
                  </div>
                  {!showPrintPreview && (
                    <div className="flex items-center gap-2 no-print">
                      <button 
                        onClick={() => toggleStaffAvailability(staff.id)}
                        className="text-xs bg-white border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50 active:bg-gray-100"
                        title="出勤可否の切り替え"
                      >
                        切替
                      </button>
                      <button onClick={() => removeStaff(staff.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </div>
                
                <div className="w-full">
                  <label className="text-xs text-gray-500 font-bold flex items-center gap-1 mb-1">
                    <Clock size={12} /> 勤務条件・備考
                  </label>
                  <input 
                    type="text" 
                    value={staff.workSchedule || ''} 
                    onChange={(e) => updateStaffSchedule(staff.id, e.target.value)}
                    placeholder="例: 火曜定休"
                    readOnly={showPrintPreview}
                    className={`w-full text-sm p-2 border border-gray-300 rounded focus:border-orange-400 focus:ring-1 focus:ring-orange-200 outline-none ${showPrintPreview ? 'border-none p-0 bg-transparent' : ''}`}
                  />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        renderStaffShiftTable()
      )}
    </div>
  );

  const renderRequestsList = () => (
    <div className={`bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-orange-100 ${showPrintPreview ? 'shadow-none border-0 p-0' : ''}`}>
      <h3 className="text-xl font-bold mb-4 text-gray-700">受信した登園希望</h3>
      {requests.length === 0 ? (
        <p className="text-gray-500">まだ希望届はありません。</p>
      ) : (
        <div className={`overflow-x-auto ${!showPrintPreview ? '-mx-4 md:mx-0' : ''}`}>
          <div className={`${!showPrintPreview ? 'min-w-[600px] px-4 md:px-0' : 'w-full'}`}>
            <table className="w-full text-left">
              <thead>
                <tr className="bg-orange-50 text-orange-800 print:bg-gray-100 print:text-black">
                  <th className="p-3 rounded-l-lg whitespace-nowrap">日付</th>
                  <th className="p-3 whitespace-nowrap">お子様名</th>
                  <th className="p-3 whitespace-nowrap">時間</th>
                  <th className="p-3 whitespace-nowrap">送迎</th>
                  <th className="p-3 whitespace-nowrap">受付日時</th>
                  <th className="p-3 rounded-r-lg min-w-[150px]">備考</th>
                </tr>
              </thead>
              <tbody>
                {requests.map(req => (
                  <tr key={req.id} className="border-b border-gray-100 hover:bg-gray-50 print:border-gray-300">
                    <td className="p-3">{format(parseISO(req.date), 'MM/dd (eee)', { locale: ja })}</td>
                    <td className="p-3 font-bold">{req.childName}</td>
                    <td className="p-3 text-sm">
                      {req.arrivalTime && req.departureTime ? `${req.arrivalTime}〜${req.departureTime}` : req.timeSlot}
                    </td>
                    <td className="p-3 text-sm">
                      <div className="flex flex-col gap-0.5">
                        {req.pickup && (
                          <span className="text-orange-600 font-bold">
                            迎え有 {req.pickupLocation && <span className="text-[10px] font-normal text-gray-500">({req.pickupLocation})</span>}
                          </span>
                        )}
                        {req.dropOff && (
                          <span className="text-blue-600 font-bold">
                            送り有 {req.dropOffLocation && <span className="text-[10px] font-normal text-gray-500">({req.dropOffLocation})</span>}
                          </span>
                        )}
                        {!req.pickup && !req.dropOff && <span className="text-gray-400">-</span>}
                      </div>
                    </td>
                    <td className="p-3 text-sm text-gray-500">
                      {req.submittedAt ? format(parseISO(req.submittedAt), 'MM/dd HH:mm', { locale: ja }) : '-'}
                    </td>
                    <td className="p-3 text-sm text-gray-500">{req.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderScheduleGrid = () => {
    let days: Date[] = [];
    
    if (viewMode === ViewMode.MONTH) {
        const start = startOfWeek(startOfMonth(currentDate));
        const end = endOfWeek(endOfMonth(currentDate));
        days = eachDayOfInterval({ start, end });
    } else if (viewMode === ViewMode.WEEK) {
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        days = eachDayOfInterval({ start, end });
    } else {
        days = [currentDate];
    }

    return (
      <div className={`grid ${viewMode === ViewMode.MONTH ? 'grid-cols-7' : viewMode === ViewMode.WEEK ? 'grid-cols-7' : 'grid-cols-1'} gap-px bg-gray-200 border border-gray-200 print:gap-0 print:border-l print:border-t print:border-gray-400 print:bg-transparent ${showPrintPreview ? 'gap-0 border-l border-t border-gray-300' : ''}`}>
        {/* Header */}
         {viewMode !== ViewMode.DAY && ['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
           <div key={day} className={`p-2 text-center font-bold text-xs md:text-base ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-700'} bg-orange-100 print:bg-gray-100 print:border-r print:border-b print:border-gray-400 ${showPrintPreview ? 'bg-gray-100 border-r border-b border-gray-300 text-sm' : ''}`}>
             {day}
           </div>
         ))}

         {/* Days */}
         {days.map(day => {
           const { dateStr, dayRequests, dayShifts } = getDayData(day);
           const isCurrentMonth = format(day, 'M') === format(currentDate, 'M');
           
           // Calculate counts
           const childCount = dayRequests.length;
           const uniqueStaff = Array.from(new Set(dayShifts.map(s => s.staffName)));
           const staffCount = uniqueStaff.length;
           
           return (
             <div 
                key={dateStr} 
                onClick={() => !showPrintPreview && setSelectedDate(day)}
                className={`
                  min-h-[80px] md:min-h-[120px] 
                  bg-white p-1 md:p-2 cursor-pointer transition-colors group relative flex flex-col
                  ${!showPrintPreview ? 'hover:bg-orange-50' : 'cursor-default min-h-[100px] border-r border-b border-gray-300'}
                  ${!isCurrentMonth && viewMode === ViewMode.MONTH ? 'opacity-40 bg-gray-50' : ''}
                  print:min-h-[100px] print:h-auto print:opacity-100 print:border-r print:border-b print:border-gray-400 print:break-inside-avoid
                `}
             >
               <div className={`font-bold text-gray-700 mb-1 md:mb-2 border-b pb-1 flex justify-between items-center text-xs md:text-base print:border-gray-300 ${showPrintPreview ? 'text-sm border-gray-300' : ''}`}>
                 <span>
                  {format(day, 'd')} <span className="text-[10px] md:text-xs font-normal text-gray-400 hidden md:inline">{format(day, 'eee', { locale: ja })}</span>
                 </span>
               </div>
               
               {/* Screen View (Interactive Mode) */}
               {!showPrintPreview && (
                 <div className="flex-1 flex flex-col justify-center gap-1 md:gap-2 print:hidden">
                   {childCount > 0 ? (
                     <>
                        <div className="flex items-center justify-between bg-orange-100 text-orange-800 rounded md:rounded-lg px-1 md:px-2 py-0.5 md:py-1.5 border border-orange-200">
                          <div className="hidden md:flex items-center gap-1">
                            <Baby size={16} />
                            <span className="text-xs font-bold">登園</span>
                          </div>
                          <div className="md:hidden text-[10px] mr-1 text-orange-400">登</div>
                          <span className="font-bold text-sm md:text-lg">{childCount}<span className="text-[10px] md:text-xs ml-0.5 font-normal">名</span></span>
                        </div>
                        
                        {staffCount > 0 ? (
                           <div className="flex items-center justify-between bg-green-100 text-green-800 rounded md:rounded-lg px-1 md:px-2 py-0.5 md:py-1.5 border border-green-200">
                             <div className="hidden md:flex items-center gap-1">
                               <Users size={16} />
                               <span className="text-xs font-bold">職員</span>
                             </div>
                             <div className="md:hidden text-[10px] mr-1 text-green-600">職</div>
                             <span className="font-bold text-sm md:text-lg">{staffCount}<span className="text-[10px] md:text-xs ml-0.5 font-normal">名</span></span>
                           </div>
                        ) : (
                           <div className="flex items-center justify-center text-[10px] md:text-xs text-red-400 bg-red-50 rounded py-0.5 md:py-1 border border-red-100">
                             <span className="hidden md:inline">職員未配置</span>
                             <span className="md:hidden">!</span>
                           </div>
                        )}
                     </>
                   ) : (
                     <div className="h-full flex items-center justify-center text-gray-200 text-xl md:text-2xl font-light">
                       -
                     </div>
                   )}
                 </div>
               )}

               {/* Print/Preview View (Detailed List) */}
               <div className={`${showPrintPreview ? 'block' : 'hidden'} print:block text-[9px] text-left`}>
                 {staffCount > 0 && (
                   <div className="mb-1">
                     <div className="font-bold text-gray-600 border-b border-gray-300 mb-0.5">職員</div>
                     <div className="flex flex-wrap gap-1">
                       {uniqueStaff.map(s => (
                         <span key={s} className="bg-gray-100 px-1 rounded border border-gray-200">{s}</span>
                       ))}
                     </div>
                   </div>
                 )}
                 
                 {childCount > 0 && (
                   <div>
                      <div className="font-bold text-gray-600 border-b border-gray-300 mb-0.5">登園</div>
                      <div className="flex flex-wrap gap-1">
                         {dayRequests.map(r => (
                           <span key={r.id} className="text-gray-800">{r.childName}</span>
                         ))}
                      </div>
                   </div>
                 )}
               </div>

             </div>
           );
         })}
      </div>
    );
  };

  const renderPrintConfirmModal = () => {
    if (!printConfirmType) return null;

    const title = printConfirmType === 'record' ? '来園記録' : '来園予定';

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Printer size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">印刷しますか？</h3>
            <p className="text-gray-500 mb-6">
              {selectedChildForRecords?.childName} 様の<br/>
              {format(recordsMonth, 'yyyy年 M月')} {title}を印刷します。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setPrintConfirmType(null)}
                className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
              >
                いいえ
              </button>
              <button 
                onClick={() => {
                  const type = printConfirmType;
                  setPrintConfirmType(null);
                  executeChildRecordsPrint(type);
                }}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const executeChildRecordsPrint = (type: 'record' | 'schedule') => {
    if (!selectedChildForRecords) return;

    const title = type === 'record' ? '来園記録' : '来園予定';
    const monthStr = format(recordsMonth, 'yyyy年 M月');
    
    const filteredRequests = requests.filter(r => {
      const rDate = parseISO(r.date);
      const isSameMonthYear = rDate.getMonth() === recordsMonth.getMonth() && rDate.getFullYear() === recordsMonth.getFullYear();
      const isPast = rDate < new Date();
      return r.childName === selectedChildForRecords.childName && isSameMonthYear && (type === 'record' ? isPast : !isPast);
    }).sort((a, b) => a.date.localeCompare(b.date));

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("ポップアップがブロックされました。");
      return;
    }

    const html = `
      <html>
        <head>
          <title>${selectedChildForRecords.childName} - ${title}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            h1 { text-align: center; color: #333; }
            .info { margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
            th { bg-color: #f9f9f9; }
            .footer { margin-top: 40px; text-align: right; font-size: 0.8em; color: #666; }
          </style>
        </head>
        <body>
          <h1>${title} (${monthStr})</h1>
          <div class="info">
            <p><strong>お子様名:</strong> ${selectedChildForRecords.childName}</p>
            <p><strong>保護者コード:</strong> ${selectedChildForRecords.code}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>日付</th>
                <th>時間</th>
                <th>迎え</th>
                <th>送り</th>
                <th>備考</th>
              </tr>
            </thead>
            <tbody>
              ${filteredRequests.map(r => `
                <tr>
                  <td>${format(parseISO(r.date), 'M/d (E)', { locale: ja })}</td>
                  <td>${r.timeSlot === TimeSlot.FULL ? '一日' : r.timeSlot === TimeSlot.AM ? '午前' : '午後'}</td>
                  <td>${r.pickup ? (r.pickupLocation || 'あり') : '-'}</td>
                  <td>${r.dropOff ? (r.dropOffLocation || 'あり') : '-'}</td>
                  <td>${r.notes || ''}</td>
                </tr>
              `).join('')}
              ${filteredRequests.length === 0 ? '<tr><td colspan="5" style="text-align:center">データがありません</td></tr>' : ''}
            </tbody>
          </table>
          <div class="footer">
            印刷日時: ${format(new Date(), 'yyyy/MM/dd HH:mm')}
          </div>
          <script>
            window.onload = () => {
              window.print();
              // window.close(); // Optional: close after print
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  const renderChildRecordsModal = () => {
    if (!selectedChildForRecords) return null;

    const childRequests = requests.filter(r => r.childName === selectedChildForRecords.childName);
    
    const currentMonthRequests = childRequests.filter(r => {
      const rDate = parseISO(r.date);
      return rDate.getMonth() === recordsMonth.getMonth() && rDate.getFullYear() === recordsMonth.getFullYear();
    });

    const pastRequests = currentMonthRequests.filter(r => parseISO(r.date) < new Date()).sort((a, b) => a.date.localeCompare(b.date));
    const futureRequests = currentMonthRequests.filter(r => parseISO(r.date) >= new Date()).sort((a, b) => a.date.localeCompare(b.date));

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-yellow-500 p-4 md:p-6 flex justify-between items-center text-white shadow-md flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <Baby className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold">{selectedChildForRecords.childName} 様</h3>
                <p className="text-xs opacity-90">保護者コード: {selectedChildForRecords.code}</p>
              </div>
            </div>
            <button onClick={() => setSelectedChildForRecords(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
              <X size={24} />
            </button>
          </div>

          {/* Month Selector */}
          <div className="bg-gray-50 p-4 border-b flex justify-between items-center no-print">
            <button onClick={() => setRecordsMonth(subMonths(recordsMonth, 1))} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ChevronLeft size={20} />
            </button>
            <span className="font-bold text-lg">{format(recordsMonth, 'yyyy年 M月', { locale: ja })}</span>
            <button onClick={() => setRecordsMonth(addMonths(recordsMonth, 1))} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto bg-white flex-1 space-y-8">
            {/* Past Records */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <FileText className="text-blue-500" /> 来園記録（月別）
                </h4>
                <button 
                  onClick={() => setPrintConfirmType('record')}
                  className="flex items-center gap-1 text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-bold"
                >
                  <Printer size={16} /> 印刷
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">日付</th>
                      <th className="px-4 py-2 text-left">時間</th>
                      <th className="px-4 py-2 text-left">迎え</th>
                      <th className="px-4 py-2 text-left">送り</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pastRequests.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-400 italic">記録はありません</td></tr>
                    ) : (
                      pastRequests.map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-2">{format(parseISO(r.date), 'M/d (E)', { locale: ja })}</td>
                          <td className="px-4 py-2">{r.timeSlot === TimeSlot.FULL ? '一日' : r.timeSlot === TimeSlot.AM ? '午前' : '午後'}</td>
                          <td className="px-4 py-2">{r.pickup ? (r.pickupLocation || 'あり') : '-'}</td>
                          <td className="px-4 py-2">{r.dropOff ? (r.dropOffLocation || 'あり') : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Future Schedule */}
            <section>
              <div className="flex justify-between items-center mb-4 border-b pb-2">
                <h4 className="text-lg font-bold text-gray-700 flex items-center gap-2">
                  <CalendarIcon className="text-green-500" /> 来園予定（月別）
                </h4>
                <button 
                  onClick={() => setPrintConfirmType('schedule')}
                  className="flex items-center gap-1 text-sm bg-green-50 text-green-600 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-bold"
                >
                  <Printer size={16} /> 印刷
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-2 text-left">日付</th>
                      <th className="px-4 py-2 text-left">時間</th>
                      <th className="px-4 py-2 text-left">迎え</th>
                      <th className="px-4 py-2 text-left">送り</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {futureRequests.length === 0 ? (
                      <tr><td colSpan={4} className="px-4 py-4 text-center text-gray-400 italic">予定はありません</td></tr>
                    ) : (
                      futureRequests.map(r => (
                        <tr key={r.id}>
                          <td className="px-4 py-2">{format(parseISO(r.date), 'M/d (E)', { locale: ja })}</td>
                          <td className="px-4 py-2">{r.timeSlot === TimeSlot.FULL ? '一日' : r.timeSlot === TimeSlot.AM ? '午前' : '午後'}</td>
                          <td className="px-4 py-2">{r.pickup ? (r.pickupLocation || 'あり') : '-'}</td>
                          <td className="px-4 py-2">{r.dropOff ? (r.dropOffLocation || 'あり') : '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const renderParentCodeDeleteModal = () => {
    if (!codeToDelete) return null;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col items-center text-center">
            <div className="bg-red-100 p-4 rounded-full mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">削除しますか？</h3>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              コード: <span className="font-bold text-orange-600">{codeToDelete.code}</span><br/>
              お子様名: <span className="font-bold text-gray-800">{codeToDelete.childName}</span> さんの<br/>
              登録情報を削除します。
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setCodeToDelete(null)}
                className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition-colors"
              >
                いいえ
              </button>
              <button 
                onClick={executeDeleteParentCode}
                className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 transition-colors"
              >
                はい
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderParentCodeManagement = () => {
    return (
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-orange-100">
        {renderParentCodeDeleteModal()}
        {renderChildRecordsModal()}
        {renderPrintConfirmModal()}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Key className="text-orange-500" /> 保護者コード管理
          </h3>
        </div>

        <div className="bg-orange-50 p-4 rounded-xl mb-8 border border-orange-100">
          <h4 className="font-bold text-orange-800 mb-4 text-sm">新規コード登録</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-1">コード (数字)</label>
              <input 
                type="text" 
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="例: 1234"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-1">お子様名</label>
              <input 
                type="text" 
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                placeholder="例: 山田 太郎"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-1">迎え場所 (デフォルト)</label>
              <input 
                type="text" 
                value={newPickupLoc}
                onChange={(e) => setNewPickupLoc(e.target.value)}
                placeholder="例: 自宅"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-500 ml-1">送り場所 (デフォルト)</label>
              <input 
                type="text" 
                value={newDropOffLoc}
                onChange={(e) => setNewDropOffLoc(e.target.value)}
                placeholder="例: 自宅"
                className="w-full p-2.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={handleAddParentCode}
                className="w-full bg-orange-500 text-white p-2.5 rounded-lg hover:bg-orange-600 flex items-center justify-center gap-2 font-bold transition-colors shadow-sm"
              >
                <Plus size={18} /> 登録
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 font-bold uppercase text-xs">
              <tr>
                <th className="px-4 py-3">コード</th>
                <th className="px-4 py-3">お子様名</th>
                <th className="px-4 py-3">迎え場所</th>
                <th className="px-4 py-3">送り場所</th>
                <th className="px-4 py-3 text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {parentCodes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-400 italic">
                    登録されているコードはありません
                  </td>
                </tr>
              ) : (
                parentCodes.map(c => (
                  <tr key={c.code} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-orange-600">{c.code}</td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            setSelectedChildForRecords(c);
                            setRecordsMonth(new Date());
                          }}
                          className="text-orange-600 hover:text-orange-700 font-bold hover:underline text-left flex-shrink-0"
                        >
                          <FileText size={16} className="inline mr-1" />
                        </button>
                        <input 
                          type="text"
                          value={c.childName}
                          onChange={(e) => handleUpdateParentCode(c.code, 'childName', e.target.value)}
                          className="w-full p-1.5 border border-transparent hover:border-gray-200 focus:border-orange-400 rounded bg-transparent focus:bg-white transition-all font-bold"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text"
                        value={c.defaultPickupLocation}
                        onChange={(e) => handleUpdateParentCode(c.code, 'defaultPickupLocation', e.target.value)}
                        className="w-full p-1.5 border border-transparent hover:border-gray-200 focus:border-orange-400 rounded bg-transparent focus:bg-white transition-all text-gray-600"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text"
                        value={c.defaultDropOffLocation}
                        onChange={(e) => handleUpdateParentCode(c.code, 'defaultDropOffLocation', e.target.value)}
                        className="w-full p-1.5 border border-transparent hover:border-gray-200 focus:border-orange-400 rounded bg-transparent focus:bg-white transition-all text-gray-600"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteParentCode(c.code)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderSchedule = () => {
    return (
      <div className="bg-white p-4 md:p-6 rounded-2xl shadow-lg border border-orange-100 min-h-[500px]">
        
        {/* Controls Header - Stack on mobile, Row on desktop */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 no-print">
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
             <select 
               value={viewMode} 
               onChange={(e) => setViewMode(e.target.value as ViewMode)}
               className="p-2 border rounded-lg bg-orange-50 text-orange-800 font-bold text-sm md:text-base flex-1 md:flex-none"
             >
               <option value={ViewMode.MONTH}>月表示</option>
               <option value={ViewMode.WEEK}>週表示</option>
               <option value={ViewMode.DAY}>日表示</option>
             </select>
             <div className="flex items-center gap-2 flex-1 md:flex-none justify-center bg-gray-50 rounded-lg p-1">
               <button onClick={() => setCurrentDate(addMonths(currentDate, -1))} className="p-2 hover:bg-gray-200 rounded">←</button>
               <span className="font-bold text-lg">{format(currentDate, 'yyyy年 M月', { locale: ja })}</span>
               <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:bg-gray-200 rounded">→</button>
             </div>
          </div>
          <div className="flex w-full md:w-auto gap-2">
            <button 
                onClick={handleAutoGenerate}
                disabled={isGenerating}
                className="flex-1 md:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors disabled:opacity-50 text-sm md:text-base font-bold active:scale-95"
            >
                {isGenerating ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div> : <Wand2 size={18} />}
                AI作成
            </button>
            <button 
                onClick={handlePrintClick}
                className="flex-1 md:flex-none bg-gray-700 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-md transition-colors text-sm md:text-base font-bold active:scale-95"
            >
                <Printer size={18} />
                印刷
            </button>
          </div>
        </div>

        {renderScheduleGrid()}
      </div>
    );
  };

  const renderPrintPreview = () => (
    <div className="fixed inset-0 z-50 bg-gray-200 flex flex-col h-screen print:static print:inset-auto print:h-auto print:bg-white print:block print:overflow-visible">
      {/* Dynamic Style Injection for Print - still kept for consistency if user manually prints, though button opens new window */}
      <style>
        {`
          @media print {
            @page {
              size: ${printConfig.orientation};
              margin: 10mm;
            }
          }
        `}
      </style>

      {/* Preview Toolbar */}
      <div className="bg-gray-800 text-white px-4 py-3 flex flex-col md:flex-row justify-between items-center shadow-md flex-shrink-0 no-print gap-4">
        <div className="flex items-center gap-2">
           <Printer className="w-5 h-5" />
           <span className="font-bold">印刷プレビュー</span>
        </div>

        {/* Print Settings Controls */}
        <div className="flex flex-wrap items-center justify-center gap-4 bg-gray-700 p-2 rounded-lg">
          {/* Orientation */}
          <div className="flex items-center gap-1">
            <button 
              onClick={() => setPrintConfig(p => ({ ...p, orientation: 'portrait' }))}
              className={`p-1.5 rounded ${printConfig.orientation === 'portrait' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              title="縦向き"
            >
              <Smartphone size={18} />
            </button>
            <button 
              onClick={() => setPrintConfig(p => ({ ...p, orientation: 'landscape' }))}
              className={`p-1.5 rounded ${printConfig.orientation === 'landscape' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
              title="横向き"
            >
              <Monitor size={18} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-500 mx-1"></div>

          {/* Scale */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setPrintConfig(p => ({ ...p, scale: Math.max(0.5, p.scale - 0.1) }))}
              className="p-1 text-gray-300 hover:text-white"
            >
              <Minus size={16} />
            </button>
            <span className="text-xs font-mono w-12 text-center">{Math.round(printConfig.scale * 100)}%</span>
            <button 
              onClick={() => setPrintConfig(p => ({ ...p, scale: Math.min(2.0, p.scale + 0.1) }))}
              className="p-1 text-gray-300 hover:text-white"
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="h-6 w-px bg-gray-500 mx-1"></div>

          {/* Color/BW */}
          <button 
            onClick={() => setPrintConfig(p => ({ ...p, grayscale: !p.grayscale }))}
            className={`text-xs px-2 py-1 rounded border ${printConfig.grayscale ? 'bg-gray-500 border-gray-400 text-white' : 'bg-transparent border-gray-500 text-gray-300'}`}
          >
            {printConfig.grayscale ? '白黒' : 'カラー'}
          </button>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setShowPrintPreview(false)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold transition-colors"
          >
            閉じる
          </button>
          <button 
            onClick={executePrint}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Check size={16} /> 印刷実行
          </button>
        </div>
      </div>

      {/* Preview Paper Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 flex justify-center items-start print:overflow-visible print:h-auto print:block print:p-0 bg-gray-200">
        <div 
          id="print-preview-content"
          className="bg-white shadow-2xl p-8 mx-auto print:shadow-none print:w-full print:max-w-none print:p-0 print:m-0 transition-all duration-200 origin-top"
          style={{
            zoom: printConfig.scale,
            filter: printConfig.grayscale ? 'grayscale(100%)' : 'none',
            width: printConfig.orientation === 'landscape' ? '297mm' : '210mm',
            minHeight: printConfig.orientation === 'landscape' ? '210mm' : '297mm',
          }}
        >
          
          {/* Print Header */}
          <div className="mb-6 border-b pb-4">
             <h2 className="text-3xl font-bold text-gray-800 mb-2">ハッピースマイル シフト表</h2>
             <div className="flex justify-between items-end">
               <p className="text-xl text-gray-600">{format(currentDate, 'yyyy年 M月', { locale: ja })}</p>
               <p className="text-sm text-gray-400">作成日: {format(new Date(), 'yyyy/MM/dd', { locale: ja })}</p>
             </div>
          </div>

          {activeTab === 'schedule' && renderScheduleGrid()}
          {activeTab === 'requests' && renderRequestsList()}
          {activeTab === 'staff' && renderStaffManagement()}
        </div>
      </div>
    </div>
  );

  const renderDayDetailModal = () => {
    if (!selectedDate || showPrintPreview) return null; // Hide modal in preview
    const { dayRequests, dayShifts } = getDayData(selectedDate);
    const uniqueStaff = Array.from(new Set(dayShifts.map(s => s.staffName)));

    return (
      <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 print:hidden">
        <div className="bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full md:max-w-3xl overflow-hidden h-[90vh] md:max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="bg-orange-100 p-4 md:p-6 flex justify-between items-center border-b border-orange-200 flex-shrink-0">
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-orange-800">
                {format(selectedDate, 'yyyy年 M月 d日 (eee)', { locale: ja })}
              </h3>
              <p className="text-orange-600 text-sm mt-1">詳細情報</p>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => selectedDate && handleDayPrint(selectedDate)} 
                className="p-2 bg-white/50 hover:bg-orange-200 rounded-full transition-colors text-orange-700 border border-orange-200"
                title="この日を印刷"
              >
                <Printer size={24} />
              </button>
              <button 
                onClick={() => setSelectedDate(null)} 
                className="p-2 hover:bg-orange-200 rounded-full transition-colors text-orange-700"
              >
                <X size={24} />
              </button>
            </div>
          </div>
          
          {/* Body */}
          <div className="p-4 md:p-6 overflow-y-auto flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {/* Children Column */}
              <div>
                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-lg border-b pb-2 sticky top-0 bg-white z-10">
                  <Smile className="text-orange-500 w-6 h-6"/> 
                  登園予定
                  <span className="ml-2 bg-orange-100 text-orange-800 text-sm px-2 py-0.5 rounded-full">{dayRequests.length}名</span>
                </h4>
                <ul className="space-y-3">
                  {dayRequests.length === 0 ? (
                    <p className="text-gray-400 italic p-4 text-center bg-gray-50 rounded-lg">予定はありません</p>
                  ) : (
                    dayRequests.map(req => (
                      <li key={req.id} className="bg-orange-50 p-4 rounded-xl border border-orange-100 shadow-sm relative group pr-14">
                        <div className="flex justify-between items-start">
                          <div className="font-bold text-lg text-gray-800">{req.childName}</div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs font-bold px-2 py-1 bg-white text-orange-600 rounded-md border border-orange-100">
                              {req.arrivalTime && req.departureTime ? `${req.arrivalTime}〜${req.departureTime}` : req.timeSlot?.split(' ')[0]}
                            </span>
                            <div className="flex flex-col items-end gap-1">
                              {req.pickup && (
                                <div className="flex items-center gap-1">
                                  {req.pickupLocation && <span className="text-[9px] text-gray-500">{req.pickupLocation}</span>}
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-orange-500 text-white rounded">迎え</span>
                                </div>
                              )}
                              {req.dropOff && (
                                <div className="flex items-center gap-1">
                                  {req.dropOffLocation && <span className="text-[9px] text-gray-500">{req.dropOffLocation}</span>}
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-500 text-white rounded">送り</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        {req.notes && (
                           <div className="mt-2 text-sm text-gray-600 bg-white p-2 rounded-lg border border-orange-100">
                             <span className="font-bold text-orange-400 text-xs mr-1">備考:</span>
                             {req.notes}
                           </div>
                        )}
                        <button 
                           type="button"
                           onClick={(e) => { 
                             e.preventDefault();
                             e.stopPropagation();
                             confirmDeleteRequest(req); 
                           }}
                           onMouseDown={(e) => e.stopPropagation()} // Prevent drag/selection interference
                           className="absolute top-1/2 -translate-y-1/2 right-2 p-3 bg-white text-gray-400 hover:text-red-500 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-full transition-all shadow-sm z-30 cursor-pointer"
                           title="削除"
                           aria-label="削除"
                        >
                           <Trash2 size={20} />
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>

              {/* Staff Column */}
              <div>
                <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2 text-lg border-b pb-2 sticky top-0 bg-white z-10">
                  <Users className="text-green-600 w-6 h-6"/> 
                  担当スタッフ
                  <span className="ml-2 bg-green-100 text-green-800 text-sm px-2 py-0.5 rounded-full">{uniqueStaff.length}名</span>
                </h4>
                <ul className="space-y-3">
                  {uniqueStaff.length === 0 ? (
                    <div className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                      <p className="text-gray-400 mb-2">シフトは未作成です</p>
                      <button 
                        onClick={() => { setSelectedDate(null); handleAutoGenerate(); }}
                        className="text-sm text-purple-600 underline hover:text-purple-800"
                      >
                        AIで自動作成する
                      </button>
                    </div>
                  ) : (
                    uniqueStaff.map((name: string) => (
                      <li key={name} className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-200 flex items-center justify-center text-green-700 font-bold">
                          {name.charAt(0)}
                        </div>
                        <span className="font-bold text-green-800 text-lg">{name}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Footer */}
          <div className="bg-gray-50 p-4 border-t flex justify-end flex-shrink-0 safe-area-pb">
            <button 
              onClick={() => setSelectedDate(null)}
              className="w-full md:w-auto px-6 py-3 md:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg font-bold transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Main Render Logic
  if (showPrintPreview) {
    return renderPrintPreview();
  }

  return (
    <div className="min-h-screen bg-orange-50 pb-safe print:bg-white print:pb-0">
      {renderDayDetailModal()}
      {renderDeleteConfirmModal()}
      
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-20 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex justify-between items-center">
          <h1 className="text-xl md:text-2xl font-bold text-orange-600 flex items-center gap-2 truncate">
            <Settings className="w-5 h-5 md:w-6 md:h-6 flex-shrink-0" />
            <span className="truncate">管理者ダッシュボード</span>
          </h1>
          <button 
            onClick={onLogout}
            className="flex items-center gap-1 md:gap-2 text-gray-500 hover:text-red-500 px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-red-50 transition-colors text-sm md:text-base whitespace-nowrap"
          >
            <LogOut size={16} className="md:w-[18px] md:h-[18px]" />
            <span className="hidden md:inline">ログアウト</span>
            <span className="md:hidden">退出</span>
          </button>
        </div>
        
        {/* Scrollable Tabs */}
        <div className="max-w-7xl mx-auto px-4 mt-1 overflow-x-auto no-scrollbar">
          <div className="flex gap-4 min-w-max">
            <button 
              onClick={() => setActiveTab('schedule')}
              className={`pb-2 md:pb-3 px-2 md:px-4 font-bold border-b-4 transition-colors text-sm md:text-base ${activeTab === 'schedule' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              シフト表
            </button>
            <button 
              onClick={() => setActiveTab('requests')}
              className={`pb-2 md:pb-3 px-2 md:px-4 font-bold border-b-4 transition-colors text-sm md:text-base ${activeTab === 'requests' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              登園希望リスト
            </button>
            <button 
              onClick={() => setActiveTab('staff')}
              className={`pb-2 md:pb-3 px-2 md:px-4 font-bold border-b-4 transition-colors text-sm md:text-base ${activeTab === 'staff' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              スタッフ管理
            </button>
            <button 
              onClick={() => setActiveTab('codes')}
              className={`pb-2 md:pb-3 px-2 md:px-4 font-bold border-b-4 transition-colors text-sm md:text-base ${activeTab === 'codes' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              保護者コード管理
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-4 md:py-8 print:p-0 print:max-w-none">
        {activeTab === 'schedule' && renderSchedule()}
        {activeTab === 'requests' && renderRequestsList()}
        {activeTab === 'staff' && renderStaffManagement()}
        {activeTab === 'codes' && renderParentCodeManagement()}
      </main>
    </div>
  );
};

export default AdminDashboard;