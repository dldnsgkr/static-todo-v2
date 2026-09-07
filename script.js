/* ===== 할 일 앱 ===== */
(function () {
  "use strict";

  var STORAGE_KEY = "todo-app.items";

  var form = document.getElementById("todo-form");
  var input = document.getElementById("todo-input");
  var listEl = document.getElementById("todo-list");
  var emptyEl = document.getElementById("empty-state");
  var countEl = document.getElementById("count-text");
  var clearDoneBtn = document.getElementById("clear-done");

  // --- 상태 ---
  var todos = loadTodos();

  function loadTodos() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      // 데이터 형태 방어: {id, text, done} 만 통과
      return parsed.filter(function (t) {
        return t && typeof t.text === "string";
      }).map(function (t) {
        return { id: t.id || createId(), text: t.text, done: !!t.done };
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
      li.appendChild(deleteBtn);
      listEl.appendChild(li);
    });

    updateMeta();
  }

  function updateMeta() {
    var remaining = todos.filter(function (t) { return !t.done; }).length;
    var doneCount = todos.length - remaining;

    countEl.textContent =
      todos.length === 0
        ? "할 일 없음"
        : remaining + "개 남음 · 완료 " + doneCount + "개";

    clearDoneBtn.hidden = doneCount === 0;
    emptyEl.hidden = todos.length !== 0;
  }

  // --- 동작 ---
  function addTodo(text) {
    var trimmed = text.trim();
    if (!trimmed) return;
    todos.unshift({ id: createId(), text: trimmed, done: false });
    saveTodos();
    render();
  }

  function toggleTodo(id) {
    todos = todos.map(function (t) {
      return t.id === id ? { id: t.id, text: t.text, done: !t.done } : t;
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
    addTodo(input.value);
    input.value = "";
    input.focus();
  });

  clearDoneBtn.addEventListener("click", clearDone);

  // --- 초기 렌더 ---
  render();
})();
