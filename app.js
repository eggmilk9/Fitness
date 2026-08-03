if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(function(err) { console.log(err); });
}

var currentDate = new Date().toISOString().split('T')[0];
var activeMealCat = '아침';
var activeWorkoutCat = '상체';
var viewYear = new Date().getFullYear();
var viewMonth = new Date().getMonth();

// 날짜 문자열(YYYY-MM-DD)을 'YYYY년 M월 D일' 형식으로 변환
function formatDateKorean(dateStr) {
  var parts = dateStr.split('-');
  if (parts.length === 3) {
    var year = parts[0];
    var month = parseInt(parts[1], 10);
    var day = parseInt(parts[2], 10);
    return year + '년 ' + month + '월 ' + day + '일';
  }
  return dateStr;
}

function initApp() {
  var dateDisp = document.getElementById('currentDateDisplay');
  if (dateDisp) dateDisp.textContent = formatDateKorean(currentDate);
  
  loadDayData();
  setupCategoryButtons();
  setupModals();
  setupMainButtons();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

function setupCategoryButtons() {
  var mealBtns = document.querySelectorAll('#mealCategoryBtns .cat-btn');
  mealBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      mealBtns.forEach(function(b) { b.classList.remove('active'); });
      e.target.classList.add('active');
      activeMealCat = e.target.getAttribute('data-cat');
    });
  });

  var workoutBtns = document.querySelectorAll('#workoutCategoryBtns .cat-btn');
  workoutBtns.forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      workoutBtns.forEach(function(b) { b.classList.remove('active'); });
      e.target.classList.add('active');
      activeWorkoutCat = e.target.getAttribute('data-cat');
    });
  });
}

function getRecords() {
  try {
    return JSON.parse(localStorage.getItem('fitness_records') || '{}');
  } catch(e) {
    return {};
  }
}

function saveRecords(records) {
  localStorage.setItem('fitness_records', JSON.stringify(records));
}

function deleteMeal(index) {
  var records = getRecords();
  if (records[currentDate] && records[currentDate].meals) {
    records[currentDate].meals.splice(index, 1);
    saveRecords(records);
    loadDayData();
  }
}

function deleteWorkout(index) {
  var records = getRecords();
  if (records[currentDate] && records[currentDate].workouts) {
    records[currentDate].workouts.splice(index, 1);
    saveRecords(records);
    loadDayData();
  }
}

window.deleteMeal = deleteMeal;
window.deleteWorkout = deleteWorkout;

function loadDayData() {
  var records = getRecords();
  var dayData = records[currentDate] || { meals: [], workouts: [], analysis: '' };

  var mealList = document.getElementById('mealList');
  var workoutList = document.getElementById('workoutList');
  var analysisResult = document.getElementById('analysisResult');
  var analysisContent = document.getElementById('analysisContent');

  if (mealList) {
    mealList.innerHTML = (dayData.meals || []).map(function(m, idx) {
      return '<li><span class="record-text">[' + m.cat + '] ' + m.text + '</span><button class="delete-btn" onclick="deleteMeal(' + idx + ')">✕</button></li>';
    }).join('');
  }

  if (workoutList) {
    workoutList.innerHTML = (dayData.workouts || []).map(function(w, idx) {
      return '<li><span class="record-text">[' + w.cat + '] ' + w.text + '</span><button class="delete-btn" onclick="deleteWorkout(' + idx + ')">✕</button></li>';
    }).join('');
  }

  if (analysisResult && analysisContent) {
    if (dayData.analysis) {
      analysisContent.textContent = dayData.analysis;
      analysisResult.classList.remove('hidden');
    } else {
      analysisResult.classList.add('hidden');
    }
  }
}

