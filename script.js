// This array will hold all building information.
let buildings = [];

// This array will hold all reported issues.
let issues = [];

// Load saved information, or use the sample data file.
async function loadData() {
    let savedBuildings = localStorage.getItem("campusBuildings");

    if (savedBuildings) {
        buildings = JSON.parse(savedBuildings);
    } else {
        let response = await fetch("data.json");
        let data = await response.json();
        buildings = data.buildings;
        saveBuildings();
    }

    let savedIssues = localStorage.getItem("campusIssues");
    if (savedIssues) {
        issues = JSON.parse(savedIssues);
    }

    showBuildingsOnMap();
    fillBuildingLists();
    showIssues();
}

// Save building information in the browser.
function saveBuildings() {
    localStorage.setItem("campusBuildings", JSON.stringify(buildings));
}

// Save reported issues in the browser.
function saveIssues() {
    localStorage.setItem("campusIssues", JSON.stringify(issues));
}

// Create the map and show the campus area.
let map = L.map("map").setView([33.7150, 73.0260], 17);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "&copy; OpenStreetMap contributors"
}).addTo(map);

// Add one marker for each building.
function showBuildingsOnMap() {
    buildings.forEach(function(building) {
        let marker = L.marker([building.latitude, building.longitude]).addTo(map);

        marker.bindPopup("<b>" + building.name + "</b><br>Click to view details");

        marker.on("click", function() {
            showBuildingDetails(building.id);
        });
    });
}

// Show the rooms of the selected building.
function showBuildingDetails(buildingId) {
    let selectedBuilding = buildings.find(function(building) {
        return building.id === buildingId;
    });

    let filter = document.getElementById("roomFilter").value;

    let html = "<h3>" + selectedBuilding.name + "</h3>";
    html += "<p>" + selectedBuilding.description + "</p>";
    html += "<h4>Rooms and Labs</h4>";

    let count = 0;
    selectedBuilding.rooms.forEach(function(room) {
        if (filter === "All" || room.status === filter) {
            count++;
            let statusClass = room.status.replace(" ", "-");

            html += '<div class="room">' + room.name +
                    ' — <span class="' + statusClass + '">' +
                    room.status + "</span></div>";
        }
    });

    if (count === 0) {
    html += "<p>No rooms found with this status.</p>";
}

    document.getElementById("buildingDetails").innerHTML = html;
}
// Search for buildings and rooms.
document.getElementById("searchInput").addEventListener("input", function() {
    let search = this.value.toLowerCase().trim();

    if (search === "") {
        document.getElementById("buildingDetails").innerHTML =
            "<p>Search for a building or room.</p>";
        return;
    }

    let found = buildings.find(function(building) {
        return building.name.toLowerCase().includes(search) ||
        building.rooms.some(function(room) {
            return room.name.toLowerCase().includes(search);
        });
    });

    if (found) {
        showBuildingDetails(found.id);
    } else {
        document.getElementById("buildingDetails").innerHTML =
            "<p>No building or room found.</p>";
    }
});

// Put building names into both drop-down lists.
function fillBuildingLists() {
    let issueSelect = document.getElementById("issueBuilding");
    let adminSelect = document.getElementById("adminBuilding");

    issueSelect.innerHTML = '<option value="">Choose a building</option>';
    adminSelect.innerHTML = '<option value="">Choose a building</option>';

    buildings.forEach(function(building) {
        let option1 = document.createElement("option");
        option1.value = building.id;
        option1.textContent = building.name;
        issueSelect.appendChild(option1);

        let option2 = document.createElement("option");
        option2.value = building.id;
        option2.textContent = building.name;
        adminSelect.appendChild(option2);
    });
}

// Update the room list when the admin chooses a building.
document.getElementById("adminBuilding").addEventListener("change", function() {
    let buildingId = Number(this.value);
    let selectedBuilding = buildings.find(function(building) {
        return building.id === buildingId;
    });

    let roomSelect = document.getElementById("adminRoom");
    roomSelect.innerHTML = '<option value="">Choose a room</option>';

    if (selectedBuilding) {
        selectedBuilding.rooms.forEach(function(room, index) {
            let option = document.createElement("option");
            option.value = index;
            option.textContent = room.name;
            roomSelect.appendChild(option);
        });
    }
});

// Handle issue form submission.
document.getElementById("issueForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let buildingId = Number(document.getElementById("issueBuilding").value);
    let description = document.getElementById("issueDescription").value;

    let selectedBuilding = buildings.find(function(building) {
        return building.id === buildingId;
    });

  issues.push({
    buildingName: selectedBuilding.name,
    description: description,
    status: "Pending"
});

    saveIssues();
    showIssues();
    document.getElementById("issueForm").reset();

    alert("Your issue has been reported.");
});

// Show all reported issues.

function showIssues() {
    let issueList = document.getElementById("issueList");

    if (issues.length === 0) {
        issueList.innerHTML = "<p>No issues reported yet.</p>";
        return;
    }

    issueList.innerHTML = "";

    issues.forEach(function(issue, index) {
        let item = document.createElement("div");
        item.className = "issue";

        let text = document.createElement("p");
        text.textContent = issue.buildingName + ": " + issue.description + " - " + issue.status;

        let button = document.createElement("button");
        button.textContent = "Mark as Fixed";

        button.onclick = function() {
            issue.status = "Fixed";
            localStorage.setItem("campusIssues", JSON.stringify(issues));
            showIssues();
        };

        item.appendChild(text);

        if (issue.status !== "Fixed") {
            item.appendChild(button);
        }

        issueList.appendChild(item);
    });
}


// Handle admin status update.
document.getElementById("adminForm").addEventListener("submit", function(event) {
    event.preventDefault();

    let buildingId = Number(document.getElementById("adminBuilding").value);
    let roomIndex = Number(document.getElementById("adminRoom").value);
    let newStatus = document.getElementById("newStatus").value;

    let selectedBuilding = buildings.find(function(building) {
        return building.id === buildingId;
    });

    if (!selectedBuilding || !selectedBuilding.rooms[roomIndex]) {
        alert("Please choose a building and room.");
        return;
    }

    selectedBuilding.rooms[roomIndex].status = newStatus;

    saveBuildings();
    showBuildingDetails(buildingId);

    alert("Room status updated.");
    document.getElementById("adminForm").reset();
    document.getElementById("adminRoom").innerHTML =
        '<option value="">Choose a room</option>';
});

document.getElementById("searchInput").addEventListener("focus", function() {
    document.getElementById("clearSearch").style.display = "inline-block";
});

document.getElementById("clearSearch").addEventListener("click", function() {
    document.getElementById("searchInput").value = "";
    document.getElementById("buildingDetails").innerHTML =
        "<p>Search for a building or room.</p>";
    this.style.display = "none";
});
document.getElementById("searchToggle").addEventListener("click", function() {
    let search = document.getElementById("searchInput");
    let clear = document.getElementById("clearSearch");

    if (search.style.display === "none") {
        search.style.display = "block";
        clear.style.display = "inline-block";
        search.focus();
    } else {
        search.style.display = "none";
        clear.style.display = "none";
        search.value = "";
    }
});

// Start the website.
loadData();
