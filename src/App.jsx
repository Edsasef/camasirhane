import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Clock, PlusCircle, Settings, Home, Play, XCircle, AlertTriangle, ChevronLeft, ChevronRight, Lock, User, LogOut, CheckCircle, Smartphone } from 'lucide-react';
import { supabase } from './supabaseClient';

const saatDilimleri = [
  { id: 1, etiket: '1. Yıkama', saat: '09:00 - 09:45', tip: 'yikama' },
  { id: 2, etiket: '2. Yıkama', saat: '10:00 - 10:45', tip: 'yikama' },
  { id: 3, etiket: '3. Yıkama', saat: '11:00 - 11:45', tip: 'yikama' },
  { id: 'ogle', etiket: 'ÖĞLE ARASI', saat: '12:30 - 13:30', tip: 'mola' },
  { id: 4, etiket: '4. Yıkama', saat: '14:00 - 14:45', tip: 'yikama' },
  { id: 5, etiket: '5. Yıkama', saat: '15:00 - 15:45', tip: 'yikama' },
  { id: 6, etiket: '6. Yıkama', saat: '16:00 - 16:45', tip: 'yikama' },
];

const ayIsimleri = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
const gunIsimleri = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];

const getLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export default function App() {
  const [view, setView] = useState('home'); 
  
  const [sysMonth, setSysMonth] = useState(new Date());
  const [sysDate, setSysDate] = useState(getLocalDateStr(new Date()));

  const [adminMonth, setAdminMonth] = useState(new Date());
  const [adminDate, setAdminDate] = useState(getLocalDateStr(new Date()));

  const isAdmin = view.includes('admin');
  const isKiz = view.includes('kiz');

  const activeDate = isAdmin ? adminDate : sysDate;
  const activeMonth = isAdmin ? adminMonth : sysMonth;
  const setActiveDate = (val) => isAdmin ? setAdminDate(val) : setSysDate(val);
  const setActiveMonth = (val) => isAdmin ? setAdminMonth(val) : setSysMonth(val);

  const [lastRealDay, setLastRealDay] = useState(getLocalDateStr(new Date()));
  const [randevular, setRandevular] = useState([]);
  
  const [formData, setFormData] = useState({ 
    adSoyad: '', 
    odaNo: '', 
    makineNo: '1',
    randevuTarihi: getLocalDateStr(new Date()), 
    baslangicSaati: '09:00' 
  });
  
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
  
  const [toast, setToast] = useState({ isOpen: false, message: '', type: 'success' });
  const [now, setNow] = useState(Date.now());

  // PWA (Ana Ekrana Ekle) State'i
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  const realTodayStr = getLocalDateStr(new Date());

  const showToast = (message, type = 'success') => {
    setToast({ isOpen: true, message, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, isOpen: false }));
    }, 3500);
  };

  // PWA Tarayıcı Olayını Yakalama
  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // PWA Butonuna Tıklama İşlemi
  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      // iOS Cihazlar veya zaten yüklü olanlar için yönlendirme
      showToast('Cihazınızda Safari menüsünden "Paylaş" butonuna basıp "Ana Ekrana Ekle"yi seçebilirsiniz.', 'success');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      const realTodayObj = new Date();
      const currentRealTodayStr = getLocalDateStr(realTodayObj);
      
      if (currentRealTodayStr !== lastRealDay) {
        setLastRealDay(currentRealTodayStr);
        setSysDate(currentRealTodayStr);
        setSysMonth(realTodayObj);
        setAdminDate(currentRealTodayStr);
        setAdminMonth(realTodayObj);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [lastRealDay]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = document.getElementById(`card-${realTodayStr}`);
      if (el) el.scrollIntoView({ behavior: 'auto', inline: 'start', block: 'nearest' });
    }, 200);
    return () => clearTimeout(timer);
  }, []); 

  useEffect(() => {
    if (view.includes('ogrenci') || view.includes('admin')) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`card-${activeDate}`);
        if (el) el.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [view, activeDate]);

  const fetchRandevular = async () => {
    const tablo = isKiz ? 'kiz_randevu' : 'erk_randevu';
    const { data, error } = await supabase
      .from(tablo)
      .select('*')
      .eq('randevu_tarihi', activeDate)
      .neq('durum', 'İptal');
    
    if (data) setRandevular(data);
    if (error) console.error("Veri çekme hatası:", error);
  };

  useEffect(() => {
    if ((view.includes('ogrenci') || view.includes('admin')) && !view.includes('login')) {
      fetchRandevular();
    }
  }, [activeDate, view]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const { data, error } = await supabase.rpc('verify_admin', {
      p_username: loginData.username,
      p_password: loginData.password
    });

    if (error) {
      setLoginError('Bağlantı hatası oluştu.');
      setIsLoggingIn(false);
      return;
    }

    if (data === true) {
      setView(isKiz ? 'kiz_admin' : 'erkek_admin');
      setLoginData({ username: '', password: '' });
      showToast('Yönetici paneline başarıyla giriş yapıldı.', 'success');
    } else {
      setLoginError('Yönetici kimliği veya şifre hatalı!');
    }
    
    setIsLoggingIn(false);
  };

  const handleEkle = async (e) => {
    e.preventDefault();
    const bitisSaati = formData.baslangicSaati.replace('00', '45');
    const tablo = isKiz ? 'kiz_randevu' : 'erk_randevu';

    const { error } = await supabase.from(tablo).insert([{
      ogrenci_ad_soyad: formData.adSoyad,
      oda_no: formData.odaNo,
      makine_no: parseInt(formData.makineNo),
      randevu_tarihi: formData.randevuTarihi, 
      baslangic_saati: formData.baslangicSaati + ':00',
      bitis_saati: bitisSaati + ':00',
      durum: 'Bekliyor'
    }]);

    if (!error) {
      showToast(`${formData.randevuTarihi.split('-').reverse().join('.')} tarihine randevu başarıyla eklendi!`, 'success');
      
      if (formData.randevuTarihi !== adminDate) {
        setAdminDate(formData.randevuTarihi);
        const [y, m, d] = formData.randevuTarihi.split('-');
        setAdminMonth(new Date(Number(y), Number(m) - 1, 1));
      } else {
        fetchRandevular();
      }
      
      setFormData({ ...formData, adSoyad: '', odaNo: '', makineNo: '1', baslangicSaati: '09:00' });
    } else {
      showToast('Randevu eklenirken hata oluştu: ' + error.message, 'error');
    }
  };

  const handleIptalClick = (id) => {
    setDeleteModal({ isOpen: true, id: id });
  };

  const confirmDelete = async () => {
    if (!deleteModal.id) return;
    const tablo = isKiz ? 'kiz_randevu' : 'erk_randevu';
    const { error } = await supabase.from(tablo).delete().eq('id', deleteModal.id);
    
    if (!error) {
      fetchRandevular();
      setDeleteModal({ isOpen: false, id: null }); 
      showToast('Randevu sistemden tamamen silindi.', 'success');
    } else {
      setDeleteModal({ isOpen: false, id: null }); 
      showToast('Silme işlemi başarısız: ' + error.message, 'error');
    }
  };

  const handleBaslat = async (id) => {
    const tablo = isKiz ? 'kiz_randevu' : 'erk_randevu';
    const { error } = await supabase.from(tablo).update({ durum: 'Çalışıyor' }).eq('id', id);
    if (!error) {
      const bitisZamani = Date.now() + 45 * 60 * 1000;
      localStorage.setItem(`timer_${id}`, bitisZamani);
      fetchRandevular();
      showToast('Makine başlatıldı, sayaç işliyor.', 'success');
    } else {
      showToast('Makine başlatılamadı: ' + error.message, 'error');
    }
  };

  const getKalanSure = (id) => {
    const bitisZamani = localStorage.getItem(`timer_${id}`);
    if (!bitisZamani) return null;
    
    const fark = parseInt(bitisZamani) - now;
    if (fark <= 0) return '00:00'; 

    const dakika = Math.floor(fark / 60000).toString().padStart(2, '0');
    const saniye = Math.floor((fark % 60000) / 1000).toString().padStart(2, '0');
    return `${dakika}:${saniye}`;
  };

  const getSlotDurum = (makineNo, saatStr) => {
    const saatPrefix = saatStr.substring(0, 5);
    const randevu = randevular.find(r => 
      Number(r.makine_no) === Number(makineNo) && 
      r.baslangic_saati.startsWith(saatPrefix) 
    );
    
    if (randevu) {
      const sayac = randevu.durum === 'Çalışıyor' ? getKalanSure(randevu.id) : null;
      return { dolu: true, durum: randevu.durum, sayac: sayac };
    }
    return { dolu: false };
  };

  const getDaysInViewedMonth = () => {
    const year = activeMonth.getFullYear();
    const month = activeMonth.getMonth();
    const date = new Date(year, month, 1);
    const days = [];
    while (date.getMonth() === month) {
      days.push({
        dateStr: getLocalDateStr(date),
        day: date.getDate(),
        dayName: gunIsimleri[date.getDay()]
      });
      date.setDate(date.getDate() + 1);
    }
    return days;
  };
  
  const daysInMonth = getDaysInViewedMonth();

  const shiftDay = (direction) => {
    const [y, m, d] = activeDate.split('-');
    const currentObj = new Date(Number(y), Number(m) - 1, Number(d));
    currentObj.setDate(currentObj.getDate() + direction);
    
    const newDateStr = getLocalDateStr(currentObj);
    setActiveDate(newDateStr);

    if (currentObj.getMonth() !== activeMonth.getMonth() || currentObj.getFullYear() !== activeMonth.getFullYear()) {
      setActiveMonth(new Date(currentObj.getFullYear(), currentObj.getMonth(), 1));
    }

    setTimeout(() => {
      const el = document.getElementById(`card-${newDateStr}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  };

  const buguneGit = () => {
    const bugun = new Date();
    setActiveMonth(bugun);
    const bugunStr = getLocalDateStr(bugun);
    setActiveDate(bugunStr);
    
    setTimeout(() => {
      const el = document.getElementById(`card-${bugunStr}`);
      if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
  };

  const makineListesi = isKiz ? [1, 2, 3, 4, 5] : [1, 2];

  return (
    <div className={`min-h-screen flex flex-col font-sans relative transition-colors duration-300 ${isKiz ? 'bg-pink-50 text-pink-900' : 'bg-sky-50 text-sky-900'}`}>
      {/* NAVBAR */}
      <nav className="bg-white shadow-sm p-4 flex justify-between items-center px-4 md:px-8 z-20 relative">
        <button onClick={() => setView('home')} className={`flex items-center gap-2 font-bold text-lg transition ${isKiz ? 'text-pink-600 hover:text-pink-800' : 'text-sky-600 hover:text-sky-800'}`}>
          <Home size={24} /> Kula KYK
        </button>
        
        <div className="flex items-center gap-3">
          {/* DAHA BELİRGİN PWA KURULUM BUTONU (Sadece Ana Sayfada Görünür) */}
          {view === 'home' && (
            <button onClick={handleInstallClick} className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-extrabold transition-all shadow-md bg-emerald-500 text-white hover:bg-emerald-600 hover:scale-105 animate-pulse">
              <Smartphone size={22} strokeWidth={2.5} />
              <span className="hidden sm:inline">Uygulamayı Yükle</span>
            </button>
          )}

          {(view === 'erkek_ogrenci' || view === 'kiz_ogrenci') && (
            <button onClick={() => setView(isKiz ? 'kiz_admin_login' : 'erkek_admin_login')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-sm ${isKiz ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}>
              <Lock size={18} /> Admin Girişi
            </button>
          )}
          
          {(view === 'erkek_admin_login' || view === 'kiz_admin_login') && (
            <button onClick={() => setView(isKiz ? 'kiz_ogrenci' : 'erkek_ogrenci')} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition shadow-sm ${isKiz ? 'bg-pink-100 text-pink-700 hover:bg-pink-200' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}>
              Geri Dön
            </button>
          )}
          
          {(view === 'erkek_admin' || view === 'kiz_admin') && (
            <button onClick={() => setView(isKiz ? 'kiz_ogrenci' : 'erkek_ogrenci')} className="flex items-center gap-2 bg-rose-100 px-4 py-2 rounded-lg text-rose-700 font-semibold hover:bg-rose-200 transition shadow-sm">
              <LogOut size={18} /> Çıkış Yap
            </button>
          )}
        </div>
      </nav>

      <main className="flex-grow p-6">
        {/* ANA SAYFA */}
        {view === 'home' && (
          <div className="max-w-3xl mx-auto text-center mt-20">
            <h1 className="text-4xl md:text-5xl font-extrabold text-sky-800 mb-12 drop-shadow-sm">Manisa Kula KYK Yurdu <br/> Çamaşırhane Takip Sistemi</h1>
            <div className="flex flex-col gap-6 max-w-xl mx-auto">
              <button onClick={() => setView('erkek_ogrenci')} className="bg-sky-600 text-white p-6 rounded-2xl text-xl font-bold hover:bg-sky-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">👨🏻‍🎓</span>
                  <span>Erkek Yurdu Çamaşırhane Sistemi</span>
                </div>
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </button>
              
              <button onClick={() => setView('kiz_ogrenci')} className="bg-pink-500 text-white p-6 rounded-2xl text-xl font-bold hover:bg-pink-600 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1 flex justify-between items-center group">
                <div className="flex items-center gap-4">
                  <span className="text-3xl">👩🏻‍🎓</span>
                  <span>Kız Yurdu Çamaşırhane Sistemi</span>
                </div>
                <span className="text-2xl group-hover:translate-x-2 transition-transform">→</span>
              </button>
            </div>
          </div>
        )}

        {/* YÖNETİCİ GİRİŞİ */}
        {(view === 'erkek_admin_login' || view === 'kiz_admin_login') && (
          <div className="flex justify-center items-center h-[70vh]">
            <div className={`bg-white p-10 rounded-2xl shadow-xl border w-full max-w-md animate-in fade-in zoom-in duration-300 ${isKiz ? 'border-pink-100' : 'border-sky-100'}`}>
              <div className="text-center mb-8">
                <div className={`p-4 rounded-full inline-block mb-4 shadow-inner ${isKiz ? 'text-pink-600 bg-pink-100' : 'text-sky-600 bg-sky-100'}`}>
                  <Lock size={32} />
                </div>
                <h2 className={`text-2xl font-extrabold ${isKiz ? 'text-pink-800' : 'text-sky-800'}`}>{isKiz ? 'Kız Yurdu' : 'Erkek Yurdu'} Yönetici Girişi</h2>
                <p className={`text-sm mt-2 font-medium ${isKiz ? 'text-pink-600' : 'text-sky-600'}`}>Lütfen panele erişmek için giriş yapın.</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Yönetici ID</label>
                  <div className="relative">
                    <User className={`absolute left-3 top-3 ${isKiz ? 'text-pink-400' : 'text-sky-400'}`} size={20} />
                    <input 
                      required 
                      type="text" 
                      value={loginData.username} 
                      onChange={e => setLoginData({...loginData, username: e.target.value})} 
                      className={`w-full border py-3 pl-10 pr-4 rounded-xl outline-none focus:ring-2 transition font-medium ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-200 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-200 text-sky-900'}`}
                      placeholder="Örn: kyk_admin"
                    />
                  </div>
                </div>
                
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Şifre</label>
                  <div className="relative">
                    <Lock className={`absolute left-3 top-3 ${isKiz ? 'text-pink-400' : 'text-sky-400'}`} size={20} />
                    <input 
                      required 
                      type="password" 
                      value={loginData.password} 
                      onChange={e => setLoginData({...loginData, password: e.target.value})} 
                      className={`w-full border py-3 pl-10 pr-4 rounded-xl outline-none focus:ring-2 transition font-medium ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-200 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-200 text-sky-900'}`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {loginError && (
                  <div className="bg-rose-50 text-rose-600 p-3 rounded-lg text-sm font-bold text-center border border-rose-200">
                    {loginError}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoggingIn}
                  className={`w-full text-white font-bold py-3.5 rounded-xl shadow-md transition-all mt-4 ${isLoggingIn ? (isKiz ? 'bg-pink-400 cursor-not-allowed' : 'bg-sky-400 cursor-not-allowed') : (isKiz ? 'bg-pink-600 hover:bg-pink-700 hover:shadow-lg' : 'bg-sky-600 hover:bg-sky-700 hover:shadow-lg')}`}
                >
                  {isLoggingIn ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ANA SİSTEM VE YÖNETİM PANELİ */}
        {(view.includes('ogrenci') || view.includes('admin')) && !view.includes('login') && (
          <div className="max-w-7xl mx-auto">
            <h2 className={`text-2xl md:text-3xl font-extrabold text-center mb-8 drop-shadow-sm ${isKiz ? 'text-pink-800' : 'text-sky-800'}`}>
              Manisa Kula KYK {isKiz ? 'Kız' : 'Erkek'} Yurdu Çamaşırhane {isAdmin ? 'Yönetim Paneli' : 'Sistemi'}
            </h2>
            
            {/* TAKVİM KARTLARI */}
            <div className="flex flex-col items-center mb-10 w-full max-w-4xl mx-auto">
              <div className="flex justify-between items-center w-full px-2 mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => shiftDay(-1)} className={`p-2 bg-white rounded-full shadow transition ${isKiz ? 'hover:bg-pink-100 text-pink-700' : 'hover:bg-sky-100 text-sky-700'}`}>
                    <ChevronLeft size={24} />
                  </button>
                  <button onClick={buguneGit} className={`text-sm font-bold px-3 py-1.5 rounded-full transition shadow-sm ${isKiz ? 'bg-pink-200 text-pink-800 hover:bg-pink-300' : 'bg-sky-200 text-sky-800 hover:bg-sky-300'}`}>
                    Bugün
                  </button>
                </div>
                <h3 className={`text-2xl font-extrabold drop-shadow-sm ${isKiz ? 'text-pink-800' : 'text-sky-800'}`}>
                   {ayIsimleri[activeMonth.getMonth()]} {activeMonth.getFullYear()}
                </h3>
                <button onClick={() => shiftDay(1)} className={`p-2 bg-white rounded-full shadow transition ${isKiz ? 'hover:bg-pink-100 text-pink-700' : 'hover:bg-sky-100 text-sky-700'}`}>
                   <ChevronRight size={24} />
                </button>
              </div>

              <div className="flex gap-3 overflow-x-auto w-full pb-4 px-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                 {daysInMonth.map(d => {
                   const isSelected = activeDate === d.dateStr;
                   const isToday = d.dateStr === realTodayStr;
                   
                   return (
                    <button
                       key={d.dateStr}
                       id={`card-${d.dateStr}`}
                       onClick={() => {
                         setActiveDate(d.dateStr);
                         setTimeout(() => {
                           const el = document.getElementById(`card-${d.dateStr}`);
                           if (el) el.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                         }, 100);
                       }}
                       className={`snap-center flex-shrink-0 w-[5.5rem] h-24 rounded-2xl flex flex-col justify-center items-center font-bold transition-all duration-300 cursor-pointer shadow-sm
                          ${isSelected 
                            ? `${isKiz ? 'bg-pink-600' : 'bg-sky-600'} text-white shadow-xl scale-110 border-none z-10` 
                            : isToday 
                            ? `${isKiz ? 'bg-pink-50 text-pink-900 border-pink-400 shadow-[0_0px_15px_rgba(236,72,153,0.6)]' : 'bg-sky-50 text-sky-900 border-sky-400 shadow-[0_0px_15px_rgba(56,189,248,0.6)]'} border-2` 
                            : `bg-white border ${isKiz ? 'text-pink-800 border-pink-100 hover:bg-pink-50' : 'text-sky-800 border-sky-100 hover:bg-sky-50'}`}`}
                    >
                       <span className="text-xs uppercase tracking-wider opacity-90">{d.dayName}</span>
                       <span className="text-3xl mt-1">{d.day}</span>
                    </button>
                 )})}
              </div>
            </div>

            {/* ADMİN PANELİ FORMLARI VE LİSTESİ */}
            {isAdmin ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className={`bg-white p-6 rounded-2xl shadow-md border h-fit ${isKiz ? 'border-pink-100' : 'border-sky-100'}`}>
                  <h3 className={`text-xl font-bold mb-6 flex items-center gap-2 border-b pb-3 ${isKiz ? 'text-pink-800 border-pink-100' : 'text-sky-800 border-sky-100'}`}>
                    <PlusCircle /> Randevu Ekle
                  </h3>
                  <form onSubmit={handleEkle} className="space-y-4">
                    
                    <div>
                      <label className={`block text-sm font-bold mb-1 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Öğrenci Adı Soyadı</label>
                      <input required type="text" value={formData.adSoyad} onChange={e => setFormData({...formData, adSoyad: e.target.value})} className={`w-full border p-2.5 rounded-lg outline-none focus:ring-1 transition ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sky-900'}`} />
                    </div>
                    
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={`block text-sm font-bold mb-1 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Oda No</label>
                        <input required type="text" value={formData.odaNo} onChange={e => setFormData({...formData, odaNo: e.target.value})} className={`w-full border p-2.5 rounded-lg outline-none focus:ring-1 transition ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sky-900'}`} />
                      </div>
                      <div className="flex-1">
                        <label className={`block text-sm font-bold mb-1 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Tarih</label>
                        <input required type="date" value={formData.randevuTarihi} onChange={e => setFormData({...formData, randevuTarihi: e.target.value})} className={`w-full border p-2.5 rounded-lg outline-none focus:ring-1 transition cursor-pointer ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sky-900'}`} />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className={`block text-sm font-bold mb-1 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Makine</label>
                        <select value={formData.makineNo} onChange={e => setFormData({...formData, makineNo: e.target.value})} className={`w-full border p-2.5 rounded-lg outline-none focus:ring-1 transition cursor-pointer ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sky-900'}`}>
                          {makineListesi.map(m => (
                            <option key={m} value={m}>Makine {m}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex-1">
                        <label className={`block text-sm font-bold mb-1 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Saat</label>
                        <select value={formData.baslangicSaati} onChange={e => setFormData({...formData, baslangicSaati: e.target.value})} className={`w-full border p-2.5 rounded-lg outline-none focus:ring-1 transition cursor-pointer ${isKiz ? 'bg-pink-50 border-pink-200 focus:border-pink-400 focus:ring-pink-400 text-pink-900' : 'bg-sky-50 border-sky-200 focus:border-sky-400 focus:ring-sky-400 text-sky-900'}`}>
                          {saatDilimleri.filter(s => s.tip === 'yikama').map(s => (
                            <option key={s.id} value={s.saat.substring(0,5)}>{s.saat.substring(0,5)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button type="submit" className={`w-full text-white font-bold py-3 rounded-lg transition shadow-md mt-2 ${isKiz ? 'bg-pink-600 hover:bg-pink-700' : 'bg-sky-600 hover:bg-sky-700'}`}>Kaydet</button>
                  </form>
                </div>

                <div className={`col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl shadow-md border flex flex-col h-[550px] ${isKiz ? 'border-pink-100' : 'border-sky-100'}`}>
                  <h3 className={`text-xl font-bold mb-4 flex items-center gap-2 border-b pb-3 ${isKiz ? 'text-pink-800 border-pink-100' : 'text-sky-800 border-sky-100'}`}>
                    <Clock /> Aktif Randevular ve Kontrol
                  </h3>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                    {randevular.length === 0 ? (
                      <p className={`text-center mt-10 font-medium ${isKiz ? 'text-pink-400' : 'text-sky-400'}`}>Bu tarihte kayıtlı randevu yok.</p>
                    ) : (
                      randevular.map(r => (
                        <div key={r.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition shadow-sm ${isKiz ? 'bg-pink-50 border-pink-200 hover:bg-pink-100' : 'bg-sky-50 border-sky-200 hover:bg-sky-100'}`}>
                          <div>
                            <p className={`font-bold text-lg ${isKiz ? 'text-pink-900' : 'text-sky-900'}`}>
                              {r.ogrenci_ad_soyad} 
                              <span className={`text-xs font-semibold ml-2 bg-white px-2 py-1 rounded-md border ${isKiz ? 'text-pink-600 border-pink-200' : 'text-sky-600 border-sky-200'}`}>Oda: {r.oda_no}</span>
                            </p>
                            <p className={`text-sm font-medium mt-1 ${isKiz ? 'text-pink-700' : 'text-sky-700'}`}>Makine {r.makine_no} • {r.baslangic_saati.substring(0,5)} - {r.bitis_saati.substring(0,5)}</p>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full sm:w-auto">
                            {r.durum === 'Bekliyor' && (
                              <>
                                <button onClick={() => handleBaslat(r.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-emerald-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-emerald-600 transition shadow-sm">
                                  <Play size={16} /> Başlat
                                </button>
                                <button onClick={() => handleIptalClick(r.id)} className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-rose-500 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-rose-600 transition shadow-sm">
                                  <XCircle size={16} /> İptal Et
                                </button>
                              </>
                            )}
                            {r.durum === 'Çalışıyor' && (
                              <div className="bg-amber-100 border border-amber-300 text-amber-800 px-4 py-2 rounded-lg font-mono font-bold flex items-center gap-2 shadow-inner w-full sm:w-auto justify-center">
                                ⏳ {getKalanSure(r.id)}
                              </div>
                            )}
                            {r.durum === 'Tamamlandı' && (
                              <div className="bg-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold w-full sm:w-auto text-center">
                                Tamamlandı
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              // ÖĞRENCİ MAKİNE LİSTELERİ
              <div className={`grid grid-cols-1 md:grid-cols-2 ${isKiz ? 'xl:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
                {makineListesi.map(makine => (
                  <div key={makine} className={`bg-white rounded-2xl shadow-md border overflow-hidden ${isKiz ? 'border-pink-100' : 'border-sky-100'}`}>
                    <div className={`p-4 text-center border-b-4 ${isKiz ? 'bg-pink-600 border-pink-700' : 'bg-sky-600 border-sky-700'}`}>
                      <h3 className="text-xl font-extrabold text-white tracking-wide">MAKİNE {makine}</h3>
                    </div>
                    <div className={`divide-y ${isKiz ? 'divide-pink-100' : 'divide-sky-100'}`}>
                      {saatDilimleri.map((dilim) => {
                        if (dilim.tip === 'mola') {
                          return (
                            <div key={dilim.id} className={`p-4 text-center font-bold tracking-widest text-sm ${isKiz ? 'bg-pink-100/50 text-pink-700' : 'bg-sky-100/50 text-sky-700'}`}>
                              {dilim.etiket} <span className="mx-2 opacity-50">•</span> {dilim.saat}
                            </div>
                          );
                        }
                        const slot = getSlotDurum(makine, dilim.saat);
                        return (
                          <div key={dilim.id} className={`p-4 flex justify-between items-center transition duration-200 h-16 ${isKiz ? 'hover:bg-pink-50' : 'hover:bg-sky-50'}`}>
                            <div>
                              <span className={`font-extrabold block text-lg leading-tight ${isKiz ? 'text-pink-900' : 'text-sky-900'}`}>{dilim.etiket}</span>
                              <span className={`text-sm font-semibold ${isKiz ? 'text-pink-600' : 'text-sky-600'}`}>{dilim.saat}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              {slot.dolu && slot.durum === 'Çalışıyor' && (
                                <span className="text-sm font-mono font-bold text-amber-700 bg-amber-100 border border-amber-300 shadow-inner px-3 py-1 rounded-lg">
                                  ⏳ {slot.sayac}
                                </span>
                              )}
                              <span className={`px-4 py-1.5 rounded-xl text-sm font-extrabold shadow-sm ${slot.dolu ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                {slot.dolu ? 'DOLU' : 'BOŞ'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className={`py-6 text-center mt-12 transition-colors duration-300 ${isKiz ? 'bg-pink-900 text-pink-100' : 'bg-sky-900 text-sky-100'}`}>
        <p className="text-sm font-semibold tracking-wider">
          Tasarım: &copy; 2026 Berke TOSUNBAYRAKTAR - Web Tasarım ve Kodlama
        </p>
      </footer>

      {/* SİLME ONAY MODALI */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex justify-center items-center z-50 p-4 transition-all">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden transform scale-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-rose-50 p-6 flex flex-col items-center border-b border-rose-100 text-center">
              <div className="bg-rose-100 text-rose-600 p-3 rounded-full mb-4">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-extrabold text-rose-700 mb-1">Randevuyu Sil</h3>
              <p className="text-rose-600/80 text-sm font-medium">Bu işlem geri alınamaz.</p>
            </div>
            
            <div className="p-6">
              <p className="text-gray-800 font-semibold text-center mb-6">
                Öğrenci gelmediği için bu randevuyu sistemden tamamen kaldırmak istediğinize emin misiniz?
              </p>
              
              <div className="flex gap-3">
                <button onClick={() => setDeleteModal({ isOpen: false, id: null })} className="flex-1 bg-gray-100 text-gray-800 font-bold py-2.5 rounded-xl hover:bg-gray-200 transition">Vazgeç</button>
                <button onClick={confirmDelete} className="flex-1 bg-rose-500 text-white font-bold py-2.5 rounded-xl hover:bg-rose-600 shadow-md transition">Evet, Sil</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BİLDİRİM (TOAST) BİLEŞENİ */}
      {toast.isOpen && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl transform transition-all animate-in slide-in-from-right-8 fade-in duration-300 text-white font-bold ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {toast.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}