

const taskList = document.getElementById("task-list")

const todoForm = document.querySelector(".todo-form")

const todoListButton = document.querySelector("#todoList");
const doingListButton = document.querySelector("#doingList");
const doneListButton = document.querySelector("#doneList");
const allTaskButton = document.querySelector("#allTask");

const userAccount = document.querySelector(".userAccount")

const deleteAllTasksButton = document.getElementById("deleteAllTasks");

const email = JSON.parse(localStorage.getItem("user")).email
userAccount.innerHTML = email


 async function isDuplication(newTitle, taskIndex = -1) {
    try{
        const res = await fetch("http://localhost:3000/task")
        if(!res.ok) {
            throw new Error('Network response was not ok ' + res.statusText);
        }
        const tasks = await res.json()
        return tasks.some( (task,index) => {
            return task.name.toLowerCase().trim() === newTitle.toLowerCase().trim() && index !== taskIndex
        })
    }
    catch(error) {
        console.log(error);
        return false
    }
}


let currentFilter = "all"
function renderTask() {
    fetch("http://localhost:3000/task") 
    .then(res => {
        if(!res.ok) {
            throw new Error('Network response was not ok ' + response.statusText);
        }
        return res.json()
    })
    .then(tasks => {
        let filterTask = tasks
        if(currentFilter === "todo") {
            filterTask = filterTask.filter(task => task.status === "todo")
        } else if(currentFilter === "doing") {
            filterTask = filterTask.filter(task => task.status === "doing")
        } else if(currentFilter === "done") {
            filterTask = filterTask.filter(task => task.status === "done")
        }

        filterTask.sort((a, b) => {
            const priorityOrder = { "high": 1, "medium": 2, "low": 3 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });

        if(filterTask.length === 0 ) {
            const html = `<div style="text-align:center; color: #ccc; font-style: italic">have no task.</div>`
            taskList.innerHTML = html
            return
        }
        const html = filterTask.map( (task, index) => `
        <li id="task-item" data-index="${index}" class =" task-item ${task.status === "done" ? "completed" : ""} ${task.status === "doing" ? "doing" : ""} ${task.status === "todo" ? "todo" : ""}">
         <span class="activity-indicator"></span>
          <span class="id">${index + 1}.</span>
          <h2 class="title">${task.name}</h2>
          <div class="container">
                <button class="btn status ${task.status}" data-id=${task.id} data-index="${index}">${task.status}</button>
                <button class="btn priority ${task.priority}" data-id=${task.id} data-index="${index}">${task.priority}</button>
          </div>
          <div class="container-handle">
            <button class="btn edit">edit</button>
            <button class="btn delete">delete</button>
          </div>
        </li>`).join("")
        taskList.innerHTML = html
       
        const statusButtons = document.querySelectorAll('.btn.status');
        const priorityButtons = document.querySelectorAll('.btn.priority');

        statusButtons.forEach(button => {
            button.addEventListener('click', changeStatus);
        });

        priorityButtons.forEach(button => {
            button.addEventListener('click', changePriority);
        });

    })
    .catch(error => console.log(error))
}
renderTask()


async function addTask(e) {
    e.preventDefault();
    let value = document.getElementById("todo-input").value.trim();
    const isDuplicate = await isDuplication(value)
    if (isDuplicate) {
        alert("duplicated elements");
        document.getElementById("todo-input").value = ""
        return
    } 
    
    const newTask = {
        name: value,
        status: "todo",
        priority: "low"
    };
    
    if (!value) {
        alert("xin hay nhap dung du lieu");
        return;
    }
    
    try {
        const res = await fetch("http://localhost:3000/task", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newTask)
        });
        
        if (!res.ok) {
            throw new Error("Could not found res: " + res.statusText);
        }
        
        await res.json();
        value = document.getElementById("todo-input").value = ""
        renderTask();
    } catch (error) {
        console.log(error);
    }
}


