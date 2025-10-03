const addTaskBtn = document.getElementById("addTaskBtn");
const taskInput = document.getElementById("taskInput");
const taskList = document.getElementById("taskList");

// Load saved tasks
chrome.storage.sync.get(["tasks"], (result) => {
    const tasks = result.tasks || [];
    tasks.forEach(task => addTaskToDOM(task));
});

// Add new task
addTaskBtn.addEventListener("click", () => {
    const name = taskInput.value.trim();
    if (!name) return;

    const task = { name, timeSpent: 0, running: false };
    addTaskToDOM(task);
    saveTask(task);

    taskInput.value = "";
});

// Add task to popup
function addTaskToDOM(task) {
    const li = document.createElement("li");
    li.textContent = `${task.name} - ${formatTime(task.timeSpent)} `;

    // Start button
    const startBtn = document.createElement("button");
    startBtn.textContent = "Start";
    startBtn.onclick = () => startTask(task, li);

    // Stop button
    const stopBtn = document.createElement("button");
    stopBtn.textContent = "Stop";
    stopBtn.onclick = () => stopTask(task, li);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.onclick = () => deleteTask(task, li);

    li.appendChild(startBtn);
    li.appendChild(stopBtn);
    li.appendChild(deleteBtn);

    taskList.appendChild(li);
}

// Start timer
function startTask(task, li) {
    if (task.running) return;
    task.running = true;

    task.interval = setInterval(() => {
        task.timeSpent++;
        li.firstChild.textContent = `${task.name} - ${formatTime(task.timeSpent)} `;
        saveAllTasks();
    }, 1000);
}

// Stop timer
function stopTask(task, li) {
    if (!task.running) return;
    task.running = false;
    clearInterval(task.interval);
    saveAllTasks();
}

// Delete task
function deleteTask(task, li) {
    li.remove();
    chrome.storage.sync.get(["tasks"], (result) => {
        const tasks = result.tasks || [];
        const updated = tasks.filter(t => t.name !== task.name);
        chrome.storage.sync.set({ tasks: updated });
    });
}

// Save a single task
function saveTask(task) {
    chrome.storage.sync.get(["tasks"], (result) => {
        const tasks = result.tasks || [];
        tasks.push(task);
        chrome.storage.sync.set({ tasks });
    });
}

// Save all tasks (for timer updates)
function saveAllTasks() {
    const tasks = [];
    taskList.querySelectorAll("li").forEach(li => {
        const text = li.firstChild.textContent.split(" - ")[0];
        const timeParts = li.firstChild.textContent.split(" - ")[1].split(":");
        const seconds = parseInt(timeParts[0])*3600 + parseInt(timeParts[1])*60 + parseInt(timeParts[2]);
        tasks.push({ name: text, timeSpent: seconds, running: false });
    });
    chrome.storage.sync.set({ tasks });
}

// Format seconds to HH:MM:SS
function formatTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return [h,m,s].map(v => v.toString().padStart(2,"0")).join(":");
}