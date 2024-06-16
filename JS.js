class Task {
    constructor() {
        this.name = '';
        this.duration = 0;
        this.cost = 0;
        this.dependencies = [];
        this.depCount = 0;
        this.crashDuration = 0;
        this.crashCost = 0;
    }
}

let tasks = [];
let topoOrder = [];
let adjList = [];
let adjListSize = [];
let topoIndex = 0;

function createTaskInputs() {
    const taskCount = parseInt(document.getElementById('taskCount').value);
    const taskInputs = document.getElementById('taskInputs');
    taskInputs.innerHTML = '';

    for (let i = 0; i < taskCount; i++) {
        const taskDiv = document.createElement('div');
        taskDiv.classList.add('task');

        taskDiv.innerHTML = `
            <h2>Task ${i + 1}</h2>
            <label for="taskName${i}">Enter name for task ${i + 1}:</label>
            <input type="text" id="taskName${i}">
            <label for="taskDuration${i}">Enter duration for task ${i + 1}:</label>
            <input type="number" id="taskDuration${i}" min="0">
            <label for="taskCost${i}">Enter cost for task ${i + 1}:</label>
            <input type="number" id="taskCost${i}" min="0">
            <label for="taskCrashDuration${i}">Enter crash duration for task ${i + 1}:</label>
            <input type="number" id="taskCrashDuration${i}" min="0">
            <label for="taskCrashCost${i}">Enter crash cost for task ${i + 1}:</label>
            <input type="number" id="taskCrashCost${i}" min="0">
            <label for="taskDependencies${i}">Enter number of dependencies for task ${i + 1}:</label>
            <input type="number" id="taskDependencies${i}" min="0" oninput="createDependencyInputs(${i})">
            <div id="dependencyInputs${i}"></div>
        `;

        taskInputs.appendChild(taskDiv);

        // Add event listeners to all inputs for this task
        const inputs = taskDiv.querySelectorAll('input');
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    event.preventDefault();
                    const nextInput = inputs[index + 1];
                    if (nextInput) {
                        nextInput.focus();
                    } else {
                        const nextTaskDiv = taskDiv.nextElementSibling;
                        if (nextTaskDiv) {
                            const firstInputOfNextTask = nextTaskDiv.querySelector('input');
                            if (firstInputOfNextTask) {
                                firstInputOfNextTask.focus();
                            }
                        }
                    }
                }
            });
        });
    }

    const calculateButton = document.createElement('button');
    calculateButton.textContent = 'Calculate Critical Path';
    calculateButton.onclick = calculateCriticalPath;
    taskInputs.appendChild(calculateButton);
}

function createDependencyInputs(taskIndex) {
    const depCount = parseInt(document.getElementById(`taskDependencies${taskIndex}`).value);
    const dependencyInputs = document.getElementById(`dependencyInputs${taskIndex}`);
    dependencyInputs.innerHTML = '';

    for (let i = 0; i < depCount; i++) {
        const depInput = document.createElement('input');
        depInput.type = 'number';
        depInput.min = '0';
        depInput.id = `task${taskIndex}Dependency${i}`;
        depInput.placeholder = `Enter dependency ${i + 1} (0-based index)`;
        dependencyInputs.appendChild(depInput);
    }
}

function calculateCriticalPath() {
    const taskCount = parseInt(document.getElementById('taskCount').value);
    tasks = Array.from({ length: taskCount }, () => new Task());

    for (let i = 0; i < taskCount; i++) {
        tasks[i].name = document.getElementById(`taskName${i}`).value;
        tasks[i].duration = parseFloat(document.getElementById(`taskDuration${i}`).value);
        tasks[i].cost = parseFloat(document.getElementById(`taskCost${i}`).value);
        tasks[i].crashDuration = parseFloat(document.getElementById(`taskCrashDuration${i}`).value);
        tasks[i].crashCost = parseFloat(document.getElementById(`taskCrashCost${i}`).value);
        tasks[i].depCount = parseInt(document.getElementById(`taskDependencies${i}`).value);

        for (let j = 0; j < tasks[i].depCount; j++) {
            let dep = parseInt(document.getElementById(`task${i}Dependency${j}`).value);
            tasks[i].dependencies.push(dep);
        }
    }

    findCriticalPath(tasks, taskCount);
}

function findCriticalPath(tasks, taskCount) {
    let earliestStart = Array(taskCount).fill(0);
    let latestStart = Array(taskCount).fill(Number.MAX_SAFE_INTEGER);
    let earliestFinish = Array(taskCount).fill(0);
    let latestFinish = Array(taskCount).fill(Number.MAX_SAFE_INTEGER);
    
    let inDegree = Array(taskCount).fill(0);
    adjList = Array.from({ length: taskCount }, () => []);
    
    // Build the in-degree count and adjacency list
    for (let i = 0; i < taskCount; i++) {
        for (let j = 0; j < tasks[i].depCount; j++) {
            let dep = tasks[i].dependencies[j];
            adjList[dep].push(i);
            inDegree[i]++;
        }
    }

    // Topological Sort
    let q = [];
    topoOrder = [];
    for (let i = 0; i < taskCount; i++) {
        if (inDegree[i] === 0) {
            q.push(i);
        }
    }

    while (q.length > 0) {
        let u = q.shift();
        topoOrder.push(u);

        for (let v of adjList[u]) {
            if (--inDegree[v] === 0) {
                q.push(v);
            }
        }
    }

    topoIndex = topoOrder.length;

    // Calculate earliest start and finish times
    for (let i = 0; i < topoOrder.length; i++) {
        let u = topoOrder[i];
        earliestFinish[u] = earliestStart[u] + tasks[u].duration;
        for (let v of adjList[u]) {
            if (earliestStart[v] < earliestFinish[u]) {
                earliestStart[v] = earliestFinish[u];
            }
        }
    }

    // Calculate latest start and finish times
    latestFinish[topoOrder[topoOrder.length - 1]] = earliestFinish[topoOrder[topoOrder.length - 1]];
    latestStart[topoOrder[topoOrder.length - 1]] = latestFinish[topoOrder[topoOrder.length - 1]] - tasks[topoOrder[topoOrder.length - 1]].duration;
    for (let i = topoOrder.length - 1; i >= 0; i--) {
        let u = topoOrder[i];
        for (let v of adjList[u]) {
            if (latestFinish[u] > latestStart[v]) {
                latestFinish[u] = latestStart[v];
                latestStart[u] = latestFinish[u] - tasks[u].duration;
            }
        }
    }

    displayResults(tasks, taskCount, earliestStart, earliestFinish, latestStart, latestFinish);
}

