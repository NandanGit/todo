const taskInputField = document.getElementById('task-input-field');
const taskAddButton = document.getElementById('task-add-button');
const tasksTableBody = document.getElementById('tasks-table-body');
const tasksTableHeader = document.getElementById('tasks-table-header');
// console.log(taskInputField, taskAddButton, tasksTableBody);
const FIREBASE_ENDPOINT =
	'https://write-only-todo-{secret_code}-default-rtdb.firebaseio.com/';

let SECRET_CODE = '';
let url;

/////////////////User Interface related functions////////////////
// To collect input from the field
function clearInputField() {
	taskInputField.value = '';
}

function collectInput() {
	return taskInputField.value.trim();
}

function setButtonText(text) {
	taskAddButton.innerHTML = text;
}

function disableButton() {
	taskAddButton.classList.add('disabled');
}
function enableButton() {
	taskAddButton.classList.remove('disabled');
}

// To fill the tasks table tasks
function fillTasksTable(tasks) {
	res = '';
	tasks.forEach((task) => {
		res += `
        <tr>
			<td>${task}</td>
		</tr>
        `;
	});
	tasksTableBody.innerHTML = res;
}

function addTaskOnTop(task) {
	tasksTableBody.insertAdjacentHTML(
		'afterBegin',
		`
        <tr>
			<td>${task}</td>
		</tr>
        `
	);
}
/////////////////Application Logic related functions/////////////////
function verifyAuthentication(firstTime = true) {
	if (!SECRET_CODE) {
		// Ask for secret_code
		SECRET_CODE = prompt('Enter the secret code below');
		return verifyAuthentication();
	}
	if (!firstTime) {
		SECRET_CODE = prompt('Wrong secret code, try again');
	}
	url =
		FIREBASE_ENDPOINT.replace('{secret_code}', SECRET_CODE) + 'tasks.json';
}

async function addTaskToDB(task) {
	verifyAuthentication();
	const response = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ task }),
	});
	if (response.status === 404) {
		throw new Error('Wrong secret code');
	}
	// console.log(response);
}

async function getTasksFromDB() {
	verifyAuthentication();
	// (await fetch(url));
	const response = await fetch(url);
	if (response.status === 404) {
		throw new Error('Wrong secret code');
	}
	const data = await response.json();
	const tasks = [];
	for (const task in data) {
		tasks.unshift(data[task].task); // Use unshift instead of push to get the correct order
	}

	return tasks;
}
/////////////////Controller/////////////////
async function refreshTableHandler() {
	try {
		const tasks = await getTasksFromDB();
		fillTasksTable(tasks);
	} catch (error) {
		console.log(error.message);
		verifyAuthentication(false); // Not first time
		await refreshTableHandler();
	}
}

async function addTaskHandler(task) {
	// console.log('Task will be added');
	// Validate Input value
	clearInputField();
	if (!task) {
		return console.log('Input field should not be empty');
	}
	try {
		await addTaskToDB(task);
		addTaskOnTop(task);
	} catch (error) {
		console.log(error.message);
		verifyAuthentication(false); // Not first time
		await addTaskHandler(task);
	}
}

taskAddButton.addEventListener('click', async (event) => {
	event.preventDefault();
	const task = collectInput();
	setButtonText('Adding...');
	disableButton();
	await addTaskHandler(task);
	enableButton();
	setButtonText('Add');
});

tasksTableHeader.addEventListener('click', async (event) => {
	await refreshTableHandler();
});