function changeStatus(e) {
    const button = e.target
    const taskId = button.getAttribute("data-id")
    const index = button.getAttribute("data-index")
    console.log(index);
    const currentStatus = button.classList.contains("todo") ? "todo" : button.classList.contains("doing") ? "doing" : "done"
    
    let newStatus
    if(currentStatus === "todo") {
        newStatus = "doing"
    } else if(currentStatus === "doing") {
        newStatus = "done"
    } else {
        newStatus = "todo"
    }

    const title = document.querySelectorAll(`.title`)[index].innerText
    const priority = document.querySelectorAll(`.priority`)[index].innerText
    

    fetch(`http://localhost:3000/task/${taskId}`,{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: title,
            status: newStatus,
            priority: priority
        })
    })
    .then (res => {
        if(!res.ok) {
            throw new Error("Failed to update status: ", res.statusText)
        }
        return res.json()
    })
    .then( tasks => renderTask())
    .catch(error => console.log(error))

}

todoForm.addEventListener("submit",addTask)

function changePriority(e) {
    const button = e.target
    const taskId = button.getAttribute("data-id")
    const index = button.getAttribute("data-index")
    const currentPriority = button.classList.contains("low") ? "low" : button.classList.contains("medium") ? "medium" : "high"
    
    let newPriority
    if(currentPriority === "low") {
        newPriority = "medium"
    } else if(currentPriority === "medium") {
        newPriority = "high"
    } else {
        newPriority = "low"
    }

    const title = document.querySelectorAll(`.title`)[index].innerText
    const status = document.querySelectorAll(`.status`)[index].innerText
    

    fetch(`http://localhost:3000/task/${taskId}`,{
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: title,
            priority: newPriority,
            status
        })
    })
    .then(res => {
        if(res.ok) {
            throw new Error("Failed to update priority: ", res.statusText)
        }
        return res.json()
    })
    .then( tasks => {
        renderTask()
    })
    .catch(error => console.log(error))
}
async function handleTask(e) {
    const taskItem = e.target.closest("#task-item");
    const taskId = taskItem.querySelector(".status").getAttribute("data-id");
    const action = e.target.closest(".edit") ? "edit" : e.target.closest(".delete") ? "delete" : null;
    const index = +taskItem.dataset.index;



    if (action === "edit") {
        const currentTitle = taskItem.querySelector(".title").innerText;
        let newTitle = prompt("Please enter the new title:", currentTitle);
        const isDuplicate = await isDuplication(newTitle, index)
        if (isDuplicate) return alert("Phần tử bị trùng lặp");

        if (newTitle) {
            try {
                const response = await fetch(`http://localhost:3000/task/${taskId}`, {
                    method: "PATCH",
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        name: newTitle,
                        status: taskItem.querySelector(".status").innerText,
                        priority: taskItem.querySelector(".priority").innerText
                    })
                });

                if (!response.ok) {
                    throw new Error("Failed to update task: " + response.statusText);
                }

                const updateTask = await response.json();
                renderTask()
            } catch (error) {
                console.log(error);
            }
        }
    } else if (action === "delete") {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                const response = await fetch(`http://localhost:3000/task/${taskId}`, {
                    method: "DELETE"
                });

                if (!response.ok) {
                    throw new Error("Failed to delete task: " + response.statusText);
                }

                await response.json();
                renderTask()
            } catch (error) {
                console.log(error);
            }
        }
    }
}


async function deleteAllTasks() {
    if (!confirm("Are you sure you want to delete all tasks?")) return;

    try {
        const res = await fetch("http://localhost:3000/task");
        if (!res.ok) throw new Error("Failed to fetch tasks");

        const tasks = await res.json();

        const deleteRequests = tasks.map(task => 
            fetch(`http://localhost:3000/task/${task.id}`, { method: "DELETE" })
        );

        await Promise.all(deleteRequests);

        renderTask();
    } catch (error) {
        console.error("Error deleting all tasks:", error);
    }
}


deleteAllTasksButton.addEventListener("click", deleteAllTasks);


todoListButton.addEventListener("click", () => {
    currentFilter = 'todo';
    renderTask();
});

doingListButton.addEventListener("click", () => {
    currentFilter = 'doing';
    renderTask();
});

doneListButton.addEventListener("click", () => {
    currentFilter = 'done';
    renderTask();
});
allTaskButton.addEventListener("click", () => {
    currentFilter = 'all';
    renderTask();
});


taskList.addEventListener("click", handleTask)