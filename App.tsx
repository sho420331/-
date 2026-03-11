import React, { useState } from 'react';
import ParentPortal from './components/ParentPortal';
import AdminDashboard from './components/AdminDashboard';
import AdminLogin from './components/AdminLogin';
import { AttendanceRequest, Staff, ShiftAssignment, ParentCode } from './types';
import { Users, User, Sun, BookOpen, HelpCircle, X, FileQuestion, Info, CheckCircle, AlertTriangle, RefreshCw, Printer, Wifi, Monitor, Smartphone, Share, MousePointerClick, Calendar, Key } from 'lucide-react';
import { format, addDays } from 'date-fns';

enum ViewState {
  HOME,
  PARENT,
  ADMIN_LOGIN,
  ADMIN_DASHBOARD,
}

// Mock initial data
const INITIAL_STAFF: Staff[] = [
  { id: '1', name: '佐藤 先生', role: '保育士', isAvailable: true, workSchedule: '平日のみ (土日休み)' },
  { id: '2', name: '鈴木 先生', role: '指導員', isAvailable: true, workSchedule: '毎週火曜・木曜休み' },
  { id: '3', name: '高橋 先生', role: '保育士', isAvailable: false, workSchedule: '育休中' },
  { id: '4', name: '田中 先生', role: '指導員', isAvailable: true, workSchedule: '全日可' },
  { id: '5', name: '伊藤 先生', role: '保育士', isAvailable: true, workSchedule: '週3日勤務 (月・水・金)' },
];

const INITIAL_REQUESTS: AttendanceRequest[] = [
    { id: '1', childName: '山田 太郎', date: format(new Date(), 'yyyy-MM-dd'), arrivalTime: '09:00', departureTime: '17:00', pickup: true, dropOff: true, submittedAt: new Date().toISOString() },
    { id: '2', childName: '木村 花子', date: format(new Date(), 'yyyy-MM-dd'), arrivalTime: '09:00', departureTime: '13:00', pickup: false, dropOff: true, submittedAt: new Date().toISOString() },
    { id: '3', childName: '鈴木 健太', date: format(addDays(new Date(), 1), 'yyyy-MM-dd'), arrivalTime: '13:00', departureTime: '17:00', pickup: true, dropOff: false, submittedAt: addDays(new Date(), -1).toISOString() },
];