function setupMainButtons() {
  var saveMealBtn = document.getElementById('saveMealBtn');
  var saveWorkoutBtn = document.getElementById('saveWorkoutBtn');
  var analyzeBtn = document.getElementById('analyzeBtn');

  if (saveMealBtn) {
    saveMealBtn.addEventListener('click', function() {
      var input = document.getElementById('mealInput');
      var text = input ? input.value.trim() : '';
      if (!text) return;

      var records = getRecords();
      if (!records[currentDate]) records[currentDate] = { meals: [], workouts: [], analysis: '' };

      records[currentDate].meals.push({ cat: activeMealCat, text: text });
      saveRecords(records);
      if (input) input.value = '';
      loadDayData();
    });
  }

  if (saveWorkoutBtn) {
    saveWorkoutBtn.addEventListener('click', function() {
      var input = document.getElementById('workoutInput');
      var text = input ? input.value.trim() : '';
      if (!text) return;

      var records = getRecords();
      if (!records[currentDate]) records[currentDate] = { meals: [], workouts: [], analysis: '' };

      records[currentDate].workouts.push({ cat: activeWorkoutCat, text: text });
      saveRecords(records);
      if (input) input.value = '';
      loadDayData();
    });
  }

  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', runAIAnalysis);
  }
}

function setupModals() {
  var pModal = document.getElementById('profileModal');
  var cModal = document.getElementById('calendarModal');
  var profileBtn = document.getElementById('profileBtn');
  var calendarBtn = document.getElementById('calendarBtn');
  var closeProfileBtn = document.getElementById('closeProfileBtn');
  var saveProfileBtn = document.getElementById('saveProfileBtn');
  var closeCalendarBtn = document.getElementById('closeCalendarBtn');

  if (profileBtn) {
    profileBtn.onclick = function() {
      document.getElementById('userHeight').value = localStorage.getItem('user_height') || '';
      document.getElementById('userWeight').value = localStorage.getItem('user_weight') || '';
      document.getElementById('userMuscle').value = localStorage.getItem('user_muscle') || '';
      document.getElementById('apiProvider').value = localStorage.getItem('api_provider') || 'gemini';
      document.getElementById('apiKey').value = localStorage.getItem('api_key') || '';
      if (pModal) pModal.classList.remove('hidden');
    };
  }

  if (closeProfileBtn) {
    closeProfileBtn.onclick = function() {
      if (pModal) pModal.classList.add('hidden');
    };
  }

  if (saveProfileBtn) {
    saveProfileBtn.onclick = function() {
      localStorage.setItem('user_height', document.getElementById('userHeight').value);
      localStorage.setItem('user_weight', document.getElementById('userWeight').value);
      localStorage.setItem('user_muscle', document.getElementById('userMuscle').value);
      localStorage.setItem('api_provider', document.getElementById('apiProvider').value);
      localStorage.setItem('api_key', document.getElementById('apiKey').value);
      if (pModal) pModal.classList.add('hidden');
      alert('설정이 저장되었습니다.');
    };
  }

  if (calendarBtn) {
    calendarBtn.onclick = function() {
      renderCalendar();
      if (cModal) cModal.classList.remove('hidden');
    };
  }

  if (closeCalendarBtn) {
    closeCalendarBtn.onclick = function() {
      if (cModal) cModal.classList.add('hidden');
    };
  }

  var prevMonthBtn = document.getElementById('prevMonth');
  var nextMonthBtn = document.getElementById('nextMonth');

  if (prevMonthBtn) {
    prevMonthBtn.onclick = function() {
      viewMonth--;
      if (viewMonth < 0) { viewMonth = 11; viewYear--; }
      renderCalendar();
    };
  }

  if (nextMonthBtn) {
    nextMonthBtn.onclick = function() {
      viewMonth++;
      if (viewMonth > 11) { viewMonth = 0; viewYear++; }
      renderCalendar();
    };
  }
}

