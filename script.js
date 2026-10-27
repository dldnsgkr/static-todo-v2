/* ===== 할 일 앱 ===== */
(function () {
  "use strict";

  var STORAGE_KEY = "todo-app.items";

  var form = document.getElementById("todo-form");
  var input = document.getElementById("todo-input");
  var dueInput = document.getElementById("todo-due");
  var listEl = document.getElementById("todo-list");
  var emptyEl = document.getElementById("empty-state");
  var doneCountEl = document.getElementById("done-count");
  var countEl = document.getElementById("count-text");
  var clearDoneBtn = document.getElementById("clear-done");
  var yearEl = document.getElementById("copyright-year");

  // --- 푸터 연도: 시스템 날짜에서 동적으로 계산 ---
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // --- 상태 ---
  var todos = loadTodos();

  function loadTodos() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      // 데이터 형태 방어: {id, text, done, due} 만 통과
      return parsed.filter(function (t) {
        return t && typeof t.text === "string";
      }).map(function (t) {
        return {
          id: t.id || createId(),
          text: t.text,
          done: !!t.done,
          due: typeof t.due === "string" ? t.due : ""
        };
      });
    } catch (e) {
      return [];
    }
  }

  function saveTodos() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      /* 저장 실패 시에도 앱 동작은 유지 */
    }
  }

  function createId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // --- 마감일 표시 유틸 ---
  function startOfToday() {
    var now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  function parseDue(iso) {
    if (!iso) return null;
    var d = new Date(iso + "T00:00:00");
    return isNaN(d.getTime()) ? null : d;
  }

  function isOverdue(iso) {
    var d = parseDue(iso);
    return !!d && d.getTime() < startOfToday().getTime();
  }

  function formatDue(iso) {
    var d = parseDue(iso);
    if (!d) return "마감일 있음";
    var label = d.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
    if (d.getFullYear() !== new Date().getFullYear()) {
      label = d.getFullYear() + "년 " + label;
    }
    return "마감 " + label;
  }

  // --- 렌더링 ---
  function render() {
    listEl.innerHTML = "";

    todos.forEach(function (todo) {
      var li = document.createElement("li");
      li.className = "todo-item" + (todo.done ? " done" : "");
      li.dataset.id = todo.id;

      var checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "checkbox";
      checkbox.checked = todo.done;
      checkbox.setAttribute("aria-label", "완료 표시: " + todo.text);
      checkbox.addEventListener("change", function () {
        toggleTodo(todo.id);
      });

      var text = document.createElement("span");
      text.className = "todo-text";
      text.textContent = todo.text;

      var deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = "&#10005;"; // ✕
      deleteBtn.setAttribute("aria-label", "삭제: " + todo.text);
      deleteBtn.addEventListener("click", function () {
        removeTodo(todo.id, li);
      });

      li.appendChild(checkbox);
      li.appendChild(text);

      if (todo.due) {
        var due = document.createElement("span");
        due.className = "due-badge" + (!todo.done && isOverdue(todo.due) ? " overdue" : "");
        due.textContent = formatDue(todo.due);
        due.title = "마감일: " + todo.due;
        li.appendChild(due);
      }

      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });

    updateMeta();
  }

  function updateMeta() {
    var remaining = todos.filter(function (t) { return !t.done; }).length;
    var doneCount = todos.length - remaining;

    doneCountEl.textContent = "완료된 할 일: " + doneCount + "개";

    countEl.textContent =
      todos.length === 0
        ? "할 일 없음"
        : remaining + "개 남음 · 완료 " + doneCount + "개";

    clearDoneBtn.hidden = doneCount === 0;
    emptyEl.hidden = todos.length !== 0;
  }

  // --- 동작 ---
  function addTodo(text, due) {
    var trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({
      id: createId(),
      text: trimmed,
      done: false,
      due: (due || "").trim()
    });
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    todos = todos.map(function (t) {
      return t.id === id
        ? { id: t.id, text: t.text, done: !t.done, due: t.due }
        : t;
    });
    saveTodos();
    render();
  }

  function removeTodo(id, liEl) {
    // 삭제 애니메이션 후 제거
    if (liEl) {
      liEl.classList.add("removing");
      setTimeout(function () {
        todos = todos.filter(function (t) { return t.id !== id; });
        saveTodos();
        render();
      }, 220);
    } else {
      todos = todos.filter(function (t) { return t.id !== id; });
      saveTodos();
      render();
    }
  }

  function clearDone() {
    todos = todos.filter(function (t) { return !t.done; });
    saveTodos();
    render();
  }

  // --- 이벤트 ---
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    addTodo(input.value, dueInput.value);
    input.value = "";
    dueInput.value = "";
    input.focus();
  });

  clearDoneBtn.addEventListener("click", clearDone);

  // --- 초기 렌더 ---
  render();
})();
