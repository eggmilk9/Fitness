// PWA Service Worker 등록
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(err => console.log(err));
}

// 상태 변수
let currentDate = new Date().toISOString().split('T')[0];
let activeMealCat = '아침';
let activeWorkoutCat = '상체';
let viewYear = new Date().getFullYear();
let viewMonth = new Date().getMonth();

// DOM 요소
const mealInput = document.getElementById('mealInput');
const workoutInput = document.getElementById('workoutInput');
const mealList = document.getElementById('mealList');
const workoutList = document.getElementById('workoutList');
const analysisResult = document.getElementById('analysisResult');
const analysisContent = document.getElementById('analysisContent');

// 초기화
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('currentDateDisplay').textContent = `${currentDate} 기록`;
  loadDayData();
  setupCategoryButtons();
  setupModals();
});

// 카테고리 버튼 설정
function setupCategoryButtons() {
  document.querySelectorAll('#mealCategoryBtns .cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#mealCategoryBtns .cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeMealCat = e.target.dataset.cat;
    });
  });

  document.querySelectorAll('#workoutCategoryBtns .cat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#workoutCategoryBtns .cat-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeWorkoutCat = e.target.dataset.cat;
    });
  });
}

// 로컬 스토리지 저장/불러오기
function getRecords() {
  return JSON.parse(localStorage.getItem('fitness_records') || '{}');
}

function saveRecords(records) {
  localStorage.setItem('fitness_records', JSON.stringify(records));
}

function loadDayData() {
  const records = getRecords();
  const dayData = records[currentDate] || { meals: [], workouts: [], analysis: '' };

  mealList.innerHTML = dayData.meals.map(m => `<li><span>[${m.cat}] ${m.text}</span></li>`).join('');
  workoutList.innerHTML = dayData.workouts.map(w => `<li><span>[${w.cat}] ${w.text}</span></li>`).join('');

  if (dayData.analysis) {
    analysisContent.textContent = dayData.analysis;
    analysisResult.classList.remove('hidden');
  } else {
    analysisResult.classList.add('hidden');
  }
}

// 식단 / 운동 입력 저장
document.getElementById('saveMealBtn').addEventListener('click', () => {
  const text = mealInput.value.trim();
  if (!text) return;

  const records = getRecords();
  if (!records[currentDate]) records[currentDate] = { meals: [], workouts: [], analysis: '' };

  records[currentDate].meals.push({ cat: activeMealCat, text });
  saveRecords(records);
  mealInput.value = '';
  loadDayData();
});

document.getElementById('saveWorkoutBtn').addEventListener('click', () => {
  const text = workoutInput.value.trim();
  if (!text) return;

  const records = getRecords();
  if (!records[currentDate]) records[currentDate] = { meals: [], workouts: [], analysis: '' };

  records[currentDate].workouts.push({ cat: activeWorkoutCat, text });
  saveRecords(records);
  workoutInput.value = '';
  loadDayData();
});

// 프로필 및 설정 모달
function setupModals() {
  const pModal = document.getElementById('profileModal');
  const cModal = document.getElementById('calendarModal');

  document.getElementById('profileBtn').onclick = () => {
    document.getElementById('userHeight').value = localStorage.getItem('user_height') || '';
    document.getElementById('userWeight').value = localStorage.getItem('user_weight') || '';
    document.getElementById('userMuscle').value = localStorage.getItem('user_muscle') || '';
    document.getElementById('apiProvider').value = localStorage.getItem('api_provider') || 'openai';
    document.getElementById('apiKey').value = localStorage.getItem('api_key') || '';
    pModal.classList.remove('hidden');
  };

  document.getElementById('closeProfileBtn').onclick = () => pModal.classList.add('hidden');

  document.getElementById('saveProfileBtn').onclick = () => {
    localStorage.setItem('user_height', document.getElementById('userHeight').value);
    localStorage.setItem('user_weight', document.getElementById('userWeight').value);
    localStorage.setItem('user_muscle', document.getElementById('userMuscle').value);
    localStorage.setItem('api_provider', document.getElementById('apiProvider').value);
    localStorage.setItem('api_key', document.getElementById('apiKey').value);
    pModal.classList.add('hidden');
    alert('설정이 저장되었습니다.');
  };

  document.getElementById('calendarBtn').onclick = () => {
    renderCalendar();
    cModal.classList.remove('hidden');
  };

  document.getElementById('closeCalendarBtn').onclick = () => cModal.classList.add('hidden');
}