function displayResults(tasks, taskCount, earliestStart, earliestFinish, latestStart, latestFinish) {
    const results = document.getElementById('results');
    results.innerHTML = '<h2>Detailed Analysis:</h2>';

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    const headers = ['Node', 'Name', 'Duration', 'Crash Duration', 'ES', 'EF', 'LS', 'LF', 'Cost', 'Crash Cost'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    for (let i = 0; i < taskCount; i++) {
        const row = document.createElement('tr');
        const values = [i, tasks[i].name, tasks[i].duration, tasks[i].crashDuration, earliestStart[i], earliestFinish[i], latestStart[i], latestFinish[i], tasks[i].cost, tasks[i].crashCost];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });
        table.appendChild(row);
    }

    results.appendChild(table);

    let criticalPath = '';
    let projectDuration = 0;
    for (let i = 0; i < taskCount; i++) {
        if (earliestStart[i] === latestStart[i]) {
            criticalPath += tasks[i].name + ' ';
            if (projectDuration < earliestFinish[i]) {
                projectDuration = earliestFinish[i];
            }
        }
    }

    results.innerHTML += `<h3>Critical Path: ${criticalPath}</h3>`;
    results.innerHTML += `<p>Project Duration: ${projectDuration} units</p>`;

    let totalCost = tasks.reduce((acc, task) => acc + task.cost, 0);
    results.innerHTML += `<p>Total Cost: $${totalCost}</p>`;

    performCrashingAnalysis(tasks, taskCount);
}

function performCrashingAnalysis(tasks, taskCount) {
    // Initialize earliestStart and earliestFinish arrays with 0
    const earliestStart = Array(taskCount).fill(0);
    const earliestFinish = Array(taskCount).fill(0);

    // Initialize latestStart and latestFinish arrays with INT_MAX
    const latestStart = Array.from({ length: taskCount }, () => Number.MAX_SAFE_INTEGER);
    const latestFinish = Array.from({ length: taskCount }, () => Number.MAX_SAFE_INTEGER);

    for (let i = 0; i < taskCount; i++) {
        latestStart[i] = Number.MAX_SAFE_INTEGER;
        latestFinish[i] = Number.MAX_SAFE_INTEGER;
    }

    for (let i = 0; i < topoIndex; i++) {
        let u = topoOrder[i];
        earliestFinish[u] = earliestStart[u] + tasks[u].crashDuration;
        for (let j = 0; j < adjList[u].length; j++) {
            let v = adjList[u][j];
            if (earliestStart[v] < earliestFinish[u]) {
                earliestStart[v] = earliestFinish[u];
            }
        }
    }

    latestFinish[topoOrder[topoIndex - 1]] = earliestFinish[topoOrder[topoIndex - 1]];
    latestStart[topoOrder[topoIndex - 1]] = latestFinish[topoOrder[topoIndex - 1]] - tasks[topoOrder[topoIndex - 1]].crashDuration;

    for (let i = topoIndex - 1; i >= 0; i--) {
        let u = topoOrder[i];
        for (let j = 0; j < adjList[u].length; j++) {
            let v = adjList[u][j];
            if (latestFinish[u] > latestStart[v]) {
                latestFinish[u] = latestStart[v];
                latestStart[u] = latestFinish[u] - tasks[u].crashDuration;
            }
        }
    }

    const results = document.getElementById('results');
    results.innerHTML += '<h2>Crashing Analysis:</h2>';

    const table = document.createElement('table');
    const headerRow = document.createElement('tr');
    const headers = ['Node', 'Name', 'Crash Duration', 'ES', 'EF', 'LS', 'LF', 'Crash Cost'];
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);

    for (let i = 0; i < taskCount; i++) {
        const row = document.createElement('tr');
        const values = [i, tasks[i].name, tasks[i].crashDuration, earliestStart[i], earliestFinish[i], latestStart[i], latestFinish[i], tasks[i].crashCost];
        values.forEach(value => {
            const td = document.createElement('td');
            td.textContent = value;
            row.appendChild(td);
        });
        table.appendChild(row);
    }

    results.appendChild(table);

    let criticalPath = '';
    let projectDuration = 0;
    for (let i = 0; i < taskCount; i++) {
        if (earliestStart[i] === latestStart[i]) {
            criticalPath += tasks[i].name + ' ';
            if (projectDuration < earliestFinish[i]) {
                projectDuration = earliestFinish[i];
            }
        }
    }

    results.innerHTML += `<h3>Crashing Critical Path: ${criticalPath}</h3>`;
    results.innerHTML += `<p>Crashing Project Duration: ${projectDuration} units</p>`;

    let totalCrashCost = tasks.reduce((acc, task) => acc + task.crashCost, 0);
    results.innerHTML += `<p>Total Crashing Cost: $${totalCrashCost}</p>`;
}