function renderCalendar() {
  var grid = document.getElementById('calendarGrid');
  var monthDisplay = document.getElementById('calendarMonth');
  var records = getRecords();

  if (!grid || !monthDisplay) return;

  monthDisplay.textContent = viewYear + '년 ' + (viewMonth + 1) + '월';
  grid.innerHTML = '';

  var firstDay = new Date(viewYear, viewMonth, 1).getDay();
  var lastDate = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (var i = 0; i < firstDay; i++) {
    grid.appendChild(document.createElement('div'));
  }

  for (var d = 1; d <= lastDate; d++) {
    var dayDiv = document.createElement('div');
    var dateStr = viewYear + '-' + String(viewMonth + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
    dayDiv.className = 'calendar-day';
    dayDiv.textContent = d;

    if (records[dateStr] && ((records[dateStr].meals && records[dateStr].meals.length > 0) || (records[dateStr].workouts && records[dateStr].workouts.length > 0))) {
      dayDiv.classList.add('recorded');
    }

    (function(targetDate) {
      dayDiv.onclick = function() {
        currentDate = targetDate;
        var dateDisp = document.getElementById('currentDateDisplay');
        if (dateDisp) dateDisp.textContent = formatDateKorean(currentDate);
        loadDayData();
        var cModal = document.getElementById('calendarModal');
        if (cModal) cModal.classList.add('hidden');
      };
    })(dateStr);

    grid.appendChild(dayDiv);
  }
}

async function runAIAnalysis() {
  var apiKey = localStorage.getItem('api_key');
  var provider = localStorage.getItem('api_provider') || 'gemini';
  var height = localStorage.getItem('user_height') || '미기입';
  var weight = localStorage.getItem('user_weight') || '미기입';
  var muscle = localStorage.getItem('user_muscle') || '미기입';

  if (!apiKey) {
    alert('상단 ⚙️ 설정에서 API Key를 먼저 입력해주세요.');
    return;
  }

  var records = getRecords();
  var dayData = records[currentDate] || { meals: [], workouts: [] };

  if ((!dayData.meals || dayData.meals.length === 0) && (!dayData.workouts || dayData.workouts.length === 0)) {
    alert('오늘의 식단이나 운동 기록을 최소 하나 이상 작성해주세요.');
    return;
  }

  var analysisContent = document.getElementById('analysisContent');
  var analysisResult = document.getElementById('analysisResult');

  if (analysisContent) analysisContent.textContent = 'AI가 영양과 운동을 분석 중입니다... ⏳';
  if (analysisResult) analysisResult.classList.remove('hidden');

  var mealText = dayData.meals ? dayData.meals.map(function(m) { return '- [' + m.cat + '] ' + m.text; }).join('\n') : '';
  var workoutText = dayData.workouts ? dayData.workouts.map(function(w) { return '- [' + w.cat + '] ' + w.text; }).join('\n') : '';

  var prompt = "사용자 프로필: 키 " + height + "cm, 체중 " + weight + "kg, 근육량 " + muscle + "kg\n" +
               "오늘(" + currentDate + ") 섭취한 식단:\n" + mealText + "\n\n" +
               "오늘 수행한 운동:\n" + workoutText + "\n\n" +
               "위 정보를 바탕으로 아래 내용을 친절하고 명확하게 한국어로 작성해줘:\n" +
               "1. 오늘의 대략적인 탄단지(탄수화물, 단백질, 지방) 섭취량 추정 및 비율 평가\n" +
               "2. 오늘 운동으로 자극된 주 자극 부위 정리\n" +
               "3. 이 기록을 기반으로 내일 더 섭취해야 할 영양소 제안\n" +
               "4. 내일 추천하는 운동 부위 및 운동량 제안";

  try {
    var resultText = '';
    if (provider === 'gemini') {
      var res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      });
      var data = await res.json();
      if (data.error) throw new Error(data.error.message);
      resultText = data.candidates[0].content.parts[0].text;
    } else {
      var res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }]
        })
      });
      var data = await res.json();
      if (data.error) throw new Error(data.error.message);
      resultText = data.choices[0].message.content;
    }

    if (analysisContent) analysisContent.textContent = resultText;
    records[currentDate].analysis = resultText;
    saveRecords(records);

  } catch (err) {
    if (analysisContent) analysisContent.textContent = '분석 중 오류가 발생했습니다: ' + err.message;
  }
}