const INITIAL_PARENT_CODES: ParentCode[] = [
  { code: '1234', childName: '山田 太郎', defaultPickupLocation: '自宅', defaultDropOffLocation: '自宅' },
  { code: '5678', childName: '木村 花子', defaultPickupLocation: '木村家', defaultDropOffLocation: '木村家' },
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.HOME);
  const [requests, setRequests] = useState<AttendanceRequest[]>(INITIAL_REQUESTS);
  const [staffList, setStaffList] = useState<Staff[]>(INITIAL_STAFF);
  const [shifts, setShifts] = useState<ShiftAssignment[]>([]);
  const [parentCodes, setParentCodes] = useState<ParentCode[]>(INITIAL_PARENT_CODES);
  
  // Modal States
  const [showManual, setShowManual] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handleParentSubmit = (newRequests: AttendanceRequest[]) => {
    setRequests(prev => [...prev, ...newRequests]);
  };

  const renderManualModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4 md:p-6 flex justify-between items-center text-white shadow-md flex-shrink-0">
          <h3 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BookOpen className="w-7 h-7" /> 取扱説明書
          </h3>
          <button onClick={() => setShowManual(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 overflow-y-auto bg-gray-50 text-gray-800">
          
          {/* Introduction */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8">
            <h4 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2 border-b pb-2">
              <Smartphone className="text-purple-500" /> アプリを始める準備
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <span className="font-bold text-purple-700 block mb-2">1. アクセス方法</span>
                <p className="text-sm text-gray-600">
                  施設から配布されたQRコードまたはURLからアクセスしてください。インターネット接続が必要です。
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                <span className="font-bold text-purple-700 block mb-2">2. ホーム画面に追加</span>
                <p className="text-sm text-gray-600">
                  ブラウザのメニューから「ホーム画面に追加」を行うと、アプリのようにワンタップで起動できて便利です。
                </p>
              </div>
            </div>
          </div>

          {/* For Parents */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-2 h-full bg-orange-400"></div>
            <h4 className="text-xl font-bold text-orange-600 mb-4 flex items-center gap-2">
              <User className="fill-orange-100" /> 保護者の方：登園希望の出し方
            </h4>
            <ol className="relative border-l-2 border-orange-200 ml-3 space-y-6">
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full -left-4 ring-4 ring-white">
                  <span className="text-orange-600 font-bold">1</span>
                </span>
                <h5 className="font-bold text-gray-800 mb-1">保護者コードの入力</h5>
                <p className="text-sm text-gray-600">
                  「保護者の方はこちら」を開き、施設から配布された<span className="font-bold text-orange-600">「保護者コード」</span>を入力してください。お子様のお名前が自動的に入力されます。
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full -left-4 ring-4 ring-white">
                  <span className="text-orange-600 font-bold">2</span>
                </span>
                <h5 className="font-bold text-gray-800 mb-1">カレンダーで日付をタップ</h5>
                <p className="text-sm text-gray-600 mb-2">
                  登園したい日をカレンダーからタップします。タップすると詳細設定画面が開きます。
                </p>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full -left-4 ring-4 ring-white">
                  <span className="text-orange-600 font-bold">3</span>
                </span>
                <h5 className="font-bold text-gray-800 mb-1">時間の詳細と送迎の指定</h5>
                <p className="text-sm text-gray-600 mb-2">
                  詳細画面で「登園・退園時間」を確認し、必要に応じて変更します。
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-bold text-blue-600">送迎希望：</span>「迎え」や「送り」をチェックすると、登録済みの場所が自動入力されます。場所が異なる場合は手書きで修正も可能です。
                </p>
                <div className="bg-orange-50 p-2 rounded text-xs text-orange-800 border border-orange-100 inline-block">
                   <CheckCircle size={14} className="inline mr-1"/>
                   設定が終わったら「保存」を押してカレンダーに戻ります。
                </div>
              </li>
              <li className="mb-2 ml-6">
                <span className="absolute flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full -left-4 ring-4 ring-white">
                  <span className="text-orange-600 font-bold">4</span>
                </span>
                <h5 className="font-bold text-gray-800 mb-1">まとめて送信</h5>
                <p className="text-sm text-gray-600">
                  すべての希望を入力し終えたら、画面右側の「希望を送信する」ボタンを押して完了です。
                </p>
              </li>
            </ol>
          </div>

          {/* For Admins */}
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-8 relative overflow-hidden">
             <div className="absolute top-0 left-0 w-2 h-full bg-blue-500"></div>
            <h4 className="text-xl font-bold text-blue-600 mb-4 flex items-center gap-2">
              <Users className="fill-blue-100" /> 管理者の方：運用手順
            </h4>
            
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">01</div>
                <div>
                   <h5 className="font-bold text-gray-800">保護者コードの事前登録</h5>
                   <p className="text-sm text-gray-600">
                     「保護者コード管理」タブで、各ご家庭のコード・お子様名・デフォルトの送迎場所を登録します。登録したコードを保護者に配布してください。
                   </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">02</div>
                <div>
                   <h5 className="font-bold text-gray-800">スタッフ設定とAIシフト作成</h5>
                   <p className="text-sm text-gray-600 mb-1">
                     「スタッフ管理」タブで出勤可能なスタッフを設定します。その後「シフト表」タブの<span className="font-bold text-purple-600">「AI作成」</span>ボタンを押すと、登園人数に合わせて自動でシフトが組まれます。
                   </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold">03</div>
                <div>
                   <h5 className="font-bold text-gray-800">日別詳細の確認とレポート印刷</h5>
                   <p className="text-sm text-gray-600 mb-2">
                     カレンダーの日付をタップすると、その日の「登園児一覧（送迎場所・備考含む）」と「担当スタッフ」が確認できます。
                   </p>
                   <p className="text-sm text-gray-600">
                     画面内のプリンターアイコンから、その日の「日別詳細レポート」を印刷して現場で活用できます。
                   </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );

  const renderHelpModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-red-100 p-4 md:p-6 flex justify-between items-center border-b border-red-200 flex-shrink-0">
          <h3 className="text-xl font-bold text-red-800 flex items-center gap-2">
            <HelpCircle className="w-6 h-6" /> トラブルシューティング
          </h3>
          <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-red-200 rounded-full text-red-700">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-4 md:p-8 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Trouble 1: Parent Codes */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-3">
                <Key className="text-orange-500" size={24} />
                <h4 className="font-bold text-lg text-gray-800">Q. 保護者コードを入れても名前が出ない</h4>
              </div>
              <div className="p-5 text-gray-700 space-y-4">
                 <ul className="space-y-3 text-sm">
                   <li className="flex gap-2">
                     <span className="text-red-500 font-bold">・</span>
                     <span>管理者側でコードが正しく登録されているか確認してください。</span>
                   </li>
                   <li className="flex gap-2">
                     <span className="text-red-500 font-bold">・</span>
                     <span>半角数字で入力されているか確認してください（全角だと反応しない場合があります）。</span>
                   </li>
                 </ul>
              </div>
            </div>

            {/* Trouble 2: Printing */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-3">
                <Printer className="text-red-500" size={24} />
                <h4 className="font-bold text-lg text-gray-800">Q. レポートが印刷できない</h4>
              </div>
              <div className="p-5 text-gray-700 space-y-4">
                 <div className="bg-yellow-50 p-3 rounded-lg flex gap-2 text-sm text-yellow-800">
                   <AlertTriangle size={18} className="flex-shrink-0" />
                   ブラウザの「ポップアップブロック」が原因のほとんどです。
                 </div>
                 <p className="text-sm text-gray-600">
                   画面上部に「ポップアップをブロックしました」と表示されたら、それをクリックして<span className="font-bold">「常に許可」</span>に設定してください。
                 </p>
              </div>
            </div>

            {/* Trouble 3: AI Generation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gray-50 p-4 border-b border-gray-200 flex items-center gap-3">
                <Wand2IconWrapper className="text-purple-500" />
                <h4 className="font-bold text-lg text-gray-800">Q. AI作成がうまくいかない</h4>
              </div>
              <div className="p-5 text-gray-700 space-y-4 text-sm">
                 <p>以下の点を確認してください：</p>
                 <ul className="list-disc ml-5 space-y-1">
                   <li>スタッフ管理で、出勤可能なスタッフが1名以上登録されていますか？</li>
                   <li>その期間に保護者からの登園希望が1件以上ありますか？</li>
                   <li>ネット接続は安定していますか？</li>
                 </ul>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );

  const renderHome = () => (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-100 to-yellow-100">
      {/* Modals */}
      {showManual && renderManualModal()}
      {showHelp && renderHelpModal()}

      <div className="text-center mb-10 animate-fade-in-up">
        <div className="inline-block p-4 rounded-full bg-white shadow-xl mb-6">
          <Sun className="w-16 h-16 text-orange-500 animate-spin-slow" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-orange-600 mb-4 tracking-tight drop-shadow-sm">
          ハッピースマイル<br className="md:hidden" />シフト管理
        </h1>
        <p className="text-gray-600 text-lg">
          みんなの笑顔をつなぐ、<br/>やさしいシフト管理アプリ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 w-full max-w-4xl px-4 mb-12">
        <button
          onClick={() => setCurrentView(ViewState.PARENT)}
          className="group relative overflow-hidden bg-white hover:bg-orange-50 p-6 md:p-8 rounded-3xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-4 border-transparent hover:border-orange-300 active:scale-95"
        >
          <div className="flex flex-col items-center">
            <div className="bg-orange-100 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
              <User className="w-12 h-12 text-orange-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">保護者の方はこちら</h2>
            <p className="text-gray-500">登園希望の入力</p>
          </div>
        </button>

        <button
          onClick={() => setCurrentView(ViewState.ADMIN_LOGIN)}
          className="group relative overflow-hidden bg-white hover:bg-blue-50 p-6 md:p-8 rounded-3xl shadow-xl transition-all duration-300 transform hover:-translate-y-2 border-4 border-transparent hover:border-blue-300 active:scale-95"
        >
          <div className="flex flex-col items-center">
             <div className="bg-blue-100 p-6 rounded-full mb-6 group-hover:scale-110 transition-transform">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">管理者の方はこちら</h2>
            <p className="text-gray-500">シフト作成・管理</p>
          </div>
        </button>
      </div>

      {/* Footer / Support Links */}
      <div className="flex flex-wrap gap-4 justify-center items-center w-full max-w-2xl px-4">
        <button 
          onClick={() => setShowManual(true)}
          className="flex items-center gap-2 bg-white/80 hover:bg-white px-5 py-3 rounded-full text-green-700 font-bold shadow-sm hover:shadow transition-all border border-green-100"
        >
          <BookOpen size={18} />
          取扱説明書
        </button>
        <button 
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-2 bg-white/80 hover:bg-white px-5 py-3 rounded-full text-red-700 font-bold shadow-sm hover:shadow transition-all border border-red-100"
        >
          <HelpCircle size={18} />
          トラブルシューティング
        </button>
      </div>
      
      <footer className="absolute bottom-4 text-gray-400 text-sm hidden md:block">
        &copy; Happy Smile Facility
      </footer>
    </div>
  );

  return (
    <div className="font-sans">
      {currentView === ViewState.HOME && renderHome()}
      {currentView === ViewState.PARENT && (
        <ParentPortal 
          onSubmit={handleParentSubmit} 
          onBack={() => setCurrentView(ViewState.HOME)} 
          parentCodes={parentCodes}
        />
      )}
      {currentView === ViewState.ADMIN_LOGIN && (
        <AdminLogin 
          onLoginSuccess={() => setCurrentView(ViewState.ADMIN_DASHBOARD)} 
          onBack={() => setCurrentView(ViewState.HOME)} 
        />
      )}
      {currentView === ViewState.ADMIN_DASHBOARD && (
        <AdminDashboard 
          requests={requests} 
          setRequests={setRequests}
          staffList={staffList} 
          setStaffList={setStaffList}
          shifts={shifts}
          setShifts={setShifts}
          parentCodes={parentCodes}
          setParentCodes={setParentCodes}
          onLogout={() => setCurrentView(ViewState.HOME)} 
        />
      )}
    </div>
  );
};

// Helper component for Wand2 icon to avoid import conflict if needed, 
// though here we just use the Lucide one.
const Wand2IconWrapper = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M15 4V2" />
    <path d="M15 16v-2" />
    <path d="M8 9h2" />
    <path d="M20 9h2" />
    <path d="M17.8 11.8 19 13" />
    <path d="M15 9h0" />
    <path d="M17.8 6.2 19 5" />
    <path d="m3 21 9-9" />
    <path d="M12.2 6.2 11 5" />
  </svg>
);

export default App;