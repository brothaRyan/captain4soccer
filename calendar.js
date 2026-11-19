window.CalendarUI = (function () {
  function monthKey(forMatch, forStats) {
    if (forStats) return UI.statsCalendarMonth || (UI[UI.statsCalendarField] || today()).slice(0, 7);
    if (forMatch) return UI.matchCalendarMonth || UI.matchDate.slice(0, 7);
    return UI.calendarMonth || S.date.slice(0, 7);
  }

  function shiftedMonth(month, delta) {
    var parts = month.split('-');
    var date = new Date(+parts[0], +parts[1] - 1 + delta, 1);
    return date.getFullYear() + '-' + pad(date.getMonth() + 1);
  }

  function render(forMatch, forStats, panelOnly, monthOverride) {
    var statsDate = forStats ? (UI[UI.statsCalendarField] || today()) : '';
    var month = monthOverride || monthKey(forMatch, forStats);
    var parts = month.split('-');
    var year = +parts[0];
    var monthNumber = +parts[1];
    var offset = new Date(year, monthNumber - 1, 1).getDay();
    var days = new Date(year, monthNumber, 0).getDate();
    var available = {};

    S.hist.forEach(function (record) {
      available[record.date] = true;
    });

    var current = forStats ? statsDate : forMatch ? UI.matchDate : S.date;
    var previousAction = forStats ? 'statsCalendarPrev' : forMatch ? 'matchCalendarPrev' : 'calendarPrev';
    var nextAction = forStats ? 'statsCalendarNext' : forMatch ? 'matchCalendarNext' : 'calendarNext';
    var pickAction = forStats ? 'selectStatsDate' : forMatch ? 'selectMatchDate' : 'selectCalendarDate';
    var pickerYear = UI.calendarPickerYear || year;
    var weekdays = Array.from({ length: 7 }, function (_, index) {
      return new Date(2026, 0, 4 + index).toLocaleDateString(LANGS[LANG].locale, { weekday: 'short' });
    });
    var monthLabel = new Date(year, monthNumber - 1, 1).toLocaleDateString(LANGS[LANG].locale, {
      year: 'numeric',
      month: 'long'
    });
    var months = Array.from({ length: 12 }, function (_, index) {
      return new Date(year, index, 1).toLocaleDateString(LANGS[LANG].locale, { month: 'short' });
    });
    var closeAction = forStats ? 'closeStatsCalendar' : forMatch ? 'closeMatchCalendar' : 'closeCalendar';
    var html = panelOnly ? '' : '<div class="calendar-shade"><section class="calendar" role="dialog" ' +
      'aria-modal="true" aria-label="' +
      (forStats ? tr(UI.statsCalendarField === 'statsFrom' ? '시작일' : '종료일') :
        forMatch ? tr('새 경기 날짜와 시간') : tr('경기 날짜 선택')) + '">';

    if (UI.calendarMode === 'months') {
      if (panelOnly) return '';
      html += '<div class="calendar-head year-head"><button data-act="' + previousAction +
        '" aria-label="이전 연도">‹</button><label class="calendar-year"><span>' + tr('연도') +
        '</span><input type="number" min="1" max="9999" value="' + pickerYear +
        '" data-chg="calendarPickerYear" aria-label="' + tr('연도') + '"></label><button data-act="' +
        nextAction + '" aria-label="다음 연도">›</button></div><div class="month-grid">' +
        months.map(function (name, index) {
          return '<button class="' + (year === pickerYear && monthNumber === index + 1 ? 'selected' : '') +
            '" data-act="calendarPickMonth" data-month="' + (index + 1) + '">' + name + '</button>';
        }).join('') + '</div><button class="btn ghost calendar-close" data-act="calendarBack">' +
        tr('달력으로 돌아가기') + '</button>';
    } else {
      if (!panelOnly) {
        html += '<div class="calendar-head"><button data-act="' + previousAction +
          '" aria-label="이전 달">‹</button><button class="calendar-title" data-act="calendarTitle" aria-label="' +
          tr('연도와 월 선택') + '">' + monthLabel + '</button><button data-act="' + nextAction +
          '" aria-label="다음 달">›</button></div><div class="calendar-month-viewport"><div class="calendar-month-track">';
      }

      html += '<div class="calendar-month"><div class="calendar-grid">' +
        weekdays.map(function (day) { return '<span>' + day + '</span>'; }).join('');

      for (var index = 0; index < offset; index++) html += '<span></span>';
      for (var dayNumber = 1; dayNumber <= days; dayNumber++) {
        var date = year + '-' + pad(monthNumber) + '-' + pad(dayNumber);
        var enabled = forMatch || forStats || available[date];
        var classes = (available[date] ? 'has-match ' : '') + (date === current ? 'selected' : '');
        html += '<button' + (enabled ?
          ' class="' + classes.trim() + '" data-act="' + pickAction + '" data-date="' + date + '"' :
          ' disabled aria-label="' + dayNumber + '일, 경기 기록 없음"') + '>' + dayNumber + '</button>';
      }
      for (var cell = offset + days; cell < 42; cell++) html += '<span></span>';
      html += '</div></div>';
      if (!panelOnly) html += '</div></div>';
    }

    if (panelOnly) return html;

    if (forMatch) {
      html += '<div class="calendar-time"><label class="lbl" for="matchTime">경기 시간 (선택)</label>' +
        '<input id="matchTime" type="time" class="in" value="' + esc(UI.matchTime || '') +
        '"></div><button class="btn calendar-create" data-act="createMatch">이 날짜와 시간으로 경기 만들기</button>';
    }

    return html + '<button class="btn ghost calendar-close" data-act="' + closeAction + '">' +
      tr('닫기') + '</button></section></div>';
  }

  function shiftMonth(forMatch, delta, forStats) {
    if (UI.calendarMode === 'months') {
      var selectedMonth = monthKey(forMatch, forStats);
      UI.calendarPickerYear = Math.max(1, Math.min(9999,
        (UI.calendarPickerYear || +selectedMonth.slice(0, 4)) + delta));
      return;
    }

    var month = shiftedMonth(monthKey(forMatch, forStats), delta);
    if (forStats) UI.statsCalendarMonth = month;
    else if (forMatch) UI.matchCalendarMonth = month;
    else UI.calendarMonth = month;
  }

  function startSwipe(gesture, dx) {
    var viewport = document.querySelector('.calendar-month-viewport');
    var track = document.querySelector('.calendar-month-track');
    var direction = dx < 0 ? 1 : -1;
    if (UI.calendarMode === 'months' || !viewport || !track ||
        !track.querySelector('.calendar-month') || track.children.length !== 1 || !viewport.clientWidth) return false;

    var previewMonth = shiftedMonth(monthKey(gesture.forMatch, gesture.forStats), direction);
    var holder = document.createElement('div');
    holder.innerHTML = render(gesture.forMatch, gesture.forStats, true, previewMonth);
    var preview = holder.firstElementChild;
    if (!preview) return false;

    preview.setAttribute('aria-hidden', 'true');
    preview.removeAttribute('role');
    preview.removeAttribute('aria-modal');
    preview.querySelectorAll('button,input,select,textarea').forEach(function (element) {
      element.disabled = true;
      element.removeAttribute('id');
    });

    track.appendChild(preview);
    track.style.flexDirection = direction > 0 ? 'row' : 'row-reverse';
    track.style.transition = 'none';
    track.style.willChange = 'transform';

    gesture.swiping = true;
    gesture.direction = direction;
    gesture.width = viewport.clientWidth;
    gesture.track = track;
    gesture.preview = preview;
    gesture.base = direction > 0 ? 0 : -gesture.width;
    track.style.transform = 'translate3d(' + gesture.base + 'px,0,0)';
    return true;
  }

  function setSwipePosition(gesture, dx) {
    var delta = gesture.direction > 0 ? Math.min(0, dx) : Math.max(0, dx);
    gesture.delta = delta;
    gesture.track.style.transform = 'translate3d(' + (gesture.base + delta) + 'px,0,0)';
  }

  function settleSwipe(gesture, commit) {
    if (!gesture || !gesture.swiping) return;

    var track = gesture.track;
    var target = commit ? (gesture.direction > 0 ? -gesture.width : 0) : gesture.base;
    var finished = false;

    function cleanup() {
      if (finished) return;
      finished = true;
      track.removeEventListener('transitionend', onEnd);
      clearTimeout(gesture.timer);
      if (gesture.preview.parentNode) gesture.preview.remove();
      track.style.flexDirection = 'row';
      track.style.transition = '';
      track.style.transform = '';
      track.style.willChange = '';
      if (commit) {
        shiftMonth(gesture.forMatch, gesture.direction, gesture.forStats);
        window.render();
      }
    }

    function onEnd(event) {
      if (event.target === track && event.propertyName === 'transform') cleanup();
    }

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      track.style.transition = 'none';
      track.style.transform = 'translate3d(' + target + 'px,0,0)';
      cleanup();
      return;
    }

    track.addEventListener('transitionend', onEnd);
    track.style.transition = 'transform 260ms cubic-bezier(.22,.61,.36,1)';
    track.style.transform = 'translate3d(' + target + 'px,0,0)';
    gesture.timer = setTimeout(cleanup, 320);
  }

  return {
    render: render,
    shiftMonth: shiftMonth,
    startSwipe: startSwipe,
    setSwipePosition: setSwipePosition,
    settleSwipe: settleSwipe
  };
})();