// 캘린더 생성
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  const monthDisplay = document.getElementById('calendarMonth');
  const records = getRecords();

  monthDisplay.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  grid.innerHTML = '';

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (let d = 1; d <= lastDate; d++) {
    const dayDiv = document.createElement('div');
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = d;

    if (records[dateStr] && (records[dateStr].meals.length > 0 || records[dateStr].workouts.length > 0)) {
      dayDiv.classList.add('recorded');
    }

    dayDiv.onclick = () => {
      currentDate = dateStr;
      document.getElementById('currentDateDisplay').textContent = `${currentDate} 기록`;
      loadDayData();
      document.getElementById('calendarModal').classList.add('hidden');
    };

    grid.appendChild(dayDiv);
  }
}

document.getElementById('prevMonth').onclick = () => {
  viewMonth--;
  if (viewMonth < 0) { viewMonth = 11; viewYear--; }
  renderCalendar();
};

document.getElementById('nextMonth').onclick = () => {
  viewMonth++;
  if (viewMonth > 11) { viewMonth = 0; viewYear++; }
  renderCalendar();
};

// AI 분석 요청
document.getElementById('analyzeBtn').addEventListener('click', async () => {
  const apiKey = localStorage.getItem('api_key');
  const provider = localStorage.getItem('api_provider') || 'openai';
  const height = localStorage.getItem('user_height') || '미기입';
  const weight = localStorage.getItem('user_weight') || '미기입';
  const muscle = localStorage.getItem('user_muscle') || '미기입';

  if (!apiKey) {
    alert('상단 ⚙️ 설정에서 API Key를 먼저 입력해주세요.');
    return;
  }

  const records = getRecords();
  const dayData = records[currentDate] || { meals: [], workouts: [] };

  if (dayData.meals.length === 0 && dayData.workouts.length === 0) {
    alert('오늘의 식단이나 운동 기록을 최소 하나 이상 작성해주세요.');
    return;
  }

  analysisContent.textContent = 'AI가 영양과 운동을 분석 중입니다... ⏳';
  analysisResult.classList.remove('hidden');

  const prompt = `
사용자 프로필: 키 ${height}cm, 체중 ${weight}kg, 근육량 ${muscle}kg
오늘(${currentDate}) 섭취한 식단:
${dayData.meals.map(m => `- [${m.cat}] ${m.text}`).join('
')}

오늘 수행한 운동:
${dayData.workouts.map(w => `- [${w.cat}] ${w.text}`).join('
')}

위 정보를 바탕으로 아래 내용을 친절하고 명확하게 한국어로 작성해줘:
1. 오늘의 대략적인 탄단지(탄수화물, 단백질, 지방) 섭취량 추정 및 비율 평가
2. 오늘 운동으로 자극된 주 자극 부위 정리
3. 이 기록을 기반으로 내일 더 섭취해야 할 영양소 제안
4. 내일 추천하는 운동 부위 및 운동량 제안
  `;

  try {
    let resultText = '';
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      const data = await res.json();
      resultText = data.choices[0].message.content;
    } else {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      const data = await res.json();
      resultText = data.candidates[0].content.parts[0].text;
    }

    analysisContent.textContent = resultText;
    records[currentDate].analysis = resultText;
    saveRecords(records);

  } catch (err) {
    analysisContent.textContent = '분석 중 오류가 발생했습니다. API 키를 확인해주세요.';
  }
});
