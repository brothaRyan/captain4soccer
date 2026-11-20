window.GestureUI = (function () {
  var touchGesture = null;
  var tabs = ['hs', 'att', 'tm', 'fm', 'pl', 'cf'];

  function startTabSwipe(gesture, dx) {
    var index = tabs.indexOf(S.tab);
    var direction = dx < 0 ? 1 : -1;
    var destination = tabs[index + direction];
    if (!destination) return false;

    var track = document.querySelector('.tab-swipe-track');
    var viewport = document.querySelector('.tab-swipe-viewport');
    var app = document.getElementById('app');
    if (!track || !viewport || !app || track.children.length !== 1) return false;

    var preview = app.cloneNode(false);
    preview.className = 'tab-pane tab-' + destination;
    preview.setAttribute('aria-hidden', 'true');
    preview.innerHTML = tabMarkup(destination);
    addPitchFullscreenButton(preview);
    track.appendChild(preview);
    track.style.flexDirection = direction < 0 ? 'row-reverse' : 'row';
    track.style.transition = 'none';
    track.style.willChange = 'transform';

    gesture.swiping = true;
    gesture.direction = direction;
    gesture.destination = destination;
    gesture.width = viewport.clientWidth;
    gesture.track = track;
    gesture.preview = preview;
    gesture.base = direction < 0 ? -gesture.width : 0;
    localizeUI();
    fitTeamName();
    return true;
  }

  function setTabSwipePosition(gesture, dx) {
    var delta = gesture.direction > 0 ? Math.min(0, dx) : Math.max(0, dx);
    gesture.delta = delta;
    gesture.track.style.transform = 'translate3d(' + (gesture.base + delta) + 'px,0,0)';
  }

  function settleTabSwipe(gesture, commit) {
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
      if (commit) changeTab(gesture.destination);
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

  function startTouch(e) {
    if (e.touches.length !== 1 || UI.pitchFullscreen) return;

    var target = e.target;
    if (window.matchMedia('(min-width:1000px) and (orientation:landscape)').matches) return;
    var calendar = target.closest('.calendar-month-viewport');
    var segment = target.closest('.attendance-roster .seg');
    var attendanceButton = target.closest('button[data-act="att"]');
    var touch = e.touches[0];

    if (calendar) {
      touchGesture = {
        type: 'calendar',
        forMatch: UI.matchCalendarOpen,
        forStats: !!UI.statsCalendarField,
        x: touch.clientX,
        y: touch.clientY,
        lastX: touch.clientX,
        lastTime: Date.now(),
        swiping: false
      };
      return;
    }

    if (segment && attendanceButton) {
      var row = segment.closest('.row');
      if (row) {
        touchGesture = { type: 'attendance', id: attendanceButton.dataset.id, x: touch.clientX, y: touch.clientY };
        return;
      }
    }

    if (target.closest('button,input,select,textarea,a,.pitch,.sheet,.calendar,.nav,.tw,.seg')) return;
    if (target.closest('#app')) {
      touchGesture = {
        type: 'tab',
        x: touch.clientX,
        y: touch.clientY,
        lastX: touch.clientX,
        lastTime: Date.now(),
        swiping: false
      };
    }
  }

  function updateTouch(e) {
    var gesture = touchGesture;
    if (!gesture || e.touches.length !== 1) return;

    var x = e.touches[0].clientX;
    var y = e.touches[0].clientY;
    var dx = x - gesture.x;
    var dy = y - gesture.y;

    if (gesture.type === 'calendar') {
      if (!gesture.swiping && gesture.axis !== 'vertical') {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
        if (Math.abs(dx) <= Math.abs(dy) * 1.15) {
          gesture.axis = 'vertical';
          return;
        }
        if (!CalendarUI.startSwipe(gesture, dx)) {
          gesture.axis = 'horizontal-edge';
          return;
        }
      }
      if (!gesture.swiping) return;
      e.preventDefault();
      CalendarUI.setSwipePosition(gesture, dx);
      updateVelocity(gesture, x);
      return;
    }

    if (gesture.type !== 'tab') return;
    if (!gesture.swiping && gesture.axis !== 'vertical') {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dx) <= Math.abs(dy) * 1.15) {
        gesture.axis = 'vertical';
        return;
      }
      if (!startTabSwipe(gesture, dx)) {
        gesture.axis = 'horizontal-edge';
        return;
      }
    }
    if (!gesture.swiping) return;
    e.preventDefault();
    setTabSwipePosition(gesture, dx);
    updateVelocity(gesture, x);
  }

  function updateVelocity(gesture, x) {
    var now = Date.now();
    gesture.velocity = (x - gesture.lastX) / Math.max(1, now - gesture.lastTime);
    gesture.lastX = x;
    gesture.lastTime = now;
  }

  function endTouch(e) {
    if (!touchGesture || !e.changedTouches.length) return;

    var gesture = touchGesture;
    touchGesture = null;
    var dx = e.changedTouches[0].clientX - gesture.x;
    var dy = e.changedTouches[0].clientY - gesture.y;

    if (gesture.type === 'tab' && gesture.swiping) {
      var progress = Math.abs(gesture.delta);
      var flick = gesture.velocity != null && gesture.velocity * gesture.direction < -.45 && progress > 32;
      settleTabSwipe(gesture, progress >= Math.min(96, gesture.width * .22) || flick);
      return;
    }
    if (gesture.type === 'calendar' && gesture.swiping) {
      var calendarProgress = Math.abs(gesture.delta);
      var calendarFlick = gesture.velocity != null && gesture.velocity * gesture.direction < -.45 && calendarProgress > 32;
      CalendarUI.settleSwipe(gesture, calendarProgress >= Math.min(88, gesture.width * .22) || calendarFlick);
      return;
    }
    if (Math.abs(dx) < (gesture.type === 'attendance' ? 24 : 60) || Math.abs(dx) < Math.abs(dy) * 1.3) return;

    if (gesture.type === 'attendance') {
      var status = dx < 0 ? 'n' : 'y';
      if (S.att[gesture.id] === status) return;
      e.preventDefault();
      S.att[gesture.id] = status;
      if (status !== 'y') dropFromLineups(gesture.id);
      save();
      render();
      return;
    }
    if (gesture.type === 'calendar' && gesture.axis !== 'vertical' &&
        Math.abs(dx) >= 60 && Math.abs(dx) >= Math.abs(dy) * 1.3) {
      e.preventDefault();
      CalendarUI.shiftMonth(gesture.forMatch, dx < 0 ? 1 : -1, gesture.forStats);
      render();
      return;
    }
    if (gesture.type === 'tab') {
      var index = tabs.indexOf(S.tab);
      var next = index + (dx < 0 ? 1 : -1);
      if (next >= 0 && next < tabs.length) {
        e.preventDefault();
        changeTab(tabs[next]);
      }
    }
  }

  function cancelTouch() {
    var gesture = touchGesture;
    touchGesture = null;
    if (gesture && gesture.type === 'tab' && gesture.swiping) settleTabSwipe(gesture, false);
    if (gesture && gesture.type === 'calendar' && gesture.swiping) CalendarUI.settleSwipe(gesture, false);
  }

  function init() {
    document.addEventListener('touchstart', startTouch, { passive: true });
    document.addEventListener('touchmove', updateTouch, { passive: false });
    document.addEventListener('touchend', endTouch, { passive: false });
    document.addEventListener('touchcancel', cancelTouch, { passive: true });
  }

  return { init: init };
})();
