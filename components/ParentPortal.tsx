import React, { useState } from 'react';
import { AttendanceRequest, TimeSlot, ParentCode } from '../types';
import { Calendar as CalendarIcon, CheckCircle, Smile, ChevronLeft, ChevronRight, Sun, Coffee, Moon, Trash2, Clock, Key } from 'lucide-react';
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ParentPortalProps {
  onSubmit: (requests: AttendanceRequest[]) => void;
  onBack: () => void;
  parentCodes: ParentCode[];
}

const ParentPortal: React.FC<ParentPortalProps> = ({ onSubmit, onBack, parentCodes }) => {
  const [childName, setChildName] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Store selections as a map: { "YYYY-MM-DD": Partial<AttendanceRequest> }
  const [selections, setSelections] = useState<Record<string, Partial<AttendanceRequest>>>({});
  
  // Modal for editing a specific date
  const [editingDate, setEditingDate] = useState<string | null>(null);
  const [tempRequest, setTempRequest] = useState<Partial<AttendanceRequest>>({});
  
  const [submitted, setSubmitted] = useState(false);

  // Calendar Logic
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  const handleCodeChange = (code: string) => {
    setParentCode(code);
    const found = parentCodes.find(c => c.code === code);
    if (found) {
      setChildName(found.childName);
    }
  };

  const handlePickupChange = (checked: boolean) => {
    const found = parentCodes.find(c => c.code === parentCode);
    setTempRequest({
      ...tempRequest, 
      pickup: checked,
      pickupLocation: checked && found ? found.defaultPickupLocation : tempRequest.pickupLocation
    });
  };

  const handleDropOffChange = (checked: boolean) => {
    const found = parentCodes.find(c => c.code === parentCode);
    setTempRequest({
      ...tempRequest, 
      dropOff: checked,
      dropOffLocation: checked && found ? found.defaultDropOffLocation : tempRequest.dropOffLocation
    });
  };

  const handleDateClick = (day: Date) => {
    const dateKey = format(day, 'yyyy-MM-dd');
    const existing = selections[dateKey];
    
    setEditingDate(dateKey);
    setTempRequest(existing || {
      arrivalTime: '09:00',
      departureTime: '17:00',
      pickup: false,
      dropOff: false
    });
  };

  const saveRequest = () => {
    if (editingDate) {
      setSelections(prev => ({
        ...prev,
        [editingDate]: tempRequest
      }));
      setEditingDate(null);
    }
  };

  const removeRequest = (dateKey: string) => {
    setSelections(prev => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!childName) return;
    
    const dateKeys = Object.keys(selections);
    if (dateKeys.length === 0) return;

    const newRequests: AttendanceRequest[] = dateKeys.map((dateStr, index) => ({
      id: `${Date.now()}-${index}`,
      childName,
      date: dateStr,
      ...selections[dateStr],
      submittedAt: new Date().toISOString(),
    } as AttendanceRequest));

    onSubmit(newRequests);
    setSubmitted(true);
    
    // Reset after success
    setTimeout(() => {
      setSubmitted(false);
      setSelections({});
    }, 3000);
  };

  const getSlotColor = (slot: TimeSlot) => {
    switch (slot) {
      case TimeSlot.FULL_DAY: return 'bg-orange-400 text-white border-orange-400';
      case TimeSlot.MORNING: return 'bg-yellow-400 text-white border-yellow-400';
      case TimeSlot.AFTERNOON: return 'bg-blue-400 text-white border-blue-400';
      default: return 'bg-white text-gray-700 border-gray-200';
    }
  };

  const getSlotIcon = (slot: TimeSlot) => {
    switch (slot) {
      case TimeSlot.FULL_DAY: return <Sun size={16} />;
      case TimeSlot.MORNING: return <Coffee size={16} />;
      case TimeSlot.AFTERNOON: return <Moon size={16} />;
      default: return null;
    }
  };

  const getSlotLabel = (slot: TimeSlot) => {
     switch (slot) {
      case TimeSlot.FULL_DAY: return '一日';
      case TimeSlot.MORNING: return '午前';
      case TimeSlot.AFTERNOON: return '午後';
      default: return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6 pb-20">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl md:text-3xl font-bold text-orange-600 flex items-center gap-2">
          <Smile className="w-6 h-6 md:w-8 md:h-8" />
          保護者専用ページ
        </h2>
        <button 
          onClick={onBack}
          className="text-gray-500 hover:text-gray-700 underline text-sm md:text-base"
        >
          トップに戻る
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border-4 border-orange-200">
        
        {submitted ? (
           <div className="p-12 flex flex-col items-center justify-center min-h-[400px]">
             <div className="bg-green-100 p-6 rounded-full mb-6 animate-bounce">
                <CheckCircle className="w-16 h-16 text-green-500" />
             </div>
             <h3 className="text-3xl font-bold text-green-700 mb-2">送信完了！</h3>
             <p className="text-gray-600 text-lg">登園希望を受け付けました。<br/>ご協力ありがとうございます。</p>
           </div>
        ) : (
          <div className="flex flex-col md:flex-row">
            {/* Left Panel: Inputs & Calendar */}
            <div className="flex-1 p-4 md:p-6">
              
              {/* Code & Name Input */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <label className="block text-gray-700 font-bold text-sm md:text-base flex items-center gap-2">
                    <Key size={18} className="text-orange-500" /> 保護者コード
                  </label>
                  <input
                    type="text"
                    value={parentCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="例：1234"
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-0 text-base md:text-lg bg-gray-50 transition-colors font-mono"
                  />
                  <p className="text-[10px] text-gray-400 ml-1">※コードを入力するとお名前が自動入力されます</p>
                </div>
                <div className="space-y-2">
                  <label className="block text-gray-700 font-bold text-sm md:text-base">お子様のお名前</label>
                  <input
                    type="text"
                    required
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    placeholder="例：山田 太郎"
                    className="w-full p-3 rounded-xl border-2 border-gray-200 focus:border-orange-400 focus:ring-0 text-base md:text-lg bg-gray-50 transition-colors"
                  />
                </div>
              </div>

              {/* Calendar Header */}
              <div className="flex justify-between items-center mb-4 bg-orange-50 p-2 rounded-xl">
                 <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-orange-200 rounded-full text-orange-600 active:bg-orange-300">
                   <ChevronLeft />
                 </button>
                 <span className="text-lg md:text-xl font-bold text-gray-700">
                   {format(currentMonth, 'yyyy年 M月', { locale: ja })}
                 </span>
                 <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-orange-200 rounded-full text-orange-600 active:bg-orange-300">
                   <ChevronRight />
                 </button>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 md:gap-2 mb-6 select-none">
                {['日', '月', '火', '水', '木', '金', '土'].map((day, i) => (
                  <div key={i} className={`text-center text-xs md:text-sm font-bold py-1 ${i===0 ? 'text-red-500' : i===6 ? 'text-blue-500' : 'text-gray-400'}`}>
                    {day}
                  </div>
                ))}
                
                {calendarDays.map((day) => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isSelected = !!selections[dateKey];
                  const request = selections[dateKey];
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => handleDateClick(day)}
                      className={`
                        relative h-12 md:h-16 rounded-lg md:rounded-xl border-2 flex flex-col items-center justify-center md:justify-start pt-0 md:pt-1 transition-all duration-200 touch-manipulation active:scale-95
                        ${!isCurrentMonth ? 'opacity-30' : ''}
                        ${isSelected 
                          ? 'bg-orange-400 text-white border-orange-400' 
                          : 'bg-white border-gray-100 text-gray-700 hover:border-orange-200 hover:bg-orange-50'
                        }
                        ${isToday && !isSelected ? 'border-orange-300 ring-2 ring-orange-100' : ''}
                      `}
                    >
                      <span className={`text-sm font-bold ${isSelected ? 'text-white' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {isSelected && (
                         <div className="mt-0.5 md:mt-1">
                           <div className="text-[10px] leading-tight hidden md:block">
                             {request.arrivalTime}〜{request.departureTime}
                           </div>
                           <div className="md:hidden w-2 h-2 rounded-full bg-white"></div>
                         </div>
                      )}
                    </button>
                  );
                })}
              </div>
              
              <p className="text-xs text-gray-400 text-center">
                ※ 日付をタップすると、登園時間などの詳細を入力できます。
              </p>
            </div>

            {/* Right Panel: Summary & Submit */}
            <div className="md:w-80 bg-orange-50 border-t md:border-t-0 md:border-l border-orange-100 p-4 md:p-6 flex flex-col">
              <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
                <CheckCircle size={20} className="text-orange-500"/>
                選択中の日程
                <span className="bg-orange-200 text-orange-800 text-xs px-2 py-1 rounded-full">{Object.keys(selections).length}日</span>
              </h4>
              
              <div className="flex-1 overflow-y-auto max-h-[400px] mb-4 space-y-2 pr-2">
                {Object.keys(selections).length === 0 ? (
                  <p className="text-gray-400 text-sm text-center py-8">カレンダーから登園希望日を選択してください</p>
                ) : (
                  Object.entries(selections)
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([date, req]: [string, any]) => (
                    <div key={date} className="bg-white p-3 rounded-lg shadow-sm border border-orange-100 flex justify-between items-center animate-in slide-in-from-left-2 duration-300">
                      <div className="flex-1">
                        <div className="font-bold text-gray-700">{format(new Date(date), 'M/d (eee)', { locale: ja })}</div>
                        <div className="text-xs text-gray-500 flex flex-wrap gap-x-2">
                          <span className="flex items-center gap-0.5"><Clock size={10}/>{req.arrivalTime}〜{req.departureTime}</span>
                          {req.pickup && <span className="text-orange-600 font-medium">迎え有</span>}
                          {req.dropOff && <span className="text-orange-600 font-medium">送り有</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button 
                          onClick={() => handleDateClick(new Date(date))}
                          className="text-gray-400 hover:text-orange-500 p-1.5 active:bg-gray-100 rounded-full"
                        >
                          <Smile size={16} />
                        </button>
                        <button 
                          onClick={() => removeRequest(date)}
                          className="text-gray-400 hover:text-red-500 p-1.5 active:bg-gray-100 rounded-full"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <button
                onClick={handleSubmit}
                disabled={Object.keys(selections).length === 0 || !childName}
                className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg transform transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-6 h-6" />
                希望を送信する
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail Input Modal */}
      {editingDate && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="bg-orange-500 p-6 text-white flex justify-between items-center">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <CalendarIcon size={24} />
                {format(new Date(editingDate), 'M月d日 (eee)', { locale: ja })}
              </h3>
              <button onClick={() => setEditingDate(null)} className="p-1 hover:bg-white/20 rounded-full">
                <Trash2 size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">登園時間</label>
                  <input 
                    type="time" 
                    value={tempRequest.arrivalTime}
                    onChange={(e) => setTempRequest({...tempRequest, arrivalTime: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 focus:ring-0 bg-gray-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">退園時間</label>
                  <input 
                    type="time" 
                    value={tempRequest.departureTime}
                    onChange={(e) => setTempRequest({...tempRequest, departureTime: e.target.value})}
                    className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 focus:ring-0 bg-gray-50 font-bold"
                  />
                </div>
              </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 cursor-pointer hover:border-orange-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={tempRequest.pickup}
                        onChange={(e) => handlePickupChange(e.target.checked)}
                        className="w-6 h-6 rounded-lg text-orange-500 focus:ring-orange-400 border-gray-300"
                      />
                      <span className="font-bold text-gray-700">迎え（施設からの迎え）を希望する</span>
                    </label>
                    {tempRequest.pickup && (
                      <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">どこに？ (例: 自宅、学校名など)</label>
                        <input 
                          type="text"
                          value={tempRequest.pickupLocation || ''}
                          onChange={(e) => setTempRequest({...tempRequest, pickupLocation: e.target.value})}
                          placeholder="迎え場所を入力"
                          className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 focus:ring-0 bg-white text-sm"
                        />
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 bg-gray-50 cursor-pointer hover:border-orange-200 transition-colors">
                      <input 
                        type="checkbox" 
                        checked={tempRequest.dropOff}
                        onChange={(e) => handleDropOffChange(e.target.checked)}
                        className="w-6 h-6 rounded-lg text-orange-500 focus:ring-orange-400 border-gray-300"
                      />
                      <span className="font-bold text-gray-700">送り（施設からの送り）を希望する</span>
                    </label>
                    {tempRequest.dropOff && (
                      <div className="px-4 pb-2 animate-in slide-in-from-top-2 duration-200">
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">どこに？ (例: 自宅、塾など)</label>
                        <input 
                          type="text"
                          value={tempRequest.dropOffLocation || ''}
                          onChange={(e) => setTempRequest({...tempRequest, dropOffLocation: e.target.value})}
                          placeholder="送り場所を入力"
                          className="w-full p-3 rounded-xl border-2 border-gray-100 focus:border-orange-400 focus:ring-0 bg-white text-sm"
                        />
                      </div>
                    )}
                  </div>
                </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    removeRequest(editingDate);
                    setEditingDate(null);
                  }}
                  className="flex-1 py-3 px-4 rounded-xl border-2 border-gray-200 text-gray-500 font-bold hover:bg-gray-50 transition-colors"
                >
                  解除
                </button>
                <button 
                  onClick={saveRequest}
                  className="flex-[2] py-3 px-4 rounded-xl bg-orange-500 text-white font-bold hover:bg-orange-600 shadow-lg shadow-orange-200 transition-all transform active:scale-95"
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPortal;